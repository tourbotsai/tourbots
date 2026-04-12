import { NextRequest, NextResponse } from 'next/server';
import { createEbookLead, incrementEbookDownloads } from '@/lib/services/ebook-service';
import { EbookLeadCreateData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const leadData: EbookLeadCreateData = await request.json();

    // Validate required fields
    if (!leadData.ebook_id || !leadData.contact_name || !leadData.venue_name || !leadData.email) {
      return NextResponse.json(
        { success: false, error: 'Ebook ID, contact name, venue name, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate contact name and venue name length
    if (leadData.contact_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Contact name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (leadData.venue_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Venue name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (leadData.phone && leadData.phone.trim().length > 0) {
      // Clean phone number for validation (remove spaces, dashes, parentheses)
      const cleanPhone = leadData.phone.replace(/[\s\-\(\)]/g, '');
      
      // UK phone number validation: mobile (07xxxxxxxxx), landline (01xxxxxxxxx, 02xxxxxxxx), 
      // or international format (+447xxxxxxxxx, +441xxxxxxxxx, +442xxxxxxxx)
      const ukPhoneRegex = /^(\+44[1-9]\d{8,9}|0[1-9]\d{8,9})$/;
      
      if (!ukPhoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { success: false, error: 'Please provide a valid phone number' },
          { status: 400 }
        );
      }
    }

    // Create the lead
    const lead = await createEbookLead({
      ebook_id: leadData.ebook_id,
      contact_name: leadData.contact_name.trim(),
      venue_name: leadData.venue_name.trim(),
      email: leadData.email.toLowerCase().trim(),
      phone: leadData.phone?.trim() || undefined,
    });

    // Increment download count in the background
    incrementEbookDownloads(leadData.ebook_id).catch(err => {
      console.warn('Failed to increment ebook downloads:', err);
    });

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        contact_name: lead.contact_name,
        venue_name: lead.venue_name,
        email: lead.email,
        created_at: lead.created_at,
      },
      message: 'Lead captured successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ebook lead:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to capture lead' },
      { status: 500 }
    );
  }
} 