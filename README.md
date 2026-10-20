# 🐜 ANT COFFEE - HỆ THỐNG ĐẶT & QUẢN LÝ CÀ PHÊ TOÀN DIỆN
> **Enterprise Mobile F&B Platform: React Native / Expo Mobile App & Node.js Real-time Backend with MS SQL Server**

Hệ thống ứng dụng di động và máy chủ quản lý chuỗi cà phê/trà sữa **Ant Coffee** hỗ trợ đầy đủ 3 đối tượng người dùng: **Khách hàng (CUSTOMER)**, **Nhân viên thu ngân & pha chế (STAFF POS)**, và **Chủ cửa hàng (OWNER)**.

---

## 🏛️ TỔNG QUAN DỰ ÁN

Dự án bao gồm 2 thành phần chính:
1. **Frontend (`/`)**: Ứng dụng di động React Native / Expo (SDK ~57, React 19), giao diện Glassmorphism hiện đại, hoạt ảnh mượt mà, xác thực Google OAuth & SĐT, thanh toán MoMo / VietQR Napas247 / Tiền mặt, quản lý trạng thái thời gian thực qua WebSockets.
2. **Backend (`/BE`)**: Máy chủ RESTful API & WebSocket (Node.js, Express, Socket.IO) kết nối cơ sở dữ liệu quan hệ **Microsoft SQL Server** (17 bảng, Stored Procedure sinh mã thứ tự ngày, Triggers kiểm toán giá và cập nhật tồn bán). Đang được triển khai sẵn trên Cloud tại: `https://beantcafe.lingprep.cloud`.

---

## 📁 CẤU TRÚC THƯ MỤC

```
antcafe/
├── App.js                         # Điểm khởi chạy ứng dụng Frontend React Native (Multi-role state)
├── app.json                       # Cấu hình Expo SDK
├── BE/                            # Máy chủ Backend Node.js
│   ├── server.js                  # Máy chủ Express & Socket.IO
│   ├── src/                       # Controllers, Routes, Middlewares, Sockets, DB
│   └── README.md                  # Hướng dẫn chi tiết kỹ thuật Backend
├── docs/                          # Hệ thống tài liệu kỹ thuật toàn diện
│   ├── PROJECT_DOCUMENTATION.md   # [CHÍNH] Tài liệu toàn diện về Dự án, FE, BE, DB, Socket & Payment
│   ├── API_DOCUMENTATION.md       # Đặc tả chi tiết toàn bộ 45+ REST APIs & WebSocket Events
│   ├── MOMO_PAYMENT_INTEGRATION_GUIDE.md # Hướng dẫn tích hợp Cổng thanh toán MoMo v2 & COD
│   └── PRODUCT_GUIDE.md           # Hướng dẫn kiến trúc, CSDL và luồng nghiệp vụ
└── src/                           # Mã nguồn ứng dụng Frontend
    ├── api/                       # HTTP Client, Config phân giải URL (Cloud/LAN/Tunnel), Services
    ├── components/                # UI Components (Cart, VietQR, MoMo, KDS StaffView, OwnerView)
    │   └── common/                # Thư viện UI nguyên tử (GlassView, KPICard, Modal, Button...)
    ├── config/                    # Cấu hình Google OAuth
    ├── data/                      # Dữ liệu đệm ngoại tuyến (Offline Mock Data & Fallback Cache)
    ├── screens/                   # Luồng màn hình xác thực AuthFlow (Login, Register, OTP)
    ├── services/                  # Kết nối Socket.IO thời gian thực
    └── theme/                     # Design System (Màu sắc HSL, Glassmorphism, Shadows, Typography)
```

---

## ⚡ HƯỚNG DẪN KHỞI CHẠY NHANH

### 1. Chuẩn bị Cơ sở dữ liệu (Microsoft SQL Server)
- Kết nối SQL Server với tài khoản `sa` / `123456`.
- Mở terminal tại thư mục `BE` và nạp dữ liệu:
  ```powershell
  cd BE
  npm install
  npm run db:init     # Tự động tạo DB ant_coffee_db và 17 bảng
  npm run db:seed     # Nạp sẵn tài khoản mẫu, menu món và voucher
  ```

### 2. Khởi chạy Backend Server
```powershell
cd BE
npm run dev         # Chế độ phát triển (nodemon)
# hoặc
npm start           # Chế độ production
```
- Server nội bộ sẽ chạy tại: `http://localhost:5000` (hoặc mạng LAN `http://192.168.0.102:5000`).
- Kiểm tra sức khỏe: `http://localhost:5000/health`.
- Kiểm thử thanh toán tự động: `npm run test:payment`.

### 3. Khởi chạy Frontend App
Mở một terminal khác tại thư mục gốc:
```powershell
npm install
npx expo start -c
```
- Dùng app **Expo Go** trên điện thoại (Android/iOS) để quét mã QR.
- Hoặc bấm phím `w` để mở phiên bản Web trên trình duyệt (`http://localhost:8081`).
- Hoặc bấm phím `a` để chạy trên Android Emulator.

---

## 🔑 TÀI KHOẢN MẪU DÙNG THỬ (Mật khẩu chung: `123456`)

| Vai trò | Số điện thoại | Họ và tên | Chức năng kiểm thử chính |
| :--- | :--- | :--- | :--- |
| **Chủ cửa hàng (OWNER)** | `0901111111` | Phan Thế An | KPI Doanh thu, biểu đồ giờ, Price Audit Logs, bật/tắt nhận đơn |
| **Nhân viên (STAFF POS)** | `0902222222` | Trần Thu Ngân | Hàng đợi KDS, nhận đơn, xong món, hoàn tất thu tiền, báo hết món |
| **Khách hàng 1 (CUSTOMER)**| `0901234567` | Nguyễn Văn Khách | Đặt món, áp mã `ANTNEW`, thanh toán MoMo/VietQR/COD, live tracking |
| **Khách hàng 2 (CUSTOMER)**| `0903333333` | Lê Thị Trà Sữa | Đặt đơn nhiều topping, quản lý sổ địa chỉ giao hàng |

> **Mẹo chấm điểm / kiểm thử nhanh:** Trên thanh Header của ứng dụng có nút chuyển đổi vai trò (Role Switcher: Khách hàng / Nhân viên / Quản trị viên). Bạn có thể bấm chuyển tức thì để trải nghiệm cả 3 luồng người dùng mà không cần đăng xuất!

---

## 💳 PHƯƠNG THỨC THANH TOÁN TÍCH HỢP

1. **Ví điện tử MoMo API v2:** Tạo chữ ký điện tử HMAC-SHA256, hiển thị mã QR, Deep Link mở App MoMo, nhận Webhook IPN tự động cập nhật trạng thái đơn hàng.
2. **Chuyển khoản VietQR (Napas 247):** Mã hóa thông tin thanh toán tài khoản ngân hàng Quân Đội (MBBank) kèm nội dung `ANT <mã_đơn>` tự động sinh mã QR chuẩn quốc gia.
3. **Tiền mặt khi nhận hàng (COD):** Thu tiền trực tiếp và đối soát chênh lệch két tiền ca trực của nhân viên thu ngân.

---

## 🌐 HẠ TẦNG KẾT NỐI ĐA MÔI TRƯỜNG & CLOUD

Hệ thống được trang bị bộ phân giải địa chỉ thông minh (`src/api/config.js`), hỗ trợ chạy mượt mà trên mọi môi trường:
- **Cloud Backend (Trực tuyến 24/7):** `https://beantcafe.lingprep.cloud`
- **Mạng cục bộ (LAN IP):** `http://192.168.0.102:5000`
- **Android Emulator:** `http://10.0.2.2:5000`
- **Public Tunnel:** Hỗ trợ Cloudflare Tunnel / Ngrok / Localtunnel với cơ chế tự động gửi Header vượt màn hình cảnh báo (Tunnel Interstitial Bypass).

---

## 📚 HỆ THỐNG TÀI LIỆU CHI TIẾT

- 📕 **[Tài liệu toàn diện Hệ thống Ant Coffee](file:///A:/Class%20do%20DNTU/LT_Android/antcafe/docs/PROJECT_DOCUMENTATION.md)** *(Đầy đủ kiến trúc FE, BE, DB 17 bảng, Socket.IO, Thanh toán & Triển khai)*
- 📗 **[Tài liệu Chi tiết REST APIs & WebSockets](file:///A:/Class%20do%20DNTU/LT_Android/antcafe/docs/API_DOCUMENTATION.md)** *(Đặc tả chi tiết 45+ endpoints)*
- 📘 **[Hướng dẫn Tích hợp Cổng thanh toán MoMo & COD](file:///A:/Class%20do%20DNTU/LT_Android/antcafe/docs/MOMO_PAYMENT_INTEGRATION_GUIDE.md)**
- 📙 **[Hướng dẫn Sản phẩm & Kiến trúc sơ bộ](file:///A:/Class%20do%20DNTU/LT_Android/antcafe/docs/PRODUCT_GUIDE.md)**
- 📓 **[Hướng dẫn Kỹ thuật Backend Server](file:///A:/Class%20do%20DNTU/LT_Android/antcafe/BE/README.md)**
