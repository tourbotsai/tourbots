import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { TourBookingEmail } from '@/components/emails/TourBookingEmail';
import { z } from 'zod';

const PLATFORM_ADMIN_EMAIL = 'hello@tourbots.ai';

const resend = new Resend(process.env.RESEND_API_KEY);

const tourBookingSchema = z.object({
  venueName: z.string().min(1, "Venue name is required."),
  preferred_date: z.string().min(1, "Preferred date is required."),
  preferred_time: z.string().min(1, "Preferred time is required."),
  contact_phone: z.string().min(1, "Phone number is required."),
  additional_notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = tourBookingSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { venueName, preferred_date, preferred_time, contact_phone, additional_notes } = parsed.data;

    const { data, error } = await resend.emails.send({
      from: 'Tour Booking <bookings@tourbots.ai>',
      to: [PLATFORM_ADMIN_EMAIL],
      subject: `New Tour Booking Request from ${venueName}`,
      react: TourBookingEmail({ 
        venueName, 
        preferred_date, 
        preferred_time, 
        contact_phone, 
        additional_notes 
      }),
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send booking request.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tour booking request sent successfully!', data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 