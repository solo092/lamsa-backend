const express = require('express');
const router = express.Router();
const db = require('../config/db'); // تأكد إن مسار db صح، أو استخدم طريقة الربط الموجودة عندك
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getStats,
} = require('../controllers/orderController');
const { authenticateAdmin } = require('../middleware/auth');
const { orderValidation, statusValidation } = require('../middleware/validate');

// Public - create order
router.post('/', orderValidation, createOrder);

// Admin
router.get('/stats', authenticateAdmin, getStats);
router.get('/', authenticateAdmin, getAllOrders);
router.get('/:id', authenticateAdmin, getOrderById);
router.put('/:id/status', authenticateAdmin, statusValidation, updateOrderStatus);

// 1. مسار تصفير كل الطلبات
router.delete('/clear-all', authenticateAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM orders');
    res.json({ success: true, message: 'تم تصفير كافة الطلبات والعدادات بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. مسار حذف طلب واحد برقم الـ ID
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;