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

interface SalesContactEmailProps {
  name: string;
  email: string;
  phone?: string;
  venueName: string;
  planType: 'essential' | 'professional';
  message: string;
}

export const SalesContactEmail: React.FC<SalesContactEmailProps> = ({
  name,
  email,
  phone,
  venueName,
  planType,
  message,
}) => {
  const planDisplayName = planType === 'essential' ? 'AI Essentials' : 'All-in-One';
  const planPrice = planType === 'essential' ? '£99' : '£199';

  return (
    <Html>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="bg-white border border-gray-200 rounded-lg mx-auto my-12 p-8 max-w-2xl">
            <Heading className="text-2xl font-bold text-gray-800">
              New Sales Enquiry - {planDisplayName}
            </Heading>
            <Text className="text-gray-600">
              You have received a new sales enquiry for the {planDisplayName} plan ({planPrice}/month).
            </Text>
            <Hr className="border-gray-300 my-6" />
            
            {/* Contact Information */}
            <Section>
              <Heading as="h2" className="text-lg font-semibold text-gray-800 mb-4">
                Contact Details
              </Heading>
              <Row className="mb-2">
                <Column className="w-1/4 font-semibold text-gray-700">Name</Column>
                <Column className="w-3/4 text-gray-800">{name}</Column>
              </Row>
              <Row className="mb-2">
                <Column className="w-1/4 font-semibold text-gray-700">Email</Column>
                <Column className="w-3/4 text-gray-800">
                  <Link href={`mailto:${email}`} className="text-blue-600 underline">
                    {email}
                  </Link>
                </Column>
              </Row>
              {phone && (
                <Row className="mb-2">
                  <Column className="w-1/4 font-semibold text-gray-700">Phone</Column>
                  <Column className="w-3/4 text-gray-800">
                    <Link href={`tel:${phone}`} className="text-blue-600 underline">
                      {phone}
                    </Link>
                  </Column>
                </Row>
              )}
              <Row className="mb-2">
                <Column className="w-1/4 font-semibold text-gray-700">Venue name</Column>
                <Column className="w-3/4 text-gray-800">{venueName}</Column>
              </Row>
            </Section>

            <Hr className="border-gray-300 my-6" />

            {/* Plan Information */}
            <Section>
              <Heading as="h2" className="text-lg font-semibold text-gray-800 mb-4">
                Plan Interest
              </Heading>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <Row>
                  <Column className="w-1/2">
                    <Text className="font-semibold text-blue-800 text-lg">
                      {planDisplayName}
                    </Text>
                    <Text className="text-blue-600">
                      {planPrice}/month
                    </Text>
                  </Column>
                  <Column className="w-1/2">
                    <Text className="text-sm text-blue-700">
                      {planType === 'essential' 
                        ? 'Perfect for venues with existing tours or those wanting a powerful tour chatbot'
                        : 'The complete package including professional 3D tour capture and full AI platform'
                      }
                    </Text>
                  </Column>
                </Row>
              </div>
            </Section>

            <Hr className="border-gray-300 my-6" />

            {/* Message */}
            <Section>
              <Heading as="h2" className="text-lg font-semibold text-gray-800 mb-4">
                Customer Message
              </Heading>
              <Text className="text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
                {message}
              </Text>
            </Section>

            <Hr className="border-gray-300 my-6" />

            {/* Next Steps */}
            <Section>
              <Heading as="h2" className="text-lg font-semibold text-gray-800 mb-4">
                Recommended Next Steps
              </Heading>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Text className="text-green-800 font-medium mb-2">
                  High Priority - Sales Enquiry
                </Text>
                <Text className="text-green-700 text-sm">
                  • Respond within 24 hours for best conversion rates<br/>
                  • Book a demo call to discuss their specific requirements<br/>
                  • Prepare pricing proposal based on their venue size and needs<br/>
                  • Follow up with implementation timeline and onboarding process
                </Text>
              </div>
            </Section>

            <Hr className="border-gray-300 my-6" />

            {/* Footer */}
            <Text className="text-xs text-gray-500 text-center">
              This email was sent from the sales enquiry form on TourBots<br/>
              Lead captured: {new Date().toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SalesContactEmail; 