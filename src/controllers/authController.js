const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'الإيميل وكلمة المرور مطلوبين' });
    }

    const result = await query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET || 'lamsa_secret_key_2026_super_secure',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة، حاول بعد شوية.' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'تم تسجيل الخروج' });
};

const me = async (req, res) => {
  try {
    const result = await query('SELECT id, email, name FROM admins WHERE id = $1', [req.admin.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }
    res.json({ success: true, admin: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة' });
  }
};

module.exports = { login, logout, me };
