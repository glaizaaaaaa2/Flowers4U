const mongoose = require('mongoose')
const { SHOP_NAME } = require('../config/shop')

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter category name'],
        trim: true,
        maxLength: [50, 'Category name cannot exceed 50 characters']
    },
    description: { type: String, trim: true, default: '' },
    shop: { type: String, default: SHOP_NAME, index: true },
    createdAt: { type: Date, default: Date.now }
})
categorySchema.index({ shop: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('Category', categorySchema)
