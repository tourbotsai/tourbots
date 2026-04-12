import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { DemoRequestEmail } from '@/components/emails/DemoRequestEmail';
import { z } from 'zod';

const PLATFORM_ADMIN_EMAIL = 'hello@tourbots.ai';

const resend = new Resend(process.env.RESEND_API_KEY);

const demoFormSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().optional(),
  venueName: z.string().min(2, "Company or agency name is required."),
  currentWebsite: z.string().optional(),
  preferredTime: z.string().min(2, "A preferred time is required."),
  timezone: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = demoFormSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { 
      name, email, phone, venueName, currentWebsite, 
      preferredTime, timezone, additionalInfo 
    } = parsed.data;

    const { data, error } = await resend.emails.send({
      from: 'Demo Request <demo@tourbots.ai>',
      to: [PLATFORM_ADMIN_EMAIL],
      subject: `New Demo Request from ${name} (${venueName})`,
      replyTo: email,
      react: DemoRequestEmail({ 
        name, email, phone, venueName, currentWebsite, 
        preferredTime, timezone, additionalInfo 
      }),
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Demo request sent successfully!', data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 