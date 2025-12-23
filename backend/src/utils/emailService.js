import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Create the Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

// 2. Define Email Templates

/**
 * Sends a Welcome Email to new users
 */
export const sendWelcomeEmail = async (email, name, role) => {
  try {
    const subject = 'Welcome to RedGrid - Connected for Life';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Welcome to RedGrid, ${name}!</h2>
        <p>We are thrilled to have you join our community as a <strong>${role}</strong>.</p>
        <p>RedGrid connects donors, hospitals, and organizations to save lives efficiently.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Next Steps:</strong></p>
          <ul style="margin-top: 10px;">
            <li>Complete your profile in the Dashboard</li>
            ${role === 'donor' ? '<li>Check for nearby donation camps</li>' : ''}
            ${role === 'hospital' ? '<li>Update your blood inventory status</li>' : ''}
            ${role === 'organization' ? '<li>Schedule your first donation drive</li>' : ''}
          </ul>
        </div>
        
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best regards,<br/>The RedGrid Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"RedGrid Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Sends a Verification Code (Optional)
 */
export const sendVerificationEmail = async (email, code) => {
  try {
    const subject = 'Your RedGrid Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center;">
        <h2 style="color: #333;">Verification Required</h2>
        <p>Please use the following code to verify your action:</p>
        <div style="font-size: 24px; font-weight: bold; color: #dc2626; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"RedGrid Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};