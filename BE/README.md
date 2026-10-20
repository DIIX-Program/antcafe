# ☕ ANT COFFEE BACKEND SERVICE

Backend API & WebSocket Server cho hệ thống chuỗi cửa hàng Ant Coffee, xây dựng trên nền tảng **Node.js (Express)** kết nối cơ sở dữ liệu **Microsoft SQL Server**.

---

## 🚀 TÍNH NĂNG NỔI BẬT

- **Cơ sở dữ liệu Microsoft SQL Server (T-SQL)**: 17 bảng dữ liệu quan hệ, Stored Procedure sinh mã thứ tự ngày (`sp_generate_daily_queue_number`), Database Triggers ghi nhật ký biến động giá (`price_audit_logs`) và lịch sử trạng thái đơn hàng (`order_status_logs`).
- **Real-time WebSockets (Socket.IO)**: Cập nhật đơn hàng mới, đổi trạng thái pha chế, bật/tắt nhận đơn khẩn cấp và báo hết món tức thời.
- **Bảo mật chuẩn Enterprise**: Mã hóa mật khẩu bằng `bcryptjs`, cấp phát JWT Bearer Token, phân quyền 3 cấp độ (`CUSTOMER`, `STAFF`, `OWNER`).
- **Sẵn sàng cho Tunnel & Custom Domain**: Tích hợp sẵn middleware xử lý CORS và tự động vượt qua màn hình cảnh báo của `ngrok`, `localtunnel`, `Cloudflare Tunnel`.

---

## 🛠️ CẤU TRÚC THƯ MỤC

```
BE/
├── package.json               # Cấu hình dự án & scripts npm
├── server.js                  # Entry point chính của máy chủ Express & Socket.IO
├── .env                       # Cấu hình biến môi trường kết nối SQL Server & JWT
├── .env.example               # Mẫu biến môi trường
└── src/
    ├── config/
    │   └── db.js              # Cấu hình Pool kết nối SQL Server (hỗ trợ msnodesqlv8 & TDS)
    ├── database/
    │   └── schema.sql         # File DDL SQL Server khởi tạo 17 bảng, Procedures và Triggers
    ├── middlewares/
    │   ├── auth.js            # Middleware xác thực JWT và kiểm tra Role người dùng
    │   └── tunnelHeaders.js   # Middleware cấu hình CORS và Bypass Tunnel headers
    ├── controllers/
    │   ├── authController.js       # Đăng nhập, đăng ký, lấy thông tin cá nhân
    │   ├── storeController.js      # Trạng thái quán, bật/tắt nhận đơn
    │   ├── catalogController.js    # Danh mục, sản phẩm, chi tiết options
    │   ├── voucherController.js    # Danh sách voucher, tính toán áp mã giảm giá
    │   ├── customerController.js   # Quản lý sổ địa chỉ giao hàng
    │   ├── orderController.js      # Đặt hàng, đổi trạng thái đơn, hủy đơn
    │   ├── staffController.js      # Hàng đợi làm món POS, báo hết món, quản lý ca trực
    │   └── adminController.js      # Báo cáo doanh thu, lịch sử kiểm toán giá
    ├── routes/                # Khai báo các đường dẫn API tương ứng
    ├── scripts/
    │   ├── initDb.js          # Script tự động tạo Database ant_coffee_db
    │   └── seedDb.js          # Script nạp dữ liệu mẫu ban đầu
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
npm run db:init     # Chạy script DDL tạo database & bảng
npm run db:seed     # Nạp sẵn tài khoản mẫu, menu món, voucher & đơn hàng
```

### 3. Khởi chạy máy chủ:
```bash
npm run dev         # Chế độ phát triển (tự reload với nodemon)
# hoặc
npm start           # Chế độ production
```

Server sẽ lắng nghe tại cổng `5000`:
- **Local:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/health`
- **API Base:** `http://localhost:5000/api/v1`
- **Socket.IO:** `ws://localhost:5000`

---

## 🔐 TÀI KHOẢN MẪU (Mật khẩu: `123456`)

| Vai trò | Số điện thoại | Tên người dùng | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **OWNER** | `0901111111` | Võ Thị Chủ Quán | Toàn quyền quản trị, báo cáo, sửa giá, cấu hình |
| **STAFF** | `0902222222` | Trần Văn Pha Chế | Nhận đơn, đổi trạng thái, báo hết món, mở ca |
| **CUSTOMER** | `0901234567` | Nguyễn Văn An | Đặt hàng, áp voucher, quản lý địa chỉ |
| **CUSTOMER** | `0903333333` | Lê Thị Bích | Đặt hàng, xem lịch sử đơn |

---

## 🌐 HƯỚNG DẪN MỞ MẠNG TUNNEL RA NGOÀI

Để đưa Backend lên mạng internet cho người khác hoặc điện thoại ngoài mạng Wifi truy cập:

1. Dùng **Ngrok**:
   ```bash
   ngrok http 5000
   ```
2. Dùng **Cloudflare Tunnel**:
   ```bash
   cloudflared tunnel --url http://localhost:5000
   ```
3. Copy đường link được tạo và dán vào biến `TUNNEL` trong `src/api/config.js` trên Frontend.
