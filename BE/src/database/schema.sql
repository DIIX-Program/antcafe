-- =================================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU ĐẶT TRÀ SỮA / CÀ PHÊ: ANT COFFEE (ENTERPRISE EDITION)
-- Hệ quản trị : Microsoft SQL Server (SSMS / T-SQL)
-- Bảng mã     : NVARCHAR (Hỗ trợ đầy đủ Tiếng Việt có dấu & Emoji)
-- =================================================================================

USE master;
GO

-- 1. KHỞI TẠO DATABASE
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ant_coffee_db')
BEGIN
    CREATE DATABASE ant_coffee_db;
END
GO

USE ant_coffee_db;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- =================================================================================
-- 2. PHÂN HỆ NGƯỜI DÙNG, CA LÀM VIỆC & CỬA HÀNG (USERS, SHIFTS & STORE)
-- =================================================================================

-- Bảng 1: Người dùng (Quản lý tập trung 3 Role: OWNER, STAFF, CUSTOMER)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(150) NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
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
END
GO

-- Bảng 2: Cấu hình cửa hàng (Chỉ có duy nhất 1 dòng ID = 1)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[store_settings]') AND type in (N'U'))
BEGIN
CREATE TABLE store_settings (
    id TINYINT PRIMARY KEY DEFAULT 1,
    store_name NVARCHAR(150) NOT NULL DEFAULT N'Ant Coffee & Tea',
    phone VARCHAR(20) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    wifi_name NVARCHAR(100) NULL DEFAULT N'Ant Coffee Free Wifi',
    wifi_password VARCHAR(100) NULL DEFAULT 'antcoffee123',
    is_accepting_orders BIT NOT NULL DEFAULT 1,
    open_time TIME NOT NULL DEFAULT '07:00:00',
    close_time TIME NOT NULL DEFAULT '22:30:00',
    default_shipping_fee BIGINT NOT NULL DEFAULT 15000,
    updated_by BIGINT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_single_store_row CHECK (id = 1),
    CONSTRAINT chk_store_shipping_fee CHECK (default_shipping_fee >= 0),
    CONSTRAINT fk_store_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);
END
GO

-- Bảng 3: Sổ địa chỉ của Khách hàng
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[customer_addresses]') AND type in (N'U'))
BEGIN
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
END
GO

-- Bảng 4: Quản lý Ca làm việc & Két tiền của Nhân viên
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[staff_shifts]') AND type in (N'U'))
BEGIN
CREATE TABLE staff_shifts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    staff_id BIGINT NOT NULL,
    shift_date DATE NOT NULL,
    check_in_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    check_out_at DATETIME2 NULL,
    opening_cash BIGINT NOT NULL DEFAULT 0,
    system_calculated_cash BIGINT NOT NULL DEFAULT 0,
    actual_closing_cash BIGINT NULL,
    discrepancy_amount AS (actual_closing_cash - (opening_cash + system_calculated_cash)) PERSISTED,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    note NVARCHAR(500) NULL,
    CONSTRAINT chk_shift_status CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT fk_shift_staff FOREIGN KEY (staff_id) REFERENCES users(id)
);
END
GO

-- =================================================================================
-- 3. PHÂN HỆ MENU, BIẾN THỂ & TOPPING (CATALOG & OPTIONS)
-- =================================================================================

-- Bảng 5: Danh mục đồ uống
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[categories]') AND type in (N'U'))
BEGIN
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
END
GO

-- Bảng 6: Sản phẩm / Đồ uống gốc
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
BEGIN
CREATE TABLE products (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    category_id BIGINT NOT NULL,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX) NULL,
    image_url VARCHAR(500) NULL,
    base_price BIGINT NOT NULL DEFAULT 0,
    original_price BIGINT NULL,
    discount_tag NVARCHAR(50) NULL,
    rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    orders_count NVARCHAR(20) NOT NULL DEFAULT '0+',
    is_available BIT NOT NULL DEFAULT 1,
    is_active BIT NOT NULL DEFAULT 1,
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
END
GO

-- Bảng 7: Nhóm tùy chọn (Chọn Size, Mức đá, Mức đường, Thêm Topping)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[option_groups]') AND type in (N'U'))
BEGIN
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
END
GO

-- Bảng 8: Chi tiết từng mục tùy chọn
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[option_items]') AND type in (N'U'))
BEGIN
CREATE TABLE option_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    group_id BIGINT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    extra_price BIGINT NOT NULL DEFAULT 0,
    is_default BIT NOT NULL DEFAULT 0,
    is_available BIT NOT NULL DEFAULT 1,
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
END
GO

-- Bảng 9: Bảng trung gian nối Món ăn và Nhóm tùy chọn
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[product_option_groups]') AND type in (N'U'))
BEGIN
CREATE TABLE product_option_groups (
    product_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, group_id),
    CONSTRAINT fk_pog_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pog_group FOREIGN KEY (group_id) REFERENCES option_groups(id) ON DELETE CASCADE
);
END
GO

-- =================================================================================
-- 4. PHÂN HỆ GIỎ HÀNG THÔNG MINH (SMART SHOPPING CART)
-- =================================================================================

-- Bảng 10: Giỏ hàng của từng khách
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[carts]') AND type in (N'U'))
BEGIN
CREATE TABLE carts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    voucher_code VARCHAR(50) NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
END
GO

-- Bảng 11: Các món trong giỏ hàng
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cart_items]') AND type in (N'U'))
BEGIN
CREATE TABLE cart_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected_options NVARCHAR(MAX) NOT NULL,
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
END
GO

-- =================================================================================
-- 5. PHÂN HỆ KHUYẾN MÃI & BỘ ĐẾM SỐ THỨ TỰ LY (VOUCHERS & QUEUE GENERATOR)
-- =================================================================================

-- Bảng 12: Mã giảm giá
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[vouchers]') AND type in (N'U'))
BEGIN
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
    created_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_voucher_type CHECK (discount_type IN ('FIXED_AMOUNT', 'PERCENTAGE')),
    CONSTRAINT chk_voucher_val CHECK (discount_value > 0),
    CONSTRAINT fk_voucher_creator FOREIGN KEY (created_by) REFERENCES users(id)
);
END
GO

-- Bảng 13: Bộ đếm số thứ tự đơn hàng theo ngày
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[daily_sequences]') AND type in (N'U'))
BEGIN
CREATE TABLE daily_sequences (
    seq_date DATE PRIMARY KEY,
    current_number INT NOT NULL DEFAULT 0
);
END
GO

-- =================================================================================
-- 6. PHÂN HỆ ĐƠN HÀNG & VẬN HÀNH QUẦY (ORDERS & POS WORKFLOW)
-- =================================================================================

-- Bảng 14: Đơn hàng tổng (Orders)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[orders]') AND type in (N'U'))
BEGIN
CREATE TABLE orders (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    order_date DATE NOT NULL,
    daily_queue_number VARCHAR(10) NOT NULL,
    
    customer_id BIGINT NULL,
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
    
    driver_name NVARCHAR(100) NULL,
    driver_phone VARCHAR(20) NULL,
    driver_vehicle NVARCHAR(100) NULL,
    estimated_delivery NVARCHAR(50) NULL,
    
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
END
GO

-- Bảng 15: Chi tiết từng ly nước trong đơn hàng
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[order_items]') AND type in (N'U'))
BEGIN
CREATE TABLE order_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NULL,
    
    product_sku_snapshot VARCHAR(50) NOT NULL,
    product_name_snapshot NVARCHAR(150) NOT NULL,
    product_image_snapshot VARCHAR(500) NULL,
    base_price_snapshot BIGINT NOT NULL,
    options_snapshot NVARCHAR(MAX) NOT NULL,
    options_summary_text NVARCHAR(500) NOT NULL,
    
    quantity INT NOT NULL DEFAULT 1,
    options_extra_price BIGINT NOT NULL DEFAULT 0,
    unit_final_price BIGINT NOT NULL,
    line_total_amount BIGINT NOT NULL,
    item_note NVARCHAR(255) NULL,
    
    CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_item_json CHECK (ISJSON(options_snapshot) = 1),
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
END
GO

-- =================================================================================
-- 7. PHÂN HỆ KIỂM SOÁT & CHỐNG GIAN LẬN
-- =================================================================================

-- Bảng 16: Lịch sử chuyển trạng thái đơn hàng
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[order_status_logs]') AND type in (N'U'))
BEGIN
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
END
GO

-- Bảng 17: Lịch sử chỉnh sửa giá của Chủ quán / Quản lý
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[price_audit_logs]') AND type in (N'U'))
BEGIN
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
END
GO

-- =================================================================================
-- 8. INDEXES CHO TỐI ƯU HIỆU NĂNG CAO
-- =================================================================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_customer_history')
    CREATE INDEX idx_orders_customer_history ON orders (customer_id, created_at DESC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_pos_queue')
    CREATE INDEX idx_orders_pos_queue ON orders (status, created_at ASC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_products_catalog_display')
    CREATE INDEX idx_products_catalog_display ON products (category_id, is_active, deleted_at, display_order);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_price_audit_lookup')
    CREATE INDEX idx_price_audit_lookup ON price_audit_logs (entity_type, entity_id, created_at DESC);
GO

-- =================================================================================
-- 9. TRIGGERS
-- =================================================================================

CREATE OR ALTER TRIGGER trg_after_product_price_update
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

CREATE OR ALTER TRIGGER trg_after_option_price_update
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

CREATE OR ALTER TRIGGER trg_after_order_status_update
ON orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(status)
    BEGIN
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
-- 10. STORED PROCEDURE: SINH SỐ THỨ TỰ TEM DÁN LY AN TOÀN
-- =================================================================================

CREATE OR ALTER PROCEDURE sp_generate_daily_queue_number
    @p_date DATE,
    @p_queue_number VARCHAR(10) OUTPUT,
    @p_order_code VARCHAR(30) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @v_next_num INT;

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

    SET @p_queue_number = 'A' + RIGHT('000' + CAST(@v_next_num AS VARCHAR(10)), 3);
    SET @p_order_code = 'ORD-' + CONVERT(VARCHAR(8), @p_date, 112) + '-' + RIGHT('0000' + CAST(@v_next_num AS VARCHAR(10)), 4);
END;
GO
