// filepath: /HikeCast/HikeCast/src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, text, html) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { status: 'success', message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { status: 'error', message: error.message };
    }
};

module.exports = {
    sendEmail,
};