const User = require('../models/user')
const jwt = require("jsonwebtoken")

// Accepts the httpOnly cookie (normal browser flow) or an "Authorization: Bearer <token>" header
exports.isAuthenticatedUser = async (req, res, next) => {
    let token = req.cookies && req.cookies.token

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const bearer = req.headers.authorization.split(' ')[1]
        if (bearer && bearer !== 'false' && bearer !== 'null' && bearer !== 'undefined') token = bearer
    }

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id);
    } catch (err) {
        return res.status(401).json({ message: 'Your session is invalid or has expired. Please log in again' })
    }

    if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' })
    }
    next()
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to access this resource` })
        }
        next()
    }
}
