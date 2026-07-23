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
  Tailwind,
} from '@react-email/components';

interface LeadCaptureEmailProps {
  venueName: string;
  tourName?: string | null;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
  fields: Array<{ label: string; value: string }>;
  pageUrl?: string | null;
  submittedAt: string;
}

function formatSubmittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export const LeadCaptureEmail: React.FC<LeadCaptureEmailProps> = ({
  venueName,
  tourName,
  fields,
  pageUrl,
  submittedAt,
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-gray-100 font-sans">
        <Container className="bg-white border border-gray-200 rounded-lg mx-auto my-12 p-8 max-w-2xl">
          <Heading className="text-2xl font-bold text-gray-800">New chatbot lead</Heading>
          <Text className="text-gray-600">
            A visitor submitted the lead form on {venueName}
            {tourName ? ` (${tourName})` : ''}.
          </Text>
          <Hr className="border-gray-300 my-6" />
          <Section>
            {fields.map((field) => (
              <Row key={field.label} className="mb-2">
                <Column className="w-1/3 font-semibold text-gray-700">{field.label}</Column>
                <Column className="w-2/3 text-gray-800">{field.value}</Column>
              </Row>
            ))}
            <Row className="mb-2">
              <Column className="w-1/3 font-semibold text-gray-700">Submitted</Column>
              <Column className="w-2/3 text-gray-800">{formatSubmittedAt(submittedAt)}</Column>
            </Row>
            {pageUrl ? (
              <Row className="mb-2">
                <Column className="w-1/3 font-semibold text-gray-700">Page</Column>
                <Column className="w-2/3 text-gray-800">{pageUrl}</Column>
              </Row>
            ) : null}
          </Section>
          <Hr className="border-gray-300 my-6" />
          <Text className="text-sm text-gray-500">
            View all leads in TourBots under Chatbots → Actions → View all leads.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default LeadCaptureEmail;
