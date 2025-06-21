const nodemailer = require('nodemailer');

// Configuração do transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'mail.xnyxleaks.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });
};

// Email de confirmação Premium (existente)
const sendConfirmationEmail = async (email) => {
  let transporter = createTransport();

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

          <p style="margin-top: 20px;">Dive in and enjoy the full experience — we've built it for users like you.</p>
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

// Email de aprovação de request
const sendRequestApprovedEmail = async (email, requestTitle) => {
  let transporter = createTransporter();

  const mailOptions = {
    from: `"xNyxleaks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Your Content Request Has Been Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #ffffff; color: #1c1c1c; border-radius: 10px; border: 1px solid #e0e0e0;">
        <div style="text-align: center;">
          <h1 style="color: #2ecc71;">xNyxleaks</h1>
          <div style="background-color: #2ecc71; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0; font-size: 24px;">🎉 Request Approved!</h2>
          </div>
        </div>

        <div style="margin-top: 30px;">
          <p>Hello,</p>
          <p>Great news! Your content request has been <strong>approved</strong> and is now live on our website.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2ecc71;">
            <h3 style="margin-top: 0; color: #2ecc71;">Approved Content:</h3>
            <p style="font-weight: bold; margin: 0;">"${requestTitle}"</p>
          </div>

          <p>Thank you for contributing to our community! Your suggestion helps us provide better content for all our users.</p>
          
          <p>You can now find this content on our website. Feel free to submit more requests anytime!</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="https://xnyxleaks.com" style="display: inline-block; padding: 12px 25px; background-color: #2ecc71; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Website</a>
        </div>

        <div style="margin-top: 40px;">
          <h3 style="color: #2ecc71;">💬 Join Our Community</h3>
          <p>Connect with other users and stay updated with the latest content on our Discord server.</p>
          <p style="text-align: center; margin-top: 10px;">
            <a href="https://discord.com/invite/SAPZmTTeuN" style="color: #2ecc71; text-decoration: underline; font-weight: bold;">Join Discord</a>
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

// Email de resolução de report
const sendReportResolvedEmail = async (email, contentTitle, reportReason, contentSlug, contentType) => {
  let transporter = createTransporter();

  // Construir URL do conteúdo
  const contentUrl = `https://xnyxleaks.com/content/${contentType}/${contentSlug}`;

  const mailOptions = {
    from: `"xNyxleaks Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔧 Your Report Has Been Resolved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #ffffff; color: #1c1c1c; border-radius: 10px; border: 1px solid #e0e0e0;">
        <div style="text-align: center;">
          <h1 style="color: #2ecc71;">xNyxleaks Support</h1>
          <div style="background-color: #2ecc71; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0; font-size: 24px;">🔧 Issue Resolved!</h2>
          </div>
        </div>

        <div style="margin-top: 30px;">
          <p>Hello,</p>
          <p>Thank you for reporting an issue with our content. We're pleased to inform you that your report has been <strong>resolved</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2ecc71;">
            <h3 style="margin-top: 0; color: #2ecc71;">Report Details:</h3>
            <p><strong>Content:</strong> "${contentTitle}"</p>
            <p><strong>Issue:</strong> ${reportReason}</p>
            <p><strong>Status:</strong> <span style="color: #2ecc71; font-weight: bold;">✅ Resolved</span></p>
          </div>

          <p>Our team has investigated and fixed the issue you reported. The content should now be working properly.</p>
          
          <p>We appreciate your help in maintaining the quality of our platform. If you encounter any other issues, please don't hesitate to report them.</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${contentUrl}" style="display: inline-block; padding: 12px 25px; background-color: #2ecc71; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Content</a>
        </div>

        <div style="margin-top: 40px;">
          <h3 style="color: #2ecc71;">💬 Need More Help?</h3>
          <p>If you're still experiencing issues or have questions, feel free to reach out to our support team on Discord.</p>
          <p style="text-align: center; margin-top: 10px;">
            <a href="https://discord.com/invite/SAPZmTTeuN" style="color: #2ecc71; text-decoration: underline; font-weight: bold;">Contact Support</a>
          </p>
        </div>

        <div style="margin-top: 40px; font-size: 14px; color: #777; text-align: center;">
          <p>Thank you for helping us improve xNyxleaks.</p>
          <p>&copy; ${new Date().getFullYear()} xNyxleaks. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Exportar todas as funções
module.exports = {
  sendConfirmationEmail,
  sendRequestApprovedEmail,
  sendReportResolvedEmail
};