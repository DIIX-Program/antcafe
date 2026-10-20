let ioInstance = null;

export function initSocketIO(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for orders queue (Staff and Owner)
    socket.on('join:orders', () => {
      socket.join('room:orders');
      console.log(`[Socket.IO] Socket ${socket.id} joined room:orders`);
    });

    // Join room for customer's private updates
    socket.on('join:customer', (customerId) => {
      if (customerId) {
        socket.join(`customer_${customerId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined customer_${customerId}`);
      }
    });

    // General store room
    socket.on('join:store', () => {
      socket.join('room:store');
      console.log(`[Socket.IO] Socket ${socket.id} joined room:store`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return ioInstance;
}

// Broadcast new order to staff & owner POS
export function emitOrderCreated(order) {
  if (ioInstance) {
    console.log(`[Socket.IO] Emitting order:created for #${order.order_code || order.orderCode}`);
    ioInstance.to('room:orders').emit('order:created', order);
    ioInstance.emit('order:created', order); // Also broadcast globally for fallback
  }
}

// Broadcast order status update (CONFIRMED, READY, COMPLETED, CANCELLED)
export function emitOrderStatusUpdated(order) {
  if (ioInstance) {
    console.log(`[Socket.IO] Emitting order:status_updated for #${order.order_code || order.orderCode} -> ${order.status}`);
    ioInstance.to('room:orders').emit('order:status_updated', order);
    if (order.customer_id) {
      ioInstance.to(`customer_${order.customer_id}`).emit('order:status_updated', order);
    }
    ioInstance.emit('order:status_updated', order); // Broadcast globally
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
    ioInstance.emit('order:payment_updated', order);
  }
}

