const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; background:#f5f0e8; }
  .wrapper { max-width:520px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:#1a1410; padding:32px; text-align:center; }
  .header svg { display:block; margin:0 auto 12px; }
  .header h1 { color:#f5e6c8; font-size:20px; letter-spacing:2px; margin:0; }
  .header p { color:#c4843a; font-size:11px; letter-spacing:4px; margin-top:4px; }
  .body { padding:40px 36px; }
  .body h2 { color:#28251f; font-size:22px; margin-bottom:12px; }
  .body p { color:#5a5449; font-size:15px; line-height:1.7; margin-bottom:16px; }
  .otp-box { background:#fdf8f0; border:2px solid #c4843a; border-radius:12px; padding:24px; text-align:center; margin:24px 0; }
  .otp-code { font-family:monospace; font-size:42px; font-weight:bold; color:#1a1410; letter-spacing:12px; display:block; }
  .otp-note { color:#938d7c; font-size:13px; margin-top:8px; }
  .footer { background:#f5f0e8; padding:24px; text-align:center; color:#938d7c; font-size:12px; border-top:1px solid #e8e0d0; }
  .footer a { color:#c4843a; text-decoration:none; }
  .divider { height:1px; background:#e8e0d0; margin:20px 0; }
  .badge { display:inline-block; background:#c4843a; color:#fff; padding:4px 12px; border-radius:20px; font-size:12px; letter-spacing:1px; margin-bottom:16px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <svg width="60" height="60" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="96" fill="#1a1410"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c4843a" stroke-width="2.5"/>
      <circle cx="100" cy="100" r="87" fill="none" stroke="#c4843a" stroke-width="0.8" stroke-dasharray="4 3"/>
      <ellipse cx="100" cy="122" rx="28" ry="5" fill="#a86d2a"/>
      <path d="M81,92 Q79,122 87,122 Q100,126 113,122 Q121,122 119,92 Z" fill="#c4843a"/>
      <ellipse cx="100" cy="92" rx="19" ry="4" fill="#a86d2a"/>
      <path d="M119,102 Q136,102 136,110 Q136,120 119,118" fill="none" stroke="#c4843a" stroke-width="3" stroke-linecap="round"/>
      <path d="M91,88 Q88,80 91,72 Q94,64 91,58" fill="none" stroke="#e8c88a" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
      <path d="M100,87 Q103,78 100,68 Q97,58 100,50" fill="none" stroke="#e8c88a" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
      <path d="M109,88 Q112,80 109,72 Q106,64 109,60" fill="none" stroke="#e8c88a" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
    </svg>
    <h1>BREWED AWAKENING</h1>
    <p>CAFÉ &amp; COFFEE HOUSE</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Brewed Awakening · 42 Maple Street, Downtown</p>
    <p style="margin-top:6px"><a href="mailto:hello@brewedawakening.com">hello@brewedawakening.com</a></p>
    <p style="margin-top:10px;color:#b8b2a0">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>
</body>
</html>`;

async function sendOTPEmail(email, name, otp, type = 'email_verify') {
  const isReset = type === 'password_reset';
  const subject = isReset ? 'Reset Your Password — Brewed Awakening' : 'Verify Your Email — Brewed Awakening';
  const content = `
    <span class="badge">${isReset ? 'PASSWORD RESET' : 'EMAIL VERIFICATION'}</span>
    <h2>${isReset ? 'Reset your password' : 'Welcome, ' + (name || 'Coffee Lover') + '!'}</h2>
    <p>${isReset
      ? 'We received a request to reset your password. Use the code below to continue:'
      : 'Thank you for joining Brewed Awakening! To complete your registration, please verify your email address using the code below:'
    }</p>
    <div class="otp-box">
      <span class="otp-code">${otp}</span>
      <p class="otp-note">This code expires in <strong>10 minutes</strong></p>
    </div>
    <div class="divider"></div>
    <p style="font-size:13px;color:#938d7c">For your security, never share this code with anyone. Our team will never ask for it.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Brewed Awakening <noreply@brewedawakening.com>',
    to: email,
    subject,
    html: baseTemplate(content),
  });
}

async function sendWelcomeEmail(email, name) {
  const content = `
    <span class="badge">WELCOME</span>
    <h2>You're all set, ${name}! ☕</h2>
    <p>Your account has been verified and you're now part of the Brewed Awakening family. Here's what you can do:</p>
    <p>• Browse our full menu and place orders online<br/>
       • Book a table with just a few clicks<br/>
       • Earn loyalty points with every order<br/>
       • Track your orders in real-time</p>
    <div class="divider"></div>
    <p>We can't wait to serve you your perfect cup.</p>
    <p style="color:#c4843a;font-style:italic;">"Where every cup tells a story."</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Brewed Awakening <noreply@brewedawakening.com>',
    to: email,
    subject: 'Welcome to Brewed Awakening!',
    html: baseTemplate(content),
  });
}

module.exports = { sendOTPEmail, sendWelcomeEmail };
