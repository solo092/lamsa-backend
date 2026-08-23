const { query } = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

const LOCATIONS = [
  'بورتسودان', 'القضارف', 'عطبرة', 'دنقلا',
  'الخرطوم', 'أم درمان', 'مدني', 'المناقل'
];

const getAllProducts = async (req, res) => {
  try {
    let result;
    try {
      result = await query(`SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC`);
    } catch (dbErr) {
      result = await query(`SELECT * FROM products ORDER BY created_at DESC`);
    }
    
    res.json({ success: true, products: result.rows, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'حصلت مشكلة مؤقتة، حاول بعد شوية.',
      error: err.message || err.toString()
    });
  }
};

const getProductsByLocation = async (req, res) => {
  try {
    // 1. فك ترميز الاسم العربي وتنظيف المسافات
    let locationParam = decodeURIComponent(req.params.location || '').trim();

    let result;
    try {
      result = await query(
        `SELECT * FROM products WHERE location = $1 AND is_active = TRUE ORDER BY created_at DESC`,
        [locationParam]
      );
    } catch (dbErr) {
      result = await query(
        `SELECT * FROM products WHERE location = $1 ORDER BY created_at DESC`,
        [locationParam]
      );
    }

    // 2. إذا لم توجد منتجات مطابقة للمنطقة، يتم إرجاع كل المنتجات بدلاً من إيقاف الصفحة
    if (!result.rows || result.rows.length === 0) {
      result = await query(`SELECT * FROM products ORDER BY created_at DESC`);
    }

    res.json({ 
      success: true, 
      products: result.rows, 
      data: result.rows, 
      location: locationParam 
    });
  } catch (err) {
    console.error(err);
    // إرجاع المنتجات كخيار احتياطي لمنع التعليق عند وقوع أي خطأ
    try {
      const fallback = await query(`SELECT * FROM products ORDER BY created_at DESC`);
      return res.json({ success: true, products: fallback.rows, data: fallback.rows });
    } catch (fallbackErr) {
      res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة', error: err.message });
    }
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let result;
    try {
      result = await query('SELECT * FROM products WHERE id = $1 AND is_active = TRUE', [id]);
    } catch (dbErr) {
      result = await query('SELECT * FROM products WHERE id = $1', [id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
    res.json({ success: true, product: result.rows[0], data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة', error: err.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity, delivery_fee, location } = req.body;
    let image_urls = [];

    if (req.files && req.files.length > 0) {
      image_urls = req.files.map((f) => f.path || f.secure_url || f.url);
    } else if (req.body.image_urls) {
      image_urls = Array.isArray(req.body.image_urls) ? req.body.image_urls : [req.body.image_urls];
    }

    const result = await query(
      `INSERT INTO products (name, description, price, quantity, delivery_fee, location, image_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name, 
        description || '', 
        parseFloat(price), 
        parseInt(quantity), 
        delivery_fee ? parseFloat(delivery_fee) : 0, 
        location, 
        image_urls
      ]
    );

    res.status(201).json({ success: true, message: 'تم إضافة المنتج بنجاح', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة في إضافة المنتج', error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, quantity, delivery_fee, location } = req.body;

    const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    let image_urls = existing.rows[0].image_urls || [];

    if (req.files && req.files.length > 0) {
      image_urls = req.files.map((f) => f.path || f.secure_url || f.url);
    } else if (req.body.image_urls) {
      image_urls = Array.isArray(req.body.image_urls) ? req.body.image_urls : [req.body.image_urls];
    }

    const result = await query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        quantity = COALESCE($4, quantity),
        delivery_fee = COALESCE($5, delivery_fee),
        location = COALESCE($6, location),
        image_urls = $7,
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name || null,
        description !== undefined ? description : null,
        price !== undefined ? parseFloat(price) : null,
        quantity !== undefined ? parseInt(quantity) : null,
        delivery_fee !== undefined ? parseFloat(delivery_fee) : null,
        location || null,
        image_urls,
        id,
      ]
    );

    res.json({ success: true, message: 'تم تحديث المنتج', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة في التحديث', error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let result;
    try {
      result = await query(
        `UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
        [id]
      );
    } catch (dbErr) {
      result = await query(`DELETE FROM products WHERE id = $1 RETURNING id`, [id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف المنتج' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة في الحذف', error: err.message });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const result = await query(`SELECT * FROM products ORDER BY created_at DESC`);
    res.json({ success: true, products: result.rows, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة', error: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductsByLocation,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  LOCATIONS,
};
