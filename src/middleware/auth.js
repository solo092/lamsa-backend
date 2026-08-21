const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // 1. القراءة من الـ Authorization Header أولاً
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. القراءة من الـ Cookies كخيار ثانٍ
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lamsa_secret_key_2026_super_secure');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'توكين غير صالح' });
  }
};

module.exports = { protect };
