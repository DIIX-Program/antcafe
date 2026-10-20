import { getDbPool, sql } from '../config/db.js';
import { emitProductAvailabilityUpdated } from '../socket/socketHandler.js';

export async function getCategories(req, res) {
  try {
    const pool = await getDbPool();
    const query = `
      SELECT 
        c.id, c.name, c.slug, c.icon_url as icon, c.display_order,
        COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1 AND p.deleted_at IS NULL
      WHERE c.is_active = 1 AND c.deleted_at IS NULL
      GROUP BY c.id, c.name, c.slug, c.icon_url, c.display_order
      ORDER BY c.display_order ASC
    `;

    const result = await pool.request().query(query);

    // Compute total for "Tất cả" (ID 1)
    const allCountResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM products WHERE is_active = 1 AND deleted_at IS NULL
    `);
    const totalCount = allCountResult.recordset[0]?.total || 0;

    const categories = result.recordset.map(cat => ({
      id: Number(cat.id),
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || 'grid-outline',
      count: cat.id === 1 ? totalCount : Number(cat.count),
    }));

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('[Catalog] getCategories error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh mục' });
  }
}

export async function getProducts(req, res) {
  try {
    const { category_id, search, is_featured, tag } = req.query;
    const pool = await getDbPool();

    let query = `
      SELECT 
        p.id, p.sku, p.category_id, c.name as category_name,
        p.name, p.description, p.image_url as image,
        p.base_price, p.original_price, p.discount_tag,
        p.rating, p.orders_count, p.is_available, p.is_featured,
        p.total_sold, p.display_order
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.deleted_at IS NULL
    `;

    const request = pool.request();

    if (category_id && Number(category_id) !== 1) {
      query += ` AND p.category_id = @categoryId`;
      request.input('categoryId', sql.BigInt, Number(category_id));
    }

    if (search && search.trim()) {
      query += ` AND (p.name LIKE @search OR c.name LIKE @search OR p.description LIKE @search)`;
      request.input('search', sql.NVarChar(200), `%${search.trim()}%`);
    }

    if (is_featured === '1' || is_featured === 'true') {
      query += ` AND p.is_featured = 1`;
    }

    if (tag === 'BEST_SELLER') {
      query += ` AND p.discount_tag = N'Best Seller'`;
    } else if (tag === 'DISCOUNT') {
      query += ` AND p.discount_tag IS NOT NULL AND p.discount_tag <> ''`;
    } else if (tag === 'FEATURED') {
      query += ` AND p.is_featured = 1`;
    }

    query += ` ORDER BY p.display_order ASC, p.id ASC`;

    const result = await request.query(query);

    const products = result.recordset.map(prod => ({
      id: Number(prod.id),
      sku: prod.sku,
      category_id: Number(prod.category_id),
      category_name: prod.category_name,
      name: prod.name,
      description: prod.description,
      image: prod.image,
      base_price: Number(prod.base_price),
      original_price: prod.original_price ? Number(prod.original_price) : null,
      discount_tag: prod.discount_tag,
      rating: Number(prod.rating),
      orders_count: prod.orders_count,
      is_available: Boolean(prod.is_available),
      is_featured: Boolean(prod.is_featured),
      total_sold: Number(prod.total_sold),
    }));

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('[Catalog] getProducts error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách sản phẩm' });
  }
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const pool = await getDbPool();

    // 1. Get product
    const prodRes = await pool.request()
      .input('id', sql.BigInt, Number(id))
      .query(`
        SELECT 
          p.id, p.sku, p.category_id, c.name as category_name,
          p.name, p.description, p.image_url as image,
          p.base_price, p.original_price, p.discount_tag,
          p.rating, p.orders_count, p.is_available, p.is_featured,
          p.total_sold
        FROM products p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.id = @id AND p.is_active = 1 AND p.deleted_at IS NULL
      `);

    if (prodRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const prod = prodRes.recordset[0];

    // 2. Get Option Groups for this product
    const groupsRes = await pool.request()
      .input('productId', sql.BigInt, Number(id))
      .query(`
        SELECT 
          g.id, g.name, g.internal_code, g.selection_type,
          g.is_required, g.min_select, g.max_select, pog.display_order
        FROM product_option_groups pog
        INNER JOIN option_groups g ON pog.group_id = g.id
        WHERE pog.product_id = @productId AND g.is_active = 1 AND g.deleted_at IS NULL
        ORDER BY pog.display_order ASC
      `);

    // 3. Get Option Items for these groups
    const itemsRes = await pool.request()
      .input('productId', sql.BigInt, Number(id))
      .query(`
        SELECT 
          oi.id, oi.group_id, oi.name, oi.extra_price,
          oi.is_default, oi.is_available, oi.display_order
        FROM option_items oi
        INNER JOIN product_option_groups pog ON oi.group_id = pog.group_id
        WHERE pog.product_id = @productId AND oi.is_active = 1 AND oi.deleted_at IS NULL
        ORDER BY oi.display_order ASC
      `);

    const groupsMap = {};
    for (const g of groupsRes.recordset) {
      groupsMap[g.internal_code] = {
        id: g.id,
        name: g.name,
        code: g.internal_code,
        type: g.selection_type,
        isRequired: Boolean(g.is_required),
        minSelect: g.min_select,
        maxSelect: g.max_select,
        items: [],
      };
    }

    for (const it of itemsRes.recordset) {
      const gCode = Object.keys(groupsMap).find(k => groupsMap[k].id === it.group_id);
      if (gCode) {
        groupsMap[gCode].items.push({
          id: it.id,
          name: it.name,
          extra_price: Number(it.extra_price),
          price: Number(it.extra_price),
          is_default: Boolean(it.is_default),
          is_available: Boolean(it.is_available),
        });
      }
    }

    return res.json({
      success: true,
      data: {
        id: Number(prod.id),
        sku: prod.sku,
        category_id: Number(prod.category_id),
        category_name: prod.category_name,
        name: prod.name,
        description: prod.description,
        image: prod.image,
        base_price: Number(prod.base_price),
        original_price: prod.original_price ? Number(prod.original_price) : null,
        discount_tag: prod.discount_tag,
        rating: Number(prod.rating),
        orders_count: prod.orders_count,
        is_available: Boolean(prod.is_available),
        is_featured: Boolean(prod.is_featured),
        optionGroups: groupsMap,
        option_groups: groupsMap,
      },
    });
  } catch (error) {
    console.error('[Catalog] getProductById error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết sản phẩm' });
  }
}

export async function toggleProductAvailability(req, res) {
  try {
    const { id } = req.params;
    const pool = await getDbPool();

    const result = await pool.request()
      .input('id', sql.BigInt, Number(id))
      .input('userId', sql.BigInt, req.user?.id || 1)
      .query(`
        UPDATE products
        SET is_available = CASE WHEN is_available = 1 THEN 0 ELSE 1 END,
            updated_by = @userId,
            updated_at = SYSDATETIME()
        WHERE id = @id;

        SELECT id, name, is_available FROM products WHERE id = @id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món' });
    }

    const item = result.recordset[0];
    const isAvail = Boolean(item.is_available);

    emitProductAvailabilityUpdated({
      productId: Number(item.id),
      name: item.name,
      is_available: isAvail,
    });

    return res.json({
      success: true,
      message: `Đã ${isAvail ? 'MỞ BÁN' : 'BÁO HẾT'} món ${item.name}`,
      data: {
        id: Number(item.id),
        is_available: isAvail,
      },
    });
  } catch (error) {
    console.error('[Catalog] toggleProductAvailability error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái món' });
  }
}

export async function getOptionGroups(req, res) {
  try {
    const pool = await getDbPool();
    const groupsRes = await pool.request().query(`
      SELECT id, name, internal_code, selection_type, is_required, min_select, max_select
      FROM option_groups
      WHERE is_active = 1 AND deleted_at IS NULL
      ORDER BY id ASC
    `);

    const itemsRes = await pool.request().query(`
      SELECT id, group_id, name, extra_price, is_default, is_available, display_order
      FROM option_items
      WHERE is_active = 1 AND deleted_at IS NULL
      ORDER BY display_order ASC
    `);

    const sizes = itemsRes.recordset.filter(i => i.group_id === 1).map(i => ({
      id: `size_${i.id}`,
      db_id: i.id,
      name: i.name,
      extra_price: Number(i.extra_price),
      is_default: Boolean(i.is_default),
    }));

    const iceLevels = itemsRes.recordset.filter(i => i.group_id === 2).map(i => ({
      id: `ice_${i.id}`,
      db_id: i.id,
      name: i.name,
      is_default: Boolean(i.is_default),
    }));

    const sugarLevels = itemsRes.recordset.filter(i => i.group_id === 3).map(i => ({
      id: `sugar_${i.id}`,
      db_id: i.id,
      name: i.name,
      is_default: Boolean(i.is_default),
    }));

    const toppings = itemsRes.recordset.filter(i => i.group_id === 4).map(i => ({
      id: `top_${i.id}`,
      db_id: i.id,
      name: i.name,
      price: Number(i.extra_price),
      extra_price: Number(i.extra_price),
      is_available: Boolean(i.is_available),
    }));

    return res.json({
      success: true,
      data: {
        sizes,
        iceLevels,
        sugarLevels,
        toppings,
      },
    });
  } catch (error) {
    console.error('[Catalog] getOptionGroups error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh mục tùy chọn' });
  }
}
