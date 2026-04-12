import React from 'react';
import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
  Tailwind,
} from '@react-email/components';

interface SalesEmailTemplateProps {
  recipientEmail: string;
  subject: string;
  body: string;
  templateType?: 'sales_outreach' | 'follow_up' | 'proposal' | 'custom';
}

export const SalesEmailTemplate: React.FC<SalesEmailTemplateProps> = ({
  recipientEmail,
  subject,
  body,
  templateType = 'custom',
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-white font-sans">
        <Container className="mx-auto my-8 px-6 max-w-2xl">
          
          {/* Main Email Content */}
          <Section>
            <Text className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap" style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              lineHeight: '1.6',
              margin: '0',
              padding: '0'
            }}>
              {body}
            </Text>
          </Section>

        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default SalesEmailTemplate; 