import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ContactFormEmail } from '@/components/emails/ContactFormEmail';
import { z } from 'zod';

const PLATFORM_ADMIN_EMAIL = 'hello@tourbots.ai';

const resend = new Resend(process.env.RESEND_API_KEY);

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  venueName: z.string().optional(),
  phone: z.string().optional(),
  helpTopic: z.string(),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { name, email, phone, message, venueName, helpTopic } = parsed.data;

    const { data, error } = await resend.emails.send({
      from: 'Contact Form <contact@tourbots.ai>',
      to: [PLATFORM_ADMIN_EMAIL],
      subject: `New Message from ${name} via TourBots.ai`,
      replyTo: email,
      react: ContactFormEmail({ name, email, phone, message, venueName, helpTopic }),
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully!', data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 