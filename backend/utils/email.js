const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email function
const sendEmail = async ({ to, subject, html }) => {
  try {
    // Skip if email is not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Email not configured. Skipping email to:', to);
      console.log('Subject:', subject);
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Return & Exchange System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    // Don't throw error, just log it
  }
};

module.exports = { sendEmail };

