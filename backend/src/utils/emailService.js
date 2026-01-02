import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Check if SMTP is configured - if not, skip all emails
const SMTP_ENABLED = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

if (!SMTP_ENABLED) {
  console.log('⚠️ SMTP not fully configured. Emails will be disabled.');
}

const transporter = SMTP_ENABLED ? nodemailer.createTransport({
  service: 'gmail',
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 5000, // 5 second timeout (fail fast)
  greetingTimeout: 5000,
  socketTimeout: 5000,
}) : null;


export const sendWelcomeEmail = async (email, name, role) => {
  if (!SMTP_ENABLED || !transporter) {
    console.log(`[Email Skipped] Welcome email to ${email} - SMTP disabled`);
    return true;
  }

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
    console.error('Error sending welcome email:', error.message);
    return false;
  }
};




export const sendVerificationEmail = async (email, code) => {
  if (!SMTP_ENABLED || !transporter) {
    console.log(`[Email Skipped] Verification email to ${email} - SMTP disabled`);
    return true;
  }

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
    console.error('Error sending verification email:', error.message);
    return false;
  }
};

/**
 * Sends a Generic Email
 * Useful for notifications, alerts, etc.
 */
export const sendEmail = async (to, subject, html) => {
  if (!SMTP_ENABLED || !transporter) {
    console.log(`[Email Skipped] ${subject} to ${to} - SMTP disabled`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"RedGrid Notification" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Generic email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending generic email:', error.message);
    return false;
  }
};
