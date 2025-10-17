'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { generateMonthlyReport, generateReportHTML } from '@/utils/reportGenerator';
import { formatNumber, formatDPU, getStagePerformanceSummary } from '@/utils/dataUtils';
import { ArrowLeft, Download, FileText, Sun, Moon, Camera, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { YearTarget } from '@/types';
import { InterventionPlan } from '@/types/interventions';

const ReportPage: React.FC = () => {
  const { data, loading } = useData();
  const searchParams = useSearchParams();
  const reportType = searchParams.get('type') || 'combined';
  const stageName = searchParams.get('stage') || '';
  
  const [reportHTML, setReportHTML] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [yearTargets, setYearTargets] = useState<YearTarget | null>(null);
  const [interventionPlans, setInterventionPlans] = useState<InterventionPlan[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Helper functions to calculate metrics
  const calculateStageMetrics = (stageName: string) => {
    if (!data.length) return null;
    
    // Determine the actual stage name based on report type
    let actualStageName = stageName;
    if (reportType === 'combined') {
      actualStageName = 'COMBINED TOTALS';
    } else if (reportType === 'production') {
      actualStageName = 'PRODUCTION TOTALS';
    } else if (reportType === 'dpdi') {
      actualStageName = 'DPDI TOTALS';
    } else if (reportType === 'stage' && stageName) {
      actualStageName = stageName.toUpperCase().replace(/\s+/g, '_');
    }
    
    // Find the last month with actual data (not all zeros)
    const monthsWithData = data.filter(month => {
      if (actualStageName === 'PRODUCTION TOTALS') {
        return (month.productionTotalDpu ?? month.totalDpu ?? 0) > 0;
      } else if (actualStageName === 'DPDI TOTALS') {
        return (month.dpdiTotalDpu ?? 0) > 0;
      } else if (actualStageName === 'COMBINED TOTALS') {
        return (month.combinedTotalDpu ?? month.totalDpu ?? 0) > 0;
      } else {
        // Individual stage - check if stage has data
        const inspectedKey = `${actualStageName}_INSPECTED`;
        const dpuKey = `${actualStageName}_DPU`;
        return (month[inspectedKey] ?? 0) > 0 || (month[dpuKey] ?? 0) > 0;
      }
    });
    
    if (monthsWithData.length === 0) return null;
    
    const currentMonth = monthsWithData[monthsWithData.length - 1];
    const lastMonth = monthsWithData.length > 1 ? monthsWithData[monthsWithData.length - 2] : null;
    
    let currentDPU = 0;
    let buildVolume = 0;
    let totalFaults = 0;
    
    if (actualStageName === 'PRODUCTION TOTALS') {
      currentDPU = currentMonth?.productionTotalDpu ?? currentMonth?.totalDpu ?? 0;
      buildVolume = currentMonth?.signoutVolume ?? 0; // Use signout volume for build volume
      totalFaults = currentMonth?.productionTotalFaults ?? currentMonth?.totalFaults ?? 0;
    } else if (actualStageName === 'DPDI TOTALS') {
      currentDPU = currentMonth?.dpdiTotalDpu ?? 0;
      buildVolume = currentMonth?.signoutVolume ?? 0; // Use signout volume for build volume
      totalFaults = currentMonth?.dpdiTotalFaults ?? 0;
    } else if (actualStageName === 'COMBINED TOTALS') {
      currentDPU = currentMonth?.combinedTotalDpu ?? currentMonth?.totalDpu ?? 0;
      buildVolume = currentMonth?.signoutVolume ?? 0; // Use signout volume for build volume
      totalFaults = currentMonth?.combinedTotalFaults ?? currentMonth?.totalFaults ?? 0;
    } else {
      // Individual stage
      const dpuKey = `${actualStageName}_DPU`;
      const inspectedKey = `${actualStageName}_INSPECTED`;
      const faultsKey = `${actualStageName}_FAULTS`;
      
      currentDPU = currentMonth?.[dpuKey] ?? 0;
      buildVolume = currentMonth?.[inspectedKey] ?? 0; // Use inspected quantity for individual stages
      totalFaults = currentMonth?.[faultsKey] ?? 0;
    }
    
    const lastMonthDPU = lastMonth ? (
      actualStageName === 'PRODUCTION TOTALS' ? (lastMonth.productionTotalDpu ?? lastMonth.totalDpu ?? 0) :
      actualStageName === 'DPDI TOTALS' ? (lastMonth.dpdiTotalDpu ?? 0) :
      actualStageName === 'COMBINED TOTALS' ? (lastMonth.combinedTotalDpu ?? lastMonth.totalDpu ?? 0) :
      lastMonth[`${actualStageName}_DPU`] ?? 0
    ) : 0;
    
    // Calculate month-over-month change (negative = improvement for DPU)
    const momChange = lastMonthDPU > 0 ? ((currentDPU - lastMonthDPU) / lastMonthDPU) * 100 : 0;
    
    // Calculate YTD metrics using months with actual data
    const ytdData = monthsWithData.filter(month => {
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month.date.substring(0, 3));
      return monthIndex < new Date().getMonth();
    });
    
    const ytdDPUs = ytdData.map(month => {
      if (actualStageName === 'PRODUCTION TOTALS') return month.productionTotalDpu ?? month.totalDpu ?? 0;
      if (actualStageName === 'DPDI TOTALS') return month.dpdiTotalDpu ?? 0;
      if (actualStageName === 'COMBINED TOTALS') return month.combinedTotalDpu ?? month.totalDpu ?? 0;
      return month[`${actualStageName}_DPU`] ?? 0;
    }).filter(dpu => dpu > 0);
    
    const ytdAverage = ytdDPUs.length > 0 ? ytdDPUs.reduce((sum, dpu) => sum + dpu, 0) / ytdDPUs.length : 0;
    const ytdImprovement = ytdDPUs.length > 1 ? ((ytdDPUs[0] - ytdDPUs[ytdDPUs.length - 1]) / ytdDPUs[0]) * 100 : 0;
    
    return {
      currentDPU,
      buildVolume,
      totalFaults,
      momChange,
      ytdAverage,
      ytdImprovement,
      faultRate: buildVolume > 0 ? (totalFaults / buildVolume) * 1000 : 0
    };
  };

  // Fetch targets and interventions
  useEffect(() => {
    const fetchTargetsAndInterventions = async () => {
      try {
        const currentYear = new Date().getFullYear();
        
        // Fetch targets
        const targetsResponse = await fetch(`/api/targets?year=${currentYear}`);
        if (targetsResponse.ok) {
          const targetsResult = await targetsResponse.json();
          if (targetsResult.success && targetsResult.target) {
            setYearTargets(targetsResult.target);
          }
        }
        
        // Fetch all intervention plans for the year
        const interventionsResponse = await fetch(`/api/interventions?year=${currentYear}`);
        if (interventionsResponse.ok) {
          const interventionsResult = await interventionsResponse.json();
          if (interventionsResult.success && interventionsResult.plans) {
            setInterventionPlans(interventionsResult.plans);
          }
        }
        setDataLoaded(true);
      } catch (error) {
        console.error('Error fetching targets and interventions:', error);
        setDataLoaded(true); // Still set to true to show the report even if some data fails
      }
    };

    fetchTargetsAndInterventions();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      try {
        const reportData = generateMonthlyReport(data);
        setReportData(reportData);
        const html = generateReportHTML(reportData, data);
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
      const html = generateReportHTML(reportData, data);
      // Apply theme class to the HTML
      const themedHTML = html.replace(
        '<body>',
        `<body class="${isDarkTheme ? 'dark-theme' : 'light-theme'}">`
      );
      setReportHTML(themedHTML);
    }
  }, [isDarkTheme, data]);

  // Calculate metrics based on report type
  const getCurrentStageMetrics = () => {
    if (reportType === 'combined') {
      return calculateStageMetrics('COMBINED TOTALS');
    } else if (reportType === 'production') {
      return calculateStageMetrics('PRODUCTION TOTALS');
    } else if (reportType === 'dpdi') {
      return calculateStageMetrics('DPDI TOTALS');
    } else if (reportType === 'stage' && stageName) {
      return calculateStageMetrics(stageName);
    }
    return calculateStageMetrics('COMBINED TOTALS'); // Default fallback
  };

  const currentMetrics = getCurrentStageMetrics();
  
  // Calculate metrics for all three totals (for comparison)
  const productionMetrics = calculateStageMetrics('PRODUCTION TOTALS');
  const dpdiMetrics = calculateStageMetrics('DPDI TOTALS');
  const combinedMetrics = calculateStageMetrics('COMBINED TOTALS');

  // Helper function to get last month with actual data
  const getLastMonthWithData = (stageName: string) => {
    if (!data.length) return null;
    
    const monthsWithData = data.filter(month => {
      if (stageName === 'PRODUCTION TOTALS') {
        return (month.productionTotalDpu ?? month.totalDpu ?? 0) > 0;
      } else if (stageName === 'DPDI TOTALS') {
        return (month.dpdiTotalDpu ?? 0) > 0;
      } else {
        return (month.combinedTotalDpu ?? month.totalDpu ?? 0) > 0;
      }
    });
    
    return monthsWithData.length > 0 ? monthsWithData[monthsWithData.length - 1] : null;
  };

  // Fallback to basic data if metrics are null - use last month with actual data
  const lastProductionMonth = getLastMonthWithData('PRODUCTION TOTALS');
  const lastDpdiMonth = getLastMonthWithData('DPDI TOTALS');
  const lastCombinedMonth = getLastMonthWithData('COMBINED TOTALS');

  const safeProductionMetrics = productionMetrics || {
    currentDPU: lastProductionMonth ? (lastProductionMonth.productionTotalDpu ?? lastProductionMonth.totalDpu ?? 0) : 0,
    buildVolume: lastProductionMonth ? (lastProductionMonth.signoutVolume ?? 0) : 0, // Use signout volume
    totalFaults: lastProductionMonth ? (lastProductionMonth.productionTotalFaults ?? lastProductionMonth.totalFaults ?? 0) : 0,
    momChange: 0,
    ytdAverage: 0,
    ytdImprovement: 0,
    faultRate: 0
  };

  const safeDpdiMetrics = dpdiMetrics || {
    currentDPU: lastDpdiMonth ? (lastDpdiMonth.dpdiTotalDpu ?? 0) : 0,
    buildVolume: lastDpdiMonth ? (lastDpdiMonth.signoutVolume ?? 0) : 0, // Use signout volume
    totalFaults: lastDpdiMonth ? (lastDpdiMonth.dpdiTotalFaults ?? 0) : 0,
    momChange: 0,
    ytdAverage: 0,
    ytdImprovement: 0,
    faultRate: 0
  };

  // Safe metrics for current report type
  const safeCurrentMetrics = currentMetrics || {
    currentDPU: 0,
    buildVolume: 0,
    totalFaults: 0,
    momChange: 0,
    ytdAverage: 0,
    ytdImprovement: 0,
    faultRate: 0
  };


  // Get targets based on report type
  const getCurrentTarget = () => {
    if (reportType === 'combined') {
      return yearTargets?.combinedTarget || 8.2;
    } else if (reportType === 'production') {
      return yearTargets?.productionTarget || 8.2;
    } else if (reportType === 'dpdi') {
      return yearTargets?.dpdiTarget || 0;
    } else if (reportType === 'stage' && stageName) {
      // For individual stages, use the stage-specific target or fallback to combined
      return yearTargets?.stageTargets?.[stageName.toLowerCase().replace(/\s+/g, '_')] || yearTargets?.combinedTarget || 8.2;
    }
    return yearTargets?.combinedTarget || 8.2;
  };

  const currentTargets = getCurrentTarget();
  const productionTarget = yearTargets?.productionTarget || 8.2;
  const dpdiTarget = yearTargets?.dpdiTarget || 0;

  // Get active interventions
  const activeInterventions = interventionPlans.filter(plan => 
    plan.interventions.some(int => int.status !== 'Cancelled')
  );

  const totalExpectedImpact = activeInterventions.reduce((sum, plan) => 
    sum + (plan.projections?.totalExpectedImpact || 0), 0
  );

  const averageConfidence = activeInterventions.length > 0 ? 
    activeInterventions.reduce((sum, plan) => sum + (plan.projections?.confidenceScore || 0), 0) / activeInterventions.length : 0;

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
      // Get current theme from the document
      const currentTheme = document.documentElement.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
      
      // Try the simple PDF method first
      const response = await fetch('/api/simple-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: currentTheme }),
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

  if (isLoading || !dataLoaded || loading) {
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
              <h1 className="text-xl font-bold text-black">
                {reportType === 'combined' ? 'Combined Quality Performance Report' :
                 reportType === 'production' ? 'Production Quality Performance Report' :
                 reportType === 'dpdi' ? 'DPDI Quality Performance Report' :
                 reportType === 'stage' && stageName ? `${stageName} Quality Performance Report` :
                 'LOADALL Quality Performance Report'}
              </h1>
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

      {/* Enhanced Report Content */}
      <div className={`w-full transition-colors duration-300 ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`max-w-none mx-auto shadow-2xl border-t-4 border-yellow-500 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          {data.length > 0 ? (
            <div className="p-8">
              {/* Executive Summary */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black p-6 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold">JCB QUALITY PERFORMANCE REPORT</h1>
                      <p className="text-lg mt-2">
                        Month Ending: {new Date().toLocaleDateString('en-GB')} • Generated: {new Date().toLocaleDateString('en-GB')} • Digital Factory Quality Management
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-yellow-400 font-bold text-xl">JCB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Executive Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Current Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Combined DPU:</span>
                        <span className="font-bold text-2xl text-red-600">{formatDPU(safeCurrentMetrics.currentDPU)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(currentTargets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gap:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) > currentTargets ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDPU((safeCurrentMetrics.currentDPU) - currentTargets)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Trend Analysis</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Month-over-Month:</span>
                        <span className={`font-bold flex items-center ${(safeCurrentMetrics.momChange) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeCurrentMetrics.momChange) < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
                          {Math.abs(safeCurrentMetrics.momChange).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">YTD Average:</span>
                        <span className="font-bold text-lg text-blue-600">{formatDPU(safeCurrentMetrics.ytdAverage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">YTD Improvement:</span>
                        <span className="font-bold text-lg text-green-600">{Math.abs(safeCurrentMetrics.ytdImprovement).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Intervention Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Plans:</span>
                        <span className="font-bold text-2xl text-purple-600">{activeInterventions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Impact:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(Math.abs(totalExpectedImpact))} DPU</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-bold text-lg text-blue-600">{Math.round(averageConfidence)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Key Performance Indicators</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Current DPU */}
                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 text-center shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">CURRENT DPU</h3>
                    <div className="text-4xl font-bold text-yellow-600 mb-2">{formatDPU(safeCurrentMetrics.currentDPU)}</div>
                    <div className={`flex items-center justify-center text-sm ${(safeCurrentMetrics.momChange) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(safeCurrentMetrics.momChange) < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
                      {Math.abs(safeCurrentMetrics.momChange).toFixed(1)}% vs last month
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Target: {formatDPU(currentTargets)}</div>
                  </div>

                  {/* Build Volume */}
                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 text-center shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">BUILD VOLUME</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">{formatNumber(safeCurrentMetrics.buildVolume)}</div>
                    <div className="text-sm text-gray-600">Units Built</div>
                  </div>

                  {/* Total Faults */}
                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 text-center shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">TOTAL FAULTS</h3>
                    <div className="text-4xl font-bold text-red-600 mb-2">{formatNumber(safeCurrentMetrics.totalFaults)}</div>
                    <div className="text-sm text-gray-600">Fault Rate: {(safeCurrentMetrics.faultRate).toFixed(1)} per 1000 units</div>
                  </div>

                  {/* YTD Improvement */}
                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 text-center shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">YTD IMPROVEMENT</h3>
                    <div className="text-4xl font-bold text-green-600 mb-2">{Math.abs(safeCurrentMetrics.ytdImprovement).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">{formatDPU(Math.abs(safeCurrentMetrics.ytdImprovement) * (safeCurrentMetrics.ytdAverage) / 100)} DPU reduction</div>
                  </div>
                </div>
              </div>

              {/* Three Totals Breakdown */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance by Area</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Production Totals */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-blue-800 mb-4">Production Totals</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">DPU:</span>
                        <span className="font-bold text-lg text-blue-600">{formatDPU(safeProductionMetrics.currentDPU)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Build Volume:</span>
                        <span className="font-bold text-lg text-blue-600">{formatNumber(safeProductionMetrics.buildVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Faults:</span>
                        <span className="font-bold text-lg text-blue-600">{formatNumber(safeProductionMetrics.totalFaults)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(productionTarget)}</span>
                      </div>
                    </div>
                  </div>

                  {/* DPDI Totals */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-green-800 mb-4">DPDI Totals</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">DPU:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(safeDpdiMetrics.currentDPU)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Build Volume:</span>
                        <span className="font-bold text-lg text-green-600">{formatNumber(safeDpdiMetrics.buildVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Faults:</span>
                        <span className="font-bold text-lg text-green-600">{formatNumber(safeDpdiMetrics.totalFaults)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(dpdiTarget)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Combined Totals */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-yellow-800 mb-4">Combined Totals</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">DPU:</span>
                        <span className="font-bold text-lg text-yellow-600">{formatDPU(safeCurrentMetrics.currentDPU)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Build Volume:</span>
                        <span className="font-bold text-lg text-yellow-600">{formatNumber(safeCurrentMetrics.buildVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Faults:</span>
                        <span className="font-bold text-lg text-yellow-600">{formatNumber(safeCurrentMetrics.totalFaults)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(currentTargets)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-yellow-600" />
                  Performance Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Quality Improvement Insight */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center mb-4">
                      <TrendingDown className="w-6 h-6 text-green-600 mr-2" />
                      <h3 className="text-lg font-bold text-green-800">Quality Improvement</h3>
                    </div>
                    <p className="text-gray-700 mb-3">
                      DPU improved by {Math.abs(safeCurrentMetrics.momChange).toFixed(1)}% month-over-month - strong performance momentum
                    </p>
                    <div className="text-sm text-green-600 font-semibold">
                      Continue current improvement strategies
                    </div>
                  </div>

                  {/* Intervention Impact Insight */}
                  {activeInterventions.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-6 shadow-lg">
                      <div className="flex items-center mb-4">
                        <Target className="w-6 h-6 text-purple-600 mr-2" />
                        <h3 className="text-lg font-bold text-purple-800">Intervention Impact</h3>
                      </div>
                      <p className="text-gray-700 mb-3">
                        Active improvement plans expected to deliver {formatDPU(Math.abs(totalExpectedImpact))} DPU reduction with {Math.round(averageConfidence)}% confidence
                      </p>
                      <div className="text-sm text-purple-600 font-semibold">
                        Monitor intervention progress closely
                      </div>
                    </div>
                  )}

                  {/* Risk Assessment Insight */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center mb-4">
                      <AlertTriangle className="w-6 h-6 text-orange-600 mr-2" />
                      <h3 className="text-lg font-bold text-orange-800">Risk Assessment</h3>
                    </div>
                    <p className="text-gray-700 mb-3">
                      {(safeCurrentMetrics.currentDPU) > currentTargets ? 
                        'Current performance exceeds target - immediate attention required' :
                        'Performance within target range - maintain current trajectory'
                      }
                    </p>
                    <div className="text-sm text-orange-600 font-semibold">
                      {(safeCurrentMetrics.currentDPU) > currentTargets ? 
                        'Review and accelerate improvement plans' :
                        'Continue monitoring and optimization'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Trajectory Performance Analysis */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Trajectory Performance Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Target Glide Path */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center mb-4">
                      <Target className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-bold text-blue-800">Target Glide Path</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Path:</span>
                        <span className="font-bold text-blue-600">
                          {formatDPU(safeCurrentMetrics.ytdAverage)} → {formatDPU(currentTargets)} DPU
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Required Rate:</span>
                        <span className="font-bold text-blue-600">
                          {formatDPU(Math.abs((safeCurrentMetrics.ytdAverage) - currentTargets) / 12)} DPU/month
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) <= currentTargets ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeCurrentMetrics.currentDPU) <= currentTargets ? 'On Track' : 'Behind Target'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-bold text-blue-600">
                          {Math.round(Math.abs(((safeCurrentMetrics.currentDPU) - (safeCurrentMetrics.ytdAverage)) / ((safeCurrentMetrics.ytdAverage) - currentTargets)) * 100)}% Complete
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Trajectory */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center mb-4">
                      <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                      <h3 className="text-lg font-bold text-green-800">Performance Trajectory</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trend:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.momChange) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeCurrentMetrics.momChange) < 0 ? 'Improving' : 'Deteriorating'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Rate:</span>
                        <span className="font-bold text-green-600">
                          {formatDPU(Math.abs(safeCurrentMetrics.momChange) * (safeCurrentMetrics.currentDPU) / 100)} DPU/month
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Projection:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) <= currentTargets ? 'text-green-600' : 'text-yellow-600'}`}>
                          {(safeCurrentMetrics.currentDPU) <= currentTargets ? 'On Track' : 'May Miss Target'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Consistency:</span>
                        <span className="font-bold text-green-600">
                          {Math.abs(safeCurrentMetrics.momChange) < 5 ? 'Stable' : 'Variable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gap Analysis */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center mb-4">
                      <AlertTriangle className="w-6 h-6 text-orange-600 mr-2" />
                      <h3 className="text-lg font-bold text-orange-800">Gap Analysis</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Gap:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) > currentTargets ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDPU((safeCurrentMetrics.currentDPU) - currentTargets)} DPU
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Now:</span>
                        <span className="font-bold text-orange-600">{formatDPU(currentTargets)} DPU</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actual DPU:</span>
                        <span className="font-bold text-orange-600">{formatDPU(safeCurrentMetrics.currentDPU)} DPU</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Acceleration:</span>
                        <span className="font-bold text-orange-600">
                          {formatDPU(Math.abs((safeCurrentMetrics.currentDPU) - currentTargets) / 12)} DPU/month
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Forecast */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center mb-4">
                      <Target className="w-6 h-6 text-purple-600 mr-2" />
                      <h3 className="text-lg font-bold text-purple-800">Forecast</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dec Projection:</span>
                        <span className="font-bold text-purple-600">
                          {formatDPU((safeCurrentMetrics.currentDPU) + ((safeCurrentMetrics.momChange) * (safeCurrentMetrics.currentDPU) / 100) * 3)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Likelihood:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) <= currentTargets ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeCurrentMetrics.currentDPU) <= currentTargets ? 'High' : 'Low'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Action Required:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) > currentTargets ? 'text-red-600' : 'text-green-600'}`}>
                          {(safeCurrentMetrics.currentDPU) > currentTargets ? 'Critical' : 'Monitor'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Level:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) > currentTargets * 1.5 ? 'text-red-600' : (safeCurrentMetrics.currentDPU) > currentTargets ? 'text-yellow-600' : 'text-green-600'}`}>
                          {(safeCurrentMetrics.currentDPU) > currentTargets * 1.5 ? 'High' : (safeCurrentMetrics.currentDPU) > currentTargets ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Interventions */}
              {activeInterventions.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Improvement Plans</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeInterventions.map((plan, index) => (
                      <div key={index} className="bg-white border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{plan.stageName}</h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{plan.interventions.length}</div>
                            <div className="text-sm text-gray-600">Active Plans</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{formatDPU(Math.abs(plan.projections?.totalExpectedImpact || 0))}</div>
                            <div className="text-sm text-gray-600">Expected Impact</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{Math.round(plan.projections?.confidenceScore || 0)}%</div>
                            <div className="text-sm text-gray-600">Confidence</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {plan.interventions.slice(0, 3).map((intervention, intIndex) => (
                            <div key={intIndex} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">{intervention.title}</div>
                                <div className="text-sm text-gray-600">{intervention.type} • {intervention.owner}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-green-600">{formatDPU(Math.abs(intervention.estimatedDPUReduction))} DPU</div>
                                <div className={`text-xs px-2 py-1 rounded ${
                                  intervention.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  intervention.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {intervention.status}
                                </div>
                              </div>
                            </div>
                          ))}
                          {plan.interventions.length > 3 && (
                            <div className="text-center text-sm text-gray-500">
                              +{plan.interventions.length - 3} more interventions
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage Performance Analysis */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Stage Performance Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Production Stage */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-blue-800 mb-4">Production Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current DPU:</span>
                        <span className="font-bold text-lg text-blue-600">{formatDPU(safeProductionMetrics.currentDPU)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(productionTarget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gap:</span>
                        <span className={`font-bold ${(safeProductionMetrics.currentDPU) > productionTarget ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDPU((safeProductionMetrics.currentDPU) - productionTarget)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-bold ${(safeProductionMetrics.currentDPU) <= productionTarget ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeProductionMetrics.currentDPU) <= productionTarget ? 'On Track' : 'Behind Target'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Build Volume:</span>
                        <span className="font-bold text-lg text-blue-600">{formatNumber(safeProductionMetrics.buildVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fault Rate:</span>
                        <span className="font-bold text-lg text-blue-600">{(safeProductionMetrics.faultRate).toFixed(1)} per 1000</span>
                      </div>
                    </div>
                  </div>

                  {/* DPDI Stage */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-green-800 mb-4">DPDI Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current DPU:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(safeDpdiMetrics.currentDPU)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(dpdiTarget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gap:</span>
                        <span className={`font-bold ${(safeDpdiMetrics.currentDPU) > dpdiTarget ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDPU((safeDpdiMetrics.currentDPU) - dpdiTarget)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-bold ${(safeDpdiMetrics.currentDPU) <= dpdiTarget ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeDpdiMetrics.currentDPU) <= dpdiTarget ? 'On Track' : 'Behind Target'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Build Volume:</span>
                        <span className="font-bold text-lg text-green-600">{formatNumber(safeDpdiMetrics.buildVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fault Rate:</span>
                        <span className="font-bold text-lg text-green-600">{(safeDpdiMetrics.faultRate).toFixed(1)} per 1000</span>
                      </div>
                    </div>
                  </div>

                  {/* Combined Performance */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-yellow-800 mb-4">Combined Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current DPU:</span>
                        <span className="font-bold text-lg text-yellow-600">{formatDPU(safeCurrentMetrics.currentDPU)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-bold text-lg text-green-600">{formatDPU(currentTargets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gap:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) > currentTargets ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDPU((safeCurrentMetrics.currentDPU) - currentTargets)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-bold ${(safeCurrentMetrics.currentDPU) <= currentTargets ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeCurrentMetrics.currentDPU) <= currentTargets ? 'On Track' : 'Behind Target'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Build Volume:</span>
                        <span className="font-bold text-lg text-yellow-600">{formatNumber(safeCurrentMetrics.buildVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fault Rate:</span>
                        <span className="font-bold text-lg text-yellow-600">{(safeCurrentMetrics.faultRate).toFixed(1)} per 1000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Charts */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance Trends & Analysis</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* DPU Trend Chart */}
                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">DPU Trend Analysis</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Interactive Chart</p>
                        <p className="text-sm text-gray-500">
                          Current: {formatDPU(safeCurrentMetrics.currentDPU)} DPU<br/>
                          Target: {formatDPU(currentTargets)} DPU<br/>
                          Trend: {(safeCurrentMetrics.momChange) < 0 ? 'Improving' : 'Deteriorating'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{formatDPU(safeProductionMetrics.currentDPU)}</div>
                        <div className="text-sm text-gray-600">Production</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{formatDPU(safeDpdiMetrics.currentDPU)}</div>
                        <div className="text-sm text-gray-600">DPDI</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{formatDPU(safeCurrentMetrics.currentDPU)}</div>
                        <div className="text-sm text-gray-600">Combined</div>
                      </div>
                    </div>
                  </div>

                  {/* Build Volume vs DPU Correlation */}
                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Build Volume vs DPU Correlation</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Target className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Correlation Analysis</p>
                        <p className="text-sm text-gray-500">
                          Volume: {formatNumber(safeCurrentMetrics.buildVolume)} units<br/>
                          DPU: {formatDPU(safeCurrentMetrics.currentDPU)}<br/>
                          Rate: {(safeCurrentMetrics.faultRate).toFixed(1)} per 1000
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{formatNumber(safeCurrentMetrics.buildVolume)}</div>
                        <div className="text-sm text-gray-600">Total Volume</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{formatNumber(safeCurrentMetrics.totalFaults)}</div>
                        <div className="text-sm text-gray-600">Total Faults</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage Performance Comparison */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Stage Performance Comparison</h3>
                  <div className="bg-white border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{formatDPU(safeProductionMetrics.currentDPU)}</div>
                        <div className="text-lg font-semibold text-blue-800 mb-1">Production</div>
                        <div className="text-sm text-gray-600">Target: {formatDPU(productionTarget)}</div>
                        <div className={`text-sm font-bold ${(safeProductionMetrics.currentDPU) <= productionTarget ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeProductionMetrics.currentDPU) <= productionTarget ? 'On Track' : 'Behind'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">{formatDPU(safeDpdiMetrics.currentDPU)}</div>
                        <div className="text-lg font-semibold text-green-800 mb-1">DPDI</div>
                        <div className="text-sm text-gray-600">Target: {formatDPU(dpdiTarget)}</div>
                        <div className={`text-sm font-bold ${(safeDpdiMetrics.currentDPU) <= dpdiTarget ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeDpdiMetrics.currentDPU) <= dpdiTarget ? 'On Track' : 'Behind'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600 mb-2">{formatDPU(safeCurrentMetrics.currentDPU)}</div>
                        <div className="text-lg font-semibold text-yellow-800 mb-1">Combined</div>
                        <div className="text-sm text-gray-600">Target: {formatDPU(currentTargets)}</div>
                        <div className={`text-sm font-bold ${(safeCurrentMetrics.currentDPU) <= currentTargets ? 'text-green-600' : 'text-red-600'}`}>
                          {(safeCurrentMetrics.currentDPU) <= currentTargets ? 'On Track' : 'Behind'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items & Recommendations */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Action Items & Recommendations</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Critical Actions
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {(safeCurrentMetrics.currentDPU) > currentTargets && (
                        <li className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span className="text-red-800">Accelerate improvement plans to meet year-end target</span>
                        </li>
                      )}
                      {(safeCurrentMetrics.momChange) > 0 && (
                        <li className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span className="text-red-800">Address deteriorating trend immediately</span>
                        </li>
                      )}
                      {activeInterventions.length === 0 && (
                        <li className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span className="text-red-800">Develop intervention plans for underperforming areas</span>
                        </li>
                      )}
                      {/* Always show at least one critical action */}
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span className="text-red-800">Review current DPU performance and implement immediate corrective actions</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Important Actions
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        <span className="text-yellow-800">Monitor intervention progress and adjust timelines</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        <span className="text-yellow-800">Review and optimize process improvements</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        <span className="text-yellow-800">Share best practices across production areas</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        <span className="text-yellow-800">Conduct regular quality audits and assessments</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Opportunities
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {(safeCurrentMetrics.momChange) < 0 && (
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-green-800">Leverage current improvement momentum</span>
                        </li>
                      )}
                      {activeInterventions.length > 0 && (
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-green-800">Scale successful interventions to other areas</span>
                        </li>
                      )}
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span className="text-green-800">Implement predictive quality analytics</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span className="text-green-800">Explore advanced quality management technologies</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span className="text-green-800">Develop cross-functional quality improvement teams</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Report Summary */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black p-6 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4">Report Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-black">{formatDPU(safeCurrentMetrics.currentDPU)}</div>
                      <div className="text-sm font-semibold">Current Combined DPU</div>
                      <div className="text-xs text-gray-700">Target: {formatDPU(currentTargets)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-black">{formatNumber(safeCurrentMetrics.buildVolume)}</div>
                      <div className="text-sm font-semibold">Total Build Volume</div>
                      <div className="text-xs text-gray-700">Units Produced</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-black">{activeInterventions.length}</div>
                      <div className="text-sm font-semibold">Active Interventions</div>
                      <div className="text-xs text-gray-700">Improvement Plans</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-black">{Math.abs(safeCurrentMetrics.ytdImprovement).toFixed(1)}%</div>
                      <div className="text-sm font-semibold">YTD Improvement</div>
                      <div className="text-xs text-gray-700">Performance Gain</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
