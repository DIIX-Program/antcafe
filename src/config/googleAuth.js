import clientSecretJson from '../../client_secret.json';

// Trích xuất cấu hình OAuth Web từ file client_secret.json
const webConfig = clientSecretJson?.web || clientSecretJson?.installed || {};

export const GOOGLE_AUTH_CONFIG = {
  webClientId: webConfig.client_id || '',
  projectId: webConfig.project_id || '',
  authUri: webConfig.auth_uri || '',
  tokenUri: webConfig.token_uri || '',
  clientSecret: webConfig.client_secret || '',
  scopes: ['openid', 'profile', 'email'],
};
