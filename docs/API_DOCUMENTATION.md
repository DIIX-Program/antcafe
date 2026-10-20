# TÀI LIỆU CHI TIẾT API & WEBSOCKET - HỆ THỐNG ANT COFFEE

Hệ thống Backend Ant Coffee cung cấp toàn bộ RESTful APIs và WebSocket Server phục vụ cho 3 phân quyền người dùng: **Khách hàng (CUSTOMER)**, **Nhân viên thu ngân & pha chế (STAFF)**, và **Chủ cửa hàng (OWNER)**.

---

## 1. THÔNG TIN CHUNG & CẤU HÌNH KẾT NỐI

- **Base URL cục bộ:** `http://localhost:5000` hoặc `http://<IP_LAN_CUA_MAY>:5000` (VD: `http://192.168.0.102:5000`)
- **Android Emulator Base URL:** `http://10.0.2.2:5000`
- **Tunnel URL:** Hỗ trợ bất kỳ tunnel nào (ngrok, Cloudflare Tunnel, localtunnel, Pinggy) qua biến môi trường `EXPO_PUBLIC_API_URL`.
- **Prefix phiên bản:** `/api/v1`
- **Format dữ liệu:** `application/json` (Encoding: `UTF-8`)
- **WebSocket Protocol:** `Socket.IO v4.x` kết nối trực tiếp tại port `5000` (Path: `/socket.io/`).

### Headers Mặc Định & Tunnel Bypass
Để các công cụ tunnel như `ngrok` hoặc `localtunnel` không trả về màn hình cảnh báo (interstitial warning screen), Client luôn đính kèm các Header sau:
```http
Content-Type: application/json
Accept: application/json
ngrok-skip-browser-warning: true
bypass-tunnel-reminder: true
```

---

## 2. CƠ CHẾ BẢO MẬT & XÁC THỰC (AUTHENTICATION)

### 2.1. JWT Bearer Token
Các API yêu cầu xác thực cần gửi Bearer Token qua Header:
```http
Authorization: Bearer <access_token>
```

### 2.2. Phân Quyền (Role-Based Access Control - RBAC)
- **`PUBLIC`**: Không yêu cầu đăng nhập. Dành cho danh mục món, thông tin quán, mã voucher khả dụng.
- **`CUSTOMER`**: Khách hàng đã đăng nhập. Quyền quản lý sổ địa chỉ, giỏ hàng, đặt hàng và xem lịch sử đơn.
- **`STAFF`**: Nhân viên cửa hàng. Quyền xem hàng đợi làm món (Queue), đổi trạng thái pha chế, mở/đóng ca két tiền, bật/tắt nhanh hết món tại quầy.
- **`OWNER`**: Chủ cửa hàng / Quản trị viên. Toàn quyền quản trị: cấu hình quán, phân quyền nhân sự, quản trị danh mục/sản phẩm/topping, xem báo cáo doanh thu & lịch sử chỉnh sửa giá (audit log).

---

## 3. DANH SÁCH CHI TIẾT REST API ENDPOINTS

### 3.1. Phân Hệ Xác Thực & Tài Khoản (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
- **Mô tả:** Đăng ký tài khoản Khách hàng mới bằng Số điện thoại.
- **Quyền:** `PUBLIC`
- **Request Body:**
  ```json
  {
    "phone": "0901234567",
    "password": "mypassword123",
    "full_name": "Nguyễn Văn A",
    "email": "nguyenvana@example.com"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Đăng ký tài khoản thành công",
    "data": {
      "user": {
        "id": 1005,
        "phone": "0901234567",
        "full_name": "Nguyễn Văn A",
        "email": "nguyenvana@example.com",
        "role": "CUSTOMER",
        "loyalty_points": 0
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### `POST /api/v1/auth/login`
- **Mô tả:** Đăng nhập hệ thống (Áp dụng cho mọi vai trò: Khách hàng, Nhân viên, Chủ quán).
- **Quyền:** `PUBLIC`
- **Request Body:**
  ```json
  {
    "phone": "0901111111",
    "password": "password123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "user": {
        "id": 1,
        "phone": "0901111111",
        "full_name": "Võ Thị Chủ Quán",
        "email": "owner@antcoffee.vn",
        "role": "OWNER",
        "loyalty_points": 9999,
        "status": "ACTIVE"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### `GET /api/v1/auth/me`
- **Mô tả:** Lấy thông tin tài khoản hiện tại từ Token.
- **Quyền:** `CUSTOMER`, `STAFF`, `OWNER`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 3,
      "phone": "0901234567",
      "full_name": "Nguyễn Văn An",
      "email": "customer1@gmail.com",
      "role": "CUSTOMER",
      "loyalty_points": 150
    }
  }
  ```

---

### 3.2. Phân Hệ Thông Tin Quán & Menu Công Khai (`/api/v1/store`, `/api/v1/categories`, `/api/v1/products`)

#### `GET /api/v1/store/status`
- **Mô tả:** Lấy trạng thái hoạt động của quán (Đang mở hay tạm ngừng nhận đơn khẩn cấp, giờ mở/đóng cửa, phí ship mặc định, wifi).
- **Quyền:** `PUBLIC`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "store_name": "Ant Coffee & Tea - Flagship Store",
      "phone": "1900 6868",
      "address": "123 Đường Nguyễn Tri Phương, Phường 7, Quận 5, TP.HCM",
      "wifi_name": "Ant Coffee 5G",
      "wifi_password": "antcoffee_vip",
      "is_accepting_orders": true,
      "open_time": "07:00:00",
      "close_time": "22:30:00",
      "default_shipping_fee": 15000
    }
  }
  ```

#### `PATCH /api/v1/store/toggle-accepting`
- **Mô tả:** Bật/Tắt chế độ nhận đơn khẩn cấp (khi quán quá tải, mất điện, hết đá...).
- **Quyền:** `STAFF`, `OWNER`
- **Request Body (Tùy chọn):**
  ```json
  { "is_accepting_orders": false }
  ```
- **Response `200 OK`:** Trả về trạng thái mới và tự động phát WebSocket `store:status_updated` tới toàn bộ thiết bị.

#### `GET /api/v1/categories`
- **Mô tả:** Lấy danh sách danh mục sản phẩm đang hoạt động, sắp xếp theo `display_order`.
- **Quyền:** `PUBLIC`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Cà Phê",
        "description": "Cà phê pha phin và pha máy truyền thống",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        "product_count": 3
      },
      {
        "id": 2,
        "name": "Trà Sữa",
        "description": "Trà sữa đậm vị thơm ngon béo ngậy",
        "image_url": "https://images.unsplash.com/photo-1558857563-b37cf533b632",
        "product_count": 3
      }
    ]
  }
  ```

#### `GET /api/v1/products`
- **Mô tả:** Lấy danh sách sản phẩm. Hỗ trợ lọc theo danh mục, tìm kiếm và lấy món nổi bật.
- **Quyền:** `PUBLIC`
- **Query Parameters:**
  - `category_id`: ID danh mục (số nguyên)
  - `search`: Từ khóa tìm kiếm theo tên món
  - `is_featured`: `1` (chỉ lấy món nổi bật)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "category_id": 1,
        "category_name": "Cà Phê",
        "name": "Cà Phê Muối Hoàng Kim",
        "description": "Cà phê pha phin đậm vị kết hợp cùng lớp kem béo mặn nhẹ trứ danh",
        "base_price": 32000,
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
        "is_available": true,
        "is_featured": true,
        "display_order": 1
      }
    ]
  }
  ```

#### `GET /api/v1/products/:id`
- **Mô tả:** Lấy chi tiết 1 sản phẩm kèm toàn bộ nhóm Option (Size, Mức đường, Mức đá, Topping) và các mục lựa chọn con kèm giá cộng thêm (`extra_price`).
- **Quyền:** `PUBLIC`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "Cà Phê Muối Hoàng Kim",
      "base_price": 32000,
      "option_groups": [
        {
          "id": 1,
          "name": "Chọn Size",
          "selection_type": "SINGLE",
          "is_required": true,
          "items": [
            { "id": 1, "name": "Size M (Vừa)", "extra_price": 0, "is_default": true, "is_available": true },
            { "id": 2, "name": "Size L (Lớn)", "extra_price": 6000, "is_default": false, "is_available": true }
          ]
        },
        {
          "id": 4,
          "name": "Topping Thêm",
          "selection_type": "MULTIPLE",
          "is_required": false,
          "items": [
            { "id": 11, "name": "Trân Châu Đen Hoàng Kim", "extra_price": 8000, "is_available": true },
            { "id": 12, "name": "Thạch Củ Năng Giòn", "extra_price": 10000, "is_available": true }
          ]
        }
      ]
    }
  }
  ```

#### `GET /api/v1/products/options/all`
- **Mô tả:** Lấy danh sách đầy đủ tất cả các nhóm tùy chọn (Size, Đường, Đá, Topping) phục vụ dựng modal tùy chỉnh đồ uống phía Client.
- **Quyền:** `PUBLIC`

---

### 3.3. Phân Hệ Khuyến Mãi (Vouchers) (`/api/v1/vouchers`)

#### `GET /api/v1/vouchers/available`
- **Mô tả:** Lấy danh sách tất cả các Voucher đang có hiệu lực (còn thời hạn, chưa hết lượt sử dụng).
- **Quyền:** `PUBLIC`

#### `POST /api/v1/vouchers/apply`
- **Mô tả:** Kiểm tra và tính thử số tiền giảm giá cho một đơn hàng cụ thể trước khi bấm Đặt hàng.
- **Quyền:** `PUBLIC` hoặc `CUSTOMER`
- **Request Body:**
  ```json
  {
    "code": "ANTNEW",
    "order_amount": 75000
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Áp dụng mã giảm giá thành công",
    "data": {
      "voucher_id": 1,
      "code": "ANTNEW",
      "title": "Giảm 20% Cho Khách Mới",
      "discount_type": "PERCENT",
      "discount_amount": 15000,
      "order_amount": 75000,
      "final_amount": 60000
    }
  }
  ```

---

### 3.4. Phân Hệ Khách Hàng (Customer Profiles & Sổ Địa Chỉ) (`/api/v1/customer`)

#### `GET /api/v1/customer/addresses`
- **Mô tả:** Lấy danh sách sổ địa chỉ nhận hàng của người dùng.
- **Quyền:** `CUSTOMER`, `STAFF`, `OWNER`

#### `POST /api/v1/customer/addresses`
- **Mô tả:** Thêm địa chỉ nhận hàng mới.
- **Quyền:** `CUSTOMER`, `STAFF`, `OWNER`
- **Request Body:**
  ```json
  {
    "label": "Văn phòng",
    "recipient_name": "Nguyễn Văn A",
    "recipient_phone": "0901234567",
    "address_detail": "Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM",
    "is_default": true,
    "note": "Gọi trước khi giao 5 phút"
  }
  ```

---

### 3.5. Phân Hệ Đơn Hàng & Đặt Hàng (Orders) (`/api/v1/orders`)

#### `POST /api/v1/orders/checkout`
- **Mô tả:** Đặt hàng từ Giỏ hàng. Tự động kiểm tra giá tại thời điểm đặt, sinh mã đơn ngẫu nhiên kiểu `ANT-XXXX`, gọi Stored Procedure `sp_generate_daily_queue_number` để sinh số thứ tự trong ngày dạng `A001`, `A002`, lưu snapshot JSON các món đã chọn, và phát thông báo WebSocket `order:created` tới màn hình Thu ngân/Pha chế của nhân viên.
- **Quyền:** `PUBLIC` hoặc `CUSTOMER` (hỗ trợ cả khách vãng lai và khách đã có tài khoản)
- **Request Body:**
  ```json
  {
    "customer_name": "Nguyễn Văn A",
    "customer_phone": "0901234567",
    "order_type": "DELIVERY",
    "delivery_address": "123 Đường Nguyễn Tri Phương, Quận 5, TP.HCM",
    "payment_method": "CASH",
    "voucher_code": "ANTNEW",
    "order_note": "Giao trước 11h trưa",
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "selected_options": [
          { "group_id": 1, "group_name": "Chọn Size", "item_id": 2, "item_name": "Size L (Lớn)", "extra_price": 6000 },
          { "group_id": 2, "group_name": "Mức Đá", "item_id": 4, "item_name": "70% Đá", "extra_price": 0 },
          { "group_id": 3, "group_name": "Độ Ngọt (Đường)", "item_id": 8, "item_name": "50% Đường", "extra_price": 0 },
          { "group_id": 4, "group_name": "Topping Thêm", "item_id": 11, "item_name": "Trân Châu Đen Hoàng Kim", "extra_price": 8000 }
        ],
        "item_note": "Cho nhiều trân châu"
      }
    ]
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Đặt hàng thành công",
    "data": {
      "order": {
        "id": 1004,
        "order_code": "ANT-2221",
        "daily_queue_number": "A004",
        "status": "PENDING",
        "subtotal_amount": 92000,
        "discount_amount": 18400,
        "shipping_fee": 15000,
        "final_amount": 88600,
        "order_type": "DELIVERY",
        "payment_method": "CASH",
        "payment_status": "UNPAID",
        "customer_name": "Nguyễn Văn A",
        "customer_phone": "0901234567",
        "created_at": "2026-10-20T03:25:00.000Z"
      }
    }
  }
  ```

#### `GET /api/v1/orders`
- **Mô tả:** Lấy danh sách đơn hàng (hỗ trợ phân trang, lọc theo trạng thái và tìm kiếm).
- **Quyền:** `STAFF`, `OWNER`
- **Query Parameters:**
  - `status`: `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`
  - `order_type`: `AT_STORE`, `TAKE_AWAY`, `DELIVERY`
  - `search`: Tìm theo mã đơn, SĐT hoặc tên khách hàng
  - `page`, `limit`: Phân trang

#### `GET /api/v1/orders/:id`
- **Mô tả:** Lấy chi tiết đơn hàng (bao gồm toàn bộ danh sách món con, options đã chọn và lịch sử chuyển trạng thái từ bảng `order_status_logs`).
- **Quyền:** `ALL`

#### `PUT /api/v1/orders/:id/status`
- **Mô tả:** Cập nhật trạng thái xử lý đơn hàng. Tự động kích hoạt Database Trigger `trg_after_order_status_update` để ghi log kiểm toán, đồng thời phát WebSocket `order:status_updated` đến màn hình khách hàng và nhân viên.
- **Quyền:** `STAFF`, `OWNER`
- **Request Body:**
  ```json
  {
    "status": "CONFIRMED",
    "cancel_reason": ""
  }
  ```

#### `PATCH /api/v1/orders/:id/cancel`
- **Mô tả:** Hủy đơn hàng (Khách hàng chỉ được hủy khi trạng thái là `PENDING`; Nhân viên/Chủ quán có thể hủy và bắt buộc kèm lý do).
- **Quyền:** `CUSTOMER`, `STAFF`, `OWNER`

---

### 3.6. Phân Hệ Nhân Viên & Điểm Bán POS (`/api/v1/staff`)

#### `GET /api/v1/staff/orders/queue`
- **Mô tả:** Lấy danh sách hàng đợi các đơn đang cần xử lý tại quầy bar (`PENDING`, `CONFIRMED`, `PREPARING`, `READY`), sắp xếp theo `created_at ASC` (đến trước làm trước).
- **Quyền:** `STAFF`, `OWNER`

#### `PATCH /api/v1/staff/products/:id/availability`
- **Mô tả:** Chức năng báo hết món nhanh tại quầy (Không cho phép nhân viên tự ý sửa giá). Phát sự kiện WebSocket `product:availability_updated` để toàn bộ App khách hàng lập tức hiển thị tag "Tạm hết món".
- **Quyền:** `STAFF`, `OWNER`
- **Request Body:**
  ```json
  {
    "is_available": false
  }
  ```

#### `POST /api/v1/staff/shifts/check-in`
- **Mô tả:** Mở ca làm việc mới, ghi nhận số tiền mặt đầu ca trong két (`opening_cash`).
- **Quyền:** `STAFF`, `OWNER`

#### `POST /api/v1/staff/shifts/check-out`
- **Mô tả:** Bàn giao đóng ca, nhập số tiền mặt thực tế đếm được (`actual_closing_cash`). Hệ thống SQL Server tự động kích hoạt trường tính toán `discrepancy_amount AS (actual_closing_cash - (opening_cash + system_calculated_cash))` để tính tiền thừa/thiếu trong két.
- **Quyền:** `STAFF`, `OWNER`

---

### 3.7. Phân Hệ Quản Trị & Báo Cáo Doanh Thu (`/api/v1/admin`)

#### `GET /api/v1/admin/reports/revenue`
- **Mô tả:** Thống kê doanh thu theo ngày, tuần, tháng; tổng số đơn hàng thành công, số đơn bị hủy, giá trị trung bình mỗi đơn (AOV) và biểu đồ phân bổ đơn hàng theo khung giờ trong ngày (Hourly sales distribution).
- **Quyền:** `OWNER`
- **Query Parameters:**
  - `range`: `today`, `yesterday`, `week`, `month`, `year` (Mặc định: `today`)

#### `GET /api/v1/admin/audit/price-logs`
- **Mô tả:** Xem lịch sử ai đã thay đổi giá sản phẩm hoặc giá topping, thay đổi từ giá bao nhiêu thành giá bao nhiêu (được ghi tự động thông qua Database Triggers `trg_after_product_price_update` và `trg_after_option_price_update`).
- **Quyền:** `OWNER`

#### `PUT /api/v1/admin/products/:id`
- **Mô tả:** Sửa thông tin món ăn, bao gồm đổi giá gốc `base_price` (Trigger sẽ tự ghi nhận vào bảng kiểm toán).
- **Quyền:** `OWNER`

---

## 4. TÀI LIỆU WEBSOCKET (SOCKET.IO PROTOCOL)

Hệ thống sử dụng **Socket.IO** để trao đổi dữ liệu hai chiều thời gian thực giữa Khách hàng, Thu ngân và Chủ quán mà không cần cơ chế Polling tốn tài nguyên.

### 4.1. Kết nối và Tham gia phòng (Rooms)
Client kết nối tới WebSocket Server:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  extraHeaders: {
    'ngrok-skip-browser-warning': 'true'
  }
});

// Tham gia phòng lắng nghe đơn hàng (Dành cho Quầy thu ngân & Bếp)
socket.emit('join:orders');

// Tham gia phòng cập nhật trạng thái cửa hàng
socket.emit('join:store');

// Khách hàng tham gia lắng nghe đơn của chính mình
socket.emit('join:customer', customerUserId);
```

### 4.2. Danh Sách Sự Kiện (Events) Phát từ Server (Server-to-Client)

| Tên Event | Dữ liệu kèm theo (Payload) | Mô tả & Tác dụng |
| :--- | :--- | :--- |
| `order:created` | `{ order }` | Phát ngay khi khách bấm Đặt hàng. Quầy pha chế phát chuông thông báo và hiện thẻ đơn mới trên POS. |
| `order:status_updated` | `{ order_id, status, cancel_reason, order }` | Phát khi nhân viên chuyển trạng thái đơn (Xác nhận, Đang pha, Sẵn sàng, Hoàn tất, Hủy). App khách hàng tự động cập nhật timeline tiến trình pha chế. |
| `store:status_updated` | `{ is_accepting_orders, updated_by, timestamp }` | Phát khi quán chuyển chế độ Mở / Ngừng nhận đơn. Toàn bộ App cập nhật banner thông báo tức thì. |
| `product:availability_updated` | `{ product_id, is_available, updated_by }` | Phát khi nhân viên báo hết món hoặc mở bán lại món. Khách hàng không thể thêm món đã hết vào giỏ. |

---

## 5. MÃ TRẢ VỀ (HTTP STATUS CODES)

- `200 OK`: Yêu cầu thực hiện thành công.
- `201 Created`: Tạo tài nguyên mới thành công (Đăng ký tài khoản, Đặt đơn hàng mới).
- `400 Bad Request`: Thiếu dữ liệu bắt buộc hoặc tham số không hợp lệ.
- `401 Unauthorized`: Chưa đăng nhập hoặc Token JWT không hợp lệ/hết hạn.
- `403 Forbidden`: Người dùng không có quyền truy cập endpoint này (Ví dụ: Khách hàng cố truy cập API báo cáo của Chủ quán).
- `404 Not Found`: Không tìm thấy tài nguyên (Món ăn không tồn tại, mã đơn hàng sai).
- `500 Internal Server Error`: Lỗi phát sinh trong quá trình xử lý nội bộ hoặc truy vấn Database.
