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

interface ContactFormEmailProps {
  name: string;
  email: string;
  venueName?: string;
  phone?: string;
  helpTopic: string;
  message: string;
}

export const ContactFormEmail: React.FC<ContactFormEmailProps> = ({
  name,
  email,
  venueName,
  phone,
  helpTopic,
  message,
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-gray-100 font-sans">
        <Container className="bg-white border border-gray-200 rounded-lg mx-auto my-12 p-8 max-w-2xl">
          <Heading className="text-2xl font-bold text-gray-800">
            New Contact Form Submission
          </Heading>
          <Text className="text-gray-600">
            You have received a new message from your website contact form.
          </Text>
          <Hr className="border-gray-300 my-6" />
          <Section>
            <Row>
              <Column className="w-1/4 font-semibold text-gray-700">Name</Column>
              <Column className="w-3/4 text-gray-800">{name}</Column>
            </Row>
            <Row>
              <Column className="w-1/4 font-semibold text-gray-700">Email</Column>
              <Column className="w-3/4 text-gray-800">
                <Link href={`mailto:${email}`}>{email}</Link>
              </Column>
            </Row>
            {venueName && (
              <Row>
                <Column className="w-1/4 font-semibold text-gray-700">Venue / company</Column>
                <Column className="w-3/4 text-gray-800">{venueName}</Column>
              </Row>
            )}
            {phone && (
              <Row>
                <Column className="w-1/4 font-semibold text-gray-700">Phone</Column>
                <Column className="w-3/4 text-gray-800">{phone}</Column>
              </Row>
            )}
            <Row>
              <Column className="w-1/4 font-semibold text-gray-700">Enquiry Topic</Column>
              <Column className="w-3/4 text-gray-800">{helpTopic}</Column>
            </Row>
          </Section>
          <Hr className="border-gray-300 my-6" />
          <Heading as="h2" className="text-xl font-semibold text-gray-800">
            Message
          </Heading>
          <Text className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {message}
          </Text>
          <Hr className="border-gray-300 my-6" />
          <Text className="text-xs text-gray-500 text-center">
            This email was sent from the contact form on TourBots
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default ContactFormEmail; 