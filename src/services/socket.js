import { io } from 'socket.io-client';
import API_CONFIG from '../api/config';

let socket = null;
const listeners = {
  orderCreated: new Set(),
  orderStatusUpdated: new Set(),
  storeStatusUpdated: new Set(),
  productAvailabilityUpdated: new Set(),
};

export function initSocketClient() {
  if (socket) return socket;

  const url = API_CONFIG.BASE_URL;
  console.log('[Socket] Connecting to WebSocket at:', url);

  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to server, ID:', socket.id);
    socket.emit('join:orders');
    socket.emit('join:store');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection warning:', error.message);
  });

  // Event dispatchers to registered callbacks
  socket.on('order:created', (order) => {
    console.log('[Socket] Event order:created received:', order.orderCode || order.order_code);
    listeners.orderCreated.forEach((cb) => {
      try {
        cb(order);
      } catch (e) {
        console.error(e);
      }
    });
  });

  socket.on('order:status_updated', (order) => {
    console.log('[Socket] Event order:status_updated received:', order.orderCode || order.order_code, '->', order.status);
    listeners.orderStatusUpdated.forEach((cb) => {
      try {
        cb(order);
      } catch (e) {
        console.error(e);
      }
    });
  });

  socket.on('store:status_updated', (store) => {
    console.log('[Socket] Event store:status_updated received:', store.is_accepting_orders);
    listeners.storeStatusUpdated.forEach((cb) => {
      try {
        cb(store);
      } catch (e) {
        console.error(e);
      }
    });
  });

  socket.on('product:availability_updated', (payload) => {
    console.log('[Socket] Event product:availability_updated received:', payload);
    listeners.productAvailabilityUpdated.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error(e);
      }
    });
  });

  return socket;
}

export function subscribeOrderCreated(callback) {
  listeners.orderCreated.add(callback);
  return () => listeners.orderCreated.delete(callback);
}

export function subscribeOrderStatusUpdated(callback) {
  listeners.orderStatusUpdated.add(callback);
  return () => listeners.orderStatusUpdated.delete(callback);
}

export function subscribeStoreStatusUpdated(callback) {
  listeners.storeStatusUpdated.add(callback);
  return () => listeners.storeStatusUpdated.delete(callback);
}

export function subscribeProductAvailabilityUpdated(callback) {
  listeners.productAvailabilityUpdated.add(callback);
  return () => listeners.productAvailabilityUpdated.delete(callback);
}

export function reconnectSocket(newUrl) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (newUrl) {
    API_CONFIG.BASE_URL = newUrl;
  }
  return initSocketClient();
}

export default {
  initSocketClient,
  subscribeOrderCreated,
  subscribeOrderStatusUpdated,
  subscribeStoreStatusUpdated,
  subscribeProductAvailabilityUpdated,
  reconnectSocket,
};
