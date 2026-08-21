const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductsByLocation,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
} = require('../controllers/productController');
const { authenticateAdmin } = require('../middleware/auth');
const { protect } = require('../middleware/validate');
const { upload } = require('../config/cloudinary');

// Public
router.get('/', getAllProducts);
router.get('/location/:location', getProductsByLocation);

// Admin list (before :id)
router.get('/admin/all', protect, getAdminProducts);

// Public single
router.get('/:id', getProductById);

// Admin mutations
router.post('/', protect, upload.array('images', 5), productValidation, createProduct);
router.put('/:id', protect, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
