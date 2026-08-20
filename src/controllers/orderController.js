const { query, pool } = require('../config/db');

const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      customer_name,
      phone,
      whatsapp,
      address,
      product_id,
      size,
      quantity,
      location,
    } = req.body;

    await client.query('BEGIN');

    // Lock product row
    const productRes = await client.query(
      'SELECT * FROM products WHERE id = $1 AND is_active = TRUE FOR UPDATE',
      [product_id]
    );

    if (productRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'المعروض دا خلص حالياً.' });
    }

    const product = productRes.rows[0];

    if (product.location !== location) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'المنتج غير متوفر في منطقتك.' });
    }

    const qty = parseInt(quantity, 10);
    if (product.quantity < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: product.quantity === 0
          ? 'المعروض دا خلص حالياً.'
          : `الكمية المتوفرة حالياً ${product.quantity} فقط.`,
      });
    }

    // Server-side price calculation
    const unit_price = parseFloat(product.price);
    const total_price = unit_price * qty;

    // Create order with snapshot
    const orderRes = await client.query(
      `INSERT INTO orders (
        customer_name, phone, whatsapp, location, address,
        product_id, product_name_snapshot, size, quantity,
        unit_price, total_price, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'جديد')
      RETURNING *`,
      [
        customer_name.trim(),
        phone.trim(),
        whatsapp.trim(),
        location,
        address.trim(),
        product.id,
        product.name,
        size,
        qty,
        unit_price,
        total_price,
      ]
    );

    // Reduce stock
    await client.query(
      'UPDATE products SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2',
      [qty, product.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'تم استلام طلبك بنجاح ❤️',
      order: orderRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة في إرسال الطلب، حاول تاني.' });
  } finally {
    client.release();
  }
};

const getAllOrders = async (req, res) => {
  try {
    const result = await query(
      `SELECT o.*, p.image_urls as product_images
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       ORDER BY o.created_at DESC`
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT o.*, p.image_urls as product_images
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       WHERE o.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    res.json({ success: true, message: 'تم تحديث حالة الطلب', order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة في التحديث' });
  }
};

const getStats = async (req, res) => {
  try {
    const totalOrders = await query('SELECT COUNT(*) FROM orders');
    const newOrders = await query(`SELECT COUNT(*) FROM orders WHERE status = 'جديد'`);
    const totalProducts = await query('SELECT COUNT(*) FROM products WHERE is_active = TRUE');
    const totalSales = await query(
      `SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status != 'ملغي'`
    );

    res.json({
      success: true,
      stats: {
        totalOrders: parseInt(totalOrders.rows[0].count, 10),
        newOrders: parseInt(newOrders.rows[0].count, 10),
        totalProducts: parseInt(totalProducts.rows[0].count, 10),
        totalSales: parseFloat(totalSales.rows[0].total),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة' });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getStats,
};
