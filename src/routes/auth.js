const express = require('express');
const router = express.Router();
const { login, logout, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// تأكد من وجود دالة ممررة لكل مسار
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);

module.exports = router;
