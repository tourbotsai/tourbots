import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ContractEmailProps {
  venueName: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
  planName: string;
}

export const ContractEmail = ({
  venueName,
  ownerName,
  ownerEmail,
  password,
  planName,
}: ContractEmailProps) => {
  const previewText = `Your Service Agreement for ${venueName}`;
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Service Agreement Attached</Heading>
          
          <Text style={paragraph}>Hi {ownerName},</Text>
          
          <Text style={paragraph}>
            Thank you for choosing TourBots! Please find attached your official Service Agreement for <strong>{venueName}</strong>.
          </Text>

          <Text style={paragraph}>
            <strong>Plan:</strong> {planName === 'essential' ? 'AI Essentials' : 'All-in-One'}
          </Text>

          <Section style={credentialsBox}>
            <Text style={credentialsTitle}>🔐 Your Login Credentials</Text>
            <Text style={credentialsLabel}>Email:</Text>
            <Text style={credentialsValue}>{ownerEmail}</Text>
            <Text style={credentialsLabel}>Password:</Text>
            <Text style={credentialsPassword}>{password}</Text>
            <Text style={credentialsWarning}>
              ⚠️ Please change your password after your first login for security.
            </Text>
          </Section>

          <Section style={highlightBox}>
            <Text style={highlightTitle}>What's Included in Your Contract:</Text>
            <Text style={highlightItem}>✓ Service details and payment terms</Text>
            <Text style={highlightItem}>✓ Tour recording and re-recording policy</Text>
            <Text style={highlightItem}>✓ Terms and conditions</Text>
            <Text style={highlightItem}>✓ Data protection information</Text>
          </Section>
          
          <Hr style={hr} />
          
          <Section style={stepsBox}>
            <Text style={stepsTitle}>Next Steps:</Text>
            <Text style={stepsItem}>1. Review the attached Service Agreement</Text>
            <Text style={stepsItem}>2. Complete your payment setup (if trial enabled)</Text>
            <Text style={stepsItem}>3. Log in to your dashboard to get started</Text>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            Questions? Reply to this email or contact us at <strong>support@tourbots.ai</strong>
          </Text>
          
          <Text style={footer}>
            TourBots<br />
            The future of fitness venue marketing
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ContractEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1a1a1a',
  padding: '24px 20px',
  marginBottom: '0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4043',
  padding: '0 20px',
  marginBottom: '16px',
};

const credentialsBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const credentialsTitle = {
  fontSize: '17px',
  fontWeight: '600',
  color: '#92400e',
  marginBottom: '14px',
  marginTop: '0',
};

const credentialsLabel = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#78350f',
  marginBottom: '6px',
  marginTop: '14px',
};

const credentialsValue = {
  fontSize: '15px',
  color: '#1c1917',
  fontFamily: 'Monaco, Courier, monospace',
  marginTop: '0',
  marginBottom: '0',
  wordBreak: 'break-all' as const,
};

const credentialsPassword = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1c1917',
  backgroundColor: '#ffffff',
  padding: '10px 14px',
  borderRadius: '4px',
  fontFamily: 'Monaco, Courier, monospace',
  marginTop: '0',
  marginBottom: '10px',
  wordBreak: 'break-all' as const,
};

const credentialsWarning = {
  fontSize: '13px',
  color: '#92400e',
  marginTop: '14px',
  marginBottom: '0',
  fontStyle: 'italic',
};

const listItem = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4043',
  padding: '0 20px',
  marginBottom: '12px',
  marginTop: '0',
};

const highlightBox = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const highlightTitle = {
  fontSize: '17px',
  fontWeight: '600',
  color: '#ffffff',
  marginBottom: '14px',
  marginTop: '0',
};

const highlightItem = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#ffffff',
  marginBottom: '10px',
  marginTop: '0',
};

const stepsBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const stepsTitle = {
  fontSize: '17px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '14px',
  marginTop: '0',
};

const stepsItem = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4043',
  marginBottom: '10px',
  marginTop: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 20px',
  marginTop: '16px',
};
