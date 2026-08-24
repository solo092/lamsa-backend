require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. تعديل Helmet لعدم حجب الـ CORS وطلبات المتصفحات الخارجية
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // يمنع حجب جلب البيانات والصور من مصادر خارجية
  })
);

// 2. ضبط CORS شاملاً لجميع المصادر والـ Preflight requests
app.use(
  cors({
    origin: '*', // السماح لأي دُومين بالوصول للـ API
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);

app.options('*', cors()); // الاستجابة المباشرة لطلبات OPTIONS

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// مسار تلقائي لتجهيز قاعدة البيانات والجداول عبر المتصفح
app.get('/api/setup-db', async (req, res) => {
  try {
    const migrate = require('./db/migrate');
    const seed = require('./db/seed');

    if (typeof migrate === 'function') await migrate();
    if (typeof seed === 'function') await seed();

    res.json({ success: true, message: 'تم إنشاء الجداول وتنزيل البيانات المبدئية بنجاح!' });
  } catch (error) {
    console.error('Database Setup Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'لمسة شبابية API is running', time: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'المسار غير موجود' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'فقط الصور مسموحة') {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ 
    success: false, 
    message: err.message || 'حصلت مشكلة مؤقتة، حاول بعد شوية.',
    error: err.toString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 لمسة شبابية server running on port ${PORT}`);
});
