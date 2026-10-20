import { createMoMoPayment, verifyMoMoIpnSignature } from '../services/momoService.js';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 KIỂM THỬ TÍCH HỢP THANH TOÁN MOMO & TIỀN MẶT ANT COFFEE');
  console.log('====================================================\n');

  // TEST 1: Tạo đơn hàng thanh toán Tiền mặt (CASH)
  console.log('▶ [Test 1] Tạo đơn hàng thanh toán Tiền mặt (COD)...');
  const cashRes = await fetch(`${BASE_URL}/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: {
        recipient_name: 'Nguyễn Văn Tiền Mặt',
        phone: '0901234567',
        address_detail: '123 Đồng Khởi, Quận 1',
      },
      items: [
        {
          product: { id: 101, name: 'Cà phê Muối', base_price: 35000 },
          quantity: 1,
          totalPrice: 35000,
        },
      ],
      subtotalAmount: 35000,
      shippingFee: 15000,
      discountAmount: 0,
      totalAmount: 50000,
      paymentMethod: 'CASH',
      customerNote: 'Chuẩn bị tiền thừa 100k giúp mình',
    }),
  });

  const cashData = await cashRes.json();
  if (
    cashData.success &&
    cashData.data.payment_method === 'Tiền mặt khi nhận' &&
    cashData.data.payment_status === 'UNPAID' &&
    cashData.momoPayment === null
  ) {
    console.log('  ✅ THÀNH CÔNG: Đơn hàng tiền mặt #' + cashData.data.order_code + ' được tạo với trạng thái UNPAID, không kích hoạt gateway.');
  } else {
    console.error('  ❌ THẤT BẠI Test 1:', cashData);
    process.exit(1);
  }

  // TEST 2: Tạo đơn hàng thanh toán Ví MoMo
  console.log('\n▶ [Test 2] Tạo đơn hàng thanh toán Ví MoMo (Capture Wallet)...');
  const momoOrderRes = await fetch(`${BASE_URL}/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: {
        recipient_name: 'Trần Thị MoMo',
        phone: '0988776655',
        address_detail: '99 Lê Thánh Tôn, Quận 1',
      },
      items: [
        {
          product: { id: 102, name: 'Trà Sữa Oolong Nướng', base_price: 45000 },
          quantity: 2,
          totalPrice: 90000,
        },
      ],
      subtotalAmount: 90000,
      shippingFee: 15000,
      discountAmount: 10000,
      totalAmount: 95000,
      paymentMethod: 'MOMO',
      customerNote: 'Thanh toán online trước',
    }),
  });

  const momoOrderData = await momoOrderRes.json();
  const createdMoMoOrder = momoOrderData.data;
  const momoPayload = momoOrderData.momoPayment;

  if (
    momoOrderData.success &&
    createdMoMoOrder.payment_method === 'Ví MoMo' &&
    createdMoMoOrder.payment_status === 'UNPAID' &&
    momoPayload &&
    momoPayload.payUrl
  ) {
    console.log('  ✅ THÀNH CÔNG: Đơn hàng MoMo #' + createdMoMoOrder.order_code + ' khởi tạo thành công.');
    console.log('     - Pay URL:', momoPayload.payUrl.substring(0, 60) + '...');
    console.log('     - Deeplink:', momoPayload.deeplink.substring(0, 50) + '...');
    console.log('     - QR Code URL:', (momoPayload.qrCodeUrl || '').substring(0, 50) + '...');
  } else {
    console.error('  ❌ THẤT BẠI Test 2:', momoOrderData);
    process.exit(1);
  }

  // TEST 3: Kiểm tra trạng thái đơn hàng khi chưa thanh toán
  console.log('\n▶ [Test 3] Tra cứu trạng thái thanh toán đơn #' + createdMoMoOrder.order_code + '...');
  const statusRes1 = await fetch(`${BASE_URL}/payment/momo/status/${createdMoMoOrder.order_code}`);
  const statusData1 = await statusRes1.json();

  if (statusData1.success && statusData1.data.isPaid === false && statusData1.data.paymentStatus === 'UNPAID') {
    console.log('  ✅ THÀNH CÔNG: Trạng thái hiện tại chính xác là UNPAID (Chưa thanh toán).');
  } else {
    console.error('  ❌ THẤT BẠI Test 3:', statusData1);
    process.exit(1);
  }

  // TEST 4: Giả lập thanh toán MoMo thành công (Sandbox Simulator)
  console.log('\n▶ [Test 4] Giả lập hoàn tất thanh toán MoMo thành công cho đơn #' + createdMoMoOrder.order_code + '...');
  const simRes = await fetch(`${BASE_URL}/payment/momo/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderCode: createdMoMoOrder.order_code }),
  });
  const simData = await simRes.json();

  if (simData.success && simData.data.payment_status === 'PAID') {
    console.log('  ✅ THÀNH CÔNG: Đơn hàng đã chuyển sang PAID.');
    console.log('     - Mã giao dịch MoMo:', simData.data.payment_transaction_ref);
  } else {
    console.error('  ❌ THẤT BẠI Test 4:', simData);
    process.exit(1);
  }

  // TEST 5: Tra cứu lại trạng thái sau khi thanh toán
  console.log('\n▶ [Test 5] Tra cứu lại trạng thái đơn hàng sau thanh toán...');
  const statusRes2 = await fetch(`${BASE_URL}/payment/momo/status/${createdMoMoOrder.order_code}`);
  const statusData2 = await statusRes2.json();

  if (statusData2.success && statusData2.data.isPaid === true && statusData2.data.paymentStatus === 'PAID') {
    console.log('  ✅ THÀNH CÔNG: Xác nhận đơn hàng đã ghi nhận thanh toán thành công (isPaid = true).');
  } else {
    console.error('  ❌ THẤT BẠI Test 5:', statusData2);
    process.exit(1);
  }

  // TEST 6: Kiểm tra bảo mật chữ ký IPN (Signature Verification)
  console.log('\n▶ [Test 6] Kiểm tra xác thực chữ ký Webhook IPN...');
  const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  const accessKey = 'F8BBA842ECF85';
  const testIpnBody = {
    partnerCode: 'MOMO',
    orderId: `${createdMoMoOrder.order_code}_123456`,
    requestId: `${createdMoMoOrder.order_code}_123456`,
    amount: '95000',
    orderInfo: 'Thanh toan don hang',
    orderType: 'momo_wallet',
    transId: '2345678901',
    resultCode: 0,
    message: 'Thành công.',
    payType: 'qr',
    responseTime: 1792500000000,
    extraData: '',
  };

  const rawSig = 
    `accessKey=${accessKey}&amount=${testIpnBody.amount}&extraData=${testIpnBody.extraData}&message=${testIpnBody.message}&orderId=${testIpnBody.orderId}&orderInfo=${testIpnBody.orderInfo}&orderType=${testIpnBody.orderType}&partnerCode=${testIpnBody.partnerCode}&payType=${testIpnBody.payType}&requestId=${testIpnBody.requestId}&responseTime=${testIpnBody.responseTime}&resultCode=${testIpnBody.resultCode}&transId=${testIpnBody.transId}`;

  testIpnBody.signature = crypto.createHmac('sha256', secretKey).update(rawSig).digest('hex');

  const validCheck = verifyMoMoIpnSignature(testIpnBody);
  const invalidCheck = verifyMoMoIpnSignature({ ...testIpnBody, signature: 'fake_tampered_signature' });

  if (validCheck === true && invalidCheck === false) {
    console.log('  ✅ THÀNH CÔNG: Chữ ký hợp lệ được chấp thuận, chữ ký giả mạo bị từ chối 100%.');
  } else {
    console.error('  ❌ THẤT BẠI Test 6: Kiểm tra chữ ký thất bại.');
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ 6 BÀI KIỂM THỬ THANH TOÁN ĐỀU ĐẠT CHUẨN 100%!');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
