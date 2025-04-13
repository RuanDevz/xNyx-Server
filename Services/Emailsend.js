const nodemailer = require('nodemailer');

const sendConfirmationEmail = async (email) => {
  let transporter = nodemailer.createTransport({
    host: 'mail.xnyxleaks.com',
    port: 465,
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"xNyxleaks Premium" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to xNyxleaks Premium!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #ffffff; color: #1c1c1c; border-radius: 10px; border: 1px solid #e0e0e0;">
        <div style="text-align: center;">
          <h1 style="color: #2ecc71;">xNyxleaks Premium</h1>
          <p style="font-size: 18px; margin-top: 20px;">👑 Congratulations! Your Premium membership is now active.</p>
        </div>

        <div style="margin-top: 30px;">
          <p>Hey there,</p>
          <p>We're thrilled to welcome you as a VIP member of <strong>xNyxleaks</strong>. Your payment has been successfully processed, and your Premium access is now live!</p>

          <p>As a Premium member, you now enjoy:</p>
          <ul style="margin: 15px 0; padding-left: 20px; color: #1c1c1c;">
            <li>✅ Exclusive content access</li>
            <li>✅ Ad-free browsing</li>
            <li>✅ Priority support</li>
            <li>✅ Early access to new leaks & features</li>
          </ul>

          <p style="margin-top: 20px;">Dive in and enjoy the full experience — we’ve built it for users like you.</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="https://xnyxleaks.com" style="display: inline-block; padding: 12px 25px; background-color: #2ecc71; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </div>

        <div style="margin-top: 40px;">
          <h3 style="color: #2ecc71;">💬 Get Your Premium Role on Discord</h3>
          <p>Join our official community and request your Premium role directly with our team.</p>
          <p style="text-align: center; margin-top: 10px;">
            <a href="https://discord.com/invite/SAPZmTTeuN" style="color: #2ecc71; text-decoration: underline; font-weight: bold;">Join our Discord</a>
          </p>
        </div>

        <div style="margin-top: 40px; font-size: 14px; color: #777; text-align: center;">
          <p>Thank you for being part of the xNyxleaks community.</p>
          <p>&copy; ${new Date().getFullYear()} xNyxleaks. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendConfirmationEmail;
