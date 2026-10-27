import { io } from 'socket.io-client';
import { API_CONFIG } from '../api/config';

let socket = null;
let currentConnectionStatus = 'DISCONNECTED'; // 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED'
let activeAuthToken = null;

const listeners = {
  connectionStatus: new Set(),
  orderCreated: new Set(),
  orderStatusUpdated: new Set(),
  orderPaymentUpdated: new Set(),
  storeStatusUpdated: new Set(),
  productAvailabilityUpdated: new Set(),
  orderNewMessage: new Set(),
  notificationNew: new Set(),
};

function updateConnectionStatus(newStatus) {
  if (currentConnectionStatus !== newStatus) {
    currentConnectionStatus = newStatus;
    console.log(`[Socket] Status changed: ${newStatus}`);
    listeners.connectionStatus.forEach((cb) => {
      try {
        cb(newStatus);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

export function getConnectionStatus() {
  return currentConnectionStatus;
}

export function subscribeConnectionStatus(callback) {
  listeners.connectionStatus.add(callback);
  callback(currentConnectionStatus);
  return () => listeners.connectionStatus.delete(callback);
}

/**
 * Initialize socket connection with Handshake Token Authentication
 */
export function initSocketClient(authToken = null) {
  if (authToken) {
    activeAuthToken = authToken;
  }

  // If already connected and token didn't change, return existing
  if (socket && socket.connected) {
    return socket;
  }

  const url = API_CONFIG.BASE_URL;
  console.log('[Socket] Initializing connection to:', url, activeAuthToken ? '(with auth token)' : '(guest)');
  updateConnectionStatus('CONNECTING');

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(url, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 15000,
    auth: activeAuthToken ? { token: activeAuthToken } : undefined,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to server! Socket ID:', socket.id);
    updateConnectionStatus('CONNECTED');
    socket.emit('join:orders');
    socket.emit('join:store');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected from server:', reason);
    updateConnectionStatus('DISCONNECTED');
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
    updateConnectionStatus('RECONNECTING');
  });

  socket.on('reconnect_attempt', (attempt) => {
    console.log(`[Socket] Reconnecting attempt #${attempt}...`);
    updateConnectionStatus('RECONNECTING');
  });

  socket.on('reconnect', () => {
    console.log('[Socket] Reconnected successfully!');
    updateConnectionStatus('CONNECTED');
    socket.emit('join:orders');
    socket.emit('join:store');
  });

  // ==========================================
  // EVENT LISTENERS DISPATCH
  // ==========================================
  socket.on('order:created', (order) => {
    console.log('[Socket] Event order:created received:', order.orderCode || order.order_code);
    listeners.orderCreated.forEach((cb) => {
      try { cb(order); } catch (e) { console.error(e); }
    });
  });

  socket.on('order:status_updated', (order) => {
    console.log('[Socket] Event order:status_updated received:', order.orderCode || order.order_code, '->', order.status);
    listeners.orderStatusUpdated.forEach((cb) => {
      try { cb(order); } catch (e) { console.error(e); }
    });
  });

  socket.on('order:payment_updated', (order) => {
    console.log('[Socket] Event order:payment_updated received:', order.orderCode || order.order_code, '->', order.payment_status);
    listeners.orderPaymentUpdated.forEach((cb) => {
      try { cb(order); } catch (e) { console.error(e); }
    });
  });

  socket.on('store:status_updated', (store) => {
    console.log('[Socket] Event store:status_updated received:', store.is_accepting_orders);
    listeners.storeStatusUpdated.forEach((cb) => {
      try { cb(store); } catch (e) { console.error(e); }
    });
  });

  socket.on('product:availability_updated', (payload) => {
    console.log('[Socket] Event product:availability_updated received:', payload);
    listeners.productAvailabilityUpdated.forEach((cb) => {
      try { cb(payload); } catch (e) { console.error(e); }
    });
  });

  // 2-Way Realtime chat / note messages between customer and staff
  socket.on('order:new_message', (messagePacket) => {
    console.log('[Socket] Event order:new_message received:', messagePacket.orderCode, ':', messagePacket.message);
    listeners.orderNewMessage.forEach((cb) => {
      try { cb(messagePacket); } catch (e) { console.error(e); }
    });
  });

  // Real-time Push Notification dispatch to UI
  socket.on('notification:new', (notification) => {
    console.log('[Socket] Event notification:new received:', notification.title);
    listeners.notificationNew.forEach((cb) => {
      try { cb(notification); } catch (e) { console.error(e); }
    });
  });

  return socket;
}

// ==========================================
// ROOM TARGETING (Requirement B.4)
// ==========================================
export function joinOrderRoom(orderId) {
  if (socket && socket.connected && orderId) {
    socket.emit('join:order_room', orderId);
  }
}

export function leaveOrderRoom(orderId) {
  if (socket && socket.connected && orderId) {
    socket.emit('leave:order_room', orderId);
  }
}

export function joinCustomerRoom(customerId) {
  if (socket && socket.connected && customerId) {
    socket.emit('join:customer', customerId);
  }
}

// ==========================================
// 2-WAY REALTIME EMITTERS (Requirement B.3)
// ==========================================
export function sendOrderMessage({ orderId, orderCode, message, senderName, senderRole }) {
  if (socket && socket.connected) {
    socket.emit('order:send_message', {
      orderId,
      orderCode,
      message,
      senderName,
      senderRole,
    });
    return true;
  }
  return false;
}

export function updateOrderStatusViaSocket({ orderId, orderCode, status, customerId }) {
  if (socket && socket.connected) {
    socket.emit('order:update_status_socket', {
      orderId,
      orderCode,
      status,
      customerId,
    });
    return true;
  }
  return false;
}

// ==========================================
// SUBSCRIPTIONS (Requirement B.6 - Clean Unsubscribe)
// ==========================================
export function subscribeOrderCreated(callback) {
  listeners.orderCreated.add(callback);
  return () => listeners.orderCreated.delete(callback);
}

export function subscribeOrderStatusUpdated(callback) {
  listeners.orderStatusUpdated.add(callback);
  return () => listeners.orderStatusUpdated.delete(callback);
}

export function subscribeOrderPaymentUpdated(callback) {
  listeners.orderPaymentUpdated.add(callback);
  return () => listeners.orderPaymentUpdated.delete(callback);
}

export function subscribeStoreStatusUpdated(callback) {
  listeners.storeStatusUpdated.add(callback);
  return () => listeners.storeStatusUpdated.delete(callback);
}

export function subscribeProductAvailabilityUpdated(callback) {
  listeners.productAvailabilityUpdated.add(callback);
  return () => listeners.productAvailabilityUpdated.delete(callback);
}

export function subscribeNewMessage(callback) {
  listeners.orderNewMessage.add(callback);
  return () => listeners.orderNewMessage.delete(callback);
}

export function subscribeNotification(callback) {
  listeners.notificationNew.add(callback);
  return () => listeners.notificationNew.delete(callback);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    updateConnectionStatus('DISCONNECTED');
  }
}

export function reconnectSocket(newToken = null, newUrl = null) {
  disconnectSocket();
  if (newUrl) {
    API_CONFIG.BASE_URL = newUrl;
  }
  return initSocketClient(newToken || activeAuthToken);
}

export default {
  initSocketClient,
  getConnectionStatus,
  subscribeConnectionStatus,
  joinOrderRoom,
  leaveOrderRoom,
  joinCustomerRoom,
  sendOrderMessage,
  updateOrderStatusViaSocket,
  subscribeOrderCreated,
  subscribeOrderStatusUpdated,
  subscribeOrderPaymentUpdated,
  subscribeStoreStatusUpdated,
  subscribeProductAvailabilityUpdated,
  subscribeNewMessage,
  subscribeNotification,
  disconnectSocket,
  reconnectSocket,
};
