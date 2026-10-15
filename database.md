-- =================================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU ĐẶT TRÀ SỮA / CÀ PHÊ: ANT COFFEE (ENTERPRISE EDITION)
-- Hệ quản trị : Microsoft SQL Server (SSMS / T-SQL)
-- Bảng mã     : NVARCHAR (Hỗ trợ đầy đủ Tiếng Việt có dấu & Emoji)
-- =================================================================================

Tài Khoản : sa
Mật Khẩu 123456


USE master;
GO

-- 1. KHỞI TẠO DATABASE (Tự động ngắt kết nối cũ nếu DB đang mở để tạo lại sạch sẽ)
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'ant_coffee_db')
BEGIN
    ALTER DATABASE ant_coffee_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ant_coffee_db;
END
GO

CREATE DATABASE ant_coffee_db;
GO

USE ant_coffee_db;
GO

-- =================================================================================
-- 2. PHÂN HỆ NGƯỜI DÙNG, CA LÀM VIỆC & CỬA HÀNG (USERS, SHIFTS & STORE)
-- =================================================================================

-- Bảng 1: Người dùng (Quản lý tập trung 3 Role: OWNER, STAFF, CUSTOMER)
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(150) NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- Nhân viên nghỉ việc chuyển sang LOCKED, cấm DELETE
    loyalty_points INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    last_login_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT chk_users_role CHECK (role IN ('OWNER', 'STAFF', 'CUSTOMER')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED'))
);

-- Bảng 2: Cấu hình cửa hàng (Chỉ có duy nhất 1 dòng ID = 1)
CREATE TABLE store_settings (
    id TINYINT PRIMARY KEY DEFAULT 1,
    store_name NVARCHAR(150) NOT NULL DEFAULT N'Ant Coffee & Tea',
    phone VARCHAR(20) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    wifi_name NVARCHAR(100) NULL DEFAULT N'Ant Coffee Free Wifi',
    wifi_password VARCHAR(100) NULL DEFAULT 'antcoffee123',
    is_accepting_orders BIT NOT NULL DEFAULT 1, -- 1: Nhận đơn, 0: Ngưng nhận đơn khẩn cấp
    open_time TIME NOT NULL DEFAULT '07:00:00',
    close_time TIME NOT NULL DEFAULT '22:30:00',
    default_shipping_fee BIGINT NOT NULL DEFAULT 15000,
    updated_by BIGINT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_single_store_row CHECK (id = 1),
    CONSTRAINT chk_store_shipping_fee CHECK (default_shipping_fee >= 0),
    CONSTRAINT fk_store_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Bảng 3: Sổ địa chỉ của Khách hàng
CREATE TABLE customer_addresses (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    label NVARCHAR(50) NOT NULL DEFAULT N'Nhà riêng',
    recipient_name NVARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(15) NOT NULL,
    address_detail NVARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    note NVARCHAR(255) NULL,
    is_default BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 4: Quản lý Ca làm việc & Két tiền của Nhân viên
CREATE TABLE staff_shifts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    staff_id BIGINT NOT NULL,
    shift_date DATE NOT NULL,
    check_in_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    check_out_at DATETIME2 NULL,
    opening_cash BIGINT NOT NULL DEFAULT 0,
    system_calculated_cash BIGINT NOT NULL DEFAULT 0,
    actual_closing_cash BIGINT NULL,
    -- Cột tự động tính tiền lệch két (Âm là thiếu, Dương là thừa)
    discrepancy_amount AS (actual_closing_cash - (opening_cash + system_calculated_cash)) PERSISTED,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    note NVARCHAR(500) NULL,
    CONSTRAINT chk_shift_status CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT fk_shift_staff FOREIGN KEY (staff_id) REFERENCES users(id)
);


-- =================================================================================
-- 3. PHÂN HỆ MENU, BIẾN THỂ & TOPPING (CATALOG & OPTIONS)
-- =================================================================================

-- Bảng 5: Danh mục đồ uống
CREATE TABLE categories (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    icon_url VARCHAR(500) NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    deleted_at DATETIME2 NULL
);

-- Bảng 6: Sản phẩm / Đồ uống gốc
CREATE TABLE products (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    category_id BIGINT NOT NULL,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX) NULL,
    image_url VARCHAR(500) NULL,
    base_price BIGINT NOT NULL DEFAULT 0,
    is_available BIT NOT NULL DEFAULT 1, -- Nhân viên bật/tắt nhanh khi hết món trong ngày
    is_active BIT NOT NULL DEFAULT 1,    -- Chủ quán ẩn/hiện trên Menu
    is_featured BIT NOT NULL DEFAULT 0,
    total_sold BIGINT NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    updated_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT chk_product_base_price CHECK (base_price >= 0),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_product_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Bảng 7: Nhóm tùy chọn (Chọn Size, Mức đá, Mức đường, Thêm Topping)
CREATE TABLE option_groups (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    internal_code VARCHAR(50) NOT NULL,
    selection_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE',
    is_required BIT NOT NULL DEFAULT 0,
    min_select INT NOT NULL DEFAULT 0,
    max_select INT NOT NULL DEFAULT 1,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT chk_option_group_type CHECK (selection_type IN ('SINGLE', 'MULTIPLE')),
    CONSTRAINT chk_option_group_range CHECK (max_select >= min_select AND min_select >= 0)
);

-- Bảng 8: Chi tiết từng mục tùy chọn (Size L, 70% Đường, Trân châu trắng...)
CREATE TABLE option_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    group_id BIGINT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    extra_price BIGINT NOT NULL DEFAULT 0,
    is_default BIT NOT NULL DEFAULT 0,
    is_available BIT NOT NULL DEFAULT 1, -- Nhân viên tắt=0 khi quầy hết loại topping này
    is_active BIT NOT NULL DEFAULT 1,
    max_qty_per_cup TINYINT NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    updated_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT chk_option_extra_price CHECK (extra_price >= 0),
    CONSTRAINT fk_option_item_group FOREIGN KEY (group_id) REFERENCES option_groups(id),
    CONSTRAINT fk_option_item_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Bảng 9: Bảng trung gian nối Món ăn và Nhóm tùy chọn
CREATE TABLE product_option_groups (
    product_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, group_id),
    CONSTRAINT fk_pog_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pog_group FOREIGN KEY (group_id) REFERENCES option_groups(id) ON DELETE CASCADE
);


-- =================================================================================
-- 4. PHÂN HỆ GIỎ HÀNG THÔNG MINH (SMART SHOPPING CART)
-- =================================================================================

-- Bảng 10: Giỏ hàng của từng khách
CREATE TABLE carts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    voucher_code VARCHAR(50) NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 11: Các món trong giỏ hàng (Sử dụng Signature Hash chống trùng dòng)
CREATE TABLE cart_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected_options NVARCHAR(MAX) NOT NULL, -- Lưu chuỗi JSON
    signature_hash VARCHAR(64) NOT NULL,
    item_note NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_cart_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_cart_item_json CHECK (ISJSON(selected_options) = 1),
    CONSTRAINT uq_cart_item_signature UNIQUE (cart_id, signature_hash),
    CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


-- =================================================================================
-- 5. PHÂN HỆ KHUYẾN MÃI & BỘ ĐẾM SỐ THỨ TỰ LY (VOUCHERS & QUEUE GENERATOR)
-- =================================================================================

-- Bảng 12: Mã giảm giá
CREATE TABLE vouchers (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    title NVARCHAR(150) NOT NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'FIXED_AMOUNT',
    discount_value BIGINT NOT NULL,
    max_discount_amount BIGINT NULL,
    min_order_amount BIGINT NOT NULL DEFAULT 0,
    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    start_at DATETIME2 NOT NULL,
    end_at DATETIME2 NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_by BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_voucher_type CHECK (discount_type IN ('FIXED_AMOUNT', 'PERCENTAGE')),
    CONSTRAINT chk_voucher_val CHECK (discount_value > 0),
    CONSTRAINT fk_voucher_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bảng 13: Bộ đếm số thứ tự đơn hàng theo ngày (Tránh 2 đơn trùng số tem dán ly A001)
CREATE TABLE daily_sequences (
    seq_date DATE PRIMARY KEY,
    current_number INT NOT NULL DEFAULT 0
);


-- =================================================================================
-- 6. PHÂN HỆ ĐƠN HÀNG & VẬN HÀNH QUẦY (ORDERS & POS WORKFLOW)
-- =================================================================================

-- Bảng 14: Đơn hàng tổng (Orders)
CREATE TABLE orders (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    order_date DATE NOT NULL,
    daily_queue_number VARCHAR(10) NOT NULL,
    
    customer_id BIGINT NOT NULL,
    staff_id BIGINT NULL,
    shift_id BIGINT NULL,
    
    order_type VARCHAR(20) NOT NULL DEFAULT 'DELIVERY',
    table_number VARCHAR(20) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    total_items_qty INT NOT NULL DEFAULT 1,
    subtotal_amount BIGINT NOT NULL DEFAULT 0,
    voucher_code VARCHAR(30) NULL,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    shipping_fee BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    payment_transaction_ref VARCHAR(100) NULL,
    
    recipient_name NVARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(15) NOT NULL,
    shipping_address NVARCHAR(500) NULL,
    customer_note NVARCHAR(500) NULL,
    
    cancelled_by BIGINT NULL,
    cancel_reason NVARCHAR(255) NULL,
    
    version INT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    confirmed_at DATETIME2 NULL,
    ready_at DATETIME2 NULL,
    completed_at DATETIME2 NULL,
    cancelled_at DATETIME2 NULL,
    
    CONSTRAINT chk_order_type CHECK (order_type IN ('AT_COUNTER', 'DINE_IN', 'DELIVERY')),
    CONSTRAINT chk_order_status CHECK (status IN ('PENDING', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'MOMO', 'VNPAY')),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED')),
    CONSTRAINT chk_order_totals CHECK (subtotal_amount >= 0 AND discount_amount >= 0 AND shipping_fee >= 0 AND total_amount >= 0),
    CONSTRAINT uq_daily_queue UNIQUE (order_date, daily_queue_number),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_order_staff FOREIGN KEY (staff_id) REFERENCES users(id),
    CONSTRAINT fk_order_shift FOREIGN KEY (shift_id) REFERENCES staff_shifts(id),
    CONSTRAINT fk_order_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id)
);

-- Bảng 15: Chi tiết từng ly nước trong đơn hàng (BẤT BIẾN / IMMUTABLE SNAPSHOT)
CREATE TABLE order_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    
    product_sku_snapshot VARCHAR(50) NOT NULL,
    product_name_snapshot NVARCHAR(150) NOT NULL,
    product_image_snapshot VARCHAR(500) NULL,
    base_price_snapshot BIGINT NOT NULL,
    options_snapshot NVARCHAR(MAX) NOT NULL, -- Lưu JSON đóng băng Size, Đá, Đường, Topping
    options_summary_text NVARCHAR(500) NOT NULL,
    
    quantity INT NOT NULL DEFAULT 1,
    options_extra_price BIGINT NOT NULL DEFAULT 0,
    unit_final_price BIGINT NOT NULL,
    line_total_amount BIGINT NOT NULL,
    item_note NVARCHAR(255) NULL,
    
    CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_item_json CHECK (ISJSON(options_snapshot) = 1),
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products(id)
);


-- =================================================================================
-- 7. PHÂN HỆ KIỂM SOÁT & CHỐNG GIAN LẬN (AUDIT LOGS CHO CHỦ QUÁN)
-- =================================================================================

-- Bảng 16: Lịch sử chuyển trạng thái đơn hàng
CREATE TABLE order_status_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    old_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    changed_by BIGINT NULL,
    note NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_status_log_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_log_user FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Bảng 17: Lịch sử chỉnh sửa giá của Chủ quán / Quản lý
CREATE TABLE price_audit_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_name NVARCHAR(150) NOT NULL,
    old_price BIGINT NOT NULL,
    new_price BIGINT NOT NULL,
    changed_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_audit_entity_type CHECK (entity_type IN ('PRODUCT', 'OPTION_ITEM')),
    CONSTRAINT fk_price_log_user FOREIGN KEY (changed_by) REFERENCES users(id)
);
GO


-- =================================================================================
-- 8. HỆ THỐNG INDEX CHUYÊN SÂU (HIGH-PERFORMANCE INDEXING STRATEGY)
-- =================================================================================

-- 8.1 Index cho Khách hàng
CREATE INDEX idx_orders_customer_history ON orders (customer_id, created_at DESC);
CREATE INDEX idx_orders_customer_status ON orders (customer_id, status, created_at DESC);
CREATE INDEX idx_addresses_user_default ON customer_addresses (user_id, is_default DESC);

-- 8.2 Index cho Nhân viên (Quầy POS & Pha chế)
CREATE INDEX idx_orders_pos_queue ON orders (status, created_at ASC);
CREATE INDEX idx_orders_recipient_phone ON orders (recipient_phone, created_at DESC);

-- 8.3 Index cho Chủ quán (Quản trị & Báo cáo doanh thu)
CREATE INDEX idx_orders_revenue_analytics ON orders (order_date, status, payment_status) INCLUDE (total_amount);
CREATE INDEX idx_orders_staff_performance ON orders (staff_id, status, confirmed_at);
CREATE INDEX idx_price_audit_lookup ON price_audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_shifts_date_status ON staff_shifts (shift_date, status, staff_id);

-- 8.4 Index cho Menu & Tìm kiếm đồ uống
CREATE INDEX idx_products_catalog_display ON products (category_id, is_active, deleted_at, display_order);
CREATE INDEX idx_products_featured_bestseller ON products (is_active, deleted_at, is_featured DESC, total_sold DESC);
CREATE INDEX idx_products_name_search ON products (name);
CREATE INDEX idx_option_items_group_load ON option_items (group_id, is_active, deleted_at, display_order);
CREATE INDEX idx_order_items_product_stats ON order_items (product_id) INCLUDE (quantity);
GO


-- =================================================================================
-- 9. TRIGGERS TỰ ĐỘNG HÓA & BẢO VỆ DỮ LIỆU NGẦM TRONG DATABASE (CHUẨN T-SQL)
-- =================================================================================

-- Trigger 1: Tự động ghi vào bảng `price_audit_logs` khi Chủ quán đổi giá Món ăn
CREATE TRIGGER trg_after_product_price_update
ON products
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(base_price)
    BEGIN
        INSERT INTO price_audit_logs (entity_type, entity_id, entity_name, old_price, new_price, changed_by)
        SELECT 'PRODUCT', i.id, i.name, d.base_price, i.base_price, i.updated_by
        FROM inserted i
        INNER JOIN deleted d ON i.id = d.id
        WHERE i.base_price <> d.base_price;
    END
END;
GO

-- Trigger 2: Tự động ghi vào bảng `price_audit_logs` khi Chủ quán đổi giá Topping/Size
CREATE TRIGGER trg_after_option_price_update
ON option_items
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(extra_price)
    BEGIN
        INSERT INTO price_audit_logs (entity_type, entity_id, entity_name, old_price, new_price, changed_by)
        SELECT 'OPTION_ITEM', i.id, i.name, d.extra_price, i.extra_price, i.updated_by
        FROM inserted i
        INNER JOIN deleted d ON i.id = d.id
        WHERE i.extra_price <> d.extra_price;
    END
END;
GO

-- Trigger 3: Tự động ghi lịch sử `order_status_logs` và cộng số lượng bán khi đơn hoàn tất
CREATE TRIGGER trg_after_order_status_update
ON orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(status)
    BEGIN
        -- Ghi log chuyển trạng thái
        INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, note)
        SELECT 
            i.id, 
            d.status, 
            i.status, 
            CASE WHEN i.status = 'CANCELLED' THEN i.cancelled_by ELSE i.staff_id END,
            i.cancel_reason
        FROM inserted i
        INNER JOIN deleted d ON i.id = d.id
        WHERE i.status <> d.status;

        -- Cộng dồn số lượng bán vào bảng products nếu đơn chuyển sang COMPLETED
        UPDATE p
        SET p.total_sold = p.total_sold + oi_sum.qty_sold
        FROM products p
        INNER JOIN (
            SELECT oi.product_id, SUM(oi.quantity) AS qty_sold
            FROM order_items oi
            INNER JOIN inserted i ON oi.order_id = i.id
            INNER JOIN deleted d ON i.id = d.id
            WHERE i.status = 'COMPLETED' AND d.status <> 'COMPLETED'
            GROUP BY oi.product_id
        ) oi_sum ON p.id = oi_sum.product_id;
    END
END;
GO


-- =================================================================================
-- 10. STORED PROCEDURE: SINH SỐ THỨ TỰ TEM DÁN LY AN TOÀN (CONCURRENCY SAFE)
-- =================================================================================

CREATE PROCEDURE sp_generate_daily_queue_number
    @p_date DATE,
    @p_queue_number VARCHAR(10) OUTPUT,
    @p_order_code VARCHAR(30) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @v_next_num INT;

    -- Khóa dòng (UPDLOCK, HOLDLOCK) chống 2 khách đặt cùng 1 tích tắc bị trùng số thứ tự
    BEGIN TRANSACTION;

    IF EXISTS (SELECT 1 FROM daily_sequences WITH (UPDLOCK, HOLDLOCK) WHERE seq_date = @p_date)
    BEGIN
        UPDATE daily_sequences
        SET @v_next_num = current_number = current_number + 1
        WHERE seq_date = @p_date;
    END
    ELSE
    BEGIN
        INSERT INTO daily_sequences (seq_date, current_number)
        VALUES (@p_date, 1);
        SET @v_next_num = 1;
    END

    COMMIT TRANSACTION;

    -- Format thành A001, A002...
    SET @p_queue_number = 'A' + RIGHT('000' + CAST(@v_next_num AS VARCHAR(10)), 3);
    -- Format thành ORD-20261014-0001
    SET @p_order_code = 'ORD-' + CONVERT(VARCHAR(8), @p_date, 112) + '-' + RIGHT('0000' + CAST(@v_next_num AS VARCHAR(10)), 4);
END;
GO


-- =================================================================================
-- 11. DỮ LIỆU MẪU (SEED DATA) ĐỂ CHẠY THỬ NGAY
-- =================================================================================

-- 11.1 Tạo 3 tài khoản (Chủ quán, Nhân viên, Khách hàng)
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, phone, email, password_hash, full_name, role, status, loyalty_points) VALUES
(1, '0901111111', 'owner@antcoffee.vn', '$2b$10$OwnerHashedPasswordExample', N'Nguyễn Chủ Quán', 'OWNER', 'ACTIVE', 0),
(2, '0902222222', 'staff@antcoffee.vn', '$2b$10$StaffHashedPasswordExample', N'Trần Nhân Viên Pha Chế', 'STAFF', 'ACTIVE', 0),
(3, '0903333333', 'khachhang@gmail.com', '$2b$10$CustomerHashedPasswordExam', N'Lê Khách Hàng Nghiện Trà Sữa', 'CUSTOMER', 'ACTIVE', 150);
SET IDENTITY_INSERT users OFF;

-- 11.2 Cấu hình cửa hàng Ant Coffee
INSERT INTO store_settings (id, store_name, phone, address, is_accepting_orders, default_shipping_fee, updated_by) VALUES
(1, N'Ant Coffee & Tea - Flagship Store', '19006868', N'123 Nguyễn Huệ, Quận 1, TP.HCM', 1, 15000, 1);

-- 11.3 Địa chỉ của khách hàng
INSERT INTO customer_addresses (user_id, label, recipient_name, recipient_phone, address_detail, note, is_default) VALUES
(3, N'Công ty', N'Lê Khách Hàng', '0903333333', N'Tầng 15, Tòa nhà Bitexco, Quận 1, TP.HCM', N'Gửi ở quầy lễ tân giúp mình', 1);

-- 11.4 Mở ca làm việc cho Nhân viên số 2
SET IDENTITY_INSERT staff_shifts ON;
INSERT INTO staff_shifts (id, staff_id, shift_date, opening_cash, system_calculated_cash, status) VALUES
(1, 2, CAST(SYSDATETIME() AS DATE), 1000000, 0, 'OPEN');
SET IDENTITY_INSERT staff_shifts OFF;

-- 11.5 Danh mục & Sản phẩm
SET IDENTITY_INSERT categories ON;
INSERT INTO categories (id, name, slug, display_order) VALUES
(1, N'Trà Sữa Đậm Vị', 'tra-sua-dam-vi', 1),
(2, N'Cà Phê Truyền Thống', 'ca-phe-truyen-thong', 2),
(3, N'Trà Trái Cây Nhiệt Đới', 'tra-trai-cay-nhiet-doi', 3);
SET IDENTITY_INSERT categories OFF;

SET IDENTITY_INSERT products ON;
INSERT INTO products (id, sku, category_id, name, description, base_price, is_available, is_featured, display_order, updated_by) VALUES
(1, 'TS-OLONG-01', 1, N'Trà Sữa Ô Long Hoàng Kim', N'Trà Ô Long nướng đậm vị kết hợp sữa tươi thanh trùng.', 35000, 1, 1, 1, 1),
(2, 'CF-DEN-01', 2, N'Cà Phê Đen Đá Sài Gòn', N'100% hạt Robusta rang mộc đậm đà tỉnh táo.', 25000, 1, 0, 2, 1),
(3, 'TTC-DAO-01', 3, N'Trà Đào Cam Sả Ant Signature', N'Trà nhài ủ lạnh kèm đào miếng giòn và cam vàng tươi.', 45000, 1, 1, 3, 1);
SET IDENTITY_INSERT products OFF;

-- 11.6 Nhóm tùy chọn & Chi tiết tùy chọn
SET IDENTITY_INSERT option_groups ON;
INSERT INTO option_groups (id, name, internal_code, selection_type, is_required, min_select, max_select) VALUES
(1, N'Chọn Size', 'SIZE', 'SINGLE', 1, 1, 1),
(2, N'Mức Đường', 'SUGAR', 'SINGLE', 1, 1, 1),
(3, N'Mức Đá', 'ICE', 'SINGLE', 1, 1, 1),
(4, N'Thêm Topping', 'TOPPING', 'MULTIPLE', 0, 0, 3);
SET IDENTITY_INSERT option_groups OFF;

SET IDENTITY_INSERT option_items ON;
INSERT INTO option_items (id, group_id, name, extra_price, is_default, max_qty_per_cup, display_order, updated_by) VALUES
(1, 1, N'Size M (Tiêu chuẩn)', 0, 1, 1, 1, 1),
(2, 1, N'Size L (Khổng lồ)', 10000, 0, 1, 2, 1),
(3, 2, N'100% Đường (Tiêu chuẩn)', 0, 1, 1, 1, 1),
(4, 2, N'70% Đường (Ít ngọt)', 0, 0, 1, 2, 1),
(5, 2, N'50% Đường', 0, 0, 1, 3, 1),
(6, 3, N'100% Đá', 0, 1, 1, 1, 1),
(7, 3, N'50% Đá (Ít đá)', 0, 0, 1, 2, 1),
(8, 3, N'Đá để riêng', 0, 0, 1, 3, 1),
(9, 4, N'Trân châu trắng giòn', 7000, 0, 2, 1, 1),
(10, 4, N'Pudding trứng mềm', 8000, 0, 2, 2, 1),
(11, 4, N'Kem Cheese mặn', 12000, 0, 1, 3, 1);
SET IDENTITY_INSERT option_items OFF;

INSERT INTO product_option_groups (product_id, group_id, display_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4),
(2, 2, 1), (2, 3, 2),
(3, 1, 1), (3, 2, 2), (3, 3, 3), (3, 4, 4);

-- 11.7 Tạo mã giảm giá mẫu
INSERT INTO vouchers (code, title, discount_type, discount_value, min_order_amount, usage_limit, start_at, end_at, created_by) VALUES
('ANT10K', N'Giảm 10.000đ cho đơn từ 50.000đ', 'FIXED_AMOUNT', 10000, 50000, 100, DATEADD(DAY, -1, SYSDATETIME()), DATEADD(DAY, 30, SYSDATETIME()), 1);

-- 11.8 Tạo Giỏ hàng mẫu
SET IDENTITY_INSERT carts ON;
INSERT INTO carts (id, user_id, voucher_code) VALUES (1, 3, 'ANT10K');
SET IDENTITY_INSERT carts OFF;

INSERT INTO cart_items (cart_id, product_id, quantity, selected_options, signature_hash, item_note) VALUES
(1, 1, 2, N'[2, 4, 7, 9, 10]', CONVERT(VARCHAR(64), HASHBYTES('MD5', 'prod_1_opts_2_4_7_9_10_note_'), 2), NULL);

-- 11.9 Sinh đơn hàng mẫu bằng Stored Procedure và kiểm thử Trigger
DECLARE @queue_num VARCHAR(10), @ord_code VARCHAR(30), @today DATE = CAST(SYSDATETIME() AS DATE);
EXEC sp_generate_daily_queue_number @p_date = @today, @p_queue_number = @queue_num OUTPUT, @p_order_code = @ord_code OUTPUT;

SET IDENTITY_INSERT orders ON;
INSERT INTO orders (
    id, order_code, order_date, daily_queue_number, customer_id, staff_id, shift_id,
    order_type, status, total_items_qty, subtotal_amount, voucher_code, discount_amount, shipping_fee, total_amount,
    payment_method, payment_status, recipient_name, recipient_phone, shipping_address,
    created_at
) VALUES (
    1, @ord_code, @today, @queue_num, 3, NULL, 1,
    'DELIVERY', 'PENDING', 1, 60000, 'ANT10K', 10000, 15000, 65000,
    'MOMO', 'PAID', N'Lê Khách Hàng', '0903333333', N'Tầng 15, Tòa nhà Bitexco, Quận 1, TP.HCM',
    DATEADD(MINUTE, -5, SYSDATETIME())
);
SET IDENTITY_INSERT orders OFF;

INSERT INTO order_items (
    order_id, product_id, product_sku_snapshot, product_name_snapshot, base_price_snapshot,
    options_snapshot, options_summary_text,
    quantity, options_extra_price, unit_final_price, line_total_amount, item_note
) VALUES (
    1, 1, 'TS-OLONG-01', N'Trà Sữa Ô Long Hoàng Kim', 35000,
    N'[{"group_name":"Chọn Size","item_id":2,"item_name":"Size L (Khổng lồ)","extra_price":10000},{"group_name":"Mức Đường","item_id":4,"item_name":"70% Đường (Ít ngọt)","extra_price":0},{"group_name":"Mức Đá","item_id":7,"item_name":"50% Đá (Ít đá)","extra_price":0},{"group_name":"Thêm Topping","item_id":9,"item_name":"Trân châu trắng giòn","extra_price":7000},{"group_name":"Thêm Topping","item_id":10,"item_name":"Pudding trứng mềm","extra_price":8000}]',
    N'Size L (Khổng lồ), 70% Đường (Ít ngọt), 50% Đá (Ít đá), Trân châu trắng giòn, Pudding trứng mềm',
    1, 25000, 60000, 60000, N'Cho mình xin thêm 2 ống hút'
);

-- Giả lập Nhân viên (ID=2) bấm Xác nhận đơn -> Trigger tự động bắn lịch sử vào bảng `order_status_logs`
UPDATE orders SET status = 'CONFIRMED', staff_id = 2, confirmed_at = SYSDATETIME(), version = version + 1 WHERE id = 1;

-- Giả lập Chủ quán (ID=1) tăng giá Trà Sữa Ô Long từ 35k lên 39k -> Trigger tự động bắn vào bảng `price_audit_logs`
UPDATE products SET base_price = 39000, updated_by = 1, version = version + 1 WHERE id = 1;
GO

-- =================================================================================
-- 12. KIỂM TRA KẾT QUẢ SAU KHI CHẠY (TỰ ĐỘNG HIỂN THỊ BẢNG KẾT QUẢ)
-- =================================================================================
SELECT * FROM orders;
SELECT * FROM order_status_logs;
SELECT * FROM price_audit_logs;
GO