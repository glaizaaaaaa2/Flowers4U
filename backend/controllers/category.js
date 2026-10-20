const Category = require('../models/category')
const Product = require('../models/product')
const { SHOP_NAME } = require('../config/shop')

// Public: list categories (used by filters and the admin product form)
exports.getCategories = async (req, res) => {
    const categories = await Category.find({ shop: SHOP_NAME }).sort({ name: 1 })
    res.status(200).json({ success: true, categories })
}

exports.newCategory = async (req, res) => {
    const { name, description } = req.body
    try {
        const category = await Category.create({ name, description, shop: SHOP_NAME })
        res.status(201).json({ success: true, category })
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'That category already exists' })
        return res.status(400).json({ message: err.message })
    }
}

exports.updateCategory = async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, shop: SHOP_NAME })
    if (!category) return res.status(404).json({ message: 'Category not found' })

    const oldName = category.name
    if (req.body.name !== undefined) category.name = req.body.name
    if (req.body.description !== undefined) category.description = req.body.description
    try {
        await category.save()
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'That category already exists' })
        return res.status(400).json({ message: err.message })
    }
    // keep existing products in sync when a category is renamed
    if (oldName !== category.name) {
        await Product.updateMany({ shop: SHOP_NAME, category: oldName }, { category: category.name })
    }
    res.status(200).json({ success: true, category })
}

exports.deleteCategory = async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, shop: SHOP_NAME })
    if (!category) return res.status(404).json({ message: 'Category not found' })

    const inUse = await Product.countDocuments({ shop: SHOP_NAME, category: category.name })
    if (inUse > 0) {
        return res.status(400).json({ message: `Cannot delete: ${inUse} product(s) still use "${category.name}". Move or delete them first.` })
    }
    await category.deleteOne()
    res.status(200).json({ success: true })
}
