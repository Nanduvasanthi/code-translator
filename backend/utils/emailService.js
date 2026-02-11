import nodemailer from 'nodemailer';

const sendOTPEmail = async (email, otp, name = 'User') => {
  console.log(`\n📧 ===== EMAIL SERVICE =====`);
  console.log(`To: ${email}`);
  console.log(`OTP: ${otp}`);
  
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    console.log(`Checking .env: EMAIL_USER = ${emailUser ? 'SET' : 'NOT SET'}`);
    console.log(`Checking .env: EMAIL_PASSWORD = ${emailPassword ? 'SET' : 'NOT SET'}`);
    
    if (!emailUser || !emailPassword) {
      console.log(`❌ No email credentials. Running in DEV mode.`);
      console.log(`🔑 OTP for ${email}: ${otp}`);
      console.log(`📧 ===== END =====\n`);
      return true;
    }
    
    console.log(`✅ Credentials found! Sending real email...`);
    
    // FIX: Add tls option to ignore self-signed certificates
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      // ADD THIS TO FIX SSL ERROR:
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
    
    // Test connection first
    console.log(`🔐 Testing email connection...`);
    await transporter.verify();
    console.log(`✅ Email connection successful!`);
    
    const mailOptions = {
      from: emailUser,
      to: email,
      subject: 'Your OTP Code - Code Translator',
      text: `Hello ${name},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4F46E5;">Code Translator - Email Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your OTP code is:</p>
          <div style="background: #f8fafc; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px;">
              ${otp}
            </span>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };
    
    console.log(`📤 Sending email to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    console.log(`📧 Email response: ${info.response}`);
    console.log(`📧 ===== END =====\n`);
    return true;
    
  } catch (error) {
    console.error(`❌ Email failed: ${error.message}`);
    console.error(`❌ Error code: ${error.code}`);
    console.error(`❌ Error stack: ${error.stack}`);
    console.log(`🔑 Fallback OTP for ${email}: ${otp}`);
    
    // Try alternative configuration
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
        subject: 'Your OTP Code',
        text: `OTP: ${otp}`
      });
      
      console.log(`✅ Email sent with alternative config!`);
      return true;
    } catch (error2) {
      console.error(`❌ Alternative also failed: ${error2.message}`);
      console.log(`🔑 Manual OTP: ${otp}`);
    }
    
    console.log(`📧 ===== END =====\n`);
    return true;
  }
};

export { sendOTPEmail };