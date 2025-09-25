import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { generateMonthlyReport, generateReportHTML } from '@/utils/reportGeneratorNew';

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
    console.log('🔄 Starting PDF generation...');
    
    // Get inspection data
    const data = await getInspectionData();
    console.log(`📊 Retrieved ${data.length} months of data`);

    // Generate report data and HTML
    const reportData = generateMonthlyReport(data);
    const htmlContent = generateReportHTML(reportData);

    // Launch Puppeteer
    console.log('🚀 Launching browser...');
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

    // Generate optimized A4 PDF
    console.log('📄 Generating optimized A4 PDF...');
    const page = await browser.newPage();
    
    // Set optimal viewport for A4
    await page.setViewport({ width: 794, height: 1123 });
    
    // Set content with faster loading
    await page.setContent(htmlContent, {
      waitUntil: ['domcontentloaded']
    });

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',
        bottom: '8mm', 
        left: '8mm',
        right: '8mm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });

    console.log('✅ Professional PDF generated successfully');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LOADALL-Quality-Report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate PDF',
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
