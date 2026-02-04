import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ') || 'User';

    if (email) {
      try {
        // Send welcome email
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
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
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
      }
    }
  }

  return new Response('Webhook received', { status: 200 });
}
