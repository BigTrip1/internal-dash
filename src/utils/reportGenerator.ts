/**
 * JCB Weekly Quality Performance Report Generator
 * Generates comprehensive weekly reports for management
 */

import { InspectionData } from '@/types';
import { formatNumber, formatDPU } from './dataUtils';
import { getCurrentGlidePath, getMonthlyProgress, GlidePathResult } from './glidePath';

export interface MonthlyReportData {
  reportDate: string;
  monthEnding: string;
  currentMonthDPU: number;
  lastMonthDPU: number;
  threeMonthAverage: number;
  ytdAverage: number;
  buildVolume: number;
  totalFaults: number;
  glidePath: GlidePathResult;
  stagePerformance: Array<{
    name: string;
    dpu: number;
    change: number;
    status: 'Improved' | 'Stable' | 'Deteriorated';
  }>;
  topIssues: Array<{
    stage: string;
    issue: string;
    impact: number;
    action: string;
  }>;
  achievements: string[];
  criticalActions: string[];
}

export const generateMonthlyReport = (data: InspectionData[]): MonthlyReportData => {
  // Get current data (using September as latest complete month)
  const latestMonth = data.find(month => month.date === 'Sep-25') || data[data.length - 1];
  const previousMonth = data.find(month => month.date === 'Aug-25') || data[data.length - 2];
  
  // Calculate current month DPU
  const currentMonthDPU = latestMonth.totalDpu;
  const lastMonthDPU = previousMonth?.totalDpu || currentMonthDPU;
  
  // Calculate three-month average (last 3 months)
  const lastThreeMonths = data.slice(-3);
  const threeMonthAverage = lastThreeMonths.reduce((sum, month) => sum + month.totalDpu, 0) / lastThreeMonths.length;
  
  // Calculate YTD average
  const ytdAverage = data.reduce((sum, month) => sum + month.totalDpu, 0) / data.length;
  
  // Get glide path analysis
  const glidePath = getCurrentGlidePath(currentMonthDPU);
  
  // Stage performance analysis
  const stagePerformance = latestMonth.stages.map(stage => {
    const previousStage = previousMonth?.stages.find(s => s.name === stage.name);
    const change = previousStage ? stage.dpu - previousStage.dpu : 0;
    
    let status: 'Improved' | 'Stable' | 'Deteriorated';
    if (change < -0.5) status = 'Improved';
    else if (change > 0.5) status = 'Deteriorated';
    else status = 'Stable';
    
    return {
      name: stage.name,
      dpu: stage.dpu,
      change,
      status
    };
  }).sort((a, b) => b.dpu - a.dpu); // Sort by highest DPU first
  
  // Identify top issues
  const topIssues = [
    {
      stage: stagePerformance[0]?.name || 'CFC',
      issue: 'High fault rate in final inspection',
      impact: stagePerformance[0]?.dpu || 0,
      action: 'Implement enhanced pre-inspection protocols'
    },
    {
      stage: stagePerformance[1]?.name || 'SIP6',
      issue: 'Process variation causing defects',
      impact: stagePerformance[1]?.dpu || 0,
      action: 'Review and standardize process parameters'
    },
    {
      stage: stagePerformance[2]?.name || 'UV3',
      issue: 'Equipment calibration issues',
      impact: stagePerformance[2]?.dpu || 0,
      action: 'Schedule immediate equipment maintenance'
    }
  ];
  
  // Generate achievements
  const achievements = [];
  const improvedStages = stagePerformance.filter(stage => stage.status === 'Improved');
  if (improvedStages.length > 0) {
    achievements.push(`${improvedStages.length} stage(s) showed improvement: ${improvedStages.map(s => s.name).join(', ')}`);
  }
  if (currentMonthDPU < lastMonthDPU) {
    achievements.push(`Overall DPU improved by ${formatDPU(lastMonthDPU - currentMonthDPU)} from previous month`);
  }
  if (latestMonth.stages.find(s => s.name === 'SIGN')?.inspected || 0 > 1500) {
    achievements.push('Build volume targets exceeded while maintaining quality standards');
  }
  
  // Generate critical actions
  const criticalActions = [];
  if (glidePath.riskAssessment === 'Critical') {
    criticalActions.push('URGENT: DPU reduction rate insufficient to meet year-end target - immediate intervention required');
  }
  if (glidePath.riskAssessment === 'At Risk') {
    criticalActions.push('WARNING: Current trajectory may miss year-end target - enhanced quality measures needed');
  }
  
  const deterioratedStages = stagePerformance.filter(stage => stage.status === 'Deteriorated');
  if (deterioratedStages.length > 0) {
    criticalActions.push(`Quality deterioration detected in ${deterioratedStages.length} stage(s): ${deterioratedStages.map(s => s.name).join(', ')}`);
  }
  
  if (currentMonthDPU > glidePath.monthlyTargets[0]?.targetDPU) {
    criticalActions.push('Current DPU exceeds monthly target - accelerated improvement plan required');
  }
  
  return {
    reportDate: new Date().toISOString().split('T')[0],
    monthEnding: new Date().toISOString().split('T')[0],
    currentMonthDPU,
    lastMonthDPU,
    threeMonthAverage,
    ytdAverage,
    buildVolume: latestMonth.stages.find(s => s.name === 'SIGN')?.inspected || 0,
    totalFaults: latestMonth.totalFaults,
    glidePath,
    stagePerformance,
    topIssues,
    achievements,
    criticalActions
  };
};

export const generateReportHTML = (reportData: MonthlyReportData): string => {
  const monthlyProgress = getMonthlyProgress(
    reportData.currentMonthDPU,
    reportData.lastMonthDPU,
    reportData.glidePath.requiredMonthlyReduction
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LOADALL Internal Quality Performance Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .report-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #FCB026 0%, #F59E0B 100%);
            color: black;
            padding: 50px 30px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 140px;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #000 0%, #FCB026 50%, #000 100%);
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: #000;
        }
        .header-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 25px;
            max-width: 800px;
            width: 100%;
        }
        .jcb-logo {
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid #000;
        }
        .header-text {
            text-align: left;
            flex: 1;
        }
        .header h1 {
            margin: 0 0 8px 0;
            font-size: 36px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header .subtitle {
            margin: 0 0 15px 0;
            font-size: 22px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .header .meta-info {
            font-size: 14px;
            font-weight: 500;
            opacity: 0.8;
        }
        .section {
            padding: 25px 30px;
            border-bottom: 1px solid #e0e0e0;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section-title {
            font-size: 22px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 20px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #FCB026 0%, #F59E0B 100%);
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 6px solid #000;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        .kpi-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border: 3px solid #FCB026;
            border-radius: 15px;
            padding: 30px 25px;
            text-align: center;
            position: relative;
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            transition: transform 0.2s ease;
            min-height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #FCB026 0%, #F59E0B 100%);
            border-radius: 15px 15px 0 0;
        }
        .kpi-progress-circle {
            width: 60px;
            height: 60px;
            margin: 0 auto 15px;
            position: relative;
        }
        .kpi-progress-circle svg {
            transform: rotate(-90deg);
            width: 100%;
            height: 100%;
        }
        .kpi-progress-circle .progress-bg {
            fill: none;
            stroke: #e0e0e0;
            stroke-width: 4;
        }
        .kpi-progress-circle .progress-fill {
            fill: none;
            stroke-width: 4;
            stroke-linecap: round;
            transition: stroke-dasharray 0.3s ease;
        }
        .kpi-value {
            font-size: 42px;
            font-weight: bold;
            color: #1a1a1a;
            margin: 10px 0;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .kpi-label {
            font-size: 13px;
            color: #495057;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 700;
            margin-top: 10px;
        }
        .kpi-trend {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 8px;
            font-size: 12px;
            font-weight: 600;
        }
        .kpi-trend.positive { color: #10B981; }
        .kpi-trend.negative { color: #EF4444; }
        .kpi-trend.neutral { color: #6B7280; }
        .status-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .status-green { background-color: #10B981; }
        .status-amber { background-color: #F59E0B; }
        .status-red { background-color: #EF4444; }
        .glide-path-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .glide-path-table th,
        .glide-path-table td {
            padding: 15px 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .glide-path-table th {
            background: linear-gradient(135deg, #FCB026 0%, #F59E0B 100%);
            font-weight: 700;
            color: #000;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 1px;
            text-shadow: 1px 1px 1px rgba(255,255,255,0.3);
        }
        .glide-path-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .glide-path-table tbody tr:hover {
            background-color: #FCB026;
            color: #000;
        }
        .stage-performance {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stage-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #FCB026;
            border-radius: 10px;
            padding: 18px 15px;
            text-align: center;
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            position: relative;
        }
        .stage-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #FCB026 0%, #F59E0B 100%);
            border-radius: 10px 10px 0 0;
        }
        .stage-name {
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .stage-dpu {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stage-change {
            font-size: 12px;
            font-weight: 600;
        }
        .improved { color: #10B981; }
        .deteriorated { color: #EF4444; }
        .stable { color: #6B7280; }
        .action-list {
            list-style: none;
            padding: 0;
        }
        .action-list li {
            background: #f8f9fa;
            margin: 10px 0;
            padding: 15px;
            border-left: 4px solid #FCB026;
            border-radius: 4px;
        }
        .critical-action {
            border-left-color: #EF4444;
            background: #fef2f2;
        }
        .achievement {
            border-left-color: #10B981;
            background: #f0fdf4;
        }
        .footer {
            background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
            color: white;
            padding: 25px 30px;
            text-align: center;
            font-size: 12px;
            position: relative;
            border-top: 4px solid #FCB026;
        }
        .footer::before {
            content: '';
            position: absolute;
            top: -4px;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #FCB026 0%, #F59E0B 50%, #FCB026 100%);
        }
        .risk-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .risk-on-track {
            background: #10B981;
            color: white;
        }
        .risk-at-risk {
            background: #F59E0B;
            color: black;
        }
        .risk-critical {
            background: #EF4444;
            color: white;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="jcb-logo">
                    <img src="/jcb-logo.png" alt="JCB Logo" style="width: 80px; height: 80px; object-fit: contain;" />
                </div>
                <div class="header-text">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <h1 style="margin: 0;">JCB Digital Factory</h1>
                        <div style="background: #FF0000; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                            CONFIDENTIAL
                        </div>
                    </div>
                    <div class="subtitle">LOADALL INTERNAL QUALITY PERFORMANCE REPORT</div>
                    <div class="meta-info">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Month Ending: ${new Date(reportData.monthEnding).toLocaleDateString('en-GB')} | 
                            Report Generated: ${new Date(reportData.reportDate).toLocaleDateString('en-GB')}</span>
                            <span style="font-size: 12px; opacity: 0.7;">Distribution: Quality Management, Production Management, Senior Leadership</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Executive Summary -->
        <div class="section">
            <div class="section-title">Executive Summary</div>
            
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="status-indicator ${reportData.glidePath.riskAssessment === 'On Track' ? 'status-green' : 
                                                   reportData.glidePath.riskAssessment === 'At Risk' ? 'status-amber' : 'status-red'}"></div>
                    <div class="kpi-progress-circle">
                        <svg viewBox="0 0 36 36">
                            <circle class="progress-bg" cx="18" cy="18" r="16"></circle>
                            <circle class="progress-fill" cx="18" cy="18" r="16" 
                                    stroke="${reportData.currentMonthDPU > 15 ? '#EF4444' : reportData.currentMonthDPU > 10 ? '#F59E0B' : '#10B981'}"
                                    stroke-dasharray="${Math.min((reportData.currentMonthDPU / 20) * 100, 100)}, 100"></circle>
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; font-weight: bold;">
                            ${Math.round((1 - reportData.currentMonthDPU / 20) * 100)}%
                        </div>
                    </div>
                    <div class="kpi-value">${formatDPU(reportData.currentMonthDPU)}</div>
                    <div class="kpi-label">Current Month DPU</div>
                    <div class="kpi-trend ${reportData.currentMonthDPU < reportData.lastMonthDPU ? 'positive' : 'negative'}">
                        ${reportData.currentMonthDPU < reportData.lastMonthDPU ? '↓' : '↑'} 
                        ${formatDPU(Math.abs(reportData.currentMonthDPU - reportData.lastMonthDPU))} vs last month
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-progress-circle">
                        <svg viewBox="0 0 36 36">
                            <circle class="progress-bg" cx="18" cy="18" r="16"></circle>
                            <circle class="progress-fill" cx="18" cy="18" r="16" 
                                    stroke="#FCB026"
                                    stroke-dasharray="${Math.min((reportData.glidePath.requiredMonthlyReduction / 2) * 100, 100)}, 100"></circle>
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; font-weight: bold;">
                            TARGET
                        </div>
                    </div>
                    <div class="kpi-value">${formatDPU(reportData.glidePath.requiredMonthlyReduction)}</div>
                    <div class="kpi-label">Required Monthly Reduction</div>
                    <div class="kpi-trend ${reportData.glidePath.riskAssessment === 'On Track' ? 'positive' : reportData.glidePath.riskAssessment === 'At Risk' ? 'neutral' : 'negative'}">
                        ${reportData.glidePath.riskAssessment} - ${reportData.glidePath.riskAssessment === 'Critical' ? 'Immediate action required' : 'Enhanced measures needed'}
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-progress-circle">
                        <svg viewBox="0 0 36 36">
                            <circle class="progress-bg" cx="18" cy="18" r="16"></circle>
                            <circle class="progress-fill" cx="18" cy="18" r="16" 
                                    stroke="#3B82F6"
                                    stroke-dasharray="${Math.min((reportData.buildVolume / 2000) * 100, 100)}, 100"></circle>
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; font-weight: bold;">
                            ${Math.round((reportData.buildVolume / 2000) * 100)}%
                        </div>
                    </div>
                    <div class="kpi-value">${formatNumber(reportData.buildVolume)}</div>
                    <div class="kpi-label">Build Volume</div>
                    <div class="kpi-trend positive">
                        📈 ${reportData.buildVolume > 1500 ? 'Excellent production levels' : 'Good production levels'}
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-progress-circle">
                        <svg viewBox="0 0 36 36">
                            <circle class="progress-bg" cx="18" cy="18" r="16"></circle>
                            <circle class="progress-fill" cx="18" cy="18" r="16" 
                                    stroke="${reportData.glidePath.monthsRemaining <= 2 ? '#EF4444' : reportData.glidePath.monthsRemaining <= 4 ? '#F59E0B' : '#10B981'}"
                                    stroke-dasharray="${100 - (reportData.glidePath.monthsRemaining / 12) * 100}, 100"></circle>
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; font-weight: bold;">
                            ${Math.round((12 - reportData.glidePath.monthsRemaining) / 12 * 100)}%
                        </div>
                    </div>
                    <div class="kpi-value">${reportData.glidePath.monthsRemaining}</div>
                    <div class="kpi-label">Months to Target</div>
                    <div class="kpi-trend ${reportData.glidePath.monthsRemaining <= 3 ? 'negative' : 'neutral'}">
                        ⏱️ ${reportData.glidePath.monthsRemaining <= 3 ? 'Urgent timeline' : 'Adequate time remaining'}
                    </div>
                </div>
            </div>

            <div style="margin: 20px 0;">
                <strong>Overall Status:</strong> 
                <span class="risk-badge risk-${reportData.glidePath.riskAssessment.toLowerCase().replace(' ', '-')}">
                    ${reportData.glidePath.riskAssessment}
                </span>
            </div>

            <div style="margin: 20px 0;">
                <strong>Target Achievement:</strong> 
                Current trajectory ${reportData.currentMonthDPU > reportData.glidePath.monthlyTargets[0]?.targetDPU ? 'behind' : 'aligned with'} 
                monthly targets. ${formatDPU(reportData.glidePath.requiredMonthlyReduction)} DPU reduction required per month to achieve 8.2 target.
            </div>
        </div>

        <!-- Performance Analysis -->
        <div class="section">
            <div class="section-title">Performance Analysis & Glide Path</div>
            
            <table class="glide-path-table">
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Current DPU</th>
                        <th>Target DPU</th>
                        <th>Variance</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>This Month</strong></td>
                        <td>${formatDPU(reportData.currentMonthDPU)}</td>
                        <td>${formatDPU(reportData.glidePath.monthlyTargets[0]?.targetDPU || 8.2)}</td>
                        <td style="color: ${reportData.currentMonthDPU > (reportData.glidePath.monthlyTargets[0]?.targetDPU || 8.2) ? '#EF4444' : '#10B981'}">
                            ${formatDPU(reportData.currentMonthDPU - (reportData.glidePath.monthlyTargets[0]?.targetDPU || 8.2))}
                        </td>
                        <td>
                            <span class="risk-badge risk-${reportData.glidePath.riskAssessment.toLowerCase().replace(' ', '-')}">
                                ${reportData.glidePath.riskAssessment}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td>3-Month Average</td>
                        <td>${formatDPU(reportData.threeMonthAverage)}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>Reference</td>
                    </tr>
                    <tr>
                        <td>YTD Average</td>
                        <td>${formatDPU(reportData.ytdAverage)}</td>
                        <td>8.2</td>
                        <td style="color: #EF4444">${formatDPU(reportData.ytdAverage - 8.2)}</td>
                        <td>Year-End Target</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin: 25px 0;">
                <h4 style="margin-bottom: 20px;">DPU Trajectory to 8.2 Target:</h4>
                
                <!-- Glide Path Chart -->
                <div style="background: #f8f9fa; border: 2px solid #FCB026; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                    <svg width="100%" height="200" viewBox="0 0 800 200" style="background: white; border-radius: 6px;">
                        <!-- Grid lines -->
                        <defs>
                            <pattern id="grid" width="80" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 80 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        <!-- Y-axis labels -->
                        <text x="30" y="25" font-size="12" fill="#666" text-anchor="middle">20</text>
                        <text x="30" y="65" font-size="12" fill="#666" text-anchor="middle">15</text>
                        <text x="30" y="105" font-size="12" fill="#666" text-anchor="middle">10</text>
                        <text x="30" y="145" font-size="12" fill="#666" text-anchor="middle">8.2</text>
                        <text x="30" y="185" font-size="12" fill="#666" text-anchor="middle">5</text>
                        
                        <!-- Target line at 8.2 -->
                        <line x1="50" y1="145" x2="750" y2="145" stroke="#10B981" stroke-width="3" stroke-dasharray="5,5"/>
                        <text x="760" y="149" font-size="12" fill="#10B981" font-weight="bold">TARGET</text>
                        
                        <!-- Current DPU point -->
                        <circle cx="150" cy="${200 - (reportData.currentMonthDPU / 20) * 200}" r="6" fill="#EF4444"/>
                        <text x="150" y="${200 - (reportData.currentMonthDPU / 20) * 200 - 15}" font-size="12" fill="#EF4444" text-anchor="middle" font-weight="bold">
                            Current: ${formatDPU(reportData.currentMonthDPU)}
                        </text>
                        
                        <!-- Glide path line -->
                        <path d="M 150 ${200 - (reportData.currentMonthDPU / 20) * 200} 
                                 L 300 ${200 - (reportData.glidePath.monthlyTargets[0]?.targetDPU / 20) * 200}
                                 L 450 ${200 - (reportData.glidePath.monthlyTargets[1]?.targetDPU / 20) * 200}
                                 L 600 ${200 - (reportData.glidePath.monthlyTargets[2]?.targetDPU / 20) * 200}
                                 L 750 145" 
                              stroke="#FCB026" stroke-width="4" fill="none"/>
                        
                        <!-- Month labels -->
                        <text x="150" y="195" font-size="11" fill="#666" text-anchor="middle">Current</text>
                        <text x="300" y="195" font-size="11" fill="#666" text-anchor="middle">${reportData.glidePath.monthlyTargets[0]?.month || 'Oct'}</text>
                        <text x="450" y="195" font-size="11" fill="#666" text-anchor="middle">${reportData.glidePath.monthlyTargets[1]?.month || 'Nov'}</text>
                        <text x="600" y="195" font-size="11" fill="#666" text-anchor="middle">${reportData.glidePath.monthlyTargets[2]?.month || 'Dec'}</text>
                        <text x="750" y="195" font-size="11" fill="#666" text-anchor="middle">Target</text>
                        
                        <!-- Risk zone -->
                        <rect x="50" y="105" width="700" height="40" fill="#EF4444" opacity="0.1"/>
                        <text x="400" y="125" font-size="12" fill="#EF4444" text-anchor="middle" font-weight="bold">CRITICAL ZONE (>10 DPU)</text>
                    </svg>
                    
                    <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 12px; color: #666;">
                            <strong>Trajectory Status:</strong> 
                            <span style="color: ${reportData.glidePath.riskAssessment === 'On Track' ? '#10B981' : reportData.glidePath.riskAssessment === 'At Risk' ? '#F59E0B' : '#EF4444'}; font-weight: bold;">
                                ${reportData.glidePath.riskAssessment}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            <strong>Required Monthly Reduction:</strong> ${formatDPU(reportData.glidePath.requiredMonthlyReduction)} DPU
                        </div>
                    </div>
                </div>
                
                <h4 style="margin-bottom: 15px;">Monthly Glide Path Targets:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px;">
                    ${reportData.glidePath.monthlyTargets.slice(0, 4).map((target, index) => `
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 15px; border-radius: 8px; text-align: center; border: 2px solid ${target.isAchievable ? '#10B981' : '#EF4444'}; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                            <div style="font-weight: bold; color: #1a1a1a; font-size: 14px; margin-bottom: 8px;">${target.month}</div>
                            <div style="font-size: 24px; font-weight: bold; color: ${target.isAchievable ? '#10B981' : '#EF4444'}; margin-bottom: 5px;">
                                ${formatDPU(target.targetDPU)}
                            </div>
                            <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${target.isAchievable ? '✓ Achievable' : '⚠ Challenging'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Stage Performance -->
        <div class="section">
            <div class="section-title">Stage Performance Breakdown</div>
            
            <div class="stage-performance">
                ${reportData.stagePerformance.slice(0, 6).map(stage => `
                    <div class="stage-card">
                        <div class="stage-name">${stage.name}</div>
                        <div class="stage-dpu ${stage.status.toLowerCase()}">${formatDPU(stage.dpu)}</div>
                        <div class="stage-change ${stage.status.toLowerCase()}">
                            ${stage.change > 0 ? '+' : ''}${formatDPU(stage.change)} DPU
                            <br><small>${stage.status}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Critical Actions -->
        <div class="section">
            <div class="section-title">Critical Actions Required</div>
            <ul class="action-list">
                ${reportData.criticalActions.map(action => `
                    <li class="critical-action"><strong>CRITICAL:</strong> ${action}</li>
                `).join('')}
            </ul>
        </div>

        <!-- Achievements -->
        <div class="section">
            <div class="section-title">Monthly Achievements</div>
            <ul class="action-list">
                ${reportData.achievements.map(achievement => `
                    <li class="achievement"><strong>ACHIEVEMENT:</strong> ${achievement}</li>
                `).join('')}
            </ul>
        </div>

        <!-- Top Issues -->
        <div class="section">
            <div class="section-title">Top Quality Issues & Actions</div>
            <table class="glide-path-table">
                <thead>
                    <tr>
                        <th>Stage</th>
                        <th>Issue</th>
                        <th>DPU Impact</th>
                        <th>Action Required</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.topIssues.map(issue => `
                        <tr>
                            <td><strong>${issue.stage}</strong></td>
                            <td>${issue.issue}</td>
                            <td style="color: #EF4444; font-weight: bold;">${formatDPU(issue.impact)}</td>
                            <td>${issue.action}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 8px;">
                <img src="/jcb-logo.png" alt="JCB Logo" style="width: 24px; height: 24px; object-fit: contain; background: white; padding: 3px; border-radius: 4px;" />
                <strong>JCB Digital Factory - Confidential Quality Performance Report</strong>
            </div>
            <div>Generated: ${new Date().toLocaleString('en-GB')} | Target: 8.2 DPU by December 2025</div>
            <div style="margin-top: 8px; font-size: 10px; opacity: 0.7;">
                J.C.Bamford Excavators Limited © ${new Date().getFullYear()} | Rocester, Staffordshire, UK
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

export const generateReportPDF = async (reportData: MonthlyReportData): Promise<Blob> => {
  // This would typically use a PDF generation library like Puppeteer or jsPDF
  // For now, return the HTML as a blob that can be printed to PDF
  const html = generateReportHTML(reportData);
  return new Blob([html], { type: 'text/html' });
};
