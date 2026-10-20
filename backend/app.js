const express = require('express');
const app = express();
const cors = require('cors')
const cookieParser = require('cookie-parser')
const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5174",
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);

// Unknown route -> JSON instead of an HTML page
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
})

// Any error thrown inside a controller ends up here as { message } so the frontend can show it
app.use((err, req, res, next) => {
    console.error(err)
    let message = err.message || 'Server error'
    let status = err.status || err.statusCode || 500
    if (err.name === 'CastError') { status = 400; message = `Invalid ${err.path}: ${err.value}` }
    if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', ') }
    res.status(status).json({ success: false, message })
})

module.exports = app
