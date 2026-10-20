# TÀI LIỆU TOÀN DIỆN SẢN PHẨM & KIẾN TRÚC HỆ THỐNG ANT COFFEE

---

## 1. GIỚI THIỆU SẢN PHẨM (PRODUCT OVERVIEW)

**Ant Coffee** là hệ thống quản lý và đặt đồ uống toàn diện (Cà phê & Trà sữa) chuẩn Enterprise, được thiết kế bao gồm:
1. **Frontend (Mobile App)**: Xây dựng bằng React Native & Expo, tương thích đa nền tảng (Android, iOS, Web). Giao diện hiện đại, mượt mà với 3 phân hệ giao diện chuyên biệt cho từng vai trò người dùng.
2. **Backend (REST API & Real-time Server)**: Xây dựng bằng Node.js & Express, hỗ trợ đầy đủ các tiêu chuẩn bảo mật JWT, CORS linh hoạt, cấu trúc phân tầng (Controller - Route - Middleware - Database Pool) và WebSockets (Socket.IO).
3. **Cơ sở dữ liệu (Database)**: Microsoft SQL Server (T-SQL), quản lý toàn vẹn dữ liệu với 17 bảng liên kết, hỗ trợ Stored Procedures sinh số thứ tự ngày, Triggers tự động kiểm toán lịch sử sửa giá, và cột tính toán tiền lệch két.
4. **Hạ tầng kết nối xuyên suốt (Tunneling & Multi-Environment)**: Tự động phát hiện môi trường chạy (Máy thật qua LAN, Máy ảo Android Emulator `10.0.2.2`, hoặc Public Domain qua Cloudflare Tunnel / Ngrok / Localtunnel) mà không cần cấu hình lại code.

---

## 2. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

```
       +-----------------------------------------------------------+
       |                CLIENT LAYER (REACT NATIVE)                |
       |  Customer View       Staff POS View       Owner Dashboard |
       +-----------------------------------------------------------+
                     |                               |
          REST APIs (HTTP/JSON)           WebSockets (Socket.IO)
          (Token Bearer, Tunnel Safe)    (Bi-directional Realtime)
                     |                               |
                     v                               v
       +-----------------------------------------------------------+
       |               PUBLIC TUNNEL / GATEWAY (OPTIONAL)          |
       |          Cloudflare Tunnel / Ngrok / Custom Domain        |
       +-----------------------------------------------------------+
                                     |
                                     v
       +-----------------------------------------------------------+
       |                 BACKEND SERVER (NODE.JS)                  |
       |  - Express REST Controllers (Auth, Orders, Catalog...)    |
       |  - Socket.IO Hub (order:created, status_updated...)       |
       |  - JWT RBAC Middlewares (PUBLIC, CUSTOMER, STAFF, OWNER)  |
       |  - Tunnel Bypass Headers Interceptor                      |
       +-----------------------------------------------------------+
                                     |
                         ODBC / Named Pipes Driver
                           (msnodesqlv8 + mssql)
                                     |
                                     v
       +-----------------------------------------------------------+
       |          DATABASE LAYER (MICROSOFT SQL SERVER)            |
       |  - ant_coffee_db (17 Tables, Unicode NVARCHAR)            |
       |  - Triggers: Price Auditing, Order Status Logging         |
       |  - Stored Procedures: Daily Queue Number (A001, A002...)  |
       +-----------------------------------------------------------+
```

---

## 3. CƠ SỞ DỮ LIỆU & LOGIC NGHIỆP VỤ (DATABASE DESIGN)

Hệ thống sử dụng cơ sở dữ liệu **`ant_coffee_db`** chạy trên Microsoft SQL Server:
- **Tài khoản kết nối mặc định:** `sa` | **Mật khẩu:** `123456`
- **Instance:** `Pham-The-An\SQLEXPRESS` (hoặc cấu hình tùy ý qua file `.env`)

### 3.1. Danh mục 17 bảng dữ liệu cốt lõi
1. **`users`**: Quản trị tài khoản đa phân quyền (`CUSTOMER`, `STAFF`, `OWNER`), lưu điểm tích lũy (`loyalty_points`), hash mật khẩu bằng `bcryptjs`.
2. **`store_settings`**: Cấu hình duy nhất của quán (Tên, địa chỉ, số hotline, wifi, giờ mở/đóng cửa, phí ship, và công tắc nhận đơn khẩn cấp `is_accepting_orders`).
3. **`customer_addresses`**: Sổ địa chỉ giao hàng của khách (Nhà riêng, Công ty, ghi chú giao hàng, gắn cờ mặc định).
4. **`staff_shifts`**: Quản lý ca trực nhân viên, số tiền mặt đầu ca, tiền hệ thống bán ra và cột tính toán tự động chênh lệch két tiền `discrepancy_amount`.
5. **`categories`**: Danh mục đồ uống (Cà phê, Trà sữa, Trà trái cây, Đá xay...).
6. **`products`**: Chi tiết sản phẩm, giá gốc `base_price`, mô tả, ảnh, trạng thái còn món `is_available`.
7. **`option_groups`**: Nhóm tùy chọn (Size, Mức đá, Độ ngọt, Topping) hỗ trợ quy tắc chọn 1 (`SINGLE`) hoặc nhiều (`MULTIPLE`), bắt buộc hay tùy chọn.
8. **`option_items`**: Chi tiết từng lựa chọn (VD: Size L +6k, Trân châu +8k, 50% Đá +0k).
9. **`product_option_groups`**: Bảng liên kết Many-to-Many giữa món và nhóm tùy chọn áp dụng.
10. **`carts` & `cart_items`**: Quản lý giỏ hàng phía server kèm `signature_hash` để tự động gộp các ly có cùng cấu hình Size/Topping.
11. **`vouchers`**: Quản lý mã giảm giá (Theo phần trăm `%` hoặc tiền mặt cố định `VND`, kèm điều kiện đơn tối thiểu và giới hạn giảm tối đa).
12. **`daily_sequences`**: Lưu trữ số đếm tăng dần trong ngày phục vụ sinh mã số thứ tự.
13. **`orders`**: Thông tin đơn hàng (Mã đơn `order_code` ngẫu nhiên, số thứ tự `daily_queue_number`, tổng tiền, tiền giảm, phí ship, phương thức thanh toán, địa chỉ nhận hàng).
14. **`order_items`**: Chi tiết từng món trong đơn kèm trường `selected_options_json` lưu lại toàn bộ snapshot tại thời điểm mua (đảm bảo sau này quán đổi giá món hoặc giá topping thì lịch sử đơn cũ không bị sai lệch giá).
15. **`order_status_logs`**: Lịch sử chuyển trạng thái xử lý đơn (ai đổi, thời gian đổi, lý do hủy).
16. **`price_audit_logs`**: Nhật ký kiểm toán mọi biến động về giá bán sản phẩm hoặc topping để bảo vệ quyền lợi chủ quán.

### 3.2. Stored Procedure & Triggers Tự Động
- **Stored Procedure `sp_generate_daily_queue_number`**:
  Sinh số thứ tự mỗi ngày theo định dạng chữ cái kết hợp số 3 chữ số (VD: `A001`, `A002`, `A003`... tự động reset về `A001` khi bước sang ngày mới).
- **Trigger `trg_after_product_price_update`**:
  Khi bất kỳ ai sửa cột `base_price` trong bảng `products`, trigger tự động ghi lại giá cũ, giá mới, ngày giờ vào bảng `price_audit_logs`.
- **Trigger `trg_after_option_price_update`**:
  Tự động kiểm toán khi giá thêm `extra_price` của Topping/Size thay đổi.
- **Trigger `trg_after_order_status_update`**:
  Tự động lưu lịch sử chuyển đổi trạng thái đơn hàng vào bảng `order_status_logs`.

---

## 4. CHI TIẾT CÁC PHÂN HỆ NGƯỜI DÙNG TRÊN FRONTEND (UI/UX)

Ứng dụng hỗ trợ chuyển đổi linh hoạt hoặc đăng nhập tự động theo vai trò:

### 4.1. Phân hệ Khách hàng (CUSTOMER)
- **Menu trực quan**: Duyệt danh mục theo thanh trượt ngang, tìm kiếm món theo tên, đánh dấu món nổi bật (Best Seller).
- **Modal tùy chỉnh đồ uống cao cấp**: Khách hàng tùy biến linh hoạt Size, Mức đường, Mức đá, và chọn Topping kèm giá cộng thêm được tính toán theo thời gian thực.
- **Giỏ hàng & Khuyến mãi**: Nhập và áp dụng các mã Voucher (VD: `ANTNEW`, `FREESHIP`), tự động trừ chiết khấu và cộng phí ship.
- **Sổ địa chỉ tiện lợi**: Lưu trữ nhiều địa chỉ giao hàng và gắn cờ địa chỉ mặc định.
- **Theo dõi đơn hàng thời gian thực (Live Order Timeline)**:
  Nhận thông báo cập nhật qua WebSocket ngay khi quầy pha chế bấm "Xác nhận", "Đang pha chế", "Sẵn sàng" hoặc "Đã giao".

### 4.2. Phân hệ Nhân viên Barista & Thu ngân (STAFF POS)
- **Hàng đợi làm món trực quan (Queue Display)**:
  Hiển thị danh sách các đơn theo thứ tự đặt trước làm trước.
- **Thao tác 1 chạm (Quick Actions)**:
  Bấm "Nhận đơn", "Xong món", "Hoàn tất" và cập nhật tức thì tới khách hàng.
- **Báo hết món nhanh tại quầy (Quick Out-of-Stock)**:
  Nút bật/tắt nhanh trạng thái còn hàng của từng món khi quầy hết nguyên liệu mà không cần vào trang quản trị phức tạp.
- **Nút khẩn cấp nhận đơn**: Tắt/Bật nhận đơn toàn bộ cửa hàng khi quán quá tải.

### 4.3. Phân hệ Quản trị Chủ cửa hàng (OWNER DASHBOARD)
- **Báo cáo Doanh thu & Thống kê**:
  Doanh thu thuần, số lượng đơn hoàn thành, tỷ lệ đơn hủy, giá trị đơn trung bình (AOV).
- **Biểu đồ doanh thu theo giờ**: Giúp chủ quán nhận biết khung giờ cao điểm để phân bổ nhân sự hợp lý.
- **Kiểm toán giá (Price Audit)**: Theo dõi chặt chẽ lịch sử thay đổi giá bán để phòng ngừa gian lận.
- **Cấu hình cửa hàng**: Chỉnh sửa tên quán, số điện thoại, phí ship, tài khoản wifi.

---

## 5. HƯỚNG DẪN CÀI ĐẶT & CHẠY HỆ THỐNG

### 5.1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 18.x trở lên.
- **Microsoft SQL Server**: Bản Express, Standard hoặc Developer (Đã bật xác thực SQL Server Authentication `sa`).
- **ODBC Driver for SQL Server**: Cài đặt sẵn trên Windows (hoặc driver chuẩn `ODBC Driver 17/18 for SQL Server`).
- **Expo CLI / Expo Go**: Cài đặt trên điện thoại để quét mã QR chạy app.

### 5.2. Khởi tạo Cơ sở dữ liệu
Di chuyển vào thư mục `BE` và chạy lệnh khởi tạo:
```powershell
cd "A:\Class do DNTU\LT_Android\antcafe\BE"
npm install
npm run db:init     # Tự động tạo Database ant_coffee_db và 17 bảng
npm run db:seed     # Nạp sẵn tài khoản mẫu, menu, topping, vouchers và đơn hàng mẫu
```

**Tài khoản mẫu có sẵn trong hệ thống (Mật khẩu chung: `123456`):**
- **Chủ cửa hàng (OWNER):** `0901111111`
- **Nhân viên thu ngân (STAFF):** `0902222222`
- **Khách hàng 1 (CUSTOMER):** `0901234567`
- **Khách hàng 2 (CUSTOMER):** `0903333333`

### 5.3. Khởi chạy Backend Server
```powershell
cd "A:\Class do DNTU\LT_Android\antcafe\BE"
npm start           # Chạy server ở chế độ Production
# hoặc
npm run dev         # Chạy server với nodemon tự reload khi code thay đổi
```
Server sẽ khởi động tại: `http://localhost:5000` và lắng nghe trên tất cả các card mạng `0.0.0.0:5000`.

### 5.4. Khởi chạy Frontend App
Mở một cửa sổ Terminal khác tại thư mục gốc:
```powershell
cd "A:\Class do DNTU\LT_Android\antcafe"
npx expo start -c
```
- Quét mã QR trên màn hình bằng ứng dụng **Expo Go** trên Android/iOS.
- Hoặc bấm phím `a` để chạy trên Android Emulator.
- Hoặc bấm phím `w` để mở giao diện Web trên trình duyệt.

---

## 6. HƯỚNG DẪN MỞ MẠNG RA NGOÀI BẰNG TUNNEL (HOSTING & DOMAIN)

Hệ thống được thiết kế hoàn toàn sẵn sàng cho việc đưa Backend ra Internet công khai (Public URL / Tunnel / Custom Domain):

### 6.1. Sử dụng Ngrok
Mở Terminal và chạy:
```powershell
ngrok http 5000
```
Ngrok sẽ cung cấp một đường dẫn công khai, ví dụ:
`https://abc123-antcoffee.ngrok-free.app`

### 6.2. Sử dụng Cloudflare Tunnel (Miễn phí, ổn định cao, hỗ trợ Custom Domain)
```powershell
cloudflared tunnel --url http://localhost:5000
```

### 6.3. Cấu hình Frontend gọi vào Tunnel
Chỉ cần mở file `A:\Class do DNTU\LT_Android\antcafe\src\api\config.js`:
- Điền đường dẫn tunnel vào trường `TUNNEL`:
```javascript
export const API_CONFIG = {
  TUNNEL: 'https://abc123-antcoffee.ngrok-free.app', // Điền link tunnel hoặc custom domain tại đây
  // ...
};
```
Hoặc tạo file `.env` tại thư mục gốc với nội dung:
```env
EXPO_PUBLIC_API_URL=https://abc123-antcoffee.ngrok-free.app
```
Client HTTP và kết nối WebSocket sẽ tự động chuyển sang sử dụng đường dẫn này mà không cần sửa bất kỳ dòng code nào khác.

---

## 7. CƠ CHẾ DỰ PHÒNG & KHẢ NĂNG CHỐNG LỖI (FALLBACK RESILIENCE)

Hệ thống Ant Coffee áp dụng nguyên tắc **Graceful Degradation**:
- **Offline / Server bảo trì**: Nếu Backend hoặc SQL Server tạm thời không thể kết nối, Frontend tự động kích hoạt bộ nhớ đệm (Fallback Cache) với dữ liệu Menu và Giỏ hàng có sẵn, hiển thị thông báo nhẹ nhàng cho người dùng mà không bao giờ bị Crash trắng màn hình.
- **Tự động Reconnect WebSocket**: Socket.IO tự động thử kết nối lại với thuật toán Exponential Backoff khi mạng di động bị gián đoạn (chuyển từ Wifi sang 4G).
- **Xác thực giá hai đầu (Double Price Check)**: Giá của từng ly nước và Topping luôn được tính toán và kiểm tra lại độc lập tại Database khi thanh toán, đảm bảo khách hàng không thể chỉnh sửa giá từ phía thiết bị.
