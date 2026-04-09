const nodemailer = require('nodemailer');
const { mail, appUrl } = require('../config/env');

const transporter = nodemailer.createTransport({
  host: mail.host,
  port: mail.port,
  secure: mail.port === 465,
  auth: {
    user: mail.user,
    pass: mail.pass,
  }
});

const sendResetPasswordEmail = async ({ toEmail, fullName, token }) => {
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Karatedo Support" <${mail.user}>`,
    to: toEmail,
    subject: 'Đặt lại mật khẩu — CMS Karatedo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B3A5C;">Tài khoản Karatedo: Yêu cầu đặt lại mật khẩu</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Click vào nút bên dưới để đặt lại mật khẩu:</p>
        <a href="${resetUrl}"
           style="display:inline-block; padding:12px 24px; background:#C0392B;
                  color:#fff; text-decoration:none; border-radius:4px;
                  font-weight:bold; margin: 16px 0;">
          Đặt lại mật khẩu
        </a>
        <p style="color:#666; font-size:13px; text-transform:uppercase"> 
          Nếu bạn không yêu cầu, hãy bỏ qua email này.
        </p>
        <p style="color:#666; font-size:13px;"> 
          Trân trọng,<br/>
          CMS Karatedo
        </p>
        <hr style="border:none; border-top:1px solid #eee;" />
        <p style="color:#999; font-size:12px;">CMS Karatedo — ${appUrl}</p>
      </div>
    `
  });
};

module.exports = { sendResetPasswordEmail };