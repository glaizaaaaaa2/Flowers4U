// Single place for the shop identity and shop rules.
// Flowers 4U shares the same MongoDB database (and the same User / Product / Order
// collections) as the original system, so every product, order and category it creates
// is tagged with this name and every query is scoped to it.
module.exports = {
    SHOP_NAME: 'Flowers 4U',
    DEFAULT_CATEGORIES: [
        'Roses', 'Tulips', 'Sunflowers', 'Lilies', 'Orchids',
        'Bouquets', 'Wedding Flowers', 'Funeral Flowers', 'Potted Plants', 'Gift Sets'
    ],
    ORDER_STATUSES: ['Pending', 'Processing', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled'],
    LOW_STOCK_THRESHOLD: 10,
    // Customers can pick a delivery date from tomorrow up to 60 days ahead
    DELIVERY_MIN_DAYS: 1,
    DELIVERY_MAX_DAYS: 60,
    FREE_SHIPPING_OVER: 200,
    SHIPPING_FEE: 25,
    TAX_RATE: 0.05
}
