# ☕ ANT COFFEE BACKEND SERVICE
> **Enterprise Node.js RESTful API & WebSocket Real-time Engine with Microsoft SQL Server**

Backend API & WebSocket Server cho hệ thống chuỗi cửa hàng **Ant Coffee & Tea**, xây dựng trên nền tảng **Node.js (Express)** kết nối cơ sở dữ liệu **Microsoft SQL Server (T-SQL)**.

---

## 🚀 TÍNH NĂNG NỔI BẬT

- **Cơ sở dữ liệu Microsoft SQL Server (T-SQL)**: 17 bảng dữ liệu quan hệ, Stored Procedure sinh mã thứ tự ngày (`sp_generate_daily_queue_number`), Database Triggers ghi nhật ký biến động giá (`price_audit_logs`) và lịch sử trạng thái đơn hàng (`order_status_logs`).
- **Real-time WebSockets (Socket.IO v4)**: Cập nhật đơn hàng mới, đổi trạng thái pha chế, bật/tắt nhận đơn khẩn cấp và báo hết món tức thời.
- **Bảo mật chuẩn Enterprise**: Mã hóa mật khẩu bằng `bcryptjs`, cấp phát JWT Bearer Token, phân quyền 3 cấp độ (`CUSTOMER`, `STAFF`, `OWNER`), xác thực Google OAuth 2.0.
- **Tích hợp cổng thanh toán đa kênh**:
  - MoMo API v2: Thuật toán chữ ký số HMAC-SHA256, Webhook IPN, API giả lập kiểm thử.
  - VietQR Napas247: API giả lập xác nhận chuyển khoản và API đổi phương thức thanh toán.
  - Tiền mặt (COD): Đối soát doanh số ca trực và phát hiện lệch két tiền tự động.
- **Sẵn sàng cho Tunnel, LAN & Production Cloud**: Tích hợp sẵn middleware xử lý CORS và tự động vượt qua màn hình cảnh báo của `ngrok`, `localtunnel`, `Cloudflare Tunnel`. Hệ thống hiện đã được triển khai sẵn trên Cloud tại: `https://beantcafe.lingprep.cloud`.

---

## 🛠️ CẤU TRÚC THƯ MỤC

```
BE/
├── package.json               # Cấu hình dự án & scripts npm
├── server.js                  # Entry point chính của máy chủ Express & Socket.IO
├── .env                       # Cấu hình biến môi trường kết nối SQL Server & JWT
├── .env.example               # Mẫu biến môi trường chuẩn
└── src/
    ├── config/
    │   └── db.js              # Cấu hình Connection Pool kết nối SQL Server (msnodesqlv8 + mssql)
    ├── database/
    │   └── schema.sql         # Toàn bộ mã DDL SQL Server tạo 17 bảng, Procedures và Triggers
    ├── middlewares/
    │   ├── auth.js            # Middleware xác thực JWT và kiểm tra Role người dùng (RBAC)
    │   └── tunnelHeaders.js   # Middleware cấu hình CORS và Bypass Tunnel headers
    ├── services/
    │   └── momoService.js     # Dịch vụ chữ ký HMAC-SHA256, gọi MoMo Gateway v2 & xác thực IPN
    ├── controllers/
    │   ├── authController.js       # Đăng nhập, đăng ký, Google OAuth, lấy thông tin cá nhân
    │   ├── storeController.js      # Trạng thái quán, công tắc khẩn cấp bật/tắt nhận đơn
    │   ├── catalogController.js    # Danh mục, sản phẩm, chi tiết options
    │   ├── voucherController.js    # Danh sách voucher, tính toán áp mã giảm giá
    │   ├── customerController.js   # Quản lý sổ địa chỉ giao hàng của khách
    │   ├── orderController.js      # Đặt hàng, đổi trạng thái đơn, hủy đơn, Stored Procedure STT
    │   ├── paymentController.js    # MoMo v2, VietQR, Webhook IPN, chuyển đổi phương thức thanh toán
    │   ├── staffController.js      # Hàng đợi làm món POS, báo hết món nhanh, quản lý ca trực
    │   └── adminController.js      # Báo cáo doanh thu, thống kê theo giờ, kiểm toán giá (Audit)
    ├── routes/                     # Khai báo các đường dẫn API tương ứng
    ├── scripts/
    │   ├── initDb.js          # Script tự động tạo Database ant_coffee_db
    │   ├── seedDb.js          # Script nạp dữ liệu mẫu ban đầu
    │   ├── testEndpoints.js   # Script kiểm thử phản hồi các API endpoints
    │   └── testMoMoPayment.js # Bộ kiểm thử tự động toàn diện thanh toán MoMo & COD
    └── socket/
        └── socketHandler.js   # Xử lý kết nối và các kênh sự kiện Socket.IO
```

---

## 📦 CÁC LỆNH KHỞI CHẠY (COMMANDS)

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Khởi tạo & nạp dữ liệu mẫu vào SQL Server:
```bash
npm run db:init     # Chạy script DDL tạo database & 17 bảng
npm run db:seed     # Nạp sẵn tài khoản mẫu, menu món, voucher & đơn hàng
```

### 3. Kiểm thử thanh toán tự động (MoMo & Tiền mặt):
```bash
npm run test:payment    # Chạy kiểm thử tự động 6 kịch bản MoMo Gateway & Tiền mặt COD
```

### 4. Khởi chạy máy chủ:
```bash
npm run dev         # Chế độ phát triển (tự reload với nodemon)
# hoặc
npm start           # Chế độ production
```

Server sẽ lắng nghe tại cổng `5000`:
- **Local:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/health`
- **API Base:** `http://localhost:5000/api/v1`
- **Socket.IO:** `ws://localhost:5000` (hoặc `wss://beantcafe.lingprep.cloud`)

---

## 💳 TÍCH HỢP THANH TOÁN MOMO, VIETQR & TIỀN MẶT (COD)

Hệ thống tích hợp đầy đủ 3 phương thức thanh toán:
1. **Ví điện tử MoMo**: Tích hợp MoMo API v2 (`captureWallet`), sinh mã QR thanh toán động, deep link mở App MoMo, xác thực chữ ký bảo mật HMAC-SHA256, xử lý Webhook IPN và đồng bộ kết quả qua Socket.IO.
2. **Chuyển khoản VietQR (Napas 247)**: Tích hợp định dạng mã QR ngân hàng Quân Đội (MBBank) kèm mã đơn đối soát chính xác và API giả lập xác nhận chuyển khoản.
3. **Tiền mặt khi nhận (COD)**: Đặt hàng thanh toán khi nhận đồ uống, cập nhật két ca làm việc của nhân viên khi hoàn tất.

📖 Xem tài liệu hướng dẫn chi tiết tại:
- [PROJECT_DOCUMENTATION.md](../docs/PROJECT_DOCUMENTATION.md) (Tài liệu toàn diện kiến trúc dự án).
- [MOMO_PAYMENT_INTEGRATION_GUIDE.md](../docs/MOMO_PAYMENT_INTEGRATION_GUIDE.md) (Hướng dẫn MoMo chi tiết).
- [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md) (Đặc tả 45+ REST APIs).

---

## 🔐 TÀI KHOẢN MẪU (Mật khẩu chung: `123456`)

| Vai trò | Số điện thoại | Tên người dùng | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **OWNER** | `0901111111` | Phan Thế An | Toàn quyền quản trị, báo cáo doanh thu, audit log, cấu hình |
| **STAFF** | `0902222222` | Trần Thu Ngân | Nhận đơn KDS, đổi trạng thái, báo hết món, mở ca |
| **CUSTOMER** | `0901234567` | Nguyễn Văn Khách | Đặt hàng, áp voucher, thanh toán MoMo/VietQR/COD |
| **CUSTOMER** | `0903333333` | Lê Thị Trà Sữa | Đặt hàng, xem lịch sử đơn |

---

## 🌐 HƯỚNG DẪN MỞ MẠNG TUNNEL & CLOUD DEPLOYMENT

1. **Sử dụng Cloud Server trực tiếp:**
   Frontend có thể trỏ thẳng vào máy chủ Production: `https://beantcafe.lingprep.cloud`.
2. **Dùng Ngrok:**
   ```bash
   ngrok http 5000
   ```
3. **Dùng Cloudflare Tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:5000
   ```
4. Copy đường link được tạo và dán vào biến `TUNNEL` trong `src/api/config.js` hoặc đặt `EXPO_PUBLIC_API_URL` trong file `.env`.
