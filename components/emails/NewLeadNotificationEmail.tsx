import React from 'react';
import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
  Row,
  Column,
  Link,
  Tailwind,
  Img,
  Button
} from '@react-email/components';
import { Lead } from '@/lib/types';

const BRAND_LOGO_URL = 'https://mcnpbpwsqebihnxzhssu.supabase.co/storage/v1/object/public/venue-logo/TourBots%20AI%20logo%20-%20Vertical.png';

interface NewLeadNotificationEmailProps {
  lead: Lead;
  venueName: string;
  leadUrl: string;
  settingsUrl: string;
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
};

const box = {
  padding: '0 48px',
};

const logo = {
  margin: '0 auto',
  width: '120px',
};

const heading = {
  fontSize: '24px',
  lineHeight: '1.25',
  fontWeight: '600',
  color: '#2d3748',
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.5',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
};

const leadDetailLabel = {
  color: '#718096',
  fontSize: '14px',
  fontWeight: '500',
  marginBottom: '4px',
};

const leadDetailValue = {
  color: '#2d3748',
  fontSize: '16px',
  fontWeight: '600',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#a0aec0',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  marginTop: '20px',
};

export const NewLeadNotificationEmail: React.FC<NewLeadNotificationEmailProps> = ({
  lead,
  venueName,
  leadUrl,
  settingsUrl
}) => {
  const chatbotName = 'Tour Chatbot';

  return (
    <Html>
      <Tailwind>
        <Body style={main}>
          <Container style={container}>
            <Section style={box}>
              <Img
                src={BRAND_LOGO_URL}
                style={logo}
                alt="TourBots"
              />
              <Heading style={heading}>You have a new lead!</Heading>
              <Text style={text}>
                Congratulations, {venueName}! Your {chatbotName} has captured a new lead.
              </Text>
              <Hr style={hr} />
              
              <Heading as="h2" style={{ ...heading, fontSize: '20px', marginTop: '30px' }}>
                Lead Details
              </Heading>

              <Row>
                <Column>
                  <Text style={leadDetailLabel}>Name</Text>
                  <Text style={leadDetailValue}>{lead.visitor_name || 'Not provided'}</Text>
                </Column>
                <Column>
                  <Text style={leadDetailLabel}>Email</Text>
                  <Text style={leadDetailValue}>{lead.visitor_email || 'Not provided'}</Text>
                </Column>
              </Row>
              <Row style={{ marginTop: '16px' }}>
                <Column>
                  <Text style={leadDetailLabel}>Phone</Text>
                  <Text style={leadDetailValue}>{lead.visitor_phone || 'Not provided'}</Text>
                </Column>
                <Column>
                  <Text style={leadDetailLabel}>Lead Score</Text>
                  <Text style={leadDetailValue}>{lead.lead_score || 0}</Text>
                </Column>
              </Row>

              {lead.lead_notes && (
                <Section style={{ marginTop: '16px' }}>
                  <Text style={leadDetailLabel}>Notes from Chat</Text>
                  <Text style={{ ...text, fontSize: '14px', fontStyle: 'italic', borderLeft: '2px solid #e2e8f0', paddingLeft: '12px' }}>
                    {lead.lead_notes}
                  </Text>
                </Section>
              )}
              
              <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
                <Button style={button} href={leadUrl}>
                  View Lead in Dashboard
                </Button>
              </Section>

              <Text style={text}>
                You can manage this lead and all others from your TourBots dashboard.
              </Text>
              
              <Hr style={hr} />
              
              <Section>
                <Text style={footer}>
                  You are receiving this email because you have enabled new lead notifications in your{' '}
                  <Link href={settingsUrl}>Lead Capture Settings</Link>.
                </Text>
                <Text style={footer}>
                  TourBots | The future of fitness venue member acquisition.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default NewLeadNotificationEmail; 