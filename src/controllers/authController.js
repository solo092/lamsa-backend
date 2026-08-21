const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// استيراد وحدة قاعدة البيانات مباشرة
const db = require('../db');
const query = db.query || db;

// تسجيل الدخول
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET || 'lamsa_secret_key_2026_super_secure',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
  }
};

// تسجيل الخروج
const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء تسجيل الخروج' });
  }
};

// التحقق من بيانات الأدمن الحالي
const me = async (req, res) => {
  try {
    const result = await query('SELECT id, email, name FROM admins WHERE id = $1', [req.admin.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }
    return res.json({ success: true, admin: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة' });
  }
};

module.exports = {
  login,
  logout,
  me,
  getMe: me
};
