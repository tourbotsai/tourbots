import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface TrialCheckoutEmailProps {
  venueName: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
  trialPeriodDays: number;
  monthlyPrice: number;
  checkoutUrl: string;
  planName: string;
  hasContract?: boolean;
  recordingDate?: string;
  recordingTime?: string;
}

export const TrialCheckoutEmail = ({
  venueName,
  ownerName,
  ownerEmail,
  password,
  trialPeriodDays,
  monthlyPrice,
  checkoutUrl,
  planName,
  hasContract = false,
  recordingDate,
  recordingTime,
}: TrialCheckoutEmailProps) => {
  const previewText = `Start your ${trialPeriodDays}-day free trial for ${venueName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to TourBots! 🎉</Heading>
          
          <Text style={paragraph}>
            Hi {ownerName},
          </Text>
          
          <Text style={paragraph}>
            Your {venueName} account is ready! We've set everything up for you with our {planName === 'essential' ? 'AI Essentials' : 'All-in-One'} plan.
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
            <Text style={highlightText}>
              <strong>🎁 {trialPeriodDays}-Day Free Trial</strong>
            </Text>
            <Text style={highlightSubtext}>
              £0 today, then £{monthlyPrice.toFixed(2)}/month
            </Text>
          </Section>
          
          <Text style={paragraph}>
            <strong>Here's what happens next:</strong>
          </Text>
          
          <Text style={listItem}>
            ✅ Click the button below to start your free trial
          </Text>
          <Text style={listItem}>
            ✅ Enter your card details (you won't be charged today)
          </Text>
          <Text style={listItem}>
            ✅ Get instant access to your virtual tour and AI chatbot
          </Text>
          <Text style={listItem}>
            ✅ After {trialPeriodDays} days, your subscription begins at £{monthlyPrice.toFixed(2)}/month
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={checkoutUrl}>
              Start Your Free Trial
            </Button>
          </Section>
          
          <Hr style={hr} />

          {recordingDate && recordingTime && (
            <Section style={recordingBox}>
              <Text style={recordingTitle}>📅 Your Tour Recording is Scheduled</Text>
              <Text style={recordingDetail}>
                <strong>Date:</strong> {new Date(recordingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
              <Text style={recordingDetail}>
                <strong>Time:</strong> {recordingTime}
              </Text>
              <Text style={recordingNote}>
                We'll contact you closer to the date to confirm all the details.
              </Text>
            </Section>
          )}

          {hasContract && (
            <>
              <Section style={contractBox}>
                <Text style={contractTitle}>📄 Service Agreement Attached</Text>
                <Text style={contractItem}>✓ Service details and payment terms</Text>
                <Text style={contractItem}>✓ Tour recording and re-recording policy</Text>
                <Text style={contractItem}>✓ Terms and conditions</Text>
                <Text style={contractItem}>✓ Data protection information</Text>
              </Section>
              
              <Section style={stepsBox}>
                <Text style={stepsTitle}>Next Steps:</Text>
                <Text style={stepsItem}>1. Review the attached Service Agreement</Text>
                <Text style={stepsItem}>2. Click "Start Your Free Trial" above</Text>
                <Text style={stepsItem}>3. Log in to your dashboard to get started</Text>
              </Section>

              <Hr style={hr} />
            </>
          )}
          
          <Text style={footer}>
            <strong>No commitment required.</strong> You can cancel anytime before the trial ends, 
            and you won't be charged.
          </Text>
          
          <Text style={footer}>
            Need help? Reply to this email or contact us at support@tourbots.ai
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

export default TrialCheckoutEmail;

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
  padding: '24px 20px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const highlightText = {
  fontSize: '22px',
  color: '#ffffff',
  margin: '0',
  marginBottom: '8px',
  fontWeight: '600',
};

const highlightSubtext = {
  fontSize: '17px',
  color: '#dbeafe',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
  width: 'auto',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
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

const recordingBox = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const recordingTitle = {
  fontSize: '17px',
  fontWeight: '600',
  color: '#ffffff',
  marginBottom: '14px',
  marginTop: '0',
};

const recordingDetail = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#ffffff',
  marginBottom: '8px',
  marginTop: '0',
};

const recordingNote = {
  fontSize: '14px',
  color: '#dcfce7',
  marginTop: '14px',
  marginBottom: '0',
  fontStyle: 'italic',
};

const contractBox = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const contractTitle = {
  fontSize: '17px',
  fontWeight: '600',
  color: '#ffffff',
  marginBottom: '14px',
  marginTop: '0',
};

const contractItem = {
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

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 20px',
  marginTop: '16px',
};

