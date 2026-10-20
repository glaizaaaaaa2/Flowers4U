const mongoose = require('mongoose')
const { SHOP_NAME, ORDER_STATUSES } = require('../config/shop')

const orderSchema = mongoose.Schema({
    shippingInfo: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        phoneNo: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderItems: [
        {
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            image: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            size: {
                type: String
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    // Delivery details
    deliveryDate: {
        type: Date,
        required: true
    },
    recipient: {
        name: { type: String, required: true },
        phoneNo: { type: String }
    },
    giftMessage: {
        type: String,
        maxLength: 300
    },
    paymentInfo: {
        id: {
            type: String
        },
        status: {
            type: String
        }
    },
    paidAt: {
        type: Date
    },

    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ORDER_STATUSES,
        default: 'Pending'
    },
    statusHistory: [
        {
            status: String,
            at: { type: Date, default: Date.now }
        }
    ],
    stockRestored: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    shop: {
        type: String,
        default: SHOP_NAME,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})

module.exports = mongoose.model('Order', orderSchema)