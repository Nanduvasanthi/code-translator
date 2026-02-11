import nodemailer from 'nodemailer';

const sendPasswordResetEmail = async (email, resetUrl, name = 'User') => {
  console.log(`\n📧 ===== PASSWORD RESET EMAIL =====`);
  console.log(`To: ${email}`);
  console.log(`Reset URL: ${resetUrl.substring(0, 50)}...`);
  
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    console.log(`Checking .env: EMAIL_USER = ${emailUser ? 'SET' : 'NOT SET'}`);
    console.log(`Checking .env: EMAIL_PASSWORD = ${emailPassword ? 'SET' : 'NOT SET'}`);
    
    if (!emailUser || !emailPassword) {
      console.log(`❌ No email credentials. Running in DEV mode.`);
      console.log(`🔑 Reset URL for ${email}: ${resetUrl}`);
      console.log(`📧 ===== END =====\n`);
      return true;
    }
    
    console.log(`✅ Credentials found! Sending real email...`);
    
    // Use same configuration as your OTP emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Test connection first
    console.log(`🔐 Testing email connection...`);
    await transporter.verify();
    console.log(`✅ Email connection successful!`);
    
    const mailOptions = {
      from: `"Code Translator" <${emailUser}>`,
      to: email,
      subject: '🔐 Reset Your Password - Code Translator',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 20px;
              text-align: center;
              color: white;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin: 25px 0;
              text-align: center;
            }
            .warning {
              background-color: #fff8e1;
              border-left: 4px solid #ffb300;
              padding: 16px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .url-box {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 6px;
              font-family: monospace;
              word-break: break-all;
              margin: 20px 0;
              font-size: 14px;
              border: 1px solid #e0e0e0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🔐 Password Reset</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Code Translator Account Security</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-bottom: 10px;">Hello ${name},</h2>
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password for your Code Translator account. 
                Click the button below to create a new password:
              </p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button" style="color: white; text-decoration: none;">
                  Reset Your Password
                </a>
              </div>
              
              <div class="warning">
                <p style="margin: 0; color: #5d4037;">
                  <strong>⚠️ Important Security Notice:</strong><br>
                  This password reset link will expire in <strong>1 hour</strong> for security reasons.<br>
                  If you didn't request this password reset, please ignore this email.
                </p>
              </div>
              
              <p style="color: #555; margin: 20px 0 10px 0;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <div class="url-box">${resetUrl}</div>
              
              <p style="color: #555; line-height: 1.6; margin-top: 30px;">
                <strong>Need help?</strong> If you're having trouble resetting your password, 
                please contact our support team or reply to this email.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 5px 0;">This is an automated message from Code Translator.</p>
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} Code Translator. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    console.log(`📤 Sending password reset email to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully! Message ID: ${info.messageId}`);
    console.log(`📧 ===== END =====\n`);
    return true;
    
  } catch (error) {
    console.error(`❌ Password reset email failed: ${error.message}`);
    console.error(`❌ Error code: ${error.code}`);
    console.log(`🔑 Manual reset URL for ${email}: ${resetUrl}`);
    
    // Try alternative configuration (same as your OTP service)
    console.log(`🔄 Trying alternative email configuration...`);
    try {
      const transporter2 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });
      
      const info2 = await transporter2.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Password - Code Translator',
        text: `Click this link to reset your password: ${resetUrl}`
      });
      
      console.log(`✅ Email sent with alternative config!`);
      return true;
    } catch (error2) {
      console.error(`❌ Alternative also failed: ${error2.message}`);
      console.log(`🔑 Manual reset URL: ${resetUrl}`);
    }
    
    console.log(`📧 ===== END =====\n`);
    return true;
  }
};

export { sendPasswordResetEmail };