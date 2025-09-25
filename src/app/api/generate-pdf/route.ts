import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { generateMonthlyReport, generateReportHTML } from '@/utils/reportGenerator';

// Get inspection data from API
async function getInspectionData() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/inspections`);
    if (!response.ok) {
      throw new Error(`Failed to fetch inspection data: ${response.status}`);
    }
    const data = await response.json();
    console.log('📊 Raw data received:', typeof data, Array.isArray(data), data?.length);
    
    // Ensure we have an array
    if (!Array.isArray(data)) {
      console.error('❌ Data is not an array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching data:', error);
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

    // Check if we have data
    if (!data || data.length === 0) {
      console.error('❌ No inspection data available');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No inspection data available. Please ensure the database is seeded with data.',
          details: 'Data array is empty or undefined'
        },
        { status: 400 }
      );
    }

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

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });

    // Set content and wait for fonts/images to load
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    // Generate PDF with professional settings
    console.log('📄 Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });

    console.log('✅ PDF generated successfully');

    // Return PDF as response
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
