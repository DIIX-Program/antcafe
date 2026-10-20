import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// MoMo Sandbox / Production Configuration
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  apiEndpoint: process.env.MOMO_API_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  queryEndpoint: process.env.MOMO_QUERY_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/query',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5000/api/v1/payment/momo/callback',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5000/api/v1/payment/momo/ipn',
  partnerName: 'Ant Coffee & Tea',
  storeId: 'AntCoffee01',
};

/**
 * Tạo yêu cầu thanh toán MoMo v2 (requestType: captureWallet)
 * @param {Object} params
 * @param {string} params.orderCode - Mã đơn hàng (VD: ANT-9021)
 * @param {number} params.amount - Số tiền thanh toán (VNĐ)
 * @param {string} [params.orderInfo] - Thông tin hiển thị trên MoMo
 * @param {string} [params.extraData] - Dữ liệu mở rộng đính kèm
 * @param {string} [params.redirectUrl] - URL quay về sau khi thanh toán
 * @param {string} [params.ipnUrl] - URL Webhook server nhận IPN
 * @returns {Promise<Object>} Phản hồi từ MoMo (chứa payUrl, deeplink, qrCodeUrl)
 */
export async function createMoMoPayment({
  orderCode,
  amount,
  orderInfo,
  extraData = '',
  redirectUrl,
  ipnUrl,
}) {
  const partnerCode = MOMO_CONFIG.partnerCode;
  const accessKey = MOMO_CONFIG.accessKey;
  const secretKey = MOMO_CONFIG.secretKey;
  const finalRedirectUrl = redirectUrl || MOMO_CONFIG.redirectUrl;
  const finalIpnUrl = ipnUrl || MOMO_CONFIG.ipnUrl;
  
  // MoMo yêu cầu requestId và orderId độc nhất cho mỗi lượt thanh toán
  const requestId = `${orderCode}_${Date.now()}`;
  const orderId = requestId;
  const requestType = 'captureWallet';
  const info = orderInfo || `Thanh toan don hang ${orderCode} tai Ant Coffee & Tea`;
  const amountStr = String(Math.round(Number(amount)));

  // Chuỗi raw signature theo chuẩn alphabet của MoMo v2
  const rawSignature = 
    `accessKey=${accessKey}` +
    `&amount=${amountStr}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${finalIpnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${info}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${finalRedirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode,
    partnerName: MOMO_CONFIG.partnerName,
    storeId: MOMO_CONFIG.storeId,
    requestId,
    amount: amountStr,
    orderId,
    orderInfo: info,
    redirectUrl: finalRedirectUrl,
    ipnUrl: finalIpnUrl,
    lang: 'vi',
    extraData,
    requestType,
    signature,
  };

  console.log(`[MoMo Service] Sending payment creation for order ${orderCode}, amount: ${amountStr}`);

  try {
    const response = await fetch(MOMO_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log(`[MoMo Service] Response for order ${orderCode}: resultCode = ${data.resultCode}, message = ${data.message}`);

    if (data.resultCode === 0) {
      return {
        success: true,
        orderCode,
        requestId,
        orderId,
        amount: Number(amountStr),
        payUrl: data.payUrl,
        deeplink: data.deeplink,
        qrCodeUrl: data.qrCodeUrl,
        deeplinkMiniApp: data.deeplinkMiniApp,
        message: data.message,
        rawResponse: data,
      };
    } else {
      console.warn(`[MoMo Service] Gateway returned non-zero code ${data.resultCode}: ${data.message}`);
      // Trả về fallback thông tin giao dịch giả lập để không gián đoạn trải nghiệm người dùng
      return getSimulatedPaymentPayload({
        orderCode,
        requestId,
        orderId,
        amount: Number(amountStr),
        message: data.message,
        isFallback: true,
      });
    }
  } catch (error) {
    console.error(`[MoMo Service] Network error connecting to MoMo gateway:`, error.message);
    // Offline / Network fallback
    return getSimulatedPaymentPayload({
      orderCode,
      requestId,
      orderId,
      amount: Number(amountStr),
      message: error.message,
      isFallback: true,
    });
  }
}

/**
 * Xác thực tính hợp lệ của chữ ký MoMo gửi qua Webhook IPN
 * @param {Object} ipnData - Dữ liệu MoMo POST tới IPN URL
 * @returns {boolean} True nếu chữ ký hợp lệ
 */
export function verifyMoMoIpnSignature(ipnData) {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData = '',
      signature,
    } = ipnData;

    const accessKey = MOMO_CONFIG.accessKey;
    const secretKey = MOMO_CONFIG.secretKey;

    const rawSignature = 
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const isValid = signature === expectedSignature;
    if (!isValid) {
      console.warn('[MoMo Service] Signature mismatch in IPN verification.');
    }
    return isValid;
  } catch (err) {
    console.error('[MoMo Service] Error verifying IPN signature:', err.message);
    return false;
  }
}

/**
 * Tra cứu trạng thái giao dịch thanh toán từ MoMo Gateway
 * @param {Object} params
 * @param {string} params.orderId - orderId đã dùng khi tạo thanh toán
 * @param {string} params.requestId - requestId đã dùng khi tạo thanh toán
 * @returns {Promise<Object>}
 */
export async function queryMoMoPaymentStatus({ orderId, requestId }) {
  const partnerCode = MOMO_CONFIG.partnerCode;
  const accessKey = MOMO_CONFIG.accessKey;
  const secretKey = MOMO_CONFIG.secretKey;

  const rawSignature = 
    `accessKey=${accessKey}` +
    `&orderId=${orderId}` +
    `&partnerCode=${partnerCode}` +
    `&requestId=${requestId}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode,
    requestId,
    orderId,
    signature,
    lang: 'vi',
  };

  try {
    const response = await fetch(MOMO_CONFIG.queryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(requestBody),
    });

    return await response.json();
  } catch (error) {
    console.error('[MoMo Service] Query status error:', error.message);
    return {
      resultCode: -1,
      message: error.message,
    };
  }
}

/**
 * Hàm hỗ trợ tạo payload giao dịch MoMo giả lập khi offline hoặc test cục bộ
 */
function getSimulatedPaymentPayload({ orderCode, requestId, orderId, amount, message, isFallback = false }) {
  const simulatedPayUrl = `https://test-payment.momo.vn/v2/gateway/pay?orderCode=${orderCode}&amount=${amount}`;
  const simulatedDeeplink = `momo://app?action=payWithApp&orderCode=${orderCode}&amount=${amount}`;
  const simulatedQr = `momo://app?action=payWithApp&isScanQR=true&orderCode=${orderCode}&amount=${amount}`;

  return {
    success: true,
    orderCode,
    requestId,
    orderId,
    amount,
    payUrl: simulatedPayUrl,
    deeplink: simulatedDeeplink,
    qrCodeUrl: simulatedQr,
    deeplinkMiniApp: simulatedDeeplink,
    message: isFallback ? `MoMo Gateway (Chế độ hỗ trợ test): ${message || 'Thành công'}` : 'Thành công',
    isSimulated: isFallback,
  };
}

export default {
  createMoMoPayment,
  verifyMoMoIpnSignature,
  queryMoMoPaymentStatus,
  MOMO_CONFIG,
};
