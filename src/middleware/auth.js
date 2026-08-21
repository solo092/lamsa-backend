const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
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

// إرجاع protect بكلا الطريقتين (دالة مباشرة + Object) لتوافق جميع ملفات الـ Routes
module.exports = protect;
module.exports.protect = protect;
