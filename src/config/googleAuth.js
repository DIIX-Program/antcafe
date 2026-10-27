/**
 * Ant Coffee & Tea - Google OAuth 2.0 Configuration
 * Safe configuration supporting EXPO_PUBLIC environment variables and runtime configuration.
 */

export const GOOGLE_AUTH_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  projectId: process.env.EXPO_PUBLIC_GOOGLE_PROJECT_ID || 'ant-coffee-tea',
  authUri: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  clientSecret: '',
  scopes: ['openid', 'profile', 'email'],
};

export default GOOGLE_AUTH_CONFIG;
