const express = require('express')
const router = express.Router();

const {
    newOrder, myOrders, getSingleOrder, deleteOrder, allOrders, updateOrder,
    totalOrders, totalSales, customerSales, salesPerMonth, salesByDate,
} = require('../controllers/order')
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')
const admin = [isAuthenticatedUser, authorizeRoles('admin')]

router.post('/order/new', isAuthenticatedUser, newOrder);
router.get('/orders/me', isAuthenticatedUser, myOrders);
router.get('/order/:id', isAuthenticatedUser, getSingleOrder);
router.get('/admin/orders', ...admin, allOrders);
router.route('/admin/order/:id').put(...admin, updateOrder).delete(...admin, deleteOrder);
router.get('/admin/total-orders', ...admin, totalOrders);
router.get('/admin/total-sales', ...admin, totalSales);
router.get('/admin/customer-sales', ...admin, customerSales);
router.get('/admin/sales-per-month', ...admin, salesPerMonth);
router.get('/admin/sales-by-date', ...admin, salesByDate);
module.exports = router
