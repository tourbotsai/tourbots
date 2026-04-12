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
} from '@react-email/components';

interface DemoRequestEmailProps {
  name: string;
  email: string;
  phone?: string;
  venueName: string;
  currentWebsite?: string;
  preferredTime: string;
  timezone?: string;
  additionalInfo?: string;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Heading as="h2" className="text-xl font-semibold text-gray-800 mt-8 mb-4">
    {children}
  </Heading>
);

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <Row className="mb-2">
      <Column className="w-1/3 font-semibold text-gray-700">{label}</Column>
      <Column className="w-2/3 text-gray-800">{value}</Column>
    </Row>
  );
};

export const DemoRequestEmail: React.FC<DemoRequestEmailProps> = ({
  name,
  email,
  phone,
  venueName,
  currentWebsite,
  preferredTime,
  timezone,
  additionalInfo,
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-gray-100 font-sans">
        <Container className="bg-white border border-gray-200 rounded-lg mx-auto my-12 p-8 max-w-2xl">
          <Heading className="text-2xl font-bold text-gray-800">
            New Demo Request: {venueName}
          </Heading>
          <Text className="text-gray-600">
            A new demo has been requested via the TourBots website.
          </Text>
          <Hr className="border-gray-300 my-6" />

          <SectionTitle>Contact Information</SectionTitle>
          <Section>
            <InfoRow label="Name" value={name} />
            <InfoRow label="Email" value={email} />
            <InfoRow label="Phone" value={phone} />
          </Section>

          <SectionTitle>Company information</SectionTitle>
          <Section>
            <InfoRow label="Company or agency" value={venueName} />
            <InfoRow label="Current Website" value={currentWebsite} />
          </Section>
          
          <SectionTitle>Scheduling Information</SectionTitle>
          <Section>
            <InfoRow label="Preferred Time" value={preferredTime} />
            <InfoRow label="Timezone" value={timezone} />
          </Section>

          {additionalInfo && (
            <>
              <SectionTitle>Additional Information</SectionTitle>
              <Text className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {additionalInfo}
              </Text>
            </>
          )}

          <Hr className="border-gray-300 my-6" />
          <Text className="text-xs text-gray-500 text-center">
            This email was sent from the demo request form on TourBots
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default DemoRequestEmail; 