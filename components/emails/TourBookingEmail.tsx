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

interface TourBookingEmailProps {
  venueName: string;
  preferred_date: string;
  preferred_time: string;
  contact_phone: string;
  additional_notes?: string;
}

export const TourBookingEmail: React.FC<TourBookingEmailProps> = ({
  venueName,
  preferred_date,
  preferred_time,
  contact_phone,
  additional_notes,
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-gray-100 font-sans">
        <Container className="bg-white border border-gray-200 rounded-lg mx-auto my-12 p-8 max-w-2xl">
          <Heading className="text-2xl font-bold text-gray-800">
            New Tour Booking Request
          </Heading>
          <Text className="text-gray-600">
            A venue has requested a professional 3D tour capture.
          </Text>
          <Hr className="border-gray-300 my-6" />
          <Section>
            <Row>
              <Column className="w-1/3 font-semibold text-gray-700">Venue name</Column>
              <Column className="w-2/3 text-gray-800">{venueName}</Column>
            </Row>
            <Row>
              <Column className="w-1/3 font-semibold text-gray-700">Preferred Date</Column>
              <Column className="w-2/3 text-gray-800">{new Date(preferred_date).toLocaleDateString('en-GB')}</Column>
            </Row>
            <Row>
              <Column className="w-1/3 font-semibold text-gray-700">Preferred Time</Column>
              <Column className="w-2/3 text-gray-800">{preferred_time}</Column>
            </Row>
            <Row>
              <Column className="w-1/3 font-semibold text-gray-700">Contact Phone</Column>
              <Column className="w-2/3 text-gray-800">{contact_phone}</Column>
            </Row>
          </Section>
          {additional_notes && (
            <>
              <Hr className="border-gray-300 my-6" />
              <Heading as="h2" className="text-xl font-semibold text-gray-800">
                Additional Notes
              </Heading>
              <Text className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {additional_notes}
              </Text>
            </>
          )}
          <Hr className="border-gray-300 my-6" />
          <Section className="bg-blue-50 p-4 rounded-lg">
            <Heading as="h3" className="text-lg font-semibold text-blue-800">
              What's Included:
            </Heading>
            <Text className="text-blue-700 text-sm">
              • Professional Matterport 3D capture<br/>
              • High-resolution 360° photography<br/>
              • Interactive floor plan generation<br/>
              • AI chatbot integration<br/>
              • Included in their subscription
            </Text>
          </Section>
          <Hr className="border-gray-300 my-6" />
          <Text className="text-xs text-gray-500 text-center">
            This booking request was sent from the TourBots platform
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default TourBookingEmail; 