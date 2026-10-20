const mongoose = require('mongoose');
const Category = require('../models/category');
const { SHOP_NAME, DEFAULT_CATEGORIES } = require('./shop');

// First run: give the shop its default flower categories (admin can edit them later)
const seedCategories = async () => {
    const count = await Category.countDocuments({ shop: SHOP_NAME })
    if (count === 0) {
        await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name, shop: SHOP_NAME })))
        console.log(`Created ${DEFAULT_CATEGORIES.length} default categories for ${SHOP_NAME}`)
    }
}

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URI).then(async con => {
        console.log(`MongoDB Database connected with HOST: ${con.connection.host}`)
        await seedCategories()
    }).catch(err => {
        console.error('MongoDB connection failed:', err.message)
        process.exit(1)
    })
}

module.exports = connectDatabase
