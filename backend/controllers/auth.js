const User = require('../models/user');
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const sendEmail = require('../utils/sendEmail')
const sendToken = require('../utils/jwtToken');

exports.registerUser = async (req, res, next) => {
    try {
        const { name, email, password, avatar } = req.body;
        let avatarData
        if (avatar) {
            const result = await cloudinary.v2.uploader.upload(avatar, {
                folder: 'avatars',
                width: 150,
                crop: "scale"
            });
            avatarData = { public_id: result.public_id, url: result.secure_url }
        } else {
            // no photo chosen: generated initials avatar
            avatarData = {
                public_id: 'default_avatar',
                url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f7b6c8&color=7a2e4d&size=150`
            }
        }
        const user = await User.create({ name, email, password, avatar: avatarData })
        sendToken(user, 200, res)
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'That email is already registered' })
        return res.status(400).json({ message: err.message })
    }
}

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    // Checks if email and password is entered by user
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter email & password' })
    }


    // Finding user in database

    let user = await User.findOne({ email }).select('+password')
    if (!user) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }


    // Checks if password is correct or not
    const isPasswordMatched = await user.comparePassword(password);


    if (!isPasswordMatched) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }
    user = await User.findOne({ email })
    sendToken(user, 200, res)
}

exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ message: 'User not found with this email' })

    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    // Create reset password url
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    try {
        await sendEmail({
            email: user.email,
            subject: 'Flowers 4U Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ message: error.message })

    }
}

exports.resetPassword = async (req, res, next) => {
    console.log(req.params.token)
    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    console.log(resetPasswordToken)
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })
    console.log(user)

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })

    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })

    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user
    });

}

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(user)

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updateProfile = async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    // Update avatar
    if (req.body.avatar) {
        let user = await User.findById(req.user.id)
        const image_id = user.avatar.public_id;
        if (image_id && image_id !== 'default_avatar' && image_id !== 'google_avatar') {
            await cloudinary.v2.uploader.destroy(image_id);
        }
        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })
    if (!user) {
        return res.status(401).json({ message: 'User Not Updated' })
    }

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updatePassword = async (req, res, next) => {
    console.log(req.body.password)
    const user = await User.findById(req.user.id).select('+password');
    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
    await user.save();
    // const token = user.getJwtToken();

    // return res.status(201).json({
    //     success: true,
    //     user,
    //     token
    // });
    sendToken(user, 200, res)

}

exports.allUsers = async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
}

exports.deleteUser = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(401).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    // Remove avatar from cloudinary
    const image_id = user.avatar.public_id;
    if (image_id && image_id !== 'default_avatar' && image_id !== 'google_avatar') {
        await cloudinary.v2.uploader.destroy(image_id);
    }
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({
        success: true,
    })
}

exports.getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
}

exports.updateUser = async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        // useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
}

exports.logout = async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    return res.status(200).json({
        success: true,
        message: 'Logged out'
    })
}

// ---------------------------------------------------------------------------
// Google sign-in through Firebase Authentication
// POST /auth/google   body: { idToken }  (Firebase ID token from the browser)
// The token is verified against Google's public keys; no service account needed,
// only FIREBASE_PROJECT_ID.
// ---------------------------------------------------------------------------
let jwks
exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body
        const projectId = process.env.FIREBASE_PROJECT_ID
        if (!projectId) return res.status(500).json({ message: 'Google login is not configured (FIREBASE_PROJECT_ID missing)' })
        if (!idToken) return res.status(400).json({ message: 'Missing Google token' })

        const { createRemoteJWKSet, jwtVerify } = await import('jose')
        if (!jwks) {
            jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'))
        }
        const { payload } = await jwtVerify(idToken, jwks, {
            issuer: `https://securetoken.google.com/${projectId}`,
            audience: projectId
        })
        if (!payload.email) return res.status(400).json({ message: 'Your Google account has no email address' })
        if (payload.email_verified === false) return res.status(400).json({ message: 'Please verify your Google email first' })

        let user = await User.findOne({ email: payload.email })
        if (!user) {
            user = await User.create({
                name: (payload.name || payload.email.split('@')[0]).slice(0, 30),
                email: payload.email,
                // never used to log in; Google accounts sign in through Firebase
                password: crypto.randomBytes(24).toString('hex'),
                avatar: {
                    public_id: 'google_avatar',
                    url: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.email)}&background=f7b6c8&color=7a2e4d&size=150`
                },
                authProvider: 'google'
            })
        }
        sendToken(user, 200, res)
    } catch (err) {
        console.log('Google login failed:', err.message)
        return res.status(401).json({ message: 'Google sign-in failed. Please try again.' })
    }
}
