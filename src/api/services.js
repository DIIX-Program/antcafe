import http, { setAuthToken } from './client';
import {
  STORE_SETTINGS as MOCK_STORE,
  CATEGORIES as MOCK_CATEGORIES,
  PRODUCTS as MOCK_PRODUCTS,
  OPTION_GROUPS as MOCK_OPTIONS,
  VOUCHERS as MOCK_VOUCHERS,
  ADDRESSES as MOCK_ADDRESSES,
  INITIAL_ORDERS as MOCK_ORDERS,
} from '../data/mockData';

// ==========================================
// 1. AUTHENTICATION & PROFILE APIS
// ==========================================
export async function loginUser(phoneOrEmail, password) {
  try {
    const res = await http.post('/api/v1/auth/login', { phoneOrEmail, password });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res;
  } catch (error) {
    console.warn('[API Auth] loginUser failed:', error.message);
    throw error;
  }
}

export async function registerCustomer({ phone, password, full_name, email }) {
  try {
    const res = await http.post('/api/v1/auth/register', { phone, password, full_name, email });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res;
  } catch (error) {
    console.warn('[API Auth] registerCustomer failed:', error.message);
    throw error;
  }
}

export async function loginWithGoogle({ email, full_name, avatar_url }) {
  try {
    const res = await http.post('/api/v1/auth/google', { email, full_name, avatar_url });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res;
  } catch (error) {
    console.warn('[API Auth] loginWithGoogle failed, using optimistic response:', error.message);
    // Optimistic fallback for frontend
    const fallbackUser = {
      id: Date.now(),
      name: full_name || 'Khách hàng Google',
      email: email,
      phone: '098' + Math.floor(1000000 + Math.random() * 9000000),
      avatar: avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      role: 'CUSTOMER',
      loyalty_points: 100,
    };
    return {
      success: true,
      data: {
        token: 'MOCK_GOOGLE_JWT_TOKEN_' + Date.now(),
        role: 'CUSTOMER',
        user: fallbackUser,
      },
    };
  }
}

export async function fetchCurrentUser() {
  try {
    const res = await http.get('/api/v1/auth/me');
    return res.data;
  } catch (error) {
    console.warn('[API Auth] fetchCurrentUser failed:', error.message);
    return null;
  }
}

// ==========================================
// 2. STORE CONFIG & ONLINE STATUS APIS
// ==========================================
export async function fetchStoreStatus() {
  try {
    const res = await http.get('/api/v1/store/status');
    return res.data;
  } catch (error) {
    console.warn('[API Store] fetchStoreStatus fallback:', error.message);
    return MOCK_STORE;
  }
}

export async function toggleStoreAcceptingOrders() {
  try {
    const res = await http.patch('/api/v1/store/toggle-accepting');
    return res.data?.is_accepting_orders;
  } catch (error) {
    console.warn('[API Store] toggleStoreAcceptingOrders failed:', error.message);
    throw error;
  }
}

export async function updateStoreSettings(settings) {
  try {
    const res = await http.put('/api/v1/store/settings', settings);
    return res.data;
  } catch (error) {
    console.warn('[API Store] updateStoreSettings failed:', error.message);
    throw error;
  }
}

// ==========================================
// 3. CATALOG & PRODUCT APIS
// ==========================================
export async function fetchCategories() {
  try {
    const res = await http.get('/api/v1/categories');
    return res.data;
  } catch (error) {
    console.warn('[API Catalog] fetchCategories fallback:', error.message);
    return MOCK_CATEGORIES;
  }
}

export async function fetchProducts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category_id && params.category_id !== 1) {
      query.append('category_id', params.category_id);
    }
    if (params.search) {
      query.append('search', params.search);
    }
    if (params.is_featured) {
      query.append('is_featured', '1');
    }
    if (params.tag && params.tag !== 'ALL') {
      query.append('tag', params.tag);
    }

    const endpoint = `/api/v1/products${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await http.get(endpoint);
    return res.data;
  } catch (error) {
    console.warn('[API Catalog] fetchProducts fallback:', error.message);
    return MOCK_PRODUCTS;
  }
}

export async function fetchProductDetail(productId) {
  try {
    const res = await http.get(`/api/v1/products/${productId}`);
    return res.data;
  } catch (error) {
    console.warn('[API Catalog] fetchProductDetail fallback:', error.message);
    return MOCK_PRODUCTS.find(p => p.id === productId) || null;
  }
}

export async function toggleProductAvailability(productId) {
  try {
    const res = await http.patch(`/api/v1/products/${productId}/availability`);
    return res.data;
  } catch (error) {
    console.warn('[API Catalog] toggleProductAvailability failed:', error.message);
    throw error;
  }
}

export async function fetchOptionGroups() {
  try {
    const res = await http.get('/api/v1/products/options/groups');
    return res.data;
  } catch (error) {
    console.warn('[API Catalog] fetchOptionGroups fallback:', error.message);
    return MOCK_OPTIONS;
  }
}

// ==========================================
// 4. VOUCHERS & PROMOTIONS APIS
// ==========================================
export async function fetchVouchers() {
  try {
    const res = await http.get('/api/v1/vouchers/available');
    return res.data;
  } catch (error) {
    console.warn('[API Vouchers] fetchVouchers fallback:', error.message);
    return MOCK_VOUCHERS;
  }
}

export async function applyVoucherCode(code, orderAmount) {
  try {
    const res = await http.post('/api/v1/vouchers/apply', { code, order_amount: orderAmount });
    return res.data;
  } catch (error) {
    console.warn('[API Vouchers] applyVoucherCode failed:', error.message);
    throw error;
  }
}

// ==========================================
// 5. CUSTOMER ADDRESS APIS
// ==========================================
export async function fetchCustomerAddresses() {
  try {
    const res = await http.get('/api/v1/customer/addresses');
    return res.data;
  } catch (error) {
    console.warn('[API Customer] fetchCustomerAddresses fallback:', error.message);
    return MOCK_ADDRESSES;
  }
}

export async function addCustomerAddress(addressData) {
  try {
    const res = await http.post('/api/v1/customer/addresses', addressData);
    return res.data;
  } catch (error) {
    console.warn('[API Customer] addCustomerAddress failed:', error.message);
    throw error;
  }
}

export async function deleteCustomerAddress(addressId) {
  try {
    const res = await http.delete(`/api/v1/customer/addresses/${addressId}`);
    return res;
  } catch (error) {
    console.warn('[API Customer] deleteCustomerAddress failed:', error.message);
    throw error;
  }
}

// ==========================================
// 6. ORDERING & TRACKING APIS
// ==========================================
export async function checkoutOrder(orderPayload) {
  try {
    const res = await http.post('/api/v1/orders/checkout', orderPayload);
    const orderData = res.data || res;
    if (res.momoPayment && orderData) {
      orderData.momoPayment = res.momoPayment;
    }
    return orderData;
  } catch (error) {
    console.warn('[API Order] checkoutOrder failed:', error.message);
    throw error;
  }
}

export async function fetchAllOrders(status) {
  try {
    const endpoint = status ? `/api/v1/orders?status=${status}` : '/api/v1/orders';
    const res = await http.get(endpoint);
    return res.data;
  } catch (error) {
    console.warn('[API Order] fetchAllOrders fallback:', error.message);
    return MOCK_ORDERS;
  }
}

export async function fetchMyOrders(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.customerId) query.append('customerId', params.customerId);
    if (params.phone) query.append('phone', params.phone);
    const endpoint = `/api/v1/orders/my-history${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await http.get(endpoint);
    return res.data || [];
  } catch (error) {
    console.warn('[API Order] fetchMyOrders fallback:', error.message);
    return [];
  }
}

export async function updateOrderStatus(orderId, nextStatus, cancelReason) {
  try {
    const res = await http.put(`/api/v1/orders/${orderId}/status`, {
      status: nextStatus,
      cancel_reason: cancelReason,
    });
    return res.data;
  } catch (error) {
    console.warn('[API Order] updateOrderStatus failed:', error.message);
    throw error;
  }
}

// ==========================================
// 7. STAFF SHIFTS & REPORTS APIS
// ==========================================
export async function fetchCurrentShift() {
  try {
    const res = await http.get('/api/v1/staff/shifts/current');
    return res.data;
  } catch (error) {
    console.warn('[API Staff] fetchCurrentShift failed:', error.message);
    return null;
  }
}

export async function checkInStaffShift(openingCash, note) {
  try {
    const res = await http.post('/api/v1/staff/shifts/check-in', { opening_cash: openingCash, note });
    return res.data;
  } catch (error) {
    console.warn('[API Staff] checkInStaffShift failed:', error.message);
    throw error;
  }
}

export async function checkOutStaffShift(actualClosingCash, note) {
  try {
    const res = await http.post('/api/v1/staff/shifts/check-out', { actual_closing_cash: actualClosingCash, note });
    return res.data;
  } catch (error) {
    console.warn('[API Staff] checkOutStaffShift failed:', error.message);
    throw error;
  }
}

// ==========================================
// 8. ADMIN / OWNER ANALYTICS APIS
// ==========================================
export async function fetchRevenueAnalytics() {
  try {
    const res = await http.get('/api/v1/admin/reports/revenue');
    return res.data;
  } catch (error) {
    console.warn('[API Admin] fetchRevenueAnalytics fallback:', error.message);
    return null;
  }
}

export async function fetchAuditLogs() {
  try {
    const res = await http.get('/api/v1/admin/audit/price-logs');
    return res.data;
  } catch (error) {
    console.warn('[API Admin] fetchAuditLogs fallback:', error.message);
    return [];
  }
}

// ==========================================
// 9. MOMO PAYMENT APIS
// ==========================================
export async function createMoMoPaymentSession(payload) {
  try {
    const res = await http.post('/api/v1/payment/momo/create', payload);
    return res.data;
  } catch (error) {
    console.warn('[API MoMo] createMoMoPaymentSession failed:', error.message);
    throw error;
  }
}

export async function queryMoMoPaymentStatus(orderCode) {
  try {
    const res = await http.get(`/api/v1/payment/momo/status/${orderCode}`);
    return res.data;
  } catch (error) {
    console.warn('[API MoMo] queryMoMoPaymentStatus failed:', error.message);
    throw error;
  }
}

export async function simulateMoMoPayment(orderCode) {
  try {
    const res = await http.post('/api/v1/payment/momo/simulate', { orderCode });
    return res.data;
  } catch (error) {
    console.warn('[API MoMo] simulateMoMoPayment failed:', error.message);
    throw error;
  }
}

// ==========================================
// 10. VIETQR PAYMENT & PAYMENT SWITCH APIS
// ==========================================
export async function simulateVietQRPayment(orderCode) {
  try {
    const res = await http.post('/api/v1/payment/vietqr/simulate', { orderCode });
    return res.data;
  } catch (error) {
    console.warn('[API VietQR] simulateVietQRPayment failed:', error.message);
    throw error;
  }
}

export async function switchOrderPaymentMethod(orderCode, paymentMethod) {
  try {
    const res = await http.post('/api/v1/payment/switch-method', { orderCode, paymentMethod });
    return res.data;
  } catch (error) {
    console.warn('[API Payment] switchOrderPaymentMethod failed:', error.message);
    throw error;
  }
}

