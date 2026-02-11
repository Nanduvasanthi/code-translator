import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
  try {
    console.log('📧 [Email] Attempting to send email...');
    console.log('📧 [Email] From:', process.env.EMAIL_USER);
    console.log('📧 [Email] To:', options.to);
    console.log('📧 [Email] Subject:', options.subject);
    
    // Create transporter with detailed logging
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true, // Enable SMTP protocol debug output
      logger: true, // Log to console
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    console.log('📧 [Email] Verifying SMTP connection...');
    await transporter.verify();
    console.log('📧 [Email] SMTP connection verified successfully');

    // Send mail
    console.log('📧 [Email] Sending email...');
    const info = await transporter.sendMail({
      from: `"CodeTranslator" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('✅ Email sent successfully!');
    console.log('📧 [Email] Message ID:', info.messageId);
    console.log('📧 [Email] Response:', info.response);
    
    return info;
    
  } catch (error) {
    console.error('❌ Email sending failed!');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Common error solutions
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Possible solution for EAUTH error:');
      console.log('1. Make sure you\'re using App Password, not regular password');
      console.log('2. Check if 2-Step Verification is enabled');
      console.log('3. Verify the App Password was generated for "Mail"');
      console.log('4. Try generating a new App Password');
    } else if (error.code === 'EENVELOPE') {
      console.log('\n🔧 Possible solution for EENVELOPE error:');
      console.log('1. Check the "to" email address format');
      console.log('2. Ensure the email address exists');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Possible solution for ECONNECTION error:');
      console.log('1. Check your internet connection');
      console.log('2. Try port 465 with secure: true');
      console.log('3. Check if your network blocks SMTP');
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export { sendEmail };