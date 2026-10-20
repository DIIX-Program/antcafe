import API_CONFIG, { getApiUrl } from './config';

let storedAuthToken = null;

export function setAuthToken(token) {
  storedAuthToken = token;
}

export function getAuthToken() {
  return storedAuthToken;
}

export async function apiClient(endpoint, options = {}) {
  const url = getApiUrl(endpoint);

  const headers = {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(options.headers || {}),
  };

  if (storedAuthToken) {
    headers['Authorization'] = `Bearer ${storedAuthToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.message || `Lỗi HTTP ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn(`[API Client] Timeout (${API_CONFIG.TIMEOUT_MS}ms) for ${url}`);
      throw new Error('Kết nối máy chủ quá thời gian chờ, vui lòng kiểm tra lại mạng hoặc tunnel.');
    }
    throw error;
  }
}

export const http = {
  get: (endpoint, options) => apiClient(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    apiClient(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),
  put: (endpoint, body, options) =>
    apiClient(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),
  patch: (endpoint, body, options) =>
    apiClient(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: (endpoint, options) => apiClient(endpoint, { method: 'DELETE', ...options }),
};

export default http;
