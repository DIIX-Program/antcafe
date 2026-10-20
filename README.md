# 🐜 ANT COFFEE - HỆ THỐNG ĐẶT & QUẢN LÝ CÀ PHÊ TOÀN DIỆN

Hệ thống ứng dụng di động và máy chủ quản lý chuỗi cà phê/trà sữa **Ant Coffee** hỗ trợ đầy đủ 3 đối tượng người dùng: **Khách hàng (CUSTOMER)**, **Nhân viên thu ngân & pha chế (STAFF POS)**, và **Chủ cửa hàng (OWNER)**.

---

## 🏛️ TỔNG QUAN DỰ ÁN

Dự án bao gồm 2 thành phần chính:
1. **Frontend (`/`)**: Ứng dụng di động React Native / Expo, giao diện hiện đại với Dark Mode, hoạt ảnh mượt mà, quản lý trạng thái thời gian thực.
2. **Backend (`/BE`)**: Máy chủ REST API & WebSocket (Node.js, Express, Socket.IO) kết nối cơ sở dữ liệu quan hệ **Microsoft SQL Server**.

---

## 📁 CẤU TRÚC THƯ MỤC

```
antcafe/
├── App.js                      # Điểm khởi chạy ứng dụng Frontend React Native
├── app.json                    # Cấu hình Expo
├── BE/                         # Máy chủ Backend Node.js
│   ├── server.js               # Máy chủ Express & Socket.IO
│   ├── src/                    # Controllers, Routes, Middlewares, Sockets, DB
│   └── README.md               # Tài liệu chi tiết Backend
├── docs/                       # Tài liệu kỹ thuật
│   ├── API_DOCUMENTATION.md    # Đặc tả chi tiết toàn bộ REST APIs & WebSocket Events
│   └── PRODUCT_GUIDE.md        # Hướng dẫn chi tiết kiến trúc, CSDL & luồng nghiệp vụ
└── src/                        # Mã nguồn ứng dụng Frontend
    ├── api/                    # Client kết nối API, cấu hình URL, các dịch vụ gọi API
    ├── components/             # Các components UI (Cart, Modals, Views theo vai trò)
    ├── screens/                # Màn hình đăng nhập, đăng ký, xác thực
    ├── services/               # Kết nối Socket.IO thời gian thực
    └── theme/                  # Định nghĩa màu sắc, typography
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
npm start
```
Server sẽ chạy tại `http://localhost:5000` (hoặc mạng LAN `http://<IP_MAY>:5000`).

### 3. Khởi chạy Frontend App
Mở một terminal khác tại thư mục gốc:
```powershell
npm install
npx expo start -c
```
- Dùng app **Expo Go** trên điện thoại để quét mã QR.
- Hoặc bấm `w` để mở phiên bản Web trên trình duyệt.

---

## 🔑 TÀI KHOẢN MẪU DÙNG THỬ (Mật khẩu chung: `123456`)

- **Chủ cửa hàng (OWNER):** `0901111111`
- **Nhân viên (STAFF):** `0902222222`
- **Khách hàng 1 (CUSTOMER):** `0901234567`
- **Khách hàng 2 (CUSTOMER):** `0903333333`

---

## 🌐 HỖ TRỢ KẾT NỐI QUA TUNNEL (PUBLIC DOMAIN)

Frontend và Backend được xây dựng để tương thích hoàn toàn với các giải pháp Tunnel:
- Khi sử dụng **Cloudflare Tunnel** hoặc **Ngrok**:
  - Backend đã sẵn sàng CORS `*` và headers bypass cảnh báo.
  - Frontend chỉ cần cập nhật link tunnel trong `src/api/config.js` hoặc file `.env` với biến `EXPO_PUBLIC_API_URL`.

---

## 📚 TÀI LIỆU CHI TIẾT

- [Tài liệu toàn diện Sản phẩm & Kiến trúc](file:///A:/Class%20do%20DNTU/LT_Android/antcafe/docs/PRODUCT_GUIDE.md)
- [Tài liệu Chi tiết REST APIs & WebSockets](file:///A:/Class%20do%20DNTU/LT_Android/antcafe/docs/API_DOCUMENTATION.md)
- [Hướng dẫn Backend & Database](file:///A:/Class%20do%20DNTU/LT_Android/antcafe/BE/README.md)
