# 📋 THIẾT KẾ ĐẶC TẢ RESTFUL API - HỆ THỐNG ANT COFFEE

Tài liệu này tổng hợp toàn bộ danh mục các RESTful API Endpoints của hệ thống Ant Coffee & Tea, phân loại chi tiết theo từng phân quyền và nhóm chức năng nghiệp vụ.

---

## 1. Phân hệ Xác thực & Tài khoản (AUTH - Dùng chung)

| Method | Endpoint | Quyền | Chức năng mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `PUBLIC` | Khách hàng đăng ký tài khoản mới bằng Số điện thoại |
| `POST` | `/api/v1/auth/login` | `PUBLIC` | Đăng nhập tài khoản bằng SĐT/Email + Mật khẩu (trả về JWT Token + Role) |
| `POST` | `/api/v1/auth/google` | `PUBLIC` | Đăng nhập hoặc tạo mới tài khoản qua Google OAuth 2.0 |
| `POST` | `/api/v1/auth/logout` | `ALL` | Đăng xuất người dùng |
| `GET` | `/api/v1/auth/me` | `ALL` | Lấy thông tin cá nhân và điểm tích lũy hiện tại |
| `PUT` | `/api/v1/auth/me` | `ALL` | Cập nhật họ tên, ảnh đại diện |
| `PUT` | `/api/v1/auth/change-password` | `ALL` | Đổi mật khẩu tài khoản |

---

## 2. Phân hệ Menu & Cửa hàng (PUBLIC / CATALOG - Ai cũng xem được)

| Method | Endpoint | Quyền | Chức năng mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/store/status` | `PUBLIC` | Xem thông tin quán, giờ mở cửa & kiểm tra quán có đang nhận đơn (`is_accepting_orders`) không |
| `GET` | `/api/v1/categories` | `PUBLIC` | Lấy danh sách danh mục đang bán (`is_active = 1`) |
| `GET` | `/api/v1/products` | `PUBLIC` | Lấy danh sách đồ uống (hỗ trợ lọc theo `?category_id=`, `?search=`, `?is_featured=1`) |
| `GET` | `/api/v1/products/:id` | `PUBLIC` | Lấy chi tiết 1 đồ uống kèm toàn bộ nhóm Size, Đá, Đường, Topping của món đó |
| `GET` | `/api/v1/vouchers/available` | `PUBLIC` | Lấy danh sách mã giảm giá đang có hiệu lực |

---

## 3. Phân quyền 1: KHÁCH HÀNG (CUSTOMER)

### 3.1. Sổ địa chỉ nhận hàng
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/customer/addresses` | Lấy danh sách địa chỉ nhận hàng của khách |
| `POST` | `/api/v1/customer/addresses` | Thêm địa chỉ giao hàng mới |
| `PUT` | `/api/v1/customer/addresses/:id` | Sửa địa chỉ hoặc đặt làm địa chỉ mặc định |
| `DELETE` | `/api/v1/customer/addresses/:id` | Xóa địa chỉ khỏi sổ |

### 3.2. Giỏ hàng thông minh (Cart)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/cart` | Xem giỏ hàng hiện tại (Tự động tính lại giá mới nhất từ DB) |
| `POST` | `/api/v1/cart/items` | Thêm món kèm Size/Topping vào giỏ (Tự gộp số lượng qua `signature_hash`) |
| `PUT` | `/api/v1/cart/items/:itemId` | Tăng / Giảm số lượng ly hoặc sửa ghi chú (`item_note`) |
| `DELETE` | `/api/v1/cart/items/:itemId` | Xóa 1 dòng món khỏi giỏ hàng |
| `DELETE` | `/api/v1/cart/clear` | Xóa sạch toàn bộ món trong giỏ hàng |
| `POST` | `/api/v1/cart/apply-voucher` | Áp thử mã giảm giá vào giỏ để tính số tiền được giảm |

### 3.3. Đặt hàng & Lịch sử đơn hàng (Orders)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/v1/orders/checkout` | Bấm Đặt hàng (Kiểm tra giá, tạo Snapshot JSON, sinh số thứ tự ngày `A001`, xóa giỏ) |
| `GET` | `/api/v1/orders/my-history` | Xem lịch sử đơn hàng của khách (Phân trang & lọc theo `?status=`) |
| `GET` | `/api/v1/orders/:orderCode` | Xem chi tiết 1 đơn hàng & tiến trình pha chế |
| `PUT` | `/api/v1/orders/:id/cancel` | Khách tự hủy đơn (Chỉ cho phép khi trạng thái là `PENDING`) |
| `POST` | `/api/v1/orders/:id/reorder` | Đặt lại đơn cũ (Đẩy các món từ đơn cũ vào lại Giỏ hàng hiện tại) |

### 3.4. Cổng Thanh Toán MoMo, VietQR & Quản Lý Giao Dịch (Payment)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/v1/payment/momo/create` | Khởi tạo phiên thanh toán MoMo v2 (Capture Wallet) |
| `POST` | `/api/v1/payment/momo/ipn` | Webhook MoMo gọi ngầm thông báo kết quả (Xác thực chữ ký HMAC-SHA256) |
| `GET` | `/api/v1/payment/momo/callback` | Trang chuyển hướng khách hàng sau khi thanh toán trên MoMo |
| `GET` | `/api/v1/payment/momo/status/:orderCode` | Tra cứu trạng thái thanh toán của đơn hàng |
| `POST` | `/api/v1/payment/momo/simulate` | Giả lập thanh toán MoMo thành công cho môi trường test/chấm điểm |
| `POST` | `/api/v1/payment/vietqr/simulate` | Giả lập thanh toán chuyển khoản VietQR Napas247 thành công |
| `POST` | `/api/v1/payment/switch-method` | Đổi phương thức thanh toán giữa MoMo, VietQR và Tiền mặt (COD) |

---

## 4. Phân quyền 2: NHÂN VIÊN (STAFF - Thu ngân & Pha chế)

### 4.1. Xử lý Đơn hàng tại quầy (POS Order Workflow)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/staff/orders/queue` | Lấy danh sách đơn hàng cần làm (`PENDING`, `CONFIRMED`, `READY`) theo thứ tự đặt trước làm trước |
| `PUT` | `/api/v1/staff/orders/:id/confirm` | Nhận đơn & Chốt đơn (`PENDING` -> `CONFIRMED` + in tem dán ly) |
| `PUT` | `/api/v1/staff/orders/:id/ready` | Báo pha chế xong (`CONFIRMED` -> `READY` - Báo khách lấy nước hoặc giao đi) |
| `PUT` | `/api/v1/staff/orders/:id/complete` | Hoàn tất đơn & Thu tiền (`READY` -> `COMPLETED`, cập nhật `payment_status = 'PAID'`) |
| `PUT` | `/api/v1/staff/orders/:id/cancel` | Nhân viên hủy đơn của khách (Bắt buộc truyền `cancel_reason`: Hết nguyên liệu, khách bom...) |

### 4.2. Báo hết hàng nhanh tại quầy (Quick Out-of-Stock)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `PATCH` | `/api/v1/staff/products/:id/availability` | Bật / Tắt trạng thái còn hàng của Món (`is_available` = 0/1) |
| `PATCH` | `/api/v1/staff/option-items/:id/availability` | Bật / Tắt trạng thái còn hàng của Topping/Size (`is_available` = 0/1) |

### 4.3. Quản lý Ca làm việc & Két tiền (Shifts)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/v1/staff/shifts/check-in` | Mở ca làm việc mới & nhập số tiền mặt đầu ca (`opening_cash`) |
| `POST` | `/api/v1/staff/shifts/check-out` | Đóng ca & nhập tiền mặt thực đếm (`actual_closing_cash`) để tính chênh lệch két tiền |

---

## 5. Phân quyền 3: CHỦ CỬA HÀNG (OWNER - Toàn quyền quản trị)

### 5.1. Quản lý Cửa hàng & Nhân sự (Store & Users)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `PUT` | `/api/v1/admin/store/settings` | Sửa thông tin quán, phí ship, giờ mở cửa, tài khoản wifi |
| `PATCH` | `/api/v1/store/toggle-accepting` | Nút khẩn cấp: Tắt/Bật nhận đơn toàn bộ App khi quán quá tải hoặc mất điện |
| `GET` | `/api/v1/admin/users` | Xem danh sách Nhân viên (`?role=STAFF`) hoặc Khách hàng (`?role=CUSTOMER`) |
| `POST` | `/api/v1/admin/staff` | Tạo tài khoản mới cho Nhân viên pha chế / thu ngân |
| `PATCH` | `/api/v1/admin/users/:id/status` | Khóa / Mở khóa tài khoản Nhân viên nghỉ việc hoặc Khách bom hàng (`ACTIVE` / `LOCKED`) |

### 5.2. Quản lý Menu, Giá bán & Khuyến mãi (Catalog & Pricing)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/v1/admin/categories` | Tạo danh mục mới |
| `PUT` | `/api/v1/admin/categories/:id` | Sửa tên, thứ tự hiển thị danh mục |
| `DELETE` | `/api/v1/admin/categories/:id` | Xóa mềm danh mục (`deleted_at = SYSDATETIME()`) |
| `POST` | `/api/v1/admin/products` | Thêm món đồ uống mới & gắn các nhóm Option |
| `PUT` | `/api/v1/admin/products/:id` | Chỉnh sửa giá gốc (`base_price`), tên món (Tự động kích hoạt Trigger lưu `price_audit_logs`) |
| `DELETE` | `/api/v1/admin/products/:id` | Xóa mềm đồ uống |
| `POST` | `/api/v1/admin/option-groups` | Tạo nhóm tùy chọn mới (VD: Chọn loại sữa) |
| `POST` | `/api/v1/admin/option-items` | Thêm mục Topping / Size mới |
| `PUT` | `/api/v1/admin/option-items/:id` | Chỉnh sửa giá cộng thêm (`extra_price`) của Size/Topping (Tự động lưu `price_audit_logs`) |
| `POST` | `/api/v1/admin/vouchers` | Tạo mã khuyến mãi mới |
| `PUT` | `/api/v1/admin/vouchers/:id` | Sửa hoặc tắt mã khuyến mãi |

### 5.3. Kiểm soát Gian lận & Báo cáo Doanh thu (Audit & Analytics)
| Method | Endpoint | Chức năng mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/reports/revenue` | Báo cáo doanh thu, số đơn thành công, số đơn hủy theo ngày/tuần/tháng |
| `GET` | `/api/v1/admin/reports/top-products` | Thống kê Top đồ uống và Topping bán chạy nhất |
| `GET` | `/api/v1/admin/audit/price-logs` | Xem lịch sử ai đã sửa giá món/topping và sửa từ bao nhiêu thành bao nhiêu |
| `GET` | `/api/v1/admin/audit/cancelled-orders` | Danh sách các đơn bị hủy kèm người hủy & lý do |
| `GET` | `/api/v1/admin/shifts` | Xem lịch sử bàn giao ca & các ca bị lệch tiền mặt (`discrepancy_amount < 0`) |