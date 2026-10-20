import bcrypt from 'bcryptjs';
import { getDbPool, sql } from '../config/db.js';

async function seed() {
  console.log('[Seed] Starting database seeding...');
  const pool = await getDbPool();

  try {
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    // 1. Clean existing data in reverse order of FKs
    console.log('[Seed] Resetting old data...');
    await pool.request().query(`
      DELETE FROM order_status_logs;
      DELETE FROM price_audit_logs;
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM cart_items;
      DELETE FROM carts;
      DELETE FROM product_option_groups;
      DELETE FROM option_items;
      DELETE FROM option_groups;
      DELETE FROM products;
      DELETE FROM categories;
      DELETE FROM vouchers;
      DELETE FROM customer_addresses;
      DELETE FROM staff_shifts;
      DELETE FROM store_settings;
      DELETE FROM users;
      DELETE FROM daily_sequences;
    `);

    // 2. Seed Users
    console.log('[Seed] Seeding users...');
    await pool.request().query(`
      SET IDENTITY_INSERT users ON;
      INSERT INTO users (id, phone, email, password_hash, full_name, role, status, loyalty_points) VALUES
      (1, '0901111111', 'owner@antcoffee.vn', '${defaultPasswordHash}', N'Nguyễn Thế Hùng (Chủ quán)', 'OWNER', 'ACTIVE', 0),
      (2, '0902222222', 'staff@antcoffee.vn', '${defaultPasswordHash}', N'Minh Tuấn (Barista Ca sáng)', 'STAFF', 'ACTIVE', 0),
      (3, '0901234567', 'customer@antcoffee.vn', '${defaultPasswordHash}', N'Nguyễn Văn A', 'CUSTOMER', 'ACTIVE', 150),
      (4, '0903333333', 'khachhang@gmail.com', '${defaultPasswordHash}', N'Lê Khách Hàng', 'CUSTOMER', 'ACTIVE', 200);
      SET IDENTITY_INSERT users OFF;
    `);

    // 3. Seed Store Settings
    console.log('[Seed] Seeding store settings...');
    await pool.request().query(`
      INSERT INTO store_settings (id, store_name, phone, address, wifi_name, wifi_password, is_accepting_orders, open_time, close_time, default_shipping_fee, updated_by) VALUES
      (1, N'Ant Coffee & Tea', '0901 234 567', N'123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM', N'Ant Coffee Guest Wifi', 'antcoffee2026', 1, '07:00:00', '22:30:00', 15000, 1);
    `);

    // 4. Seed Customer Addresses
    console.log('[Seed] Seeding customer addresses...');
    await pool.request().query(`
      SET IDENTITY_INSERT customer_addresses ON;
      INSERT INTO customer_addresses (id, user_id, label, recipient_name, recipient_phone, address_detail, is_default) VALUES
      (1, 3, N'Công ty', N'Nguyễn Văn A', '0901 234 567', N'Tầng 12, Toà nhà Bitexco, Q.1, TP.HCM', 1),
      (2, 3, N'Nhà riêng', N'Nguyễn Văn A', '0901 234 567', N'45 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM', 0);
      SET IDENTITY_INSERT customer_addresses OFF;
    `);

    // 5. Seed Staff Shifts
    console.log('[Seed] Seeding staff shifts...');
    await pool.request().query(`
      SET IDENTITY_INSERT staff_shifts ON;
      INSERT INTO staff_shifts (id, staff_id, shift_date, opening_cash, system_calculated_cash, status, note) VALUES
      (1, 2, CAST(SYSDATETIME() AS DATE), 1500000, 0, 'OPEN', N'Mở ca sáng bàn giao đủ tiền két');
      SET IDENTITY_INSERT staff_shifts OFF;
    `);

    // 6. Seed Categories
    console.log('[Seed] Seeding categories...');
    await pool.request().query(`
      SET IDENTITY_INSERT categories ON;
      INSERT INTO categories (id, name, slug, icon_url, display_order) VALUES
      (1, N'Tất cả', 'tat-ca', 'grid-outline', 1),
      (2, N'Cà Phê', 'ca-phe', 'cafe-outline', 2),
      (3, N'Trà Sữa', 'tra-sua', 'wine-outline', 3),
      (4, N'Trà Trái Cây', 'tra-trai-cay', 'leaf-outline', 4),
      (5, N'Đá Xay', 'da-xay', 'snow-outline', 5),
      (6, N'Bánh Ngọt', 'banh-ngot', 'nutrition-outline', 6);
      SET IDENTITY_INSERT categories OFF;
    `);

    // 7. Seed Option Groups & Items
    console.log('[Seed] Seeding option groups & items...');
    await pool.request().query(`
      SET IDENTITY_INSERT option_groups ON;
      INSERT INTO option_groups (id, name, internal_code, selection_type, is_required, min_select, max_select) VALUES
      (1, N'Chọn Size', 'SIZE', 'SINGLE', 1, 1, 1),
      (2, N'Mức Đá', 'ICE', 'SINGLE', 1, 1, 1),
      (3, N'Mức Đường', 'SUGAR', 'SINGLE', 1, 1, 1),
      (4, N'Thêm Topping', 'TOPPING', 'MULTIPLE', 0, 0, 4);
      SET IDENTITY_INSERT option_groups OFF;

      SET IDENTITY_INSERT option_items ON;
      INSERT INTO option_items (id, group_id, name, extra_price, is_default, is_available, display_order) VALUES
      -- Sizes
      (1, 1, N'Size S (Tiêu chuẩn)', 0, 1, 1, 1),
      (2, 1, N'Size M (Vừa +500ml)', 8000, 0, 1, 2),
      (3, 1, N'Size L (Lớn +700ml)', 14000, 0, 1, 3),

      -- Ice Levels
      (4, 2, N'100% Đá (Chuẩn vị)', 0, 1, 1, 1),
      (5, 2, N'70% Đá', 0, 0, 1, 2),
      (6, 2, N'50% Đá', 0, 0, 1, 3),
      (7, 2, N'30% Đá (Ít đá)', 0, 0, 1, 4),
      (8, 2, N'Không đá', 0, 0, 1, 5),

      -- Sugar Levels
      (9, 3, N'100% Đường (Chuẩn vị)', 0, 1, 1, 1),
      (10, 3, N'70% Đường', 0, 0, 1, 2),
      (11, 3, N'50% Đường (Vừa phải)', 0, 0, 1, 3),
      (12, 3, N'30% Đường (Ít ngọt)', 0, 0, 1, 4),
      (13, 3, N'Không đường', 0, 0, 1, 5),

      -- Toppings
      (14, 4, N'Trân châu Hoàng Kim', 6000, 0, 1, 1),
      (15, 4, N'Trân châu Trắng 3Q', 8000, 0, 1, 2),
      (16, 4, N'Kem Cheese Macchiato', 10000, 0, 1, 3),
      (17, 4, N'Thạch Cà Phê Ant House', 6000, 0, 1, 4),
      (18, 4, N'Pudding Trứng béo ngậy', 8000, 0, 1, 5),
      (19, 4, N'Hạt Sen Huế ngào đường', 10000, 0, 1, 6);
      SET IDENTITY_INSERT option_items OFF;
    `);

    // 8. Seed Products
    console.log('[Seed] Seeding products...');
    await pool.request().query(`
      SET IDENTITY_INSERT products ON;
      INSERT INTO products (id, sku, category_id, name, description, image_url, base_price, original_price, discount_tag, rating, orders_count, is_available, is_active, is_featured, total_sold, display_order, updated_by) VALUES
      (101, 'CF-01', 2, N'Cà Phê Muối Hoàng Gia', N'Cốt cà phê phin Robusta Đắk Lắk đậm đà hòa quyện lớp kem muối biển sánh mịn béo mặn đặc trưng.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', 35000, 42000, N'30% OFF', 4.9, '2.8k+', 1, 1, 1, 2800, 1, 1),
      (102, 'CF-02', 2, N'Bạc Xỉu Sài Gòn Ba Tầng', N'Tỉ lệ vàng giữa sữa đặc thơm ngọt, sữa tươi thanh béo và cà phê pha phin truyền thống thơm lừng.', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80', 32000, 38000, N'Best Seller', 4.8, '3.4k+', 1, 1, 1, 3400, 2, 1),
      (103, 'CF-03', 2, N'Cold Brew Cam Vàng Quế', N'Cà phê ủ lạnh 16 giờ từ hạt Arabica Cầu Đất kết hợp lát cam vàng mọng nước và thanh quế ấm áp.', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80', 45000, 52000, N'Mới ra mắt', 4.7, '950+', 1, 1, 1, 950, 3, 1),
      (104, 'TS-01', 3, N'Trà Sữa Ant Special Signature', N'Hương vị trà đen thượng hạng ủ thảo mộc, sữa tươi nguyên kem béo ngậy kèm sẵn trân châu hoàng kim.', 'https://images.unsplash.com/photo-1558857563-b37cf5a285d8?w=600&auto=format&fit=crop&q=80', 42000, 48000, N'Signature', 5.0, '5.1k+', 1, 1, 1, 5100, 4, 1),
      (105, 'TS-02', 3, N'Trà Sữa Ô Long Nướng Khói', N'Lá trà Ô Long sấy chậm với than gỗ tự nhiên mang lại hậu vị khói dịu nhẹ, ngọt ngào cuốn hút.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', 39000, 45000, N'HOT', 4.8, '2.1k+', 1, 1, 1, 2100, 5, 1),
      (106, 'TC-01', 4, N'Trà Đào Cam Sả Tươi Mát', N'Nước cốt trà thanh mát, miếng đào ngâm giòn ngọt, cam tươi cắt lát và sả tươi thơm nồng sảng khoái.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', 38000, 45000, N'Giải Nhiệt', 4.9, '4.2k+', 1, 1, 1, 4200, 6, 1),
      (107, 'TC-02', 4, N'Trà Vải Lài Hoa Hồng Pha Lê', N'Hương lài thơm quý phái phối hợp vải ngọt mọng và nụ hồng sấy thanh tao tạo cảm giác thư giãn.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80', 40000, 46000, N'Yêu Thích', 4.7, '1.8k+', 1, 1, 0, 1800, 7, 1),
      (108, 'DX-01', 5, N'Caramel Macchiato Đá Xay', N'Espresso xay nhuyễn cùng sữa tươi và sốt caramel hảo hạng, phủ lớp whipping cream bông tuyết béo mềm.', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80', 49000, 55000, N'Đặc Biệt', 4.9, '1.5k+', 1, 1, 1, 1500, 8, 1),
      (109, 'DX-02', 5, N'Matcha Uji Freeze Kem Tuyết', N'Bột trà xanh Uji Kyoto nhập khẩu chuẩn Nhật Bản, xay mịn ngậy cùng kem béo tự nhiên ngọt nhẹ.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80', 49000, 55000, N'Premium', 4.8, '1.1k+', 1, 1, 0, 1100, 9, 1),
      (110, 'BN-01', 6, N'Croissant Bơ Pháp Nướng Giòn', N'Vỏ ngàn lớp giòn tan thơm lừng bơ Pháp cao cấp, nướng nóng hổi thích hợp dùng cùng cà phê sáng.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80', 28000, 32000, N'Combo +15k', 4.8, '2.3k+', 1, 1, 1, 2300, 10, 1),
      (111, 'BN-02', 6, N'Tiramisu Cà Phê Ant Signature', N'Lớp bánh ladyfingers ngấm đẫm cà phê espresso hòa cùng kem phô mai mascarpone rắc bột cacao nồng nàn.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80', 39000, 45000, N'Sweet Pick', 4.9, '1.7k+', 1, 1, 0, 1700, 11, 1),
      (112, 'BN-03', 6, N'Bánh Muffin Vanilla Pháp', N'Bánh muffin nướng vàng xốp mềm thơm phức mùi bơ sữa và hương vani Pháp tự nhiên.', 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&auto=format&fit=crop&q=80', 22000, 25000, N'Bánh Mới', 4.6, '800+', 1, 1, 0, 800, 12, 1);
      SET IDENTITY_INSERT products OFF;
    `);

    // 9. Link Product Option Groups (Drinks get Size, Ice, Sugar, Topping)
    console.log('[Seed] Linking product option groups...');
    await pool.request().query(`
      INSERT INTO product_option_groups (product_id, group_id, display_order)
      SELECT p.id, g.id, g.id
      FROM products p
      CROSS JOIN option_groups g
      WHERE p.category_id IN (2, 3, 4, 5);
    `);

    // 10. Seed Vouchers
    console.log('[Seed] Seeding vouchers...');
    await pool.request().query(`
      SET IDENTITY_INSERT vouchers ON;
      INSERT INTO vouchers (id, code, title, discount_type, discount_value, min_order_amount, usage_limit, start_at, end_at, is_active, created_by) VALUES
      (1, 'ANTWELCOME', N'Giảm 30.000đ cho đơn đầu tiên', 'FIXED_AMOUNT', 30000, 60000, 1000, DATEADD(DAY, -10, SYSDATETIME()), DATEADD(DAY, 90, SYSDATETIME()), 1, 1),
      (2, 'FREESHIP', N'Miễn phí giao hàng (Tối đa 15.000đ)', 'FIXED_AMOUNT', 15000, 50000, 2000, DATEADD(DAY, -10, SYSDATETIME()), DATEADD(DAY, 90, SYSDATETIME()), 1, 1),
      (3, 'COFFEETIME', N'Giảm 20.000đ đơn từ 80.000đ', 'FIXED_AMOUNT', 20000, 80000, 500, DATEADD(DAY, -10, SYSDATETIME()), DATEADD(DAY, 90, SYSDATETIME()), 1, 1),
      (4, 'ANT10K', N'Giảm 10.000đ cho đơn từ 50.000đ', 'FIXED_AMOUNT', 10000, 50000, 500, DATEADD(DAY, -10, SYSDATETIME()), DATEADD(DAY, 90, SYSDATETIME()), 1, 1);
      SET IDENTITY_INSERT vouchers OFF;
    `);

    // 11. Seed Daily Sequence & Sample Orders
    console.log('[Seed] Seeding sample orders...');
    const today = new Date().toISOString().slice(0, 10);
    await pool.request().query(`
      INSERT INTO daily_sequences (seq_date, current_number) VALUES ('${today}', 3);

      SET IDENTITY_INSERT orders ON;
      INSERT INTO orders (
        id, order_code, order_date, daily_queue_number, customer_id, staff_id, shift_id,
        order_type, status, total_items_qty, subtotal_amount, voucher_code, discount_amount, shipping_fee, total_amount,
        payment_method, payment_status, recipient_name, recipient_phone, shipping_address, customer_note,
        driver_name, driver_phone, driver_vehicle, estimated_delivery,
        created_at, confirmed_at
      ) VALUES
      (1001, 'ANT-9021', '${today}', 'A001', 3, 2, 1, 'DELIVERY', 'CONFIRMED', 3, 147000, NULL, 0, 0, 147000, 'MOMO', 'PAID', N'Hoàng Minh', '0912 345 678', N'Toà nhà SunWah, 115 Nguyễn Huệ, Q.1', N'Giao trước sảnh', N'Nguyễn Tuấn Tài', '0933 888 999', N'Yamaha Grande - 59F1 888.29', N'11:10 (15 phút nữa)', DATEADD(MINUTE, -20, SYSDATETIME()), DATEADD(MINUTE, -15, SYSDATETIME())),
      (1002, 'ANT-8954', '${today}', 'A002', 4, 2, 1, 'DELIVERY', 'COMPLETED', 3, 123000, NULL, 0, 0, 123000, 'CASH', 'PAID', N'Thanh Thảo', '0909 777 666', N'68 Hàm Nghi, Q.1', NULL, NULL, NULL, NULL, NULL, DATEADD(HOUR, -2, SYSDATETIME()), DATEADD(HOUR, -2, SYSDATETIME())),
      (1003, 'ANT-8902', '${today}', 'A003', 3, NULL, 1, 'DELIVERY', 'PENDING', 1, 45000, NULL, 0, 15000, 60000, 'CASH', 'UNPAID', N'Nguyễn Văn A', '0901 234 567', N'Tầng 12, Toà nhà Bitexco, Q.1, TP.HCM', N'Ít ngọt giúp em', NULL, NULL, NULL, N'15 - 25 phút', DATEADD(MINUTE, -2, SYSDATETIME()), NULL);
      SET IDENTITY_INSERT orders OFF;

      INSERT INTO order_items (
        order_id, product_id, product_sku_snapshot, product_name_snapshot, product_image_snapshot, base_price_snapshot,
        options_snapshot, options_summary_text, quantity, options_extra_price, unit_final_price, line_total_amount, item_note
      ) VALUES
      (1001, 101, 'CF-01', N'Cà Phê Muối Hoàng Gia', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', 35000, N'{"size":"Size M","ice":"70% Đá","sugar":"70% Đường","toppings":["Thạch Cà Phê Ant House"]}', N'Size M (+8k), 70% Đường, 70% Đá, Thạch Cà Phê (+6k)', 2, 14000, 49000, 98000, NULL),
      (1001, 106, 'TC-01', N'Trà Đào Cam Sả Tươi Mát', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', 38000, N'{"size":"Size M","ice":"100% Đá","sugar":"50% Đường"}', N'Size M (+8k), 50% Đường, 100% Đá', 1, 8000, 46000, 46000, NULL),
      (1002, 104, 'TS-01', N'Trà Sữa Ant Special Signature', 'https://images.unsplash.com/photo-1558857563-b37cf5a285d8?w=600&auto=format&fit=crop&q=80', 42000, N'{"size":"Size L","toppings":["Kem Cheese Macchiato"]}', N'Size L (+14k), Kem Cheese (+10k)', 1, 24000, 66000, 66000, NULL),
      (1002, 110, 'BN-01', N'Croissant Bơ Pháp Nướng Giòn', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80', 28000, N'{}', N'Nướng nóng giòn', 2, 0, 28000, 56000, NULL),
      (1003, 103, 'CF-03', N'Cold Brew Cam Vàng Quế', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80', 45000, N'{"size":"Size S","ice":"100% Đá"}', N'Size S, 100% Đá', 1, 0, 45000, 45000, N'Ít ngọt giúp em');
    `);

    // 12. Seed Cart
    console.log('[Seed] Seeding sample cart...');
    await pool.request().query(`
      SET IDENTITY_INSERT carts ON;
      INSERT INTO carts (id, user_id, voucher_code) VALUES (1, 3, 'FREESHIP');
      SET IDENTITY_INSERT carts OFF;
    `);

    console.log('[Seed] Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    process.exit(1);
  }
}

seed();
