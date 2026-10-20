export function tunnelHeadersMiddleware(req, res, next) {
  // Allow cross-origin requests from any client, webview, mobile device or tunnel
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning, bypass-tunnel-reminder');

  // Skip ngrok and localtunnel reminder / browser warning pages
  res.header('ngrok-skip-browser-warning', 'true');
  res.header('Bypass-Tunnel-Reminder', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}
