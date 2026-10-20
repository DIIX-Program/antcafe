import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function pass(msg) {
  console.log(`${colors.green}  ✔ PASS:${colors.reset} ${msg}`);
}

function fail(msg, err) {
  console.error(`${colors.red}  ✘ FAIL:${colors.reset} ${msg}`);
  if (err) console.error(err);
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}🧪 ANT COFFEE - AUTOMATED LOCAL ENDPOINT & SOCKET TEST${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  let passedCount = 0;
  let totalCount = 0;

  async function testStep(name, fn) {
    totalCount++;
    try {
      await fn();
      pass(name);
      passedCount++;
    } catch (e) {
      fail(name, e.message);
    }
  }

  // 1. Health check
  await testStep('1. Kiểm tra Health Check (GET /health)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'HEALTHY') {
      throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 2. Store status
  await testStep('2. Lấy thông tin cửa hàng (GET /api/v1/store/status)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/store/status`);
    const json = await res.json();
    if (!json.success || !json.data.store_name) {
      throw new Error('Dữ liệu cửa hàng không hợp lệ');
    }
  });

  // 3. Categories
  await testStep('3. Lấy danh mục sản phẩm (GET /api/v1/categories)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/categories`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error('Không có danh mục nào');
    }
  });

  // 4. Products
  let sampleProductId = 101;
  await testStep('4. Lấy danh sách đồ uống (GET /api/v1/products)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/products`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error('Không có sản phẩm nào');
    }
    sampleProductId = json.data[0].id;
  });

  // 5. Product Detail with Options
  await testStep(`5. Lấy chi tiết món kèm Options (GET /api/v1/products/${sampleProductId})`, async () => {
    const res = await fetch(`${BASE_URL}/api/v1/products/${sampleProductId}`);
    const json = await res.json();
    if (!json.success || (!json.data.optionGroups && !json.data.option_groups)) {
      throw new Error('Không lấy được options của món');
    }
  });

  // 6. Available Vouchers
  await testStep('6. Lấy danh sách Voucher (GET /api/v1/vouchers/available)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/vouchers/available`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('Không lấy được vouchers');
    }
  });

  // 7. Auth: Login as Customer
  let customerToken = '';
  await testStep('7. Đăng nhập Khách hàng (POST /api/v1/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0901234567', password: '123456' })
    });
    const json = await res.json();
    if (!json.success || !json.data.token) {
      throw new Error(json.message || 'Đăng nhập khách hàng thất bại');
    }
    customerToken = json.data.token;
  });

  // 8. Auth: Login as Staff
  let staffToken = '';
  await testStep('8. Đăng nhập Nhân viên (POST /api/v1/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0902222222', password: '123456' })
    });
    const json = await res.json();
    if (!json.success || !json.data.token) {
      throw new Error(json.message || 'Đăng nhập staff thất bại');
    }
    staffToken = json.data.token;
  });

  // 9. Auth: Login as Owner
  let ownerToken = '';
  await testStep('9. Đăng nhập Chủ quán (POST /api/v1/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0901111111', password: '123456' })
    });
    const json = await res.json();
    if (!json.success || !json.data.token) {
      throw new Error(json.message || 'Đăng nhập owner thất bại');
    }
    ownerToken = json.data.token;
  });

  // 10. WebSocket real-time connection & event test
  await testStep('10. Kiểm tra kết nối WebSocket (Socket.IO)', async () => {
    return new Promise((resolve, reject) => {
      const socket = io(BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      socket.on('connect', () => {
        socket.emit('join:orders');
        setTimeout(() => {
          socket.disconnect();
          resolve();
        }, 800);
      });

      socket.on('connect_error', (err) => {
        reject(err);
      });
    });
  });

  // 11. Checkout order test
  let createdOrderId = null;
  await testStep('11. Đặt hàng mới (POST /api/v1/orders/checkout)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        address: {
          recipient_name: 'Nguyễn Văn An',
          phone: '0901234567',
          address_detail: '123 Nguyễn Huệ, P. Bến Nghé, Q.1'
        },
        items: [
          {
            product: {
              id: sampleProductId,
              name: 'Cà Phê Muối Hoàng Gia',
              base_price: 35000
            },
            quantity: 1,
            unitPrice: 35000,
            totalPrice: 35000,
            selectedSize: { name: 'Size S' }
          }
        ],
        subtotalAmount: 35000,
        shippingFee: 15000,
        totalAmount: 50000,
        paymentMethod: 'CASH'
      })
    });
    const json = await res.json();
    if (!json.success || (!json.data?.id && !json.data?.order?.id)) {
      throw new Error(json.message || 'Đặt hàng thất bại');
    }
    createdOrderId = json.data?.id || json.data?.order?.id;
  });

  // 12. Staff updates order status
  if (createdOrderId) {
    await testStep(`12. Nhân viên chuyển trạng thái đơn (PUT /api/v1/orders/${createdOrderId}/status)`, async () => {
      const res = await fetch(`${BASE_URL}/api/v1/orders/${createdOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`
        },
        body: JSON.stringify({ status: 'CONFIRMED' })
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Cập nhật trạng thái thất bại');
      }
    });
  }

  // 13. Owner analytics
  await testStep('13. Chủ quán xem báo cáo doanh thu (GET /api/v1/admin/reports/revenue)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/reports/revenue?range=today`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error('Không lấy được báo cáo');
    }
  });

  console.log(`\n${colors.bold}Kết quả kiểm thử:${colors.reset} ${passedCount}/${totalCount} bước thành công!`);
  if (passedCount === totalCount) {
    console.log(`${colors.green}${colors.bold}🎉 TẤT CẢ 13/13 TEST ĐỀU HOẠT ĐỘNG HOÀN HẢO TRÊN LOCAL!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}Có một số bài test chưa đạt, vui lòng kiểm tra server log.${colors.reset}\n`);
  }
}

runTests();
