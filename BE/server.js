import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

import { getDbPool } from './src/config/db.js';
import { initSocketIO } from './src/socket/socketHandler.js';
import { tunnelHeadersMiddleware } from './src/middlewares/tunnelHeaders.js';

import authRoutes from './src/routes/authRoutes.js';
import storeRoutes from './src/routes/storeRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import voucherRoutes from './src/routes/voucherRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import staffRoutes from './src/routes/staffRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { migrateChatTables } from './src/scripts/migrateChat.js';

const app = express();
const server = http.createServer(app);

// WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});
initSocketIO(io);

// Global Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(tunnelHeadersMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health & Root Status Check (Very useful when checking tunnel or remote server)
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'Ant Coffee & Tea API',
    version: '1.0.0',
    database: 'Microsoft SQL Server (ant_coffee_db)',
    websocket: 'Socket.IO Active',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req, res) => {
  try {
    const pool = await getDbPool();
    const dbTest = await pool.request().query('SELECT 1 as is_alive, DB_NAME() as db_name');
    res.json({
      status: 'HEALTHY',
      database_connected: true,
      database_name: dbTest.recordset[0]?.db_name,
      uptime_seconds: Math.floor(process.uptime()),
    });
  } catch (err) {
    res.status(500).json({
      status: 'UNHEALTHY',
      database_connected: false,
      error: err.message,
    });
  }
});

// Mount API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/vouchers', voucherRoutes);
app.use('/api/v1/customer', customerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn API không tồn tại: ${req.method} ${req.originalUrl}`,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, async () => {
  console.log(`\n======================================================`);
  console.log(`☕ ANT COFFEE BACKEND SERVER IS RUNNING`);
  console.log(`📡 Local URL:   http://localhost:${PORT}`);
  console.log(`🌐 Network URL: http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket:   Enabled (Socket.IO)`);
  console.log(`💾 Database:    Microsoft SQL Server (ant_coffee_db)`);
  console.log(`🚀 Ready to accept requests from Frontend & Tunnels`);
  console.log(`======================================================\n`);

  // Ensure DB connection is warmed up and chat tables exist
  try {
    await getDbPool();
    await migrateChatTables();
  } catch (err) {
    console.error('Initial DB connection failed:', err.message);
  }
});

export default app;
