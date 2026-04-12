import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { FeedbackFormEmail } from '@/components/emails/FeedbackFormEmail';
import { z } from 'zod';

const PLATFORM_ADMIN_EMAIL = 'hello@tourbots.ai';

const resend = new Resend(process.env.RESEND_API_KEY);

const feedbackSchema = z.object({
  category: z.string(),
  message: z.string().min(10, "Feedback must be at least 10 characters."),
  tourId: z.string().uuid(),
  userEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { category, message, tourId, userEmail } = parsed.data;

    const { data, error } = await resend.emails.send({
      from: 'Feedback Form <feedback@tourbots.ai>',
      to: [PLATFORM_ADMIN_EMAIL],
      subject: `New Feedback Received (${category})`,
      replyTo: userEmail,
      react: FeedbackFormEmail({
        userEmail,
        category,
        message,
        tourId,
      }),
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send feedback email.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Feedback submitted successfully!' });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 