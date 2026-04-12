import { Ebook } from '@/lib/types';

// Simple markdown to HTML converter (basic implementation)
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  
  // Line breaks
  html = html.replace(/\n\n/gim, '</p><p>');
  html = html.replace(/\n/gim, '<br>');
  
  // Wrap in paragraphs
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/gim, '');
  html = html.replace(/<p><br><\/p>/gim, '');
  
  return html;
}

// Generate styled HTML for PDF
export function generateEbookHTML(ebook: Ebook): string {
  const htmlContent = markdownToHtml(ebook.content);
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${ebook.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: #ffffff;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 60px;
          padding-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .title {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
          line-height: 1.2;
        }
        
        .subtitle {
          font-size: 18px;
          color: #6b7280;
          margin-bottom: 20px;
        }
        
        .meta {
          font-size: 14px;
          color: #9ca3af;
        }
        
        .content {
          font-size: 16px;
          line-height: 1.8;
        }
        
        h1 {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin: 40px 0 20px 0;
          line-height: 1.3;
        }
        
        h2 {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin: 32px 0 16px 0;
          line-height: 1.3;
        }
        
        h3 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 24px 0 12px 0;
          line-height: 1.3;
        }
        
        p {
          margin-bottom: 16px;
          color: #374151;
        }
        
        strong {
          font-weight: 600;
          color: #111827;
        }
        
        em {
          font-style: italic;
        }
        
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        
        .logo {
          margin-bottom: 12px;
          font-weight: 600;
          color: #3b82f6;
        }
        
        @media print {
          body {
            padding: 20px;
          }
          .header {
            margin-bottom: 40px;
          }
          .footer {
            margin-top: 40px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${ebook.title}</h1>
        ${ebook.excerpt ? `<p class="subtitle">${ebook.excerpt}</p>` : ''}
        <div class="meta">
          ${ebook.reading_time_minutes ? `${ebook.reading_time_minutes} minute read` : ''}
          ${ebook.published_at ? ` • Published ${new Date(ebook.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
        </div>
      </div>
      
      <div class="content">
        ${htmlContent}
      </div>
      
      <div class="footer">
        <div class="logo">TourBots AI</div>
        <p>Transform your venue with virtual tours and AI-powered assistance</p>
        <p>Visit us at tourbots.ai</p>
      </div>
    </body>
    </html>
  `;
}

// Generate PDF blob (browser-side implementation)
export async function generateEbookPDF(ebook: Ebook): Promise<Blob> {
  try {
    // For browser-side PDF generation, we can use html2pdf or similar
    // This is a placeholder that would need a proper PDF library
    const htmlContent = generateEbookHTML(ebook);
    
    // Convert HTML to blob (simplified approach)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return blob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

// Server-side PDF generation (would use Puppeteer or similar)
export async function generateEbookPDFServer(ebook: Ebook): Promise<Buffer> {
  try {
    // This would implement server-side PDF generation using Puppeteer
    // For now, return a placeholder
    const htmlContent = generateEbookHTML(ebook);
    return Buffer.from(htmlContent, 'utf-8');
  } catch (error) {
    console.error('Error generating server PDF:', error);
    throw new Error('Failed to generate PDF on server');
  }
}

// Download PDF utility for client-side
export function downloadEbookPDF(ebook: Ebook, htmlContent?: string) {
  try {
    const html = htmlContent || generateEbookHTML(ebook);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ebook.slug}.html`; // Would be .pdf with proper PDF generation
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF');
  }
} 