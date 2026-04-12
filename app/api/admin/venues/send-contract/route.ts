import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateContractPDF } from '@/lib/contracts/venue-contract-generator';
import { ContractData } from '@/lib/contracts/venue-contract-terms';
import { ContractEmail } from '@/components/emails/ContractEmail';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

const PLATFORM_ADMIN_EMAIL = 'hello@tourbots.ai';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    
    const {
      venueName,
      venueAddress,
      ownerName,
      ownerEmail,
      password,
      planName,
      monthlyPrice,
      billingCycle,
      trialPeriodDays,
    } = body;

    // Validate required fields
    if (!venueName || !venueAddress || !ownerName || !ownerEmail || !password || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields for contract generation' },
        { status: 400 }
      );
    }

    // Prepare contract data
    const contractData: ContractData = {
      venueName,
      venueAddress,
      ownerName,
      ownerEmail,
      planName,
      monthlyPrice: monthlyPrice || (planName === 'professional' ? 99.99 : 79.99),
      billingCycle: billingCycle || 'monthly',
      trialPeriodDays,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
    };

    // Generate PDF
    console.log('Generating contract PDF for', venueName);
    const pdfBuffer = await generateContractPDF(contractData);

    // Send email with attachment
    const { data, error } = await resend.emails.send({
      from: 'TourBots AI <contracts@tourbots.ai>',
      to: [ownerEmail, PLATFORM_ADMIN_EMAIL],
      subject: `Service Agreement - ${venueName}`,
      react: ContractEmail({
        venueName,
        ownerName,
        ownerEmail,
        password,
        planName,
      }),
      attachments: [{
        filename: `TourBots_ServiceAgreement_${venueName.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
      }],
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json(
        { error: 'Failed to send contract email' },
        { status: 500 }
      );
    }

    console.log(`Contract sent successfully to ${ownerEmail} for ${venueName}`);

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: `Contract sent to ${ownerEmail}`,
    });
  } catch (error: any) {
    console.error('Error sending contract:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send contract' },
      { status: 500 }
    );
  }
}
