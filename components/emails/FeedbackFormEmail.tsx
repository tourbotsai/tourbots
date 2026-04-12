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

interface FeedbackFormEmailProps {
  userEmail?: string;
  category: string;
  message: string;
  tourId: string;
}

export const FeedbackFormEmail: React.FC<FeedbackFormEmailProps> = ({
  userEmail,
  category,
  message,
  tourId,
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-gray-100 font-sans">
        <Container className="bg-white border border-gray-200 rounded-lg mx-auto my-12 p-8 max-w-2xl">
          <Heading className="text-2xl font-bold text-gray-800">
            New Tour Feedback Received
          </Heading>
          <Text className="text-gray-600">
            A user has submitted feedback regarding one of the virtual tours.
          </Text>
          <Hr className="border-gray-300 my-6" />
          <Section>
            <Row className="mb-2">
              <Column className="w-1/3 font-semibold text-gray-700">From User</Column>
              <Column className="w-2/3 text-gray-800">
                {userEmail ? <Link href={`mailto:${userEmail}`}>{userEmail}</Link> : 'Anonymous'}
              </Column>
            </Row>
            <Row className="mb-2">
              <Column className="w-1/3 font-semibold text-gray-700">Tour ID</Column>
              <Column className="w-2/3 text-gray-800">{tourId}</Column>
            </Row>
            <Row className="mb-2">
              <Column className="w-1/3 font-semibold text-gray-700">Category</Column>
              <Column className="w-2/3 text-gray-800" style={{ textTransform: 'capitalize' }}>
                {category}
              </Column>
            </Row>
          </Section>
          <Hr className="border-gray-300 my-6" />
          <Heading as="h2" className="text-xl font-semibold text-gray-800">
            Feedback Message
          </Heading>
          <Text className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {message}
          </Text>
          <Hr className="border-gray-300 my-6" />
          <Text className="text-xs text-gray-500 text-center">
            This email was sent from the in-app feedback form on TourBots
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default FeedbackFormEmail; 