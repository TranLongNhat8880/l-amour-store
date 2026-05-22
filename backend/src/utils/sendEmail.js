const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
    // Basic setup for development (usually use an actual SMTP provider)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL || 'test@gmail.com',
            pass: process.env.SMTP_PASSWORD || 'password'
        }
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Fashion Ecommerce'} <${process.env.FROM_EMAIL || 'test@gmail.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
