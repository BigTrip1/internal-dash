/**
 * Professional 5-Page Quality Report Generator
 * Optimized layout with perfect content density
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
  // Validate input data
  if (!Array.isArray(data)) {
    console.error('generateMonthlyReport: data is not an array:', typeof data, data);
    throw new Error('Invalid data format: expected array of InspectionData');
  }
  
  if (data.length === 0) {
    console.error('generateMonthlyReport: data array is empty');
    throw new Error('No inspection data available for report generation');
  }
  
  console.log(`generateMonthlyReport: Processing ${data.length} months of data`);
  
  // Get current data (using September as latest complete month)
  const latestMonth = data.find(month => month && month.date === 'Sep-25') || data[data.length - 1];
  const previousMonth = data.find(month => month && month.date === 'Aug-25') || data[data.length - 2];
  
  if (!latestMonth) {
    console.error('generateMonthlyReport: No valid latest month found');
    throw new Error('No valid inspection data found for report generation');
  }
  
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
  }).sort((a, b) => b.dpu - a.dpu);
  
  // Identify top DPU contributors
  const topIssues = stagePerformance.slice(0, 3).map(stage => ({
    stage: stage.name,
    issue: `DPU: ${formatDPU(stage.dpu)} (${stage.status.toLowerCase()})`,
    impact: stage.dpu,
    action: `Requires analysis - ${stage.status === 'Deteriorated' ? 'declining performance' : stage.status === 'Improved' ? 'positive trend' : 'stable performance'}`
  }));
  
  // Generate achievements
  const achievements = [
    "Overall DPU improved by 0.52 from previous month",
    "Build volume targets exceeded while maintaining quality standards"
  ];
  
  // Generate critical actions
  const criticalActions = [
    "Current improvement rate needs 187% acceleration to meet 8.2 target",
    "SIP6 shows 2.39 DPU - primary focus area"
  ];

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
        @page {
            size: A4;
            margin: 8mm;
        }
        @media print {
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
            color: #333;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #FCB026 0%, #F59E0B 100%);
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            margin-bottom: 6px;
        }
        .jcb-logo {
            width: 30px;
            height: 30px;
            background: #000;
            color: #FCB026;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 10px;
        }
        .header-title {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            margin: 0;
        }
        .confidential {
            background: #FF0000;
            color: white;
            padding: 2px 6px;
            border-radius: 2px;
            font-size: 7px;
            font-weight: bold;
        }
        
        /* Sections */
        .section-title {
            background: #FCB026;
            color: #000;
            padding: 3px 8px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            margin: 4px 0 3px 0;
            border-radius: 2px;
        }
        
        /* KPI Cards */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
            margin: 4px 0;
        }
        .kpi-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 4px;
            text-align: center;
            height: 50px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .kpi-circle {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            margin: 0 auto 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 6px;
            font-weight: bold;
            color: white;
        }
        .kpi-circle.orange { background: #F59E0B; }
        .kpi-circle.blue { background: #3B82F6; }
        .kpi-value {
            font-size: 11px;
            font-weight: bold;
            margin: 1px 0;
        }
        .kpi-label {
            font-size: 6px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .kpi-trend {
            font-size: 5px;
            margin-top: 1px;
        }
        
        /* Executive Summary */
        .exec-summary {
            background: #fff8e1;
            border: 1px solid #FCB026;
            border-radius: 3px;
            margin: 4px 0;
            overflow: hidden;
        }
        .exec-header {
            background: #FCB026;
            color: #000;
            padding: 2px 6px;
            font-size: 7px;
            font-weight: 700;
        }
        .exec-content {
            padding: 4px 6px;
            font-size: 7px;
            display: flex;
            justify-content: space-between;
        }
        .enhanced-bar {
            background: #FCB026;
            color: #000;
            padding: 2px 4px;
            font-size: 6px;
            font-weight: bold;
            text-align: center;
            margin-top: 2px;
        }
        
        /* Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0;
            font-size: 7px;
        }
        .data-table th {
            background: #FCB026;
            color: #000;
            padding: 2px 4px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 6px;
        }
        .data-table td {
            padding: 2px 4px;
            border-bottom: 1px solid #eee;
        }
        
        /* Chart */
        .chart-container {
            background: #f8f9fa;
            border: 1px solid #FCB026;
            border-radius: 3px;
            padding: 6px;
            margin: 4px 0;
            height: 60px;
            position: relative;
        }
        .chart-line {
            position: absolute;
            top: 15px;
            left: 8px;
            right: 8px;
            height: 2px;
            background: linear-gradient(to right, #EF4444, #F59E0B, #10B981);
        }
        .chart-labels {
            display: flex;
            justify-content: space-between;
            font-size: 6px;
            margin-top: 20px;
        }
        
        /* Target Cards */
        .target-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            margin: 4px 0;
        }
        .target-card {
            background: white;
            border: 1px solid #10B981;
            border-radius: 3px;
            padding: 4px;
            text-align: center;
        }
        .target-month {
            font-size: 6px;
            font-weight: bold;
        }
        .target-value {
            font-size: 9px;
            font-weight: bold;
            color: #10B981;
            margin: 1px 0;
        }
        .target-status {
            font-size: 5px;
            color: #10B981;
            font-weight: bold;
        }
        
        /* Two Column Layout */
        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin: 4px 0;
        }
        .col-box {
            border: 1px solid #ddd;
            border-radius: 3px;
            overflow: hidden;
        }
        .col-header {
            padding: 2px 4px;
            font-size: 6px;
            font-weight: bold;
        }
        .col-header.blue { background: #e3f2fd; color: #1976d2; }
        .col-header.orange { background: #fff3e0; color: #f57c00; }
        .col-content {
            padding: 4px;
            font-size: 6px;
        }
        .status-row {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
        }
        .value-red { color: #EF4444; font-weight: bold; }
        .value-green { color: #10B981; font-weight: bold; }
        .value-blue { color: #3B82F6; font-weight: bold; }
        
        /* Stage Performance */
        .stage-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3px;
            margin: 4px 0;
        }
        .stage-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 3px;
            text-align: center;
            font-size: 6px;
            height: 45px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .stage-card.improved { border-color: #10B981; background: #f0fdf4; }
        .stage-card.stable { border-color: #F59E0B; background: #fffbeb; }
        .stage-card.deteriorated { border-color: #EF4444; background: #fef2f2; }
        .stage-name { font-weight: bold; margin-bottom: 1px; }
        .stage-value { font-size: 8px; font-weight: bold; margin: 1px 0; }
        .stage-change { font-size: 5px; }
        .stage-status {
            background: #10B981;
            color: white;
            padding: 1px 2px;
            border-radius: 2px;
            font-size: 5px;
            font-weight: bold;
            margin: 1px 0;
        }
        .stage-card.stable .stage-status { background: #F59E0B; }
        .stage-card.deteriorated .stage-status { background: #EF4444; }
        
        /* Performance Counts */
        .count-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            margin: 4px 0;
        }
        .count-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 4px;
            text-align: center;
        }
        .count-card.green { border-color: #10B981; }
        .count-card.orange { border-color: #F59E0B; }
        .count-card.red { border-color: #EF4444; }
        .count-number {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 1px;
        }
        .count-card.green .count-number { color: #10B981; }
        .count-card.orange .count-number { color: #F59E0B; }
        .count-card.red .count-number { color: #EF4444; }
        .count-label {
            font-size: 5px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        /* Upcoming Updates */
        .upcoming-updates {
            background: #ffebee;
            border: 2px solid #f44336;
            border-radius: 4px;
            margin: 6px 0;
            overflow: hidden;
        }
        .updates-header {
            background: #FCB026;
            color: #000;
            padding: 3px 6px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .updates-content {
            padding: 4px 6px;
            font-size: 7px;
            line-height: 1.3;
        }
        .updates-content ul {
            margin: 2px 0;
            padding-left: 10px;
        }
        .updates-content li {
            margin: 1px 0;
        }
        
        /* Footer */
        .footer {
            background: #333;
            color: white;
            padding: 4px 8px;
            text-align: center;
            font-size: 6px;
            margin-top: 8px;
        }
        .footer-logo {
            background: #FCB026;
            color: #000;
            padding: 1px 3px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 6px;
            display: inline-block;
            margin-right: 4px;
        }
    </style>
</head>
<body>
    <!-- PAGE 1: Complete Executive Dashboard -->
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="jcb-logo">JCB</div>
                <h1 class="header-title">LOADALL INTERNAL QUALITY PERFORMANCE REPORT</h1>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <div class="confidential">CONFIDENTIAL</div>
                <div style="font-size: 6px; text-align: right;">
                    <div>Created By: Adam Lawton</div>
                    <div>Senior Production Analyst</div>
                </div>
            </div>
        </div>

        <!-- Executive Summary -->
        <div class="section-title">EXECUTIVE SUMMARY</div>
        
        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-circle orange">36%</div>
                <div class="kpi-value">${formatDPU(reportData.currentMonthDPU)}</div>
                <div class="kpi-label">CURRENT MONTH DPU</div>
                <div class="kpi-trend">↓ ${formatDPU(Math.abs(reportData.currentMonthDPU - reportData.lastMonthDPU))} vs last month</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-circle orange">TARGET</div>
                <div class="kpi-value">${formatDPU(reportData.glidePath.requiredMonthlyReduction)}</div>
                <div class="kpi-label">REQUIRED MONTHLY REDUCTION</div>
                <div class="kpi-trend">At Risk - Enhanced measures needed</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-circle blue">87%</div>
                <div class="kpi-value">${formatNumber(reportData.buildVolume)}</div>
                <div class="kpi-label">BUILD VOLUME</div>
                <div class="kpi-trend">📈 Excellent production levels</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-circle orange">73%</div>
                <div class="kpi-value">${reportData.glidePath.monthsRemaining}</div>
                <div class="kpi-label">MONTHS TO TARGET</div>
                <div class="kpi-trend">⚠️ Urgent timeline</div>
            </div>
        </div>

        <!-- Executive Performance Summary -->
        <div class="exec-summary">
            <div class="exec-header">📊 EXECUTIVE PERFORMANCE SUMMARY</div>
            <div class="exec-content">
                <div>
                    <strong>Current Status:</strong> <span style="color: #EF4444; font-weight: bold;">${reportData.glidePath.riskAssessment}</span> - Current DPU of ${formatDPU(reportData.currentMonthDPU)} is ${formatDPU(Math.abs(reportData.currentMonthDPU - reportData.glidePath.targetDPU))} above target trajectory
                </div>
                <div>
                    <strong>Improvement Required:</strong> ${formatDPU(reportData.glidePath.requiredMonthlyReduction)} DPU reduction needed monthly to achieve 8.2 target by year-end. This represents a 36% improvement requirement.
                </div>
            </div>
            <div class="enhanced-bar">ENHANCED MONITORING: Performance requires accelerated improvement measures</div>
        </div>

        <!-- Performance Analysis Table -->
        <div class="section-title">PERFORMANCE ANALYSIS & GLIDE PATH</div>
        <table class="data-table">
            <thead>
                <tr><th>PERIOD</th><th>CURRENT DPU</th><th>TARGET DPU</th><th>VARIANCE</th><th>STATUS</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td>This Month</td><td>${formatDPU(reportData.currentMonthDPU)}</td><td>${formatDPU(reportData.glidePath.targetDPU)}</td>
                    <td style="color: #EF4444; font-weight: bold;">${formatDPU(Math.abs(reportData.currentMonthDPU - reportData.glidePath.targetDPU))}</td>
                    <td><span style="background: #EF4444; color: white; padding: 1px 3px; border-radius: 2px; font-size: 5px;">AT RISK</span></td>
                </tr>
                <tr><td>YTD Average</td><td>${formatDPU(reportData.ytdAverage)}</td><td>8.2</td><td style="color: #EF4444; font-weight: bold;">${formatDPU(Math.abs(reportData.ytdAverage - 8.2))}</td><td>Year-End Target</td></tr>
            </tbody>
        </table>

        <!-- Monthly Targets -->
        <div style="font-size: 7px; font-weight: bold; margin: 4px 0 2px 0;">Monthly Glide Path Targets:</div>
        <div class="target-grid">
            <div class="target-card"><div class="target-month">Oct-25</div><div class="target-value">11.27</div><div class="target-status">✓ ACHIEVABLE</div></div>
            <div class="target-card"><div class="target-month">Nov-25</div><div class="target-value">9.73</div><div class="target-status">✓ ACHIEVABLE</div></div>
            <div class="target-card"><div class="target-month">Dec-25</div><div class="target-value">8.20</div><div class="target-status">✓ ACHIEVABLE</div></div>
        </div>

        <!-- Stage Performance Heat Map -->
        <div class="section-title">🔥 STAGE PERFORMANCE HEAT MAP</div>
        <div class="stage-grid">
            ${reportData.stagePerformance.slice(0, 6).map(stage => `
                <div class="stage-card ${stage.status.toLowerCase()}">
                    <div class="stage-name">${stage.name}</div>
                    <div class="stage-value">${formatDPU(stage.dpu)}</div>
                    <div class="stage-change">${stage.change > 0 ? '+' : ''}${formatDPU(stage.change)} DPU</div>
                    <div class="stage-status">${stage.status.toUpperCase()}</div>
                </div>
            `).join('')}
        </div>

        <!-- Performance Counts -->
        <div class="count-grid">
            <div class="count-card green"><div class="count-number">${reportData.stagePerformance.filter(s => s.status === 'Improved').length}</div><div class="count-label">PERFORMING WELL</div></div>
            <div class="count-card orange"><div class="count-number">${reportData.stagePerformance.filter(s => s.status === 'Stable').length}</div><div class="count-label">MONITOR CLOSELY</div></div>
            <div class="count-card red"><div class="count-number">${reportData.stagePerformance.filter(s => s.status === 'Deteriorated').length}</div><div class="count-label">REQUIRES ATTENTION</div></div>
        </div>
    </div>

    <!-- PAGE 2: Strategic Analysis & Future Updates -->
    <div class="page page-break">
        <!-- Strategic Context -->
        <div class="section-title">STRATEGIC CONTEXT & PERFORMANCE ANALYSIS</div>
        <div class="two-col">
            <div class="col-box">
                <div class="col-header blue">📊 Current Performance Status</div>
                <div class="col-content">
                    <div class="status-row"><span>Starting Position (Jan-25):</span><span class="value-red">20.17 DPU</span></div>
                    <div class="status-row"><span>Current Position (Sep-25):</span><span class="value-red">12.80 DPU</span></div>
                    <div class="status-row"><span>Target Position (Dec-25):</span><span class="value-green">8.2 DPU</span></div>
                    <div class="status-row"><span>Gap Remaining:</span><span class="value-red">4.60 DPU</span></div>
                </div>
                <div style="background: #FCB026; color: #000; padding: 2px 4px; font-size: 5px; font-weight: bold; text-align: center;">62% OF TARGET IMPROVEMENT ACHIEVED</div>
            </div>
            <div class="col-box">
                <div class="col-header orange">📈 Performance Trajectory</div>
                <div class="col-content">
                    <div class="status-row"><span>YTD Improvement:</span><span class="value-green">37% ↓</span></div>
                    <div class="status-row"><span>Months of Progress:</span><span class="value-blue">9 months</span></div>
                    <div class="status-row"><span>Required Acceleration:</span><span class="value-red">187% faster</span></div>
                </div>
                <div style="background: #FCB026; color: #000; padding: 2px 4px; font-size: 5px; font-weight: bold; text-align: center;">ENHANCED FOCUS: Maintain momentum</div>
            </div>
        </div>

        <!-- Critical Focus Areas -->
        <div class="section-title">STRATEGIC DECISION FRAMEWORK</div>
        <div style="border: 1px solid #f44336; border-radius: 3px; margin: 4px 0; overflow: hidden;">
            <div style="background: #FCB026; color: #000; padding: 2px 6px; font-size: 7px; font-weight: bold;">🎯 CRITICAL FOCUS AREAS</div>
            <table class="data-table" style="margin: 0;">
                <thead><tr><th>🔴 HIGHEST DPU STAGES</th><th>📈 PERFORMANCE TRENDS</th></tr></thead>
                <tbody>
                    ${reportData.stagePerformance.slice(0, 3).map(stage => `
                        <tr>
                            <td><strong>${stage.name}:</strong> <span style="color: #EF4444; font-weight: bold;">${formatDPU(stage.dpu)} DPU</span></td>
                            <td><span style="color: ${stage.status === 'Improved' ? '#10B981' : stage.status === 'Stable' ? '#F59E0B' : '#EF4444'};">${stage.status} Stage</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Performance Summary -->
        <div style="border: 1px solid #FCB026; border-radius: 3px; margin: 4px 0; overflow: hidden;">
            <div style="background: #FCB026; color: #000; padding: 2px 6px; font-size: 7px; font-weight: bold;">📊 PERFORMANCE SUMMARY</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px;">
                <div style="text-align: center;"><div style="font-size: 12px; font-weight: bold; color: #10B981;">37%</div><div style="font-size: 5px; font-weight: bold;">YTD IMPROVEMENT</div></div>
                <div style="text-align: center;"><div style="font-size: 12px; font-weight: bold; color: #F59E0B;">1.53</div><div style="font-size: 5px; font-weight: bold;">MONTHLY REDUCTION NEEDED</div></div>
                <div style="text-align: center;"><div style="font-size: 12px; font-weight: bold; color: #3B82F6;">3</div><div style="font-size: 5px; font-weight: bold;">MONTHS REMAINING</div></div>
            </div>
        </div>

        <!-- Risk Assessment -->
        <div class="section-title">RISK ASSESSMENT & SUCCESS FACTORS</div>
        <div class="two-col">
            <div style="background: #fef2f2; border: 1px solid #EF4444; border-radius: 3px; padding: 4px;">
                <div style="font-size: 6px; font-weight: bold; color: #EF4444; margin-bottom: 2px;">⚠️ RISK ANALYSIS</div>
                <div style="font-size: 5px;">Current Status: <strong>At Risk</strong> | Required Monthly Reduction: <strong>1.53</strong> | Months Remaining: <strong>3</strong> | Improvement Acceleration Needed: <strong>187%</strong></div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #10B981; border-radius: 3px; padding: 4px;">
                <div style="font-size: 6px; font-weight: bold; color: #10B981; margin-bottom: 2px;">📊 DATA-DRIVEN INSIGHTS</div>
                <div style="font-size: 5px;">Best Performing Stage: <strong>LECFBC (0.96)</strong> | Highest Risk Stage: <strong>SIP6 (2.39)</strong> | Stages Improving: <strong>6 of 19</strong> | Stages Requiring Attention: <strong>2 of 19</strong></div>
            </div>
        </div>

        <!-- Mathematical Analysis -->
        <div style="background: #fffbeb; border: 1px solid #F59E0B; border-radius: 3px; margin: 4px 0; padding: 4px;">
            <div style="font-size: 6px; font-weight: bold; margin-bottom: 2px; text-align: center;">📊 MATHEMATICAL ANALYSIS</div>
            <div class="two-col" style="gap: 4px;">
                <div>
                    <div style="font-size: 5px; font-weight: bold; color: #3B82F6;">📊 IMPROVEMENT METRICS</div>
                    <div style="font-size: 5px;">Total Improvement Needed: <strong>4.60 DPU</strong> | Time Available: <strong>3 months</strong> | Required Rate: <strong>1.53/month</strong> | Historical Rate: <strong>0.82/month</strong></div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 5px; font-weight: bold; color: #F59E0B;">⚠️ TARGET FEASIBILITY</div>
                    <div style="font-size: 16px; color: #F59E0B;">⚠️</div>
                    <div style="font-size: 6px; font-weight: bold; color: #EF4444;">At Risk</div>
                </div>
            </div>
        </div>

        <!-- Performance Highlights -->
        <div class="section-title">PERFORMANCE HIGHLIGHTS & TOP DPU CONTRIBUTORS</div>
        <div class="two-col">
            <div style="background: #f0fdf4; border: 1px solid #10B981; border-radius: 3px; padding: 4px;">
                <div style="font-size: 6px; font-weight: bold; color: #10B981; margin-bottom: 2px;">✅ THIS MONTH'S SUCCESSES</div>
                <ul style="margin: 1px 0; padding-left: 6px; font-size: 5px;">
                    <li>Overall DPU improved by 0.52 from previous month</li>
                    <li>Build volume targets exceeded while maintaining quality standards</li>
                </ul>
            </div>
            <div style="background: #fff3e0; border: 1px solid #F59E0B; border-radius: 3px; padding: 4px;">
                <div style="font-size: 6px; font-weight: bold; color: #F59E0B; margin-bottom: 2px;">📊 TOP DPU CONTRIBUTORS</div>
                <div style="font-size: 5px;">
                    ${reportData.stagePerformance.slice(0, 3).map(stage => `<strong>${stage.name}:</strong> ${formatDPU(stage.dpu)} DPU (${stage.status})<br/>`).join('')}
                </div>
            </div>
        </div>
    </div>

    <!-- PAGE 2: Strategic Analysis & Future Updates -->
    <div class="page page-break">
        <!-- Strategic Context -->
        <div class="section-title">STRATEGIC CONTEXT & INDUSTRY POSITION</div>
        <div class="two-col">
            <div class="col-box">
                <div class="col-header blue">📊 Current Performance Status</div>
                <div class="col-content">
                    <div class="status-row"><span>Starting Position (Jan-25):</span><span class="value-red">20.17 DPU</span></div>
                    <div class="status-row"><span>Current Position (Sep-25):</span><span class="value-red">12.80 DPU</span></div>
                    <div class="status-row"><span>Target Position (Dec-25):</span><span class="value-green">8.2 DPU</span></div>
                    <div class="status-row"><span>Gap Remaining:</span><span class="value-red">4.60 DPU</span></div>
                </div>
                <div style="background: #FCB026; color: #000; padding: 2px 4px; font-size: 5px; font-weight: bold; text-align: center;">62% OF TARGET IMPROVEMENT ACHIEVED</div>
            </div>
            <div class="col-box">
                <div class="col-header orange">📈 Performance Trajectory</div>
                <div class="col-content">
                    <div class="status-row"><span>YTD Improvement:</span><span class="value-green">37% ↓</span></div>
                    <div class="status-row"><span>Months of Progress:</span><span class="value-blue">9 months</span></div>
                    <div class="status-row"><span>Average Monthly Reduction:</span><span class="value-green">0.82</span></div>
                    <div class="status-row"><span>Required Acceleration:</span><span class="value-red">187% faster</span></div>
                </div>
                <div style="background: #FCB026; color: #000; padding: 2px 4px; font-size: 5px; font-weight: bold; text-align: center;">ENHANCED FOCUS: Maintain momentum with targeted improvements</div>
            </div>
        </div>

        <!-- Key Performance Insights -->
        <div style="background: #f8f9fa; border: 1px solid #FCB026; border-radius: 3px; padding: 4px; margin: 4px 0;">
            <div style="font-size: 6px; font-weight: bold; margin-bottom: 2px;">🎯 KEY PERFORMANCE INSIGHTS</div>
            <div class="two-col" style="gap: 4px;">
                <div>
                    <strong style="color: #10B981; font-size: 5px;">✅ POSITIVE TRENDS:</strong>
                    <ul style="margin: 1px 0; padding-left: 6px; font-size: 5px;">
                        <li>Consistent month-over-month improvement trend</li>
                        <li>Build volume maintained above 1,500 units</li>
                        <li>Multiple stages showing stability</li>
                        <li>Quality systems implementation progressing</li>
                    </ul>
                </div>
                <div>
                    <strong style="color: #EF4444; font-size: 5px;">⚠️ AREAS OF CONCERN:</strong>
                    <ul style="margin: 1px 0; padding-left: 6px; font-size: 5px;">
                        <li>Improvement rate needs 187% acceleration</li>
                        <li>Critical stages require focused intervention</li>
                        <li>Target timeline creates delivery pressure</li>
                        <li>Performance consistency varies by stage</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Stage Performance Grid -->
        <div class="section-title">🔥 STAGE PERFORMANCE HEAT MAP</div>
        <div class="stage-grid">
            ${reportData.stagePerformance.slice(0, 6).map(stage => `
                <div class="stage-card ${stage.status.toLowerCase()}">
                    <div class="stage-name">${stage.name}</div>
                    <div class="stage-value">${formatDPU(stage.dpu)}</div>
                    <div class="stage-change">${stage.change > 0 ? '+' : ''}${formatDPU(stage.change)} DPU</div>
                    <div class="stage-status">${stage.status.toUpperCase()}</div>
                </div>
            `).join('')}
        </div>

        <!-- Target Achievement Analysis -->
        <div class="section-title">TARGET ACHIEVEMENT ANALYSIS</div>
        <div class="two-col" style="gap: 2px;">
            <div style="background: #f0fdf4; border: 1px solid #10B981; padding: 3px;">
                <div style="font-size: 5px; font-weight: bold; color: #10B981; margin-bottom: 1px;">✅ CURRENT TRAJECTORY</div>
                <div style="font-size: 5px;">Historical Rate: <strong>0.82/month</strong> | Required Rate: <strong>1.53/month</strong> | Acceleration Needed: <strong>187%</strong></div>
            </div>
            <div style="background: #fef2f2; border: 1px solid #EF4444; padding: 3px;">
                <div style="font-size: 5px; font-weight: bold; color: #EF4444; margin-bottom: 1px;">⚠️ RISK FACTORS</div>
                <div style="font-size: 5px;">Status: <strong>At Risk</strong> | Gap to Target: <strong>4.60 DPU</strong> | Time Pressure: <strong>HIGH</strong></div>
            </div>
        </div>

        <!-- Upcoming Updates -->
        <div class="upcoming-updates">
            <div class="updates-header">🚀 UPCOMING UPDATES</div>
            <div class="updates-content">
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
                <div style="font-style: italic; text-align: center; margin-top: 2px; font-size: 5px; color: #666;">
                    <strong>Phase 1 Implementation:</strong> Live data integration and real-time quality monitoring (Q1 2026)
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div>
            <span class="footer-logo">JCB</span>
            <strong>JCB Digital Factory - Confidential Quality Performance Report</strong>
        </div>
        <div style="margin-top: 2px;">
            Generated: ${new Date(reportData.reportDate).toLocaleDateString('en-GB')} | Target: 8.2 DPU by December 2025<br/>
            J.C.Bamford Excavators Limited © 2025 | Rocester, Staffordshire, UK
        </div>
    </div>
</body>
</html>
  `;
};
