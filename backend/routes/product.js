const express = require('express');
const router = express.Router();

const {
    newProduct,
    getSingleProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    getAdminProducts,
    createProductReview,
    getProductReviews,
    deleteReview,
    canReview,
    productSales,
    bestSellers,
} = require('../controllers/product');
const {
    getCategories,
    newCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/category');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')
const admin = [isAuthenticatedUser, authorizeRoles('admin')]

// products
router.get('/products', getProducts)
router.get('/product/:id', getSingleProduct)
router.post('/admin/product/new', ...admin, newProduct);
router.put('/admin/product/:id', ...admin, updateProduct);
router.delete('/admin/product/:id', ...admin, deleteProduct);
router.post('/admin/products/bulk-delete', ...admin, bulkDeleteProducts);
router.get('/admin/products', ...admin, getAdminProducts)

// categories
router.get('/categories', getCategories)
router.post('/admin/category/new', ...admin, newCategory)
router.route('/admin/category/:id').put(...admin, updateCategory).delete(...admin, deleteCategory)

// reviews
router.get('/product/:id/can-review', isAuthenticatedUser, canReview)
router.put('/review', isAuthenticatedUser, createProductReview);
router.get('/reviews', isAuthenticatedUser, authorizeRoles('admin'), getProductReviews)
router.delete('/reviews', ...admin, deleteReview)

// reports
router.get('/admin/product-sales', ...admin, productSales);
router.get('/admin/best-sellers', ...admin, bestSellers);
module.exports = router
