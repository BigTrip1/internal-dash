'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { generateMonthlyReport, generateReportHTML } from '@/utils/reportGenerator';
import { ArrowLeft, Download, FileText, Sun, Moon, Camera } from 'lucide-react';
import Link from 'next/link';

const ReportPage: React.FC = () => {
  const { data } = useData();
  const [reportHTML, setReportHTML] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    if (data.length > 0) {
      try {
        const reportData = generateMonthlyReport(data);
        const html = generateReportHTML(reportData);
        setReportHTML(html);
      } catch (error) {
        console.error('Error generating report:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [data]);

  // Update report HTML when theme changes
  useEffect(() => {
    if (data.length > 0) {
      const reportData = generateMonthlyReport(data);
      const html = generateReportHTML(reportData);
      // Apply theme class to the HTML
      const themedHTML = html.replace(
        '<body>',
        `<body class="${isDarkTheme ? 'dark-theme' : 'light-theme'}">`
      );
      setReportHTML(themedHTML);
    }
  }, [isDarkTheme, data]);

  const handleTakeScreenshot = async () => {
    try {
      // Hide the header controls for clean screenshot
      const headerControls = document.querySelector('.print\\:hidden');
      if (headerControls) {
        (headerControls as HTMLElement).style.display = 'none';
      }

      // Wait a moment for the UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use html2canvas with more compatible options
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#000000', // Set explicit background
        scale: 1,
        ignoreElements: (element) => {
          // Skip elements that might cause parsing issues
          return element.classList.contains('print-hidden') || 
                 element.tagName === 'SCRIPT' || 
                 element.tagName === 'STYLE';
        },
        onclone: (clonedDoc) => {
          // Clean up any problematic CSS in the cloned document
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color-scheme: light !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Restore header controls
      if (headerControls) {
        (headerControls as HTMLElement).style.display = '';
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `LOADALL-Quality-Report-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error taking screenshot:', error);
      alert('Screenshot failed due to CSS compatibility. Please use browser screenshot tools (Ctrl+Shift+S or Cmd+Shift+S) or the Print feature.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Try the simple PDF method first
      const response = await fetch('/api/simple-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `PDF generation failed: ${response.statusText}`);
      }

      // Get the HTML content
      const htmlContent = await response.text();
      
      // Create a new window with the HTML content
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        // Give user instructions
        alert('Report opened in new window. Use Ctrl+P (or Cmd+P) to print/save as PDF.');
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try the Print/PDF button instead.`);
    }
  };

  // Add right-click save functionality
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('.report-container')) {
        e.preventDefault();
        
        // Create a simple right-click menu
        const menu = document.createElement('div');
        menu.style.cssText = `
          position: fixed;
          top: ${e.clientY}px;
          left: ${e.clientX}px;
          background: #1a1a1a;
          border: 1px solid #FCB026;
          border-radius: 8px;
          padding: 8px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        const screenshotButton = document.createElement('button');
        screenshotButton.textContent = 'Take Screenshot';
        screenshotButton.style.cssText = `
          background: #FCB026;
          color: #000;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          width: 100%;
          margin-bottom: 4px;
        `;
        
        screenshotButton.onclick = () => {
          handleTakeScreenshot();
          document.body.removeChild(menu);
        };
        
        const printButton = document.createElement('button');
        printButton.textContent = 'Print/Save as PDF';
        printButton.style.cssText = `
          background: #3B82F6;
          color: #fff;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          width: 100%;
        `;
        
        printButton.onclick = () => {
          window.print();
          document.body.removeChild(menu);
        };
        
        menu.appendChild(screenshotButton);
        menu.appendChild(printButton);
        document.body.appendChild(menu);
        
        // Remove menu on click outside
        setTimeout(() => {
          const removeMenu = (e: MouseEvent) => {
            if (!menu.contains(e.target as Node)) {
              document.body.removeChild(menu);
              document.removeEventListener('click', removeMenu);
            }
          };
          document.addEventListener('click', removeMenu);
        }, 100);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Generating Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Controls */}
      <div className="jcb-header">
        <div className="w-full">
          <div className="relative flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="flex items-center space-x-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Admin</span>
              </Link>
              <h1 className="text-xl font-bold text-black">LOADALL Quality Performance Report</h1>
            </div>
            
               <div className="flex items-center space-x-3">
                 <button
                   onClick={() => setIsDarkTheme(!isDarkTheme)}
                   className={`flex items-center space-x-2 px-4 py-2 font-bold rounded-lg shadow-lg transition-colors duration-200 ${
                     isDarkTheme 
                       ? 'bg-yellow-600 text-black hover:bg-yellow-700' 
                       : 'bg-gray-800 text-white hover:bg-gray-900'
                   }`}
                 >
                   {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                   <span>{isDarkTheme ? 'Light' : 'Dark'}</span>
                 </button>
                 
                 <button
                   onClick={handleTakeScreenshot}
                   className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 transition-colors duration-200"
                 >
                   <Camera className="w-4 h-4" />
                   <span>Screenshot</span>
                 </button>
                 
                 <button
                   onClick={() => {
                     // Hide header for clean capture
                     const headerControls = document.querySelector('.print\\:hidden');
                     if (headerControls) {
                       (headerControls as HTMLElement).style.display = 'none';
                     }
                     
                     // Use browser's print to PDF feature
                     window.print();
                     
                     // Restore header after print dialog
                     setTimeout(() => {
                       if (headerControls) {
                         (headerControls as HTMLElement).style.display = '';
                       }
                     }, 1000);
                   }}
                   className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg shadow-lg hover:bg-orange-700 transition-colors duration-200"
                 >
                   <FileText className="w-4 h-4" />
                   <span>Print/PDF</span>
                 </button>
                 
                 <button
                   onClick={handleDownloadPDF}
                   className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200"
                 >
                   <Download className="w-4 h-4" />
                   <span>Download PDF</span>
                 </button>
                 
                 <button
                   onClick={() => window.print()}
                   className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-200"
                 >
                   <FileText className="w-4 h-4" />
                   <span>Print Report</span>
                 </button>
                 
                 <button
                   onClick={async () => {
                     try {
                       const response = await fetch('/api/inspections');
                       const data = await response.json();
                       const validData = data.filter((month: any) => month.totalInspections > 0);
                       alert(`Database contains ${data.length} total months, ${validData.length} with actual data. ${validData.length === 0 ? 'Please seed the database first.' : 'Data is available for PDF generation.'}`);
                     } catch (error) {
                       alert('Error checking database: ' + error);
                     }
                   }}
                   className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200"
                 >
                   <FileText className="w-4 h-4" />
                   <span>Check Data</span>
                 </button>
               </div>
          </div>
        </div>
      </div>

      {/* Full-Width Report Content */}
      <div className={`w-full transition-colors duration-300 ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`max-w-none mx-auto shadow-2xl border-t-4 border-yellow-500 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          {reportHTML ? (
            <iframe
              srcDoc={reportHTML}
              className="w-full border-none"
              style={{ 
                height: 'calc(100vh - 80px)',
                minHeight: '800px',
                width: '100%'
              }}
              title="LOADALL Quality Performance Report"
              onLoad={() => {
                // Ensure iframe content is properly sized
                const iframe = document.querySelector('iframe');
                if (iframe && iframe.contentDocument) {
                  const body = iframe.contentDocument.body;
                  if (body) {
                    body.style.margin = '0';
                    body.style.padding = '0';
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No report data available</p>
                <Link 
                  href="/admin"
                  className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-yellow-600 text-black font-bold rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Admin Panel</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .jcb-header {
            display: none !important;
          }
          
          iframe {
            height: auto !important;
            min-height: auto !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportPage;
