const nodemailer = require('nodemailer');

// options: { email, subject, message (plain text), html (optional), attachments (optional) }
const sendEmail = async options => {
    const missing = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD']
    .filter(k => !process.env[k] || !process.env[k].trim())
if (missing.length) throw new Error(`Empty in config/.env: ${missing.join(', ')}`)
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `<p>${options.message}</p>`,
        attachments: options.attachments
    }

    await transporter.sendMail(message)
}

module.exports = sendEmail;
