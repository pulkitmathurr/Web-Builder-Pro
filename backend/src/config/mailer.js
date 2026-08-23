const nodemailer = require('nodemailer');

// ── Gmail SMTP ────────────────────────────────────────
// Requires a Gmail App Password (Google Account → Security → 2-Step
// Verification → App Passwords), not the regular account password.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const sendMail = async ({ to, subject, html }) => {
    await transporter.sendMail({
        from: `"Web Builder Pro" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
    });
};

module.exports = { sendMail };
