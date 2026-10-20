const Order = require('../models/order');
const Product = require('../models/product');
const {
    SHOP_NAME, ORDER_STATUSES, DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS,
    FREE_SHIPPING_OVER, SHIPPING_FEE, TAX_RATE
} = require('../config/shop');
const { sendOrderPlaced, sendStatusUpdate, sendReceipt } = require('../utils/orderEmail');

const TZ = 'Asia/Manila'
const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100

const toYMD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }

// Put stock back (used when an order is cancelled or deleted before delivery)
const restoreStock = async (order) => {
    if (order.stockRestored) return
    for (const item of order.orderItems) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
    }
    order.stockRestored = true
}

// ---------------------------------------------------------------------------
// POST /order/new
// Prices, stock and availability are checked on the server, never trusted from the browser.
// ---------------------------------------------------------------------------
exports.newOrder = async (req, res) => {
    const { orderItems, shippingInfo, deliveryDate, recipient, giftMessage, paymentInfo } = req.body

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ message: 'Your cart is empty' })
    }
    if (!shippingInfo || !shippingInfo.address) {
        return res.status(400).json({ message: 'Please provide delivery details' })
    }
    if (!recipient || !String(recipient.name || '').trim()) {
        return res.status(400).json({ message: 'Please provide the recipient name' })
    }

    // Delivery date must be within the allowed window
    const ymd = String(deliveryDate || '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
        return res.status(400).json({ message: 'Please choose a delivery date' })
    }
    const minYMD = toYMD(addDays(DELIVERY_MIN_DAYS))
    const maxYMD = toYMD(addDays(DELIVERY_MAX_DAYS))
    if (ymd < minYMD || ymd > maxYMD) {
        return res.status(400).json({ message: `Delivery date must be between ${minYMD} and ${maxYMD}` })
    }

    // Validate every line and reserve stock atomically
    const reserved = []
    const lines = []
    const rollback = async () => {
        for (const r of reserved) await Product.updateOne({ _id: r.product }, { $inc: { stock: r.quantity } })
    }

    try {
        for (const item of orderItems) {
            const quantity = Number(item.quantity)
            if (!Number.isInteger(quantity) || quantity < 1) {
                await rollback()
                return res.status(400).json({ message: 'Invalid quantity in your cart' })
            }
            const product = await Product.findOne({ _id: item.product, shop: SHOP_NAME })
            if (!product) {
                await rollback()
                return res.status(400).json({ message: `"${item.name || 'An item'}" is no longer sold` })
            }
            if (!product.isAvailable || product.stock <= 0) {
                await rollback()
                return res.status(400).json({ message: `"${product.name}" is currently unavailable` })
            }

            let price = product.price
            let size
            if (product.sizes && product.sizes.length > 0) {
                const found = product.sizes.find(s => s.name === item.size)
                if (!found) {
                    await rollback()
                    return res.status(400).json({ message: `Please choose a size for "${product.name}"` })
                }
                price = found.price
                size = found.name
            }

            const got = await Product.findOneAndUpdate(
                { _id: product._id, isAvailable: true, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } }
            )
            if (!got) {
                await rollback()
                return res.status(400).json({ message: `Only ${product.stock} of "${product.name}" left in stock` })
            }
            reserved.push({ product: product._id, quantity })
            lines.push({
                name: product.name,
                quantity,
                image: product.images[0] ? product.images[0].url : '',
                price,
                size,
                product: product._id
            })
        }

        const itemsPrice = round2(lines.reduce((acc, l) => acc + l.price * l.quantity, 0))
        const shippingPrice = itemsPrice > FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE
        const taxPrice = round2(itemsPrice * TAX_RATE)
        const totalPrice = round2(itemsPrice + shippingPrice + taxPrice)

        const order = await Order.create({
            orderItems: lines,
            shippingInfo,
            deliveryDate: new Date(`${ymd}T00:00:00.000Z`),
            recipient: { name: String(recipient.name).trim(), phoneNo: recipient.phoneNo },
            giftMessage: giftMessage ? String(giftMessage).slice(0, 300) : undefined,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo,
            paidAt: Date.now(),
            orderStatus: 'Pending',
            statusHistory: [{ status: 'Pending' }],
            shop: SHOP_NAME,
            user: req.user._id
        })

        sendOrderPlaced(req.user, order)   // fire and forget
        return res.status(201).json({ success: true, order })
    } catch (err) {
        await rollback()
        return res.status(400).json({ message: err.message })
    }
}

// GET /orders/me
exports.myOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.id, shop: SHOP_NAME }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, orders })
}

// GET /order/:id   (the customer who owns it, or an admin)
exports.getSingleOrder = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, shop: SHOP_NAME }).populate('user', 'name email')
    if (!order) return res.status(404).json({ message: 'No Order found with this ID' })

    const ownerId = order.user && order.user._id ? order.user._id.toString() : String(order.user)
    if (req.user.role !== 'admin' && ownerId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not allowed to view this order' })
    }
    res.status(200).json({ success: true, order })
}

// GET /admin/orders
exports.allOrders = async (req, res) => {
    const orders = await Order.find({ shop: SHOP_NAME }).sort({ createdAt: -1 }).populate('user', 'name email')
    const totalAmount = orders
        .filter(o => o.orderStatus !== 'Cancelled')
        .reduce((acc, o) => acc + o.totalPrice, 0)
    res.status(200).json({ success: true, totalAmount, orders })
}

// DELETE /admin/order/:id
exports.deleteOrder = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, shop: SHOP_NAME })
    if (!order) return res.status(404).json({ message: 'No Order found with this ID' })

    if (order.orderStatus !== 'Delivered') await restoreStock(order)
    await order.deleteOne()
    return res.status(200).json({ success: true })
}

// PUT /admin/order/:id   body: { status }
exports.updateOrder = async (req, res) => {
    const status = req.body.status
    if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` })
    }
    const order = await Order.findOne({ _id: req.params.id, shop: SHOP_NAME }).populate('user', 'name email')
    if (!order) return res.status(404).json({ message: 'No Order found with this ID' })

    if (order.orderStatus === 'Delivered') {
        return res.status(400).json({ message: 'This order has already been delivered' })
    }
    if (order.orderStatus === 'Cancelled') {
        return res.status(400).json({ message: 'This order was cancelled and cannot be changed' })
    }
    if (order.orderStatus === status) {
        return res.status(400).json({ message: `The order is already "${status}"` })
    }

    if (status === 'Cancelled') await restoreStock(order)
    if (status === 'Delivered') order.deliveredAt = Date.now()

    order.orderStatus = status
    order.statusHistory.push({ status })
    await order.save()

    // Customer gets an email with the order details on every change
    if (order.user && order.user.email) {
        sendStatusUpdate(order.user, order)
        if (status === 'Delivered') sendReceipt(order.user, order)
    }
    res.status(200).json({ success: true, order })
}

// ---------------------------------------------------------------------------
// Reports (admin). Cancelled orders are not counted as sales.
// Optional ?start=YYYY-MM-DD&end=YYYY-MM-DD limits the date range.
// ---------------------------------------------------------------------------
const salesMatch = (req) => {
    const match = { shop: SHOP_NAME, orderStatus: { $ne: 'Cancelled' } }
    const { start, end } = req.query
    if (start || end) {
        match.paidAt = {}
        if (start) match.paidAt.$gte = new Date(`${start}T00:00:00+08:00`)
        if (end) match.paidAt.$lte = new Date(`${end}T23:59:59.999+08:00`)
    }
    return match
}

exports.totalOrders = async (req, res) => {
    const totalOrders = await Order.aggregate([
        { $match: { shop: SHOP_NAME } },
        { $group: { _id: null, count: { $sum: 1 } } }
    ])
    res.status(200).json({ success: true, totalOrders })
}

exports.totalSales = async (req, res) => {
    const totalSales = await Order.aggregate([
        { $match: salesMatch(req) },
        { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } }
    ])
    res.status(200).json({ success: true, totalSales })
}

exports.customerSales = async (req, res) => {
    const customerSales = await Order.aggregate([
        { $match: salesMatch(req) },
        { $group: { _id: "$user", total: { $sum: "$totalPrice" } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
        { $unwind: "$userDetails" },
        { $project: { _id: 0, "userDetails.name": 1, total: 1 } },
        { $sort: { total: -1 } },
    ])
    res.status(200).json({ success: true, customerSales })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// GET /admin/sales-per-month[?start&end]  -> [{ month: 'Oct 2026', total }]
exports.salesPerMonth = async (req, res) => {
    const rows = await Order.aggregate([
        { $match: salesMatch(req) },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$paidAt', timezone: TZ } },
                total: { $sum: "$totalPrice" },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])
    const salesPerMonth = rows.map(r => {
        const [y, m] = r._id.split('-')
        return { month: `${MONTHS[Number(m) - 1]} ${y}`, total: round2(r.total), orders: r.orders }
    })
    res.status(200).json({ success: true, salesPerMonth })
}

// GET /admin/sales-by-date?start&end  -> [{ date: '2026-10-10', total, orders }]
exports.salesByDate = async (req, res) => {
    const rows = await Order.aggregate([
        { $match: salesMatch(req) },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: TZ } },
                total: { $sum: "$totalPrice" },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])
    const salesByDate = rows.map(r => ({ date: r._id, total: round2(r.total), orders: r.orders }))
    res.status(200).json({ success: true, salesByDate })
}
