const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protectMiddleware = require('../middleware/auth');

const protect = typeof protectMiddleware === 'function' ? protectMiddleware : (protectMiddleware.protect || ((req, res, next) => next()));
const login = authController.login || ((req, res) => res.status(500).json({ success: false }));
const logout = authController.logout || ((req, res) => res.json({ success: true }));
const me = authController.me || authController.getMe || ((req, res) => res.json({ success: true, admin: req.admin }));

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);

module.exports = router;
