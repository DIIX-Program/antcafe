import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Ant Coffee API & WebSocket Configuration
 * 
 * Auto-detects the best connection URL for:
 * 1. Physical Phone with Expo Go ("expo ngoài") -> Uses Cloudflare HTTPS Tunnel or Host LAN IP
 * 2. Web Browser (Localhost or LAN/Tunnel) -> Uses Cloudflare HTTPS Tunnel or Localhost:5000
 * 3. Android Studio Emulator -> Cloudflare HTTPS Tunnel or 10.0.2.2:5000
 */

// Production / Public Cloud Tunnel URL (Cloudflare Tunnel to port 5000)
export const CLOUD_API_URL = 'https://beantcafe.lingprep.cloud';

// LAN IP of developer machine (Fallback for local offline Wi-Fi development)
export const LAN_IP = '192.168.0.101';
export const PORT = 5000;

/**
 * Extract host IP address from Expo Metro bundler
 */
export function getExpoHostIp() {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost ||
      '';
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && !ip.includes('exp.direct')) {
        return ip;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

export function getDefaultApiUrl() {
  // 1. Explicit environment variable override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // 2. Physical device (Điện thoại thật bên ngoài dùng Expo Go):
  // Thiết bị thật không thể truy cập 10.0.2.2 hay localhost của PC.
  // Ưu tiên dùng Cloud URL (Cloudflare HTTPS tunnel) hoặc IP mạng LAN của máy dev.
  if (Device.isDevice) {
    if (CLOUD_API_URL) {
      return CLOUD_API_URL.replace(/\/$/, '');
    }
    const detectedIp = getExpoHostIp() || LAN_IP;
    return `http://${detectedIp}:${PORT}`;
  }

  // 3. Android Studio Emulator (Giả lập Android trên máy dev):
  // Giả lập kết nối trực tiếp với backend máy dev qua IP đặc biệt 10.0.2.2:5000 cực nhanh và ổn định.
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}`;
  }

  // 4. Web environment
  if (Platform.OS === 'web') {
    // Nếu mở web từ thiết bị khác trong mạng LAN hoặc tunnel bên ngoài
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      if (CLOUD_API_URL) return CLOUD_API_URL.replace(/\/$/, '');
      return `http://${window.location.hostname}:${PORT}`;
    }
    // Web mở trên chính máy tính dev: dùng localhost:5000
    return `http://localhost:${PORT}`;
  }

  return `http://${LAN_IP}:${PORT}`;
}

let activeBaseUrl = getDefaultApiUrl();
console.log('[API Config] Selected Base URL:', activeBaseUrl, '| Platform:', Platform.OS, '| Physical Device:', Device.isDevice);

export const API_CONFIG = {
  get BASE_URL() {
    return activeBaseUrl;
  },
  set BASE_URL(newUrl) {
    if (newUrl) {
      activeBaseUrl = newUrl.replace(/\/$/, '');
      console.log('[API Config] Switched Base URL to:', activeBaseUrl);
    }
  },
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'bypass-tunnel-reminder': 'true',
  },
  TIMEOUT_MS: 15000,
};

export function setCustomApiUrl(url) {
  API_CONFIG.BASE_URL = url;
}

export function getApiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
}

export default API_CONFIG;
