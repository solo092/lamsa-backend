const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', authController.logout);

// المسار مع فحص أمان لتفادي خطأ undefined
router.get('/me', protect, authController.getMe || ((req, res) => res.json({ success: true, admin: req.admin })));

module.exports = router;
