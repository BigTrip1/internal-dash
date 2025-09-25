'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { generateMonthlyReport, generateReportHTML } from '@/utils/reportGenerator';
import { ArrowLeft, Download, FileText, Sun, Moon } from 'lucide-react';
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

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.statusText}`);
      }

      const pdfBlob = await response.blob();
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LOADALL-Quality-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

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
