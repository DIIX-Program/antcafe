import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ant_coffee_super_secret_jwt_key_2026_xyz987';

let ioInstance = null;

export function initSocketIO(io) {
  ioInstance = io;

  // 1. Handshake Authentication Middleware
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || 
                         socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
                         socket.handshake.query?.token;

      if (!authHeader) {
        // Allow guest browsing mode
        socket.user = null;
        console.log(`[Socket.IO Auth] Client connected as GUEST: ${socket.id}`);
        return next();
      }

      jwt.verify(authHeader, JWT_SECRET, (err, decoded) => {
        if (err) {
          console.warn(`[Socket.IO Auth] Invalid token on handshake: ${err.message}. Proceeding as GUEST.`);
          socket.user = null;
          return next();
        }

        socket.user = decoded;
        console.log(`[Socket.IO Auth] Authenticated user #${decoded.id} (${decoded.role}) on socket: ${socket.id}`);
        return next();
      });
    } catch (middlewareError) {
      console.error('[Socket.IO Auth] Middleware exception:', middlewareError);
      return next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id} | User: ${socket.user ? `#${socket.user.id} (${socket.user.role})` : 'Guest'}`);

    // Automatically join role-based rooms if authenticated
    if (socket.user) {
      socket.join(`customer_${socket.user.id}`);
      if (['STAFF', 'OWNER'].includes(socket.user.role)) {
        socket.join('room:orders');
        socket.join('room:staff');
      }
    }

    // Join room for orders queue (Staff and Owner)
    socket.on('join:orders', () => {
      socket.join('room:orders');
      console.log(`[Socket.IO] Socket ${socket.id} joined room:orders`);
    });

    // Join room for customer's private updates
    socket.on('join:customer', (customerId) => {
      const targetId = customerId || socket.user?.id;
      if (targetId) {
        socket.join(`customer_${targetId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined customer_${targetId}`);
      }
    });

    // Join specific order tracking room
    socket.on('join:order_room', (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined order_${orderId}`);
      }
    });

    // Leave room
    socket.on('leave:order_room', (orderId) => {
      if (orderId) {
        socket.leave(`order_${orderId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left order_${orderId}`);
      }
    });

    // General store room
    socket.on('join:store', () => {
      socket.join('room:store');
      console.log(`[Socket.IO] Socket ${socket.id} joined room:store`);
    });

    // =========================================================================
    // 2-WAY REAL-TIME EVENTS (emit/on)
    // =========================================================================

    // Event 1: Client sends quick message/note for order (2-way chat/support)
    socket.on('order:send_message', (payload) => {
      const { orderId, orderCode, message, senderName, senderRole } = payload || {};
      console.log(`[Socket.IO] 2-Way Message for order #${orderCode}: "${message}" from ${senderName} (${senderRole})`);

      const messagePacket = {
        id: Date.now(),
        orderId,
        orderCode,
        message,
        senderName: senderName || (socket.user?.full_name || 'Khách hàng'),
        senderRole: senderRole || (socket.user?.role || 'CUSTOMER'),
        timestamp: new Date().toISOString(),
      };

      // Broadcast to both customer room and staff room
      if (orderId) {
        io.to(`order_${orderId}`).emit('order:new_message', messagePacket);
      }
      io.to('room:orders').emit('order:new_message', messagePacket);
      io.emit('order:new_message', messagePacket); // Global fallback

      // Acknowledge back to sender
      socket.emit('order:message_sent_ack', { success: true, messagePacket });
    });

    // Event 2: Staff updates order status via socket directly (2-way)
    socket.on('order:update_status_socket', (payload) => {
      const { orderId, orderCode, status, customerId } = payload || {};
      console.log(`[Socket.IO] 2-Way Status update requested via socket: #${orderCode} -> ${status}`);

      const updatePacket = {
        id: orderId,
        orderCode,
        order_code: orderCode,
        status,
        customer_id: customerId,
        updated_at: new Date().toISOString(),
      };

      // Broadcast immediately to rooms
      emitOrderStatusUpdated(updatePacket);

      // Acknowledge back to staff
      socket.emit('order:status_updated_ack', { success: true, order: updatePacket });
    });

    // Event 3: Ping / Heartbeat for connection health check
    socket.on('system:ping', () => {
      socket.emit('system:pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
}

export function getIO() {
  return ioInstance;
}

// Broadcast new order to staff & owner POS + customer
export function emitOrderCreated(order) {
  if (ioInstance) {
    const code = order.order_code || order.orderCode;
    console.log(`[Socket.IO] Emitting order:created for #${code}`);
    ioInstance.to('room:orders').emit('order:created', order);
    if (order.customer_id) {
      ioInstance.to(`customer_${order.customer_id}`).emit('order:created', order);
    }
    ioInstance.emit('order:created', order); // Fallback
  }
}

// Broadcast order status update (CONFIRMED, READY, COMPLETED, CANCELLED)
export function emitOrderStatusUpdated(order) {
  if (ioInstance) {
    const code = order.order_code || order.orderCode;
    console.log(`[Socket.IO] Emitting order:status_updated for #${code} -> ${order.status}`);
    ioInstance.to('room:orders').emit('order:status_updated', order);
    if (order.id) {
      ioInstance.to(`order_${order.id}`).emit('order:status_updated', order);
    }
    if (order.customer_id) {
      ioInstance.to(`customer_${order.customer_id}`).emit('order:status_updated', order);
    }
    ioInstance.emit('order:status_updated', order);
  }
}

// Broadcast store status changes (Open / Closed)
export function emitStoreStatusUpdated(storeSettings) {
  if (ioInstance) {
    console.log(`[Socket.IO] Emitting store:status_updated is_accepting_orders = ${storeSettings.is_accepting_orders}`);
    ioInstance.emit('store:status_updated', storeSettings);
  }
}

// Broadcast product availability changes
export function emitProductAvailabilityUpdated(payload) {
  if (ioInstance) {
    console.log(`[Socket.IO] Emitting product:availability_updated`, payload);
    ioInstance.emit('product:availability_updated', payload);
  }
}

// Broadcast real-time order payment status updates (PAID, REFUNDED)
export function emitOrderPaymentUpdated(order) {
  if (ioInstance) {
    const code = order.order_code || order.orderCode;
    console.log(`[Socket.IO] Emitting order:payment_updated for #${code}: payment_status=${order.payment_status}`);
    ioInstance.to('room:orders').emit('order:payment_updated', order);
    if (order.customer_id) {
      ioInstance.to(`customer_${order.customer_id}`).emit('order:payment_updated', order);
    }
    if (order.id) {
      ioInstance.to(`order_${order.id}`).emit('order:payment_updated', order);
    }
    ioInstance.emit('order:payment_updated', order);
  }
}
