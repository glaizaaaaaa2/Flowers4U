const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();
    const isProd = process.env.NODE_ENV === 'PRODUCTION';

    const options = {
        expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRES_TIME || 7) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        // localhost:5174 -> localhost:4002 is same-site, so 'lax' works in development.
        // A deployed frontend on another domain needs secure + sameSite 'none'.
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user
    })
}

module.exports = sendToken;
