// Optional: adds sample Flowers 4U categories + products to the shared database.
// Images are placeholders - replace them from Admin > Products > Update.
// Run:  npm run seed               (adds samples)
//       npm run seed -- --reset    (removes existing Flowers 4U products first)
const dotenv = require('dotenv');
dotenv.config({ path: './config/.env' });
const mongoose = require('mongoose');
const Product = require('../models/product');
const Category = require('../models/category');
const { SHOP_NAME, DEFAULT_CATEGORIES } = require('../config/shop');

const img = (label) => [{
    public_id: `placeholder/${label.toLowerCase().replace(/\s+/g, '-')}`,
    url: `https://placehold.co/400x400/f7b6c8/7a2e4d?text=${encodeURIComponent(label)}`
}];

const sizes3 = (base) => [
    { name: 'Small', price: base },
    { name: 'Medium', price: Math.round(base * 1.4) },
    { name: 'Large', price: Math.round(base * 1.9) }
];

// [name, category, price, description, stock, sizes?]
const samples = [
    ['Red Rose Bouquet', 'Roses', 45, 'Long-stemmed red roses, hand-tied and wrapped.', 30, sizes3(45)],
    ['Pink Tulip Bunch', 'Tulips', 28, 'A fresh bunch of pink tulips.', 40, sizes3(28)],
    ['Sunshine Sunflowers', 'Sunflowers', 22, 'Bright sunflowers to light up any room.', 35],
    ['White Lily Bouquet', 'Lilies', 38, 'Fragrant white lilies in a classic bouquet.', 25, sizes3(38)],
    ['Purple Orchid Pot', 'Orchids', 55, 'Potted phalaenopsis orchid, long-lasting blooms.', 6],
    ['Spring Mixed Bouquet', 'Bouquets', 40, 'Seasonal mix of the freshest blooms.', 30, sizes3(40)],
    ['Bridal Bouquet', 'Wedding Flowers', 120, 'Bridal bouquet (sample listing).', 10],
    ['Sympathy Wreath', 'Funeral Flowers', 95, 'Elegant white wreath with ribbon.', 8],
    ['Mini Succulent Pot', 'Potted Plants', 12, 'Easy-care succulent in a ceramic pot.', 50],
    ['Flowers & Chocolate Gift Set', 'Gift Sets', 60, 'Mixed bouquet with a box of chocolates.', 0]
];

(async () => {
    await mongoose.connect(process.env.DB_URI);
    for (const name of DEFAULT_CATEGORIES) {
        await Category.updateOne({ shop: SHOP_NAME, name }, { $setOnInsert: { shop: SHOP_NAME, name } }, { upsert: true });
    }
    if (process.argv.includes('--reset')) {
        const r = await Product.deleteMany({ shop: SHOP_NAME });
        console.log(`Removed ${r.deletedCount} existing ${SHOP_NAME} products`);
    }
    await Product.insertMany(samples.map(([name, category, price, description, stock, sizes]) => ({
        name, category, price, description, stock,
        sizes: sizes || [],
        seller: SHOP_NAME,
        images: img(name),
        shop: SHOP_NAME
    })));
    console.log(`Seeded ${samples.length} products for ${SHOP_NAME} (one is low stock, one is out of stock on purpose)`);
    await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
