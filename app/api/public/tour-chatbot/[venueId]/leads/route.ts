import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { submitLeadWithRateLimit } from '@/lib/lead-submit-rate-limiter';
import { resolveLeadFormPrivacyUrl } from '@/lib/chatbot-lead-form-service';
import { LeadCaptureEmail } from '@/components/emails/LeadCaptureEmail';
import { ChatbotLeadFormField } from '@/lib/types';
import { emitChatbotEventWebhook } from '@/lib/chatbot-webhook-dispatch';
import {
  verifyPublicEmbedRequest,
} from '@/lib/public-embed-token';
import { getClientIp } from '@/lib/request-client-ip';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const LEAD_FROM =
  process.env.LEAD_NOTIFICATION_FROM_EMAIL || 'TourBots Leads <alerts@tourbots.ai>';

const submitSchema = z.object({
  chatbotConfigId: z.string().uuid(),
  leadFormId: z.string().uuid(),
  conversationId: z.string().uuid().optional().nullable(),
  sessionId: z.string().min(1).optional().nullable(),
  embedId: z.string().optional().nullable(),
  embedToken: z.string().optional().nullable(),
  values: z.record(z.string()),
  consent: z.literal(true),
  pageUrl: z.string().url().max(2_048).optional().nullable(),
  domain: z.string().max(255).optional().nullable(),
});

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await context.params;
    if (!venueId) {
      return NextResponse.json({ error: 'venueId is required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid input: ${parsed.error.errors.map((e) => e.message).join(', ')}` },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const clientIP = getClientIp(request);
    const resolvedEmbedId = data.embedId || `tour-widget-${venueId}`;

    if (!verifyPublicEmbedRequest({
      request,
      token: data.embedToken,
      venueId,
      embedId: resolvedEmbedId,
    })) {
      return NextResponse.json({ error: 'Invalid or missing embed token' }, { status: 403 });
    }

    const { data: form, error: formError } = await supabase
      .from('chatbot_lead_forms')
      .select('*')
      .eq('id', data.leadFormId)
      .eq('chatbot_config_id', data.chatbotConfigId)
      .eq('venue_id', venueId)
      .eq('is_enabled', true)
      .maybeSingle();

    if (formError || !form) {
      return NextResponse.json({ error: 'Lead form not found or disabled' }, { status: 404 });
    }

    const { data: fields, error: fieldsError } = await supabase
      .from('chatbot_lead_form_fields')
      .select('*')
      .eq('lead_form_id', form.id)
      .order('display_order', { ascending: true });

    if (fieldsError) {
      throw new Error(fieldsError.message);
    }

    const typedFields = (fields || []) as ChatbotLeadFormField[];
    const values: Record<string, string> = {};

    for (const field of typedFields) {
      const raw = (data.values[field.field_key] || '').trim();
      if (field.is_required && !raw) {
        return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
      }
      if (!raw) continue;

      if (field.field_type === 'email' && !isValidEmail(raw)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
      }
      if (field.field_type === 'select') {
        const allowed = (field.options || []).map((option) => option.value);
        if (!allowed.includes(raw)) {
          return NextResponse.json({ error: `Invalid value for ${field.label}` }, { status: 400 });
        }
      }
      values[field.field_key] = raw;
    }

    const privacyUrl = resolveLeadFormPrivacyUrl(form);
    const consentedAt = new Date().toISOString();

    const submission = await submitLeadWithRateLimit({
      venueId,
      ipAddress: clientIP,
      lead: {
        chatbot_config_id: data.chatbotConfigId,
        lead_form_id: form.id,
        conversation_id: data.conversationId || null,
        session_id: data.sessionId || null,
        visitor_name: values.name || null,
        visitor_email: values.email || null,
        visitor_phone: values.phone || null,
        field_values: values,
        consent_text: form.consent_checkbox_label,
        consent_privacy_url: privacyUrl,
        consented_at: consentedAt,
        page_url: data.pageUrl || null,
        domain: data.domain || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    });
    if (!submission.accepted || !submission.leadId) {
      return NextResponse.json(
        { error: submission.message || 'Lead submission rejected' },
        { status: submission.duplicate ? 409 : 429 }
      );
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', submission.leadId)
      .single();
    if (leadError || !lead) throw new Error(leadError?.message || 'Failed to load saved lead');

    if (form.email_notifications_enabled && resend) {
      try {
        const { data: venue } = await supabase
          .from('venues')
          .select('name, email')
          .eq('id', venueId)
          .maybeSingle();

        const toAddress = (form.notification_email || venue?.email || '').trim();
        if (toAddress) {
          let tourName: string | null = null;
          if (lead.tour_id) {
            const { data: tour } = await supabase
              .from('tours')
              .select('title')
              .eq('id', lead.tour_id)
              .maybeSingle();
            tourName = tour?.title || null;
          }

          await resend.emails.send({
            from: LEAD_FROM,
            to: [toAddress],
            replyTo: lead.visitor_email || undefined,
            subject: `New lead from ${lead.visitor_name || 'your tour chatbot'} — ${venue?.name || 'TourBots'}`,
            react: LeadCaptureEmail({
              venueName: venue?.name || 'Your venue',
              tourName,
              visitorName: lead.visitor_name,
              visitorEmail: lead.visitor_email,
              visitorPhone: lead.visitor_phone,
              fields: typedFields
                .map((field) => {
                  const raw = values[field.field_key] || '';
                  if (!raw) return null;
                  let displayValue = raw;
                  if (field.field_type === 'select') {
                    const match = (field.options || []).find((option) => option.value === raw);
                    displayValue = match?.label || raw;
                  }
                  return { label: field.label, value: displayValue };
                })
                .filter(Boolean) as Array<{ label: string; value: string }>,
              pageUrl: lead.page_url,
              submittedAt: consentedAt,
            }),
          });

          await supabase
            .from('leads')
            .update({ notification_sent_at: new Date().toISOString() })
            .eq('id', lead.id);
        }
      } catch (emailError) {
        console.error('Lead notification email failed:', emailError);
      }
    }

    // Outbound event webhook (Zapier / Make / n8n) — fire-and-forget; never block the visitor.
    void emitChatbotEventWebhook({
      venueId,
      chatbotConfigId: data.chatbotConfigId,
      event: 'lead.created',
      payload: {
        lead: {
          id: lead.id,
          visitor_name: lead.visitor_name,
          visitor_email: lead.visitor_email,
          visitor_phone: lead.visitor_phone,
          field_values: lead.field_values,
          tour_id: lead.tour_id,
          conversation_id: lead.conversation_id,
          session_id: lead.session_id,
          page_url: lead.page_url,
          domain: lead.domain,
          source: lead.source,
          status: lead.status,
          consented_at: lead.consented_at,
          created_at: lead.created_at,
        },
      },
    });

    return NextResponse.json({ id: lead.id, success: true });
  } catch (error: unknown) {
    console.error('Lead submit error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
