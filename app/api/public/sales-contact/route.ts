import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { SalesContactEmail } from '@/components/emails/SalesContactEmail';
import { z } from 'zod';

const PLATFORM_ADMIN_EMAIL = 'hello@tourbots.ai';

const resend = new Resend(process.env.RESEND_API_KEY);

const salesContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  venueName: z.string().min(2, "Venue name is required"),
  planType: z.enum(["essential", "professional"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = salesContactSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { name, email, phone, venueName, planType, message } = parsed.data;

    const { data, error } = await resend.emails.send({
      from: 'Sales Enquiry <sales@tourbots.ai>',
      to: [PLATFORM_ADMIN_EMAIL],
      subject: `New Sales Enquiry: ${planType === 'essential' ? 'AI Essentials' : 'All-in-One'} from ${name} (${venueName})`,
      replyTo: email,
      react: SalesContactEmail({ 
        name, 
        email, 
        phone, 
        venueName, 
        planType, 
        message 
      }),
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Sales enquiry sent successfully!', data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 