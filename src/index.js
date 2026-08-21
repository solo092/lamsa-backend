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

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// قائمة الدومينات المسموح لها مع مرونة كاملة للـ Production
const allowedOrigins = [
  'https://lamsashababiya.online',
  'https://www.lamsashababiya.online',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.lamsashababiya.online')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// معالجة طلبات OPTIONS لجميع المسارات (ضروري جداً لمصادقة الموبايل)
app.options('*', cors());

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
  res.status(500).json({ success: false, message: 'حصلت مشكلة مؤقتة، حاول بعد شوية.' });
});

app.listen(PORT, () => {
  console.log(`🚀 لمسة شبابية server running on port ${PORT}`);
});
