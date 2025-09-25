import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyReport, generateReportHTML } from '@/utils/reportGenerator';
import { getCollection } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting simple PDF generation...');
    
    // Parse request body to get theme
    const body = await request.json();
    const theme = body.theme || 'light-theme';
    console.log(`🎨 Using theme: ${theme}`);
    
    // Get data directly from MongoDB
    const collection = await getCollection('Raw');
    const data = await collection.find({}).sort({ date: 1 }).toArray();
    console.log(`📊 Retrieved ${data.length} months of data from MongoDB`);

    // Check if we have data
    if (!data || data.length === 0) {
      console.error('❌ No inspection data available in database');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No inspection data available. Please seed the database first.',
          details: 'Database is empty'
        },
        { status: 400 }
      );
    }

    // Generate report data and HTML
    const reportData = generateMonthlyReport(data);
    let htmlContent = generateReportHTML(reportData, data);
    
    // Apply the requested theme
    htmlContent = htmlContent.replace(
      /<body[^>]*>/,
      `<body class="${theme}">`
    );

    console.log('✅ HTML content generated successfully with theme:', theme);

    // Return HTML content for browser to handle
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="LOADALL-Quality-Report-${new Date().toISOString().split('T')[0]}.html"`
      }
    });

  } catch (error) {
    console.error('❌ Simple PDF generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
