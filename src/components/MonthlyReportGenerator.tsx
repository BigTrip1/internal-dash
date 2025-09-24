'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { generateMonthlyReport, generateReportHTML } from '@/utils/reportGenerator';
import { FileText, Download, Eye } from 'lucide-react';

const MonthlyReportGenerator: React.FC = () => {
  const { data } = useData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [reportHTML, setReportHTML] = useState<string>('');

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Generate report data
      const reportData = generateMonthlyReport(data);
      const html = generateReportHTML(reportData);
      setReportHTML(html);
      
      // Create and download HTML file
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `JCB-Monthly-Quality-Report-${reportData.monthEnding}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewReport = () => {
    if (!reportHTML) {
      const reportData = generateMonthlyReport(data);
      const html = generateReportHTML(reportData);
      setReportHTML(html);
    }
    setPreviewMode(true);
  };

  const handlePrintReport = async () => {
    try {
      // Call the PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.statusText}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
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

  if (previewMode && reportHTML) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl w-full h-full m-4 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold text-black">Monthly Quality Report Preview</h3>
            <div className="flex space-x-2">
              <button
                onClick={handlePrintReport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <iframe
              srcDoc={reportHTML}
              className="w-full h-full border-none"
              title="Monthly Quality Report Preview"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/30 rounded-xl shadow-2xl p-6">
      {/* JCB Industrial Header Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"></div>
      
      <div className="relative">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full mr-3"></div>
          Monthly Quality Report Generator
        </h3>
        
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-semibold mb-2">Report Features:</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Executive summary with current DPU status</li>
              <li>• Glide path analysis showing monthly targets to achieve 8.2 DPU</li>
              <li>• Stage performance breakdown with improvement/deterioration indicators</li>
              <li>• Critical actions required for management attention</li>
              <li>• Monthly achievements and quality improvements</li>
              <li>• Professional PDF format ready for distribution</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePreviewReport}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Report</span>
            </button>
            
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
          
          <div className="text-xs text-gray-400 bg-gray-800/30 rounded p-3 border border-gray-700">
            <strong>Instructions:</strong> Click "Preview Report" to review the monthly quality report, then "Print/Save as PDF" to create a PDF for email distribution. The report includes glide path calculations showing the monthly DPU reduction targets needed to achieve the 8.2 year-end goal.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportGenerator;
