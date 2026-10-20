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
    return res.data;
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

export async function fetchMyOrders() {
  try {
    const res = await http.get('/api/v1/orders/my-history');
    return res.data;
  } catch (error) {
    console.warn('[API Order] fetchMyOrders fallback:', error.message);
    return MOCK_ORDERS;
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
