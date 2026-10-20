import { Platform } from 'react-native';

/**
 * Ant Coffee API & WebSocket Configuration
 * 
 * Supports:
 * - Localhost web testing
 * - Physical mobile phone via LAN (192.168.0.102)
 * - Android Emulator (10.0.2.2)
 * - Public Tunneling (Cloudflare, Ngrok, Localtunnel, or custom domain)
 *   via EXPO_PUBLIC_API_URL or runtime override.
 */

// Cloud Backend Domain (Active & Online with Microsoft SQL Server)
const CLOUD_API_URL = 'https://beantcafe.lingprep.cloud';

// LAN IP of developer machine (Fallback for local offline development)
const LAN_IP = '192.168.0.102';
const PORT = 5000;

function getDefaultApiUrl() {
  // 1. If explicit environment variable is defined
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // 2. Production Cloud Domain (Active & Online for both Mobile and Web)
  if (CLOUD_API_URL) {
    return CLOUD_API_URL.replace(/\/$/, '');
  }

  // 3. Browser / Web platform local fallback
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}`;
  }

  // 4. Android Emulator vs Physical Mobile on LAN
  return `http://${LAN_IP}:${PORT}`;
}

let activeBaseUrl = getDefaultApiUrl();

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
  TIMEOUT_MS: 12000,
};

export function setCustomApiUrl(url) {
  API_CONFIG.BASE_URL = url;
}

export function getApiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
}

export default API_CONFIG;
