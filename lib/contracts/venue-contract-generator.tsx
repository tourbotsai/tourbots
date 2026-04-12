import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { ContractData, getContractContent } from './venue-contract-terms';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 5,
  },
  emptyLine: {
    marginBottom: 8,
  },
  footer: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 20,
  },
  branding: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 15,
  },
});

function ContractPDF({ data }: { data: ContractData }) {
  const content = getContractContent(data);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.date}>Agreement Date: {data.date}</Text>
        <View style={styles.separator} />

        {content.sections.map((section, index) => (
          <View key={index}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.content.map((line, lineIndex) => (
              line === '' ? (
                <View key={lineIndex} style={styles.emptyLine} />
              ) : (
                <Text key={lineIndex} style={styles.text}>
                  {line}
                </Text>
              )
            ))}
          </View>
        ))}

        <View style={styles.separator} />
        {content.footer.map((line, index) => (
          <Text key={index} style={styles.footer}>
            {line}
          </Text>
        ))}

        <Text style={styles.branding}>TourBots AI Ltd</Text>
        <Text style={styles.branding}>tourbots.ai | support@tourbots.ai</Text>
      </Page>
    </Document>
  );
}

export async function generateContractPDF(data: ContractData): Promise<Buffer> {
  try {
    const blob = await pdf(<ContractPDF data={data} />).toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate contract PDF');
  }
}
