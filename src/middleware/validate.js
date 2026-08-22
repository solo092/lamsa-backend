const { body, param, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ success: false, message: messages[0], errors: messages });
  }
  next();
};

const orderValidation = [
  body('customer_name')
    .trim()
    .notEmpty().withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('الاسم لازم يكون بين 2 و 100 حرف'),
  body('phone')
    .trim()
    .notEmpty().withMessage('رقم المكالمات مطلوب')
    .matches(/^[0-9+\-\s]{8,20}$/).withMessage('رقم المكالمات غير صحيح'),
  body('whatsapp')
    .trim()
    .notEmpty().withMessage('رقم الواتساب مطلوب')
    .matches(/^[0-9+\-\s]{8,20}$/).withMessage('رقم الواتساب غير صحيح'),
  body('address')
    .trim()
    .notEmpty().withMessage('العنوان مطلوب')
    .isLength({ min: 5, max: 500 }).withMessage('العنوان لازم يكون مفصل أكثر'),
  body('product_id')
    .optional(),
  body('size')
    .isIn(['L', 'XL', 'XXL', 'XXXL']).withMessage('المقاس غير صحيح'),
  body('quantity')
    .isInt({ min: 1, max: 50 }).withMessage('الكمية غير صحيحة'),
  body('location')
    .notEmpty().withMessage('المنطقة مطلوبة'),
  handleValidation,
];

const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('اسم المنتج مطلوب')
    .isLength({ min: 2, max: 200 }).withMessage('اسم المنتج غير صحيح'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('الوصف طويل جداً'),
  body('price')
    .isFloat({ min: 0 }).withMessage('السعر غير صحيح'),
  body('quantity')
    .isInt({ min: 0 }).withMessage('الكمية غير صحيحة'),
  body('location')
    .isIn([
      'بورتسودان', 'القضارف', 'عطبرة', 'دنقلا',
      'الخرطوم', 'أم درمان', 'مدني', 'المناقل'
    ]).withMessage('الولاية غير صحيحة'),
  handleValidation,
];

const statusValidation = [
  body('status')
    .isIn(['جديد', 'تم التواصل', 'تم التأكيد', 'تم التوصيل', 'ملغي'])
    .withMessage('حالة الطلب غير صحيحة'),
  handleValidation,
];

module.exports = {
  orderValidation,
  productValidation,
  statusValidation,
  handleValidation,
};
