import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send welcome email to new users
 * إرسال إيميل ترحيب للمستخدمين الجدد
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  try {
    await resend.emails.send({
      from: 'CRM System <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to CRM System! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CRM! 🚀</h1>
            </div>
            <div style="background-color: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="color: #374151; font-size: 18px; margin-bottom: 20px;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Thank you for signing up for our CRM system! We're excited to have you on board.
              </p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                With our CRM, you can:
              </p>
              <ul style="color: #6b7280; font-size: 16px; line-height: 2; margin-bottom: 30px; padding-left: 20px;">
                <li>📊 Track all your customers in one place</li>
                <li>💼 Manage your sales pipeline effectively</li>
                <li>✅ Never miss a follow-up with task management</li>
                <li>📈 Get insights into your sales performance</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Go to Dashboard →
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                If you have any questions, feel free to reply to this email.
              </p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              © 2026 CRM System. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✉️ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw - email sending should not block registration
  }
};

/**
 * Send notification email
 */
export const sendNotificationEmail = async (
  email: string,
  subject: string,
  message: string
): Promise<void> => {
  try {
    await resend.emails.send({
      from: 'CRM System <notifications@resend.dev>',
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">${subject}</h2>
          <p style="color: #374151; line-height: 1.6;">${message}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">CRM System Notification</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
};

/**
 * Send a custom email (for email templates)
 * إرسال إيميل مخصص
 */
export const sendEmail = async (
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await resend.emails.send({
      from: 'CRM System <mail@resend.dev>',
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              ${body}
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              Sent via CRM System
            </p>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✉️ Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: String(error) };
  }
};

export default resend;

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetUrl: string
): Promise<void> => {
  try {
    await resend.emails.send({
      from: 'CRM System <security@resend.dev>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset 🔒</h1>
            </div>
            <div style="background-color: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="color: #374151; font-size: 18px; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password. Click the button below to set a new password.
              </p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                This link will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Reset Password →
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`🔒 Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
};

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (
  email: string,
  name: string,
  verifyUrl: string
): Promise<void> => {
  try {
    await resend.emails.send({
      from: 'CRM System <verify@resend.dev>',
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email ✉️</h1>
            </div>
            <div style="background-color: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="color: #374151; font-size: 18px; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Please verify your email address to get full access to all CRM features.
              </p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                This link will expire in <strong>24 hours</strong>.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Verify Email →
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                If the button doesn't work, copy and paste this URL:<br>
                <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✉️ Verification email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
};