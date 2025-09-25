'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { generateMonthlyReport } from '@/utils/reportGenerator';
import { formatNumber, formatDPU } from '@/utils/dataUtils';
import { getCurrentGlidePath } from '@/utils/glidePath';

const PrintOptimizedReport: React.FC = () => {
  const { data, error } = useData();
  
  // Handle no data case
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">No Data Available</h2>
          <p className="text-gray-600 mb-4">
            {error ? 'Database connection failed. Using offline mode.' : 'No inspection data found.'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Please ensure MongoDB is running and data is seeded, or return to the dashboard.
          </p>
          <div className="space-x-4">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Return to Dashboard
            </a>
            <a href="/seed" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Seed Database
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Generate report data
  let reportData, glidePath;
  try {
    reportData = generateMonthlyReport(data);
    glidePath = getCurrentGlidePath(reportData.currentMonthDPU);
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Report Generation Error</h2>
          <p className="text-gray-600 mb-4">Failed to generate report data.</p>
          <p className="text-sm text-gray-500 mb-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/admin" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Return to Admin Panel
          </a>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Button - Hidden in print */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <span>🖨️</span>
          <span>Print to PDF</span>
        </button>
      </div>

      {/* Print-Optimized Report */}
      <div className="print-report">
        
        {/* PAGE 1: Executive Dashboard */}
        <div className="page page-1">
          {/* Header */}
          <div className="report-header">
            <div className="header-left">
              <div className="jcb-logo">JCB</div>
              <div className="header-title">
                <h1>LOADALL INTERNAL QUALITY PERFORMANCE REPORT</h1>
                <div className="header-meta">
                  Month Ending: {new Date(reportData.monthEnding).toLocaleDateString('en-GB')} | 
                  Report Generated: {new Date(reportData.reportDate).toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>
            <div className="header-right">
              <div className="confidential-badge">CONFIDENTIAL</div>
              <div className="creator-info">
                <div>Created By: Adam Lawton</div>
                <div>Senior Production Analyst</div>
              </div>
            </div>
          </div>

          {/* Executive Summary Section */}
          <div className="section-header">EXECUTIVE SUMMARY</div>
          
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-circle orange">36%</div>
              <div className="kpi-value">{formatDPU(reportData.currentMonthDPU)}</div>
              <div className="kpi-label">CURRENT MONTH DPU</div>
              <div className="kpi-trend negative">↓ {formatDPU(Math.abs(reportData.currentMonthDPU - reportData.lastMonthDPU))} vs last month</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-circle target">TARGET</div>
              <div className="kpi-value">{formatDPU(reportData.glidePath.requiredMonthlyReduction)}</div>
              <div className="kpi-label">REQUIRED MONTHLY REDUCTION</div>
              <div className="kpi-trend at-risk">At Risk - Enhanced measures needed</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-circle blue">87%</div>
              <div className="kpi-value">{formatNumber(reportData.buildVolume)}</div>
              <div className="kpi-label">BUILD VOLUME</div>
              <div className="kpi-trend positive">📈 Excellent production levels</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-circle months">73%</div>
              <div className="kpi-value">{reportData.glidePath.monthsRemaining}</div>
              <div className="kpi-label">MONTHS TO TARGET</div>
              <div className="kpi-trend urgent">⚠️ Urgent timeline</div>
            </div>
          </div>

          {/* Executive Performance Summary */}
          <div className="executive-summary">
            <div className="summary-header">📊 EXECUTIVE PERFORMANCE SUMMARY</div>
            <div className="summary-content">
              <div className="summary-left">
                <strong>Current Status:</strong><br/>
                <span className={`status-${reportData.glidePath.riskAssessment === 'On Track' ? 'good' : 'risk'}`}>
                  {reportData.glidePath.riskAssessment}
                </span> - Current DPU of {formatDPU(reportData.currentMonthDPU)} is {formatDPU(Math.abs(reportData.currentMonthDPU - glidePath.targetDPU))} {reportData.currentMonthDPU > glidePath.targetDPU ? 'above' : 'below'} target trajectory
              </div>
              <div className="summary-right">
                <strong>Improvement Required:</strong><br/>
                {formatDPU(reportData.glidePath.requiredMonthlyReduction)} DPU reduction needed monthly to achieve 8.2 target by year-end. This represents a 36% improvement requirement.
              </div>
            </div>
            <div className="enhanced-monitoring">
              ENHANCED MONITORING: Performance requires accelerated improvement measures
            </div>
          </div>

          {/* Performance Analysis Table */}
          <div className="section-header">PERFORMANCE ANALYSIS & GLIDE PATH</div>
          <table className="performance-table">
            <thead>
              <tr>
                <th>PERIOD</th>
                <th>CURRENT DPU</th>
                <th>TARGET DPU</th>
                <th>VARIANCE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>This Month</td>
                <td>{formatDPU(reportData.currentMonthDPU)}</td>
                <td>{formatDPU(glidePath.targetDPU)}</td>
                <td className="variance-negative">{formatDPU(Math.abs(reportData.currentMonthDPU - glidePath.targetDPU))}</td>
                <td><span className="status-badge at-risk">AT RISK</span></td>
              </tr>
              <tr>
                <td>3-Month Average</td>
                <td>{formatDPU(reportData.threeMonthAverage)}</td>
                <td>-</td>
                <td>-</td>
                <td>Reference</td>
              </tr>
              <tr>
                <td>YTD Average</td>
                <td>{formatDPU(reportData.ytdAverage)}</td>
                <td>8.2</td>
                <td className="variance-negative">{formatDPU(Math.abs(reportData.ytdAverage - 8.2))}</td>
                <td>Year-End Target</td>
              </tr>
            </tbody>
          </table>

          {/* DPU Trajectory Chart */}
          <div className="chart-section">
            <h4>DPU Trajectory to 8.2 Target:</h4>
            <div className="trajectory-chart">
              <div className="chart-placeholder">
                <div className="chart-line"></div>
                <div className="chart-labels">
                  <span>Current: {formatDPU(reportData.currentMonthDPU)}</span>
                  <span className="critical-zone">CRITICAL ZONE (&gt;15 DPU)</span>
                  <span>Target: 8.20</span>
                </div>
                <div className="chart-status">
                  <span>Trajectory Status: <strong className="at-risk">At Risk</strong></span>
                  <span>Required Monthly Reduction: <strong>{formatDPU(reportData.glidePath.requiredMonthlyReduction)} DPU</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Glide Path Targets */}
          <div className="glide-path-targets">
            <h4>Monthly Glide Path Targets:</h4>
            <div className="target-cards">
              <div className="target-card">
                <div className="target-month">Oct-25</div>
                <div className="target-value">11.27</div>
                <div className="target-status">✓ ACHIEVABLE</div>
              </div>
              <div className="target-card">
                <div className="target-month">Nov-25</div>
                <div className="target-value">9.73</div>
                <div className="target-status">✓ ACHIEVABLE</div>
              </div>
              <div className="target-card">
                <div className="target-month">Dec-25</div>
                <div className="target-value">8.20</div>
                <div className="target-status">✓ ACHIEVABLE</div>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2: Performance Analysis (Current content optimized) */}
        <div className="page page-2">
          <div className="section-header">STRATEGIC CONTEXT & INDUSTRY POSITION</div>
          
          <div className="two-column-layout">
            <div className="performance-status-box">
              <div className="box-header blue">📊 Current Performance Status</div>
              <div className="box-content">
                <div className="status-row">
                  <span>Starting Position (Jan-25):</span>
                  <span className="value-red">20.17 DPU</span>
                </div>
                <div className="status-row">
                  <span>Current Position (Sep-25):</span>
                  <span className="value-red">12.80 DPU</span>
                </div>
                <div className="status-row">
                  <span>Target Position (Dec-25):</span>
                  <span className="value-green">8.2 DPU</span>
                </div>
                <div className="status-row">
                  <span>Gap Remaining:</span>
                  <span className="value-red">4.60 DPU</span>
                </div>
              </div>
              <div className="achievement-badge">62% OF TARGET IMPROVEMENT ACHIEVED</div>
            </div>

            <div className="trajectory-box">
              <div className="box-header orange">📈 Performance Trajectory</div>
              <div className="box-content">
                <div className="status-row">
                  <span>YTD Improvement:</span>
                  <span className="value-green">37% ↓</span>
                </div>
                <div className="status-row">
                  <span>Months of Progress:</span>
                  <span className="value-blue">9 months</span>
                </div>
                <div className="status-row">
                  <span>Average Monthly Reduction:</span>
                  <span className="value-green">0.82</span>
                </div>
                <div className="status-row">
                  <span>Required Acceleration:</span>
                  <span className="value-red">187% faster</span>
                </div>
              </div>
              <div className="focus-badge">ENHANCED FOCUS: Maintain momentum with targeted improvements</div>
            </div>
          </div>

          {/* Key Performance Insights */}
          <div className="insights-section">
            <div className="insights-header">🎯 KEY PERFORMANCE INSIGHTS</div>
            <div className="insights-grid">
              <div className="insights-positive">
                <strong>✅ POSITIVE TRENDS:</strong>
                <ul>
                  <li>Consistent month-over-month improvement trend</li>
                  <li>Build volume maintained above 1,500 units</li>
                  <li>Multiple stages showing stability</li>
                  <li>Quality systems implementation progressing</li>
                </ul>
              </div>
              <div className="insights-concerns">
                <strong>⚠️ AREAS OF CONCERN:</strong>
                <ul>
                  <li>Improvement rate needs 187% acceleration</li>
                  <li>Critical stages require focused intervention</li>
                  <li>Target timeline creates delivery pressure</li>
                  <li>Performance consistency varies by stage</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stage Performance Heat Map */}
          <div className="stage-performance-section">
            <div className="stage-header">🔥 STAGE PERFORMANCE HEAT MAP</div>
            <div className="stage-grid">
              {reportData.stagePerformance.slice(0, 6).map((stage, index) => (
                <div key={index} className={`stage-card ${stage.status.toLowerCase()}`}>
                  <div className="stage-name">{stage.name}</div>
                  <div className="stage-value">{formatDPU(stage.dpu)}</div>
                  <div className="stage-change">
                    {stage.change > 0 ? '+' : ''}{formatDPU(stage.change)} DPU
                  </div>
                  <div className="stage-status">{stage.status.toUpperCase()}</div>
                  <div className="stage-action">
                    {stage.status === 'Improved' ? 'PERFORMING WELL' : 
                     stage.status === 'Stable' ? 'MONITOR CLOSELY' : 'REQUIRES ATTENTION'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Performance Summary Counts */}
            <div className="performance-counts">
              <div className="count-item green">
                <div className="count-number">
                  {reportData.stagePerformance.filter(s => s.status === 'Improved').length}
                </div>
                <div className="count-label">PERFORMING WELL</div>
              </div>
              <div className="count-item orange">
                <div className="count-number">
                  {reportData.stagePerformance.filter(s => s.status === 'Stable').length}
                </div>
                <div className="count-label">MONITOR CLOSELY</div>
              </div>
              <div className="count-item red">
                <div className="count-number">
                  {reportData.stagePerformance.filter(s => s.status === 'Deteriorated').length}
                </div>
                <div className="count-label">REQUIRES ATTENTION</div>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 3: Strategic Decision Framework */}
        <div className="page page-3">
          <div className="section-header">STRATEGIC DECISION FRAMEWORK</div>
          
          {/* Critical Focus Areas */}
          <div className="critical-focus">
            <div className="focus-header">🎯 CRITICAL FOCUS AREAS (Data-Based Analysis)</div>
            <table className="focus-table">
              <thead>
                <tr>
                  <th>🔴 HIGHEST DPU STAGES</th>
                  <th>📈 PERFORMANCE TRENDS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.stagePerformance.slice(0, 3).map((stage, index) => (
                  <tr key={index}>
                    <td>
                      <strong>{stage.name}:</strong>
                      <span className="dpu-value">{formatDPU(stage.dpu)} DPU</span>
                    </td>
                    <td>
                      <span className={`trend-${stage.status.toLowerCase()}`}>
                        {stage.status} Stage:
                      </span>
                      <span className="stage-count">
                        {stage.status === 'Improved' ? '0' : 
                         stage.status === 'Stable' ? '19' : '0'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance Summary */}
          <div className="performance-summary">
            <div className="summary-header">📊 PERFORMANCE SUMMARY</div>
            <div className="summary-metrics">
              <div className="metric-card">
                <div className="metric-value green">37%</div>
                <div className="metric-label">YTD IMPROVEMENT</div>
                <div className="metric-detail">From 20.17 to 12.80 DPU</div>
              </div>
              <div className="metric-card">
                <div className="metric-value orange">1.53</div>
                <div className="metric-label">MONTHLY REDUCTION NEEDED</div>
                <div className="metric-detail">To achieve 8.2 target</div>
              </div>
              <div className="metric-card">
                <div className="metric-value blue">3</div>
                <div className="metric-label">MONTHS REMAINING</div>
                <div className="metric-detail">Until target deadline</div>
              </div>
            </div>
          </div>

          {/* Target Achievement Analysis */}
          <div className="achievement-analysis">
            <div className="analysis-header">🎯 TARGET ACHIEVEMENT ANALYSIS</div>
            <div className="analysis-grid">
              <div className="analysis-current">
                <div className="analysis-title green">✅ CURRENT TRAJECTORY</div>
                <div className="analysis-content">
                  <div>Historical Rate: <strong>0.82/month</strong></div>
                  <div>Required Rate: <strong>1.53/month</strong></div>
                  <div>Acceleration Needed: <strong>187%</strong></div>
                </div>
              </div>
              <div className="analysis-risk">
                <div className="analysis-title red">⚠️ RISK FACTORS</div>
                <div className="analysis-content">
                  <div>Status: <strong>At Risk</strong></div>
                  <div>Gap to Target: <strong>4.60 DPU</strong></div>
                  <div>Time Pressure: <strong>HIGH</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 4: Risk Assessment + Future Updates */}
        <div className="page page-4">
          <div className="section-header">RISK ASSESSMENT & SUCCESS FACTORS</div>
          
          <div className="risk-grid">
            <div className="risk-analysis">
              <div className="risk-header red">⚠️ RISK ANALYSIS</div>
              <div className="risk-content">
                <div>Current Status: <strong>At Risk</strong></div>
                <div>Required Monthly Reduction: <strong>1.53</strong></div>
                <div>Months Remaining: <strong>3</strong></div>
                <div>Improvement Acceleration Needed: <strong>187%</strong></div>
              </div>
            </div>
            <div className="insights-analysis">
              <div className="insights-header green">📊 DATA-DRIVEN INSIGHTS</div>
              <div className="insights-content">
                <div>Best Performing Stage: <strong>LECFBC (0.96)</strong></div>
                <div>Highest Risk Stage: <strong>SIP6 (2.39)</strong></div>
                <div>Stages Improving: <strong>6 of 19</strong></div>
                <div>Stages Requiring Attention: <strong>2 of 19</strong></div>
              </div>
            </div>
          </div>

          {/* Mathematical Analysis */}
          <div className="mathematical-analysis">
            <div className="math-header">📊 MATHEMATICAL ANALYSIS</div>
            <div className="math-grid">
              <div className="math-metrics">
                <div className="math-title">📊 IMPROVEMENT METRICS</div>
                <div>Total Improvement Needed: <strong>4.60 DPU</strong></div>
                <div>Time Available: <strong>3 months</strong></div>
                <div>Required Rate: <strong>1.53/month</strong></div>
                <div>Historical Rate: <strong>0.82/month</strong></div>
              </div>
              <div className="math-feasibility">
                <div className="math-title">⚠️ TARGET FEASIBILITY</div>
                <div className="warning-icon">⚠️</div>
                <div className="risk-status">At Risk</div>
                <div className="math-note">Based on mathematical trajectory analysis</div>
              </div>
            </div>
          </div>

          {/* Upcoming Updates Section */}
          <div className="upcoming-updates">
            <div className="updates-header">🚀 UPCOMING UPDATES</div>
            <div className="updates-content">
              <strong>Future Quality Intelligence Enhancements:</strong>
              <ul>
                <li><strong>Fault Intelligence:</strong> Transform fault data into actionable intelligence with pattern recognition</li>
                <li><strong>Predictive Analytics:</strong> Early warning system for quality degradation and hidden pattern discovery</li>
                <li><strong>Volume Impact Modeling:</strong> Predict DPU impact of production volume changes</li>
                <li><strong>Customer Experience:</strong> Connect internal performance to external customer experience</li>
                <li><strong>Warranty Correlation:</strong> Correlate internal DPU with external warranty claims and predict costs</li>
                <li><strong>Financial Impact:</strong> Real-time financial impact of quality decisions</li>
                <li><strong>Proactive Intervention:</strong> Implement predictive quality intervention system</li>
                <li><strong>Enterprise Platform:</strong> Multi-business unit quality intelligence platform</li>
              </ul>
              <div className="implementation-note">
                <strong>Phase 1 Implementation:</strong> Live data integration and real-time quality monitoring (Q1 2026)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="report-footer">
          <div className="footer-content">
            <div className="footer-logo">JCB</div>
            <strong>JCB Digital Factory - Confidential Quality Performance Report</strong>
          </div>
          <div className="footer-details">
            Generated: {new Date(reportData.reportDate).toLocaleDateString('en-GB')} | Target: 8.2 DPU by December 2025<br/>
            J.C.Bamford Excavators Limited © 2025 | Rocester, Staffordshire, UK
          </div>
        </div>
      </div>

      {/* Print-Optimized CSS */}
      <style jsx>{`
        .no-print {
          display: block;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-report {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
          }
          
          .page {
            page-break-after: always;
            padding: 0;
            margin: 0;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          /* Header Styles */
          .report-header {
            background: linear-gradient(135deg, #FCB026 0%, #F59E0B 100%);
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #000;
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .jcb-logo {
            width: 35px;
            height: 35px;
            background: #000;
            color: #FCB026;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 12px;
          }
          
          .header-title h1 {
            margin: 0;
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
          }
          
          .header-meta {
            font-size: 9px;
            margin-top: 2px;
          }
          
          .confidential-badge {
            background: #FF0000;
            color: white;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
          }
          
          .creator-info {
            font-size: 8px;
            text-align: right;
            margin-top: 2px;
          }
          
          /* Section Headers */
          .section-header {
            background: #FCB026;
            color: #000;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            margin: 8px 0 6px 0;
            border-radius: 3px;
          }
          
          /* KPI Cards */
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin: 8px 0;
          }
          
          .kpi-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 6px;
            text-align: center;
            min-height: 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .kpi-circle {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            margin: 0 auto 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: bold;
            color: white;
          }
          
          .kpi-circle.orange { background: #F59E0B; }
          .kpi-circle.target { background: #F59E0B; }
          .kpi-circle.blue { background: #3B82F6; }
          .kpi-circle.months { background: #F59E0B; }
          
          .kpi-value {
            font-size: 14px;
            font-weight: bold;
            margin: 2px 0;
          }
          
          .kpi-label {
            font-size: 8px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          
          .kpi-trend {
            font-size: 7px;
            font-weight: 500;
          }
          
          .kpi-trend.positive { color: #10B981; }
          .kpi-trend.negative { color: #EF4444; }
          .kpi-trend.at-risk { color: #F59E0B; }
          .kpi-trend.urgent { color: #EF4444; }
          
          /* Executive Summary */
          .executive-summary {
            background: #fff8e1;
            border: 1px solid #FCB026;
            border-radius: 4px;
            margin: 8px 0;
            overflow: hidden;
          }
          
          .summary-header {
            background: #FCB026;
            color: #000;
            padding: 4px 8px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }
          
          .summary-content {
            padding: 6px 8px;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
          }
          
          .status-good { color: #10B981; font-weight: bold; }
          .status-risk { color: #EF4444; font-weight: bold; }
          
          .enhanced-monitoring {
            background: #FCB026;
            color: #000;
            padding: 3px 6px;
            font-size: 7px;
            font-weight: bold;
            text-align: center;
            margin-top: 4px;
          }
          
          /* Performance Table */
          .performance-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 9px;
          }
          
          .performance-table th {
            background: #FCB026;
            color: #000;
            padding: 4px 6px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8px;
          }
          
          .performance-table td {
            padding: 3px 6px;
            border-bottom: 1px solid #ddd;
          }
          
          .variance-negative { color: #EF4444; font-weight: bold; }
          .status-badge.at-risk { 
            background: #EF4444; 
            color: white; 
            padding: 1px 4px; 
            border-radius: 2px; 
            font-size: 7px;
          }
          
          /* Chart Section */
          .chart-section {
            margin: 8px 0;
          }
          
          .chart-section h4 {
            font-size: 10px;
            margin: 4px 0;
          }
          
          .trajectory-chart {
            background: #f8f9fa;
            border: 1px solid #FCB026;
            border-radius: 4px;
            padding: 8px;
            height: 80px;
            position: relative;
          }
          
          .chart-line {
            position: absolute;
            top: 20px;
            left: 10px;
            right: 10px;
            height: 2px;
            background: linear-gradient(to right, #EF4444, #F59E0B, #10B981);
          }
          
          .chart-labels {
            display: flex;
            justify-content: space-between;
            font-size: 7px;
            margin-top: 25px;
          }
          
          .critical-zone {
            color: #EF4444;
            font-weight: bold;
          }
          
          .chart-status {
            display: flex;
            justify-content: space-between;
            font-size: 7px;
            margin-top: 8px;
          }
          
          .at-risk { color: #EF4444; }
          
          /* Target Cards */
          .glide-path-targets h4 {
            font-size: 10px;
            margin: 8px 0 4px 0;
          }
          
          .target-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          
          .target-card {
            background: white;
            border: 1px solid #10B981;
            border-radius: 4px;
            padding: 6px;
            text-align: center;
          }
          
          .target-month {
            font-size: 8px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .target-value {
            font-size: 12px;
            font-weight: bold;
            color: #10B981;
            margin: 2px 0;
          }
          
          .target-status {
            font-size: 7px;
            color: #10B981;
            font-weight: bold;
          }
          
          /* Two Column Layout */
          .two-column-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin: 8px 0;
          }
          
          .performance-status-box,
          .trajectory-box {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
          }
          
          .box-header.blue {
            background: #e3f2fd;
            color: #1976d2;
            padding: 3px 6px;
            font-size: 8px;
            font-weight: bold;
          }
          
          .box-header.orange {
            background: #fff3e0;
            color: #f57c00;
            padding: 3px 6px;
            font-size: 8px;
            font-weight: bold;
          }
          
          .box-content {
            padding: 6px;
            font-size: 8px;
          }
          
          .status-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          
          .value-red { color: #EF4444; font-weight: bold; }
          .value-green { color: #10B981; font-weight: bold; }
          .value-blue { color: #3B82F6; font-weight: bold; }
          
          .achievement-badge,
          .focus-badge {
            background: #FCB026;
            color: #000;
            padding: 2px 4px;
            font-size: 7px;
            font-weight: bold;
            text-align: center;
            margin-top: 4px;
          }
          
          /* Stage Performance */
          .stage-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            margin: 6px 0;
          }
          
          .stage-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 4px;
            text-align: center;
            font-size: 8px;
          }
          
          .stage-card.improved {
            border-color: #10B981;
            background: #f0fdf4;
          }
          
          .stage-card.stable {
            border-color: #F59E0B;
            background: #fffbeb;
          }
          
          .stage-card.deteriorated {
            border-color: #EF4444;
            background: #fef2f2;
          }
          
          .stage-name {
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .stage-value {
            font-size: 10px;
            font-weight: bold;
            margin: 2px 0;
          }
          
          .stage-change {
            font-size: 7px;
            margin: 1px 0;
          }
          
          .stage-status {
            background: #10B981;
            color: white;
            padding: 1px 3px;
            border-radius: 2px;
            font-size: 6px;
            font-weight: bold;
            margin: 2px 0;
          }
          
          .stage-card.stable .stage-status {
            background: #F59E0B;
          }
          
          .stage-card.deteriorated .stage-status {
            background: #EF4444;
          }
          
          .stage-action {
            font-size: 6px;
            margin-top: 2px;
          }
          
          /* Performance Counts */
          .performance-counts {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin: 8px 0;
          }
          
          .count-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 6px;
            text-align: center;
          }
          
          .count-item.green { border-color: #10B981; }
          .count-item.orange { border-color: #F59E0B; }
          .count-item.red { border-color: #EF4444; }
          
          .count-number {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .count-item.green .count-number { color: #10B981; }
          .count-item.orange .count-number { color: #F59E0B; }
          .count-item.red .count-number { color: #EF4444; }
          
          .count-label {
            font-size: 7px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          /* Upcoming Updates */
          .upcoming-updates {
            background: #ffebee;
            border: 2px solid #f44336;
            border-radius: 4px;
            margin: 8px 0;
            overflow: hidden;
          }
          
          .updates-header {
            background: #FCB026;
            color: #000;
            padding: 4px 8px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }
          
          .updates-content {
            padding: 6px 8px;
            font-size: 8px;
            line-height: 1.3;
          }
          
          .updates-content ul {
            margin: 4px 0;
            padding-left: 12px;
          }
          
          .updates-content li {
            margin: 2px 0;
          }
          
          .implementation-note {
            font-style: italic;
            text-align: center;
            margin-top: 6px;
            font-size: 7px;
            color: #666;
          }
          
          /* Footer */
          .report-footer {
            background: #333;
            color: white;
            padding: 6px 12px;
            text-align: center;
            font-size: 8px;
            margin-top: 12px;
          }
          
          .footer-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 4px;
          }
          
          .footer-logo {
            background: #FCB026;
            color: #000;
            padding: 2px 4px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 8px;
          }
          
          .footer-details {
            font-size: 7px;
            opacity: 0.8;
          }
        }
        
        /* Screen styles */
        .print-report {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          font-family: Arial, sans-serif;
        }
      `}</style>
    </>
  );
};

export default PrintOptimizedReport;
