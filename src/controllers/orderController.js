const { query, pool } = require('../config/db');

const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      customer_name,
      phone,
      whatsapp,
      state,
      location,
      address,
      color,
      size,
      quantity,
      total_price,
      selected_images
    } = req.body;

    await client.query('BEGIN');

    const finalLocation = state || location || 'غير محدد';
    const finalPhone = phone ? String(phone).trim() : '';
    const finalWhatsapp = whatsapp ? String(whatsapp).trim() : finalPhone;
    const finalAddress = address ? String(address).trim() : 'غير محدد';
    const finalColor = color ? String(color).trim() : 'غير محدد';
    const finalSize = size ? String(size).trim() : 'L';
    const qty = parseInt(quantity || 1, 10);
    const imagesArray = Array.isArray(selected_images) ? selected_images : [];

    const orderRes = await client.query(
      `INSERT INTO orders (
        customer_name, phone, whatsapp, location, state, address,
        color, size, quantity, total_price, selected_images, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], 'جديد')
      RETURNING *`,
      [
        customer_name ? String(customer_name).trim() : 'عميل',
        finalPhone,
        finalWhatsapp,
        finalLocation,
        finalLocation,
        finalAddress,
        finalColor,
        finalSize,
        qty,
        parseFloat(total_price || 0),
        imagesArray
      ]
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
      `SELECT * FROM orders ORDER BY created_at DESC`
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
      `SELECT * FROM orders WHERE id = $1`,
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
