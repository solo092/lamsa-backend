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
const { productValidation } = require('../middleware/validate');
const { upload } = require('../config/cloudinary');

// Public
router.get('/', getAllProducts);
router.get('/location/:location', getProductsByLocation);

// Admin list (before :id)
router.get('/admin/all', authenticateAdmin, getAdminProducts);

// Public single
router.get('/:id', getProductById);

// Admin mutations
router.post('/', authenticateAdmin, upload.array('images', 5), productValidation, createProduct);
router.put('/:id', authenticateAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', authenticateAdmin, deleteProduct);

module.exports = router;
