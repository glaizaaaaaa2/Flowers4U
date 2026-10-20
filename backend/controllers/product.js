const Product = require('../models/product')
const Order = require('../models/order')
const Category = require('../models/category')
const mongoose = require('mongoose')
const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures');
const { cleanText } = require('../utils/profanity');
const { SHOP_NAME, LOW_STOCK_THRESHOLD } = require('../config/shop');

const RES_PER_PAGE = 8

// sizes may arrive as a JSON string (form data) or an array
const parseSizes = (raw) => {
    if (raw === undefined) return undefined
    let sizes = raw
    if (typeof raw === 'string') {
        try { sizes = JSON.parse(raw || '[]') } catch (e) { throw new Error('Sizes must be valid JSON') }
    }
    if (!Array.isArray(sizes)) return []
    return sizes
        .filter(s => s && String(s.name || '').trim() !== '')
        .map(s => ({ name: String(s.name).trim(), price: Number(s.price) }))
        .map(s => {
            if (Number.isNaN(s.price) || s.price < 0) throw new Error(`Please enter a valid price for size "${s.name}"`)
            return s
        })
}

const uploadImages = async (raw) => {
    let images = []
    if (!raw) return images
    images = typeof raw === 'string' ? [raw] : raw
    const links = []
    for (const img of images) {
        const result = await cloudinary.v2.uploader.upload(img, { folder: 'products', width: 600, crop: 'scale' })
        links.push({ public_id: result.public_id, url: result.secure_url })
    }
    return links
}

const categoryExists = async (name) => !!(await Category.findOne({ shop: SHOP_NAME, name }))

// POST /admin/product/new
exports.newProduct = async (req, res) => {
    try {
        if (!(await categoryExists(req.body.category))) {
            return res.status(400).json({ message: 'Please select a valid category' })
        }
        const sizes = parseSizes(req.body.sizes)
        const images = await uploadImages(req.body.images)
        if (images.length === 0) return res.status(400).json({ message: 'Please upload at least one product image' })

        const product = await Product.create({
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            category: req.body.category,
            seller: req.body.seller,
            stock: req.body.stock,
            isAvailable: req.body.isAvailable === undefined ? true : String(req.body.isAvailable) !== 'false',
            sizes: sizes || [],
            images,
            user: req.user && req.user._id,
            shop: SHOP_NAME
        })
        return res.status(201).json({ success: true, product })
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

exports.getSingleProduct = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, shop: SHOP_NAME });
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' })
    }
    return res.status(200).json({ success: true, product })
}

// GET /products?keyword=&category=&price[gte]=&price[lte]=&ratings[gte]=&page=
exports.getProducts = async (req, res) => {
    const productsCount = await Product.countDocuments({ shop: SHOP_NAME });
    const apiFeatures = new APIFeatures(Product.find({ shop: SHOP_NAME }).sort({ createdAt: -1 }), req.query).search().filter()

    const filteredProductsCount = await Product.countDocuments(apiFeatures.query.getFilter());
    apiFeatures.pagination(RES_PER_PAGE);
    const products = await apiFeatures.query;

    return res.status(200).json({
        success: true,
        products,
        filteredProductsCount,
        resPerPage: RES_PER_PAGE,
        productsCount,
        lowStockThreshold: LOW_STOCK_THRESHOLD
    })
}

// PUT /admin/product/:id
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findOne({ _id: req.params.id, shop: SHOP_NAME });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

        const update = {}
        for (const f of ['name', 'price', 'description', 'seller', 'stock']) {
            if (req.body[f] !== undefined) update[f] = req.body[f]
        }
        if (req.body.category !== undefined) {
            if (!(await categoryExists(req.body.category))) return res.status(400).json({ message: 'Please select a valid category' })
            update.category = req.body.category
        }
        if (req.body.isAvailable !== undefined) update.isAvailable = String(req.body.isAvailable) !== 'false'
        const sizes = parseSizes(req.body.sizes)
        if (sizes !== undefined) update.sizes = sizes

        // Only replace images when new ones were uploaded
        if (req.body.images && req.body.images.length > 0) {
            for (const img of product.images) {
                try { await cloudinary.v2.uploader.destroy(img.public_id) } catch (e) { /* ignore */ }
            }
            update.images = await uploadImages(req.body.images)
        }

        product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
        return res.status(200).json({ success: true, product })
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

exports.deleteProduct = async (req, res) => {
    const product = await Product.findOneAndDelete({ _id: req.params.id, shop: SHOP_NAME });
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' })
    }
    for (const img of product.images) {
        try { await cloudinary.v2.uploader.destroy(img.public_id) } catch (e) { /* ignore */ }
    }
    return res.status(200).json({ success: true, message: 'Product deleted' })
}

exports.bulkDeleteProducts = async (req, res) => {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Select at least one product to delete' })
    }

    const productIds = [...new Set(ids.map(id => String(id)))]
    if (productIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ message: 'One or more product IDs are invalid' })
    }

    const products = await Product.find({ _id: { $in: productIds }, shop: SHOP_NAME })
    if (products.length !== productIds.length) {
        return res.status(404).json({ message: 'One or more selected products were not found' })
    }

    await Product.deleteMany({ _id: { $in: productIds }, shop: SHOP_NAME })
    for (const product of products) {
        for (const image of product.images) {
            try { await cloudinary.v2.uploader.destroy(image.public_id) } catch (e) { /* ignore */ }
        }
    }

    return res.status(200).json({ success: true, deletedCount: products.length })
}

exports.getAdminProducts = async (req, res) => {
    const products = await Product.find({ shop: SHOP_NAME }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, products, lowStockThreshold: LOW_STOCK_THRESHOLD })
}

// ---------------- Reviews ----------------

// A "verified customer" has a Delivered order containing the product
const hasPurchased = (userId, productId) => Order.exists({
    shop: SHOP_NAME,
    user: userId,
    orderStatus: 'Delivered',
    'orderItems.product': productId
})

// GET /product/:id/can-review
exports.canReview = async (req, res) => {
    const purchased = !!(await hasPurchased(req.user._id, req.params.id))
    const product = await Product.findOne({ _id: req.params.id, shop: SHOP_NAME })
    const existing = product && product.reviews.find(r => r.user.toString() === req.user._id.toString())
    res.status(200).json({
        success: true,
        canReview: purchased,
        review: existing ? { rating: existing.rating, comment: existing.comment } : null
    })
}

// PUT /review   (create or update the logged-in customer's review)
exports.createProductReview = async (req, res) => {
    const { rating, comment, productId } = req.body;
    const product = await Product.findOne({ _id: productId, shop: SHOP_NAME });
    if (!product) return res.status(404).json({ message: 'Product not found' })

    if (!(await hasPurchased(req.user._id, productId))) {
        return res.status(403).json({ message: 'Only customers who received this product can review it' })
    }
    const numRating = Number(rating)
    if (!numRating || numRating < 1 || numRating > 5) {
        return res.status(400).json({ message: 'Please choose a rating from 1 to 5 stars' })
    }
    if (!comment || !String(comment).trim()) {
        return res.status(400).json({ message: 'Please write a comment' })
    }

    // inappropriate words are masked with asterisks
    const cleanComment = cleanText(String(comment).trim())

    const existing = product.reviews.find(r => r.user.toString() === req.user._id.toString())
    if (existing) {
        existing.comment = cleanComment;
        existing.rating = numRating;
    } else {
        product.reviews.push({ user: req.user._id, name: req.user.name, rating: numRating, comment: cleanComment });
    }
    product.numOfReviews = product.reviews.length
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
    await product.save({ validateBeforeSave: false });

    return res.status(200).json({
        success: true,
        filtered: cleanComment !== String(comment).trim()
    })
}

exports.getProductReviews = async (req, res) => {
    const products = await Product.find({ shop: SHOP_NAME }, 'name reviews').lean()
    const reviews = products.flatMap(product => product.reviews.map(review => ({
        ...review,
        productId: product._id,
        productName: product.name
    })))
    res.status(200).json({ success: true, reviews })
}

// DELETE /reviews?id=<reviewId>&productId=<productId>   (admin)
exports.deleteReview = async (req, res) => {
    const product = await Product.findOne({ _id: req.query.productId, shop: SHOP_NAME });
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
    const numOfReviews = reviews.length;
    const ratings = numOfReviews === 0 ? 0 : reviews.reduce((acc, item) => item.rating + acc, 0) / numOfReviews

    product.reviews = reviews
    product.ratings = ratings
    product.numOfReviews = numOfReviews
    await product.save({ validateBeforeSave: false })
    return res.status(200).json({ success: true })
}

// ---------------- Reports ----------------

const soldMatch = { shop: SHOP_NAME, orderStatus: { $ne: 'Cancelled' } }

// GET /admin/product-sales  - each product's share of total sales (pie chart)
exports.productSales = async (req, res) => {
    const totalSales = await Order.aggregate([
        { $match: soldMatch },
        { $group: { _id: null, total: { $sum: "$itemsPrice" } } },
    ])
    const sales = await Order.aggregate([
        { $match: soldMatch },
        { $project: { _id: 0, orderItems: 1 } },
        { $unwind: "$orderItems" },
        { $group: { _id: { product: "$orderItems.name" }, total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } } } },
    ])
    const grand = totalSales[0] ? totalSales[0].total : 0
    const totalPercentage = sales.map(item => ({
        name: item._id.product,
        percent: grand ? Number(((item.total / grand) * 100).toFixed(2)) : 0
    }))
    res.status(200).json({ success: true, totalPercentage, sales, totalSales })
}

// GET /admin/best-sellers?limit=5  - by units sold
exports.bestSellers = async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 5, 20)
    const bestSellers = await Order.aggregate([
        { $match: soldMatch },
        { $unwind: "$orderItems" },
        {
            $group: {
                _id: "$orderItems.product",
                name: { $first: "$orderItems.name" },
                unitsSold: { $sum: "$orderItems.quantity" },
                revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            }
        },
        { $sort: { unitsSold: -1 } },
        { $limit: limit },
        { $project: { _id: 0, product: "$_id", name: 1, unitsSold: 1, revenue: 1 } }
    ])
    res.status(200).json({ success: true, bestSellers })
}
