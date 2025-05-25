const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendAlertEmail(subject, message) {
  const mailOptions = {
    from: `"Alerta de Segurança" <${process.env.ALERT_EMAIL_FROM}>`,
    to: process.env.ALERT_EMAIL_TO,
    subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('⚠️ Alerta de segurança enviado por e-mail.');
  } catch (error) {
    console.error('Erro ao enviar e-mail de alerta:', error);
  }
}

module.exports = sendAlertEmail;
