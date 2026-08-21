const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/auth');

// دالة احتياطية في حال عدم وجود getMe أو me
const getMeHandler = authController.me || authController.getMe || ((req, res) => res.json({ success: true, admin: req.admin }));
const middlewareHandler = typeof protect === 'function' ? protect : (protect.protect || ((req, res, next) => next()));

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', middlewareHandler, getMeHandler);

module.exports = router;
