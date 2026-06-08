const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }

  // For production or configured SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  verifyEmail: (name, verificationUrl, otp) => ({
    subject: 'Verify Your Email - CodeInsight AI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo h1 { color: #0ea5e9; margin: 0; font-size: 28px; }
          .content { color: #e2e8f0; }
          .content h2 { color: #ffffff; margin-top: 0; }
          .content p { line-height: 1.6; margin: 16px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
          .button:hover { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); }
          .otp-box { background: #334155; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px; margin: 0; }
          .divider { text-align: center; color: #64748b; margin: 30px 0; font-size: 14px; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .footer a { color: #0ea5e9; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <h1>⟨/⟩ CodeInsight AI</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${name}! 👋</h2>
              <p>Thank you for signing up for CodeInsight AI. To complete your registration and start analyzing code with AI, please verify your email address.</p>
              ${otp ? `
              <p style="text-align: center; font-weight: 600;">Enter this verification code:</p>
              <div class="otp-box">
                <p class="otp-code">${otp}</p>
              </div>
              <p style="text-align: center; color: #64748b; font-size: 14px;">This code expires in <strong>10 minutes</strong></p>
              <div class="divider">— OR —</div>
              ` : ''}
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #0ea5e9; font-size: 14px;">${verificationUrl}</p>
              <p>This link will expire in <strong>24 hours</strong>.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CodeInsight AI. All rights reserved.</p>
              <p><a href="${process.env.FRONTEND_URL}">Visit our website</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to CodeInsight AI, ${name}!\n\n${otp ? `Your verification code is: ${otp}\nThis code expires in 10 minutes.\n\nOR\n\n` : ''}Verify your email by visiting: ${verificationUrl}\n\nThis link expires in 24 hours.`,
  }),

  passwordChangeOTP: (name, otp) => ({
    subject: 'Password Change OTP - CodeInsight AI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo h1 { color: #0ea5e9; margin: 0; font-size: 28px; }
          .content { color: #e2e8f0; }
          .content h2 { color: #ffffff; margin-top: 0; }
          .content p { line-height: 1.6; margin: 16px 0; }
          .otp-box { background: #334155; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px; margin: 0; }
          .warning { background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .warning p { color: #fbbf24; margin: 0; font-size: 14px; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <h1>⟨/⟩ CodeInsight AI</h1>
            </div>
            <div class="content">
              <h2>Password Change Request 🔐</h2>
              <p>Hi ${name},</p>
              <p>You've requested to change your password. Use the OTP below to verify your identity:</p>
              <div class="otp-box">
                <p class="otp-code">${otp}</p>
              </div>
              <p>This OTP will expire in <strong>10 minutes</strong>.</p>
              <div class="warning">
                <p>⚠️ If you didn't request this password change, please secure your account immediately by changing your password.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CodeInsight AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name},\n\nYour password change OTP is: ${otp}\n\nThis OTP expires in 10 minutes.\n\nIf you didn't request this, please secure your account.`,
  }),

  emailVerified: (name) => ({
    subject: 'Email Verified Successfully - CodeInsight AI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo h1 { color: #0ea5e9; margin: 0; font-size: 28px; }
          .content { color: #e2e8f0; text-align: center; }
          .content h2 { color: #ffffff; margin-top: 0; }
          .success-icon { font-size: 64px; margin: 20px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <h1>⟨/⟩ CodeInsight AI</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <h2>Email Verified!</h2>
              <p>Congratulations ${name}! Your email has been successfully verified.</p>
              <p>You now have full access to CodeInsight AI. Start analyzing your code with AI-powered insights!</p>
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CodeInsight AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Congratulations ${name}! Your email has been verified. Visit ${process.env.FRONTEND_URL}/dashboard to get started.`,
  }),

  passwordReset: (name, resetUrl) => ({
    subject: 'Reset Your Password - CodeInsight AI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo h1 { color: #0ea5e9; margin: 0; font-size: 28px; }
          .content { color: #e2e8f0; }
          .content h2 { color: #ffffff; margin-top: 0; }
          .content p { line-height: 1.6; margin: 16px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
          .warning { background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .warning p { color: #fbbf24; margin: 0; font-size: 14px; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .footer a { color: #0ea5e9; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <h1>⟨/⟩ CodeInsight AI</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password 🔑</h2>
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #0ea5e9; font-size: 14px;">${resetUrl}</p>
              <p>This link will expire in <strong>10 minutes</strong>.</p>
              <div class="warning">
                <p>⚠️ If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CodeInsight AI. All rights reserved.</p>
              <p><a href="${process.env.FRONTEND_URL}">Visit our website</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name},\n\nWe received a request to reset your password. Visit this link to reset: ${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
  }),
};

// Send email function
const sendEmail = async (to, templateName, templateData) => {
  try {
    const transporter = createTransporter();
    
    let template;
    switch (templateName) {
      case 'verifyEmail':
        template = emailTemplates.verifyEmail(templateData.name, templateData.verificationUrl);
        break;
      case 'passwordChangeOTP':
        template = emailTemplates.passwordChangeOTP(templateData.name, templateData.otp);
        break;
      case 'emailVerified':
        template = emailTemplates.emailVerified(templateData.name);
        break;
      case 'passwordReset':
        template = emailTemplates.passwordReset(templateData.name, templateData.resetUrl);
        break;
      default:
        throw new Error(`Unknown email template: ${templateName}`);
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'CodeInsight AI <noreply@codeinsight.ai>',
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // For development with ethereal, log preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    // Don't throw in development to allow testing without email
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Email would have been sent to', to);
      return { success: true, development: true };
    }
    throw error;
  }
};

module.exports = {
  sendEmail,
  emailTemplates,
};
