import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { generateMonthlyReport, generateReportHTML } from '@/utils/reportGenerator';

// Get inspection data from API
async function getInspectionData() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/inspections`);
    if (!response.ok) {
      throw new Error('Failed to fetch inspection data');
    }
    const result = await response.json();
    
    // API returns { success: true, data: [...] }, we need just the data array
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    } else {
      console.error('Invalid data format from API:', result);
      return [];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    // Return fallback data structure
    return [];
  }
}

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    console.log('🔄 Starting A3 Landscape PDF generation...');
    
    // Get inspection data
    const data = await getInspectionData();
    console.log(`📊 Retrieved ${data.length} months of data`);

    // Generate report data and HTML
    const reportData = generateMonthlyReport(data);
    const htmlContent = generateReportHTML(reportData);

    // Modify HTML for A3 landscape
    const a3HtmlContent = htmlContent
      .replace('@page { size: A4; margin: 15mm; }', '@page { size: A3 landscape; margin: 10mm; }')
      .replace('font-size: 12px;', 'font-size: 11px;')
      .replace('padding: 15px 20px;', 'padding: 8px 12px;')
      .replace('min-height: 70px;', 'min-height: 50px;')
      .replace('padding: 20px 15px;', 'padding: 15px 10px;');

    // Launch Puppeteer
    console.log('🚀 Launching browser for A3 landscape...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1684, height: 1191 }); // A3 landscape dimensions
    await page.setContent(a3HtmlContent, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    const pdfBuffer = await page.pdf({
      format: 'A3',
      landscape: true,
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm', 
        right: '10mm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });

    console.log('✅ A3 Landscape PDF generated successfully');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LOADALL-Quality-Report-A3-Landscape-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('❌ A3 PDF generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate A3 PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔌 Browser closed');
    }
  }
}
