/**
 * JCB Quality Performance Report Generator - Modern Edition
 * Generates comprehensive, professional reports with cutting-edge design
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

// Helper function to generate intelligent insights
const generateInsights = (reportData: MonthlyReportData, data: InspectionData[]) => {
  const insights = [];
  
  // DPU trend analysis
  const dpuChange = reportData.currentMonthDPU - reportData.lastMonthDPU;
  const dpuChangePercent = ((dpuChange / reportData.lastMonthDPU) * 100).toFixed(1);
  
  if (dpuChange < -0.5) {
    insights.push({
      type: 'success',
      icon: '📈',
      title: 'Quality Improvement',
      message: `DPU improved by ${Math.abs(dpuChange).toFixed(2)} points (${Math.abs(parseFloat(dpuChangePercent))}% reduction) - strong performance momentum`,
      impact: 'positive'
    });
  } else if (dpuChange > 0.5) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Quality Decline',
      message: `DPU increased by ${dpuChange.toFixed(2)} points (${dpuChangePercent}% deterioration) - immediate attention required`,
      impact: 'negative'
    });
  } else {
    insights.push({
      type: 'info',
      icon: '➡️',
      title: 'Stable Performance',
      message: `DPU remained stable with minimal change of ${Math.abs(dpuChange).toFixed(2)} points - maintaining consistency`,
      impact: 'neutral'
    });
  }
  
  // Build volume analysis
  const buildVolumeStatus = reportData.buildVolume > 1800 ? 'exceptional' : reportData.buildVolume > 1500 ? 'excellent' : 'good';
  insights.push({
    type: buildVolumeStatus === 'exceptional' ? 'success' : 'info',
    icon: '🏭',
    title: 'Production Volume',
    message: `Build volume of ${formatNumber(reportData.buildVolume)} units demonstrates ${buildVolumeStatus} production capacity`,
    impact: buildVolumeStatus === 'exceptional' ? 'positive' : 'neutral'
  });
  
  // Top performer identification
  const bestStage = reportData.stagePerformance.find(s => s.status === 'Improved');
  if (bestStage) {
    insights.push({
      type: 'success',
      icon: '🎯',
      title: 'Stage Excellence',
      message: `${bestStage.name} stage demonstrates continuous improvement with DPU of ${formatDPU(bestStage.dpu)}`,
      impact: 'positive'
    });
  }
  
  // Risk assessment
  if (reportData.glidePath.riskAssessment === 'Critical') {
    insights.push({
      type: 'danger',
      icon: '🚨',
      title: 'Critical Risk Alert',
      message: 'Current trajectory may miss year-end target - immediate strategic intervention required',
      impact: 'critical'
    });
  } else if (reportData.glidePath.riskAssessment === 'At Risk') {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Performance Risk',
      message: 'Enhanced quality measures needed to ensure year-end target achievement',
      impact: 'negative'
    });
  } else {
    insights.push({
      type: 'success',
      icon: '✅',
      title: 'Target Alignment',
      message: 'Current performance trajectory aligns with year-end target achievement',
      impact: 'positive'
    });
  }
  
  return insights;
};

// Helper function to generate strategic recommendations
const generateRecommendations = (reportData: MonthlyReportData) => {
  // Immediate actions (next 30 days)
  const immediateActions = [];
  const deterioratedStages = reportData.stagePerformance.filter(s => s.status === 'Deteriorated').slice(0, 3);
  
  if (deterioratedStages.length > 0) {
    immediateActions.push({
      priority: 'high',
      action: `Focus improvement efforts on ${deterioratedStages.map(s => s.name).join(', ')} stages`,
      timeline: '7-14 days',
      owner: 'Production Team'
    });
  }
  
  if (reportData.currentMonthDPU > reportData.glidePath.monthlyTargets[0]?.targetDPU) {
    immediateActions.push({
      priority: 'critical',
      action: 'Implement accelerated quality improvement plan',
      timeline: '3-7 days',
      owner: 'Quality Manager'
    });
  }
  
  immediateActions.push({
    priority: 'medium',
    action: 'Conduct root cause analysis on top 3 fault contributors',
    timeline: '14-21 days',
    owner: 'Engineering Team'
  });
  
  // Medium-term initiatives (next quarter)
  const mediumTermActions = [];
  const highDpuStages = reportData.stagePerformance.filter(s => s.dpu > 2).slice(0, 2);
  
  if (highDpuStages.length > 0) {
    mediumTermActions.push({
      priority: 'high',
      action: `Process review and optimization for ${highDpuStages.map(s => s.name).join(', ')}`,
      timeline: '4-6 weeks',
      owner: 'Process Engineering'
    });
  }
  
  mediumTermActions.push(
    {
      priority: 'medium',
      action: 'Implement predictive quality analytics system',
      timeline: '8-12 weeks',
      owner: 'Digital Factory Team'
    },
    {
      priority: 'medium',
      action: 'Enhanced operator training and certification program',
      timeline: '6-10 weeks',
      owner: 'Training Department'
    },
    {
      priority: 'low',
      action: 'Supplier quality improvement initiatives',
      timeline: '10-16 weeks',
      owner: 'Supply Chain'
    }
  );
  
  return {
    immediate: immediateActions,
    mediumTerm: mediumTermActions
  };
};

export const generateMonthlyReport = (data: InspectionData[]): MonthlyReportData => {
  // Get current data (latest month with actual data, not just 0s)
  const latestMonth = data.filter(month => month.totalInspections > 0).pop() || data[data.length - 1];
  const previousMonth = data.filter(month => month.totalInspections > 0 && month !== latestMonth).pop() || data[data.length - 2];
  
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
  const monthBeforePrevious = data.filter(month => month.totalInspections > 0 && month !== latestMonth && month !== previousMonth).pop();
  const stagePerformance = latestMonth.stages.map(stage => {
    const monthBeforePreviousStage = monthBeforePrevious?.stages.find(s => s.name === stage.name);
    const change = monthBeforePreviousStage ? stage.dpu - monthBeforePreviousStage.dpu : 0;
    
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
    action: `${stage.status === 'Deteriorated' ? 'Immediate process review' : stage.status === 'Improved' ? 'Continue best practices' : 'Monitor performance'}`
  }));
  
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

export const generateReportHTML = (reportData: MonthlyReportData, data: InspectionData[]): string => {
  const insights = generateInsights(reportData, data);
  const recommendations = generateRecommendations(reportData);
  const currentDate = new Date().toLocaleDateString('en-GB');
  const monthEnding = new Date(reportData.monthEnding).toLocaleDateString('en-GB');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JCB Quality Performance Report - ${monthEnding}</title>
    <style>
        /* Modern CSS Variables & Reset */
        :root {
            --primary: #FCB026;
            --primary-dark: #F59E0B;
            --success: #10B981;
            --success-light: #34D399;
            --warning: #F59E0B;
            --danger: #EF4444;
            --info: #3B82F6;
            --gray-50: #F9FAFB;
            --gray-100: #F3F4F6;
            --gray-200: #E5E7EB;
            --gray-300: #D1D5DB;
            --gray-400: #9CA3AF;
            --gray-500: #6B7280;
            --gray-600: #4B5563;
            --gray-700: #374151;
            --gray-800: #1F2937;
            --gray-900: #111827;
            --white: #FFFFFF;
            --black: #000000;
            
            /* Shadows */
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            
            /* Gradients */
            --gradient-primary: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            --gradient-dark: linear-gradient(135deg, var(--gray-800) 0%, var(--gray-900) 100%);
            --gradient-light: linear-gradient(135deg, var(--white) 0%, var(--gray-50) 100%);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--gray-800);
            background: var(--gray-50);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        /* Typography Scale */
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-base { font-size: 1rem; line-height: 1.5rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
        .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
        .text-5xl { font-size: 3rem; line-height: 1; }
        
        .font-light { font-weight: 300; }
        .font-normal { font-weight: 400; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .font-extrabold { font-weight: 800; }
        
        /* Layout */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: var(--white);
            min-height: 100vh;
        }
        
        .grid {
            display: grid;
            gap: 1.5rem;
        }
        
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        
        /* Modern Card Component */
        .card {
            background: var(--white);
            border-radius: 16px;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--gray-200);
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-bottom: 2rem;
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-xl);
        }
        
        .card-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--gray-200);
            background: var(--gradient-light);
        }
        
        .card-body {
            padding: 1.5rem;
        }
        
        /* Header */
        .header {
            background: var(--gradient-primary);
            color: var(--black);
            padding: 2rem;
            border-radius: 16px;
            margin-bottom: 2rem;
            box-shadow: var(--shadow-xl);
        }
        
        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            box-shadow: var(--shadow-md);
        }
        
        .header-title {
            text-align: center;
            flex: 1;
        }
        
        .main-title {
            font-size: 2.5rem;
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .subtitle {
            font-size: 1rem;
            font-weight: 500;
            opacity: 0.8;
        }
        
        /* KPI Dashboard */
        .kpi-dashboard {
            background: var(--gradient-dark);
            border-radius: 20px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 3px solid var(--primary);
            box-shadow: 0 0 0 4px rgba(252, 176, 38, 0.1), var(--shadow-xl);
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .kpi-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient-primary);
        }
        
        .kpi-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--white);
            margin: 0.5rem 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .kpi-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--gray-300);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }
        
        .kpi-change {
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            margin-top: 0.5rem;
        }
        
        .kpi-change.positive {
            background: rgba(16, 185, 129, 0.2);
            color: var(--success-light);
        }
        
        .kpi-change.negative {
            background: rgba(239, 68, 68, 0.2);
            color: #F87171;
        }
        
        /* Insight Cards */
        .insight-card {
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            border-left: 4px solid;
            position: relative;
            background: var(--white);
            box-shadow: var(--shadow-md);
        }
        
        .insight-card.success {
            border-left-color: var(--success);
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
        }
        
        .insight-card.warning {
            border-left-color: var(--warning);
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%);
        }
        
        .insight-card.danger {
            border-left-color: var(--danger);
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
        }
        
        .insight-card.info {
            border-left-color: var(--info);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
        }
        
        .insight-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }
        
        .insight-icon {
            font-size: 1.5rem;
        }
        
        .insight-title {
            font-weight: 600;
            color: var(--gray-800);
        }
        
        .insight-message {
            color: var(--gray-600);
            line-height: 1.6;
        }
        
        /* Tables */
        .table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: var(--shadow-md);
            background: var(--white);
        }
        
        .table th {
            background: var(--gray-50);
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: var(--gray-700);
            border-bottom: 2px solid var(--gray-200);
        }
        
        .table td {
            padding: 1rem;
            border-bottom: 1px solid var(--gray-200);
        }
        
        .table tr:hover {
            background: var(--gray-50);
        }
        
        /* Status Badges */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .badge.success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }
        
        .badge.warning {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }
        
        .badge.danger {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }
        
        /* Chart */
        .chart-container {
            background: var(--white);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--gray-200);
        }
        
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 1rem;
            padding: 2rem;
            background: var(--gray-50);
            border-radius: 12px;
            margin: 1rem 0;
        }
        
        .chart-bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }
        
        .bar {
            width: 100%;
            background: var(--gradient-primary);
            border-radius: 6px 6px 0 0;
            position: relative;
            box-shadow: var(--shadow-sm);
            transition: all 0.3s ease;
        }
        
        .bar:hover {
            transform: scaleY(1.05);
            box-shadow: var(--shadow-md);
        }
        
        .bar-value {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--gray-700);
        }
        
        .bar-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--gray-600);
            text-align: center;
        }
        
        .bar-volume {
            font-size: 0.625rem;
            font-weight: 600;
            color: var(--info);
        }
        
        /* Action Cards */
        .action-card {
            border: 1px solid;
            border-radius: 12px;
            padding: 1.5rem;
            background: var(--white);
            box-shadow: var(--shadow-md);
            margin-bottom: 1rem;
        }
        
        .action-card.critical {
            border-color: var(--danger);
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
        }
        
        .action-card.high {
            border-color: var(--warning);
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%);
        }
        
        .action-card.medium {
            border-color: var(--info);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
        }
        
        .action-card.low {
            border-color: var(--gray-300);
            background: linear-gradient(135deg, rgba(107, 114, 128, 0.05) 0%, rgba(107, 114, 128, 0.02) 100%);
        }
        
        .action-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        .action-title {
            font-weight: 600;
            color: var(--gray-800);
            flex: 1;
            margin-right: 1rem;
        }
        
        .priority-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .priority-badge.critical {
            background: var(--danger);
            color: var(--white);
        }
        
        .priority-badge.high {
            background: var(--warning);
            color: var(--white);
        }
        
        .priority-badge.medium {
            background: var(--info);
            color: var(--white);
        }
        
        .priority-badge.low {
            background: var(--gray-400);
            color: var(--white);
        }
        
        .action-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
            color: var(--gray-600);
            margin-top: 1rem;
        }
        
        /* Section Headers */
        .section-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .section-icon {
            width: 48px;
            height: 48px;
            background: var(--gradient-primary);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: var(--black);
            box-shadow: var(--shadow-md);
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--gray-800);
        }
        
        .section-subtitle {
            font-size: 0.875rem;
            color: var(--gray-600);
            margin-top: 0.25rem;
        }
        
        /* Footer */
        .footer {
            background: var(--gray-800);
            color: var(--white);
            padding: 2rem;
            border-radius: 16px;
            text-align: center;
            margin-top: 3rem;
            box-shadow: var(--shadow-xl);
        }
        
        .footer-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .footer-logo {
            width: 32px;
            height: 32px;
            background: var(--white);
            padding: 4px;
            border-radius: 6px;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .grid-cols-4 {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            
            .grid-cols-2 {
                grid-template-columns: repeat(1, minmax(0, 1fr));
            }
            
            .header-content {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
            
            .main-title {
                font-size: 1.875rem;
            }
            
            .kpi-value {
                font-size: 2rem;
            }
            
            .action-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
            
            .action-title {
                margin-right: 0;
            }
        }
        
        /* Print Styles */
        @media print {
            body {
                background: var(--white);
            }
            
            .container {
                max-width: none;
                padding: 0;
                box-shadow: none;
            }
            
            .card:hover {
                transform: none;
            }
            
            .bar:hover {
                transform: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <img src="/jcb-logo.png" alt="JCB Logo" class="logo" />
                <div class="header-title">
                    <h1 class="main-title">JCB QUALITY<br>PERFORMANCE REPORT</h1>
                    <p class="subtitle">Month Ending: ${monthEnding} • Generated: ${currentDate} • Digital Factory Quality Management</p>
                </div>
            </div>
        </header>

        <!-- Executive KPI Dashboard -->
        <section class="kpi-dashboard">
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Current DPU</div>
                    <div class="kpi-value" style="color: var(--primary);">${formatDPU(reportData.currentMonthDPU)}</div>
                    <div class="kpi-change ${reportData.currentMonthDPU < reportData.lastMonthDPU ? 'positive' : 'negative'}">
                        ${reportData.currentMonthDPU < reportData.lastMonthDPU ? '↓' : '↑'} ${formatDPU(Math.abs(reportData.currentMonthDPU - reportData.lastMonthDPU))} vs last month
                    </div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-label">Build Volume</div>
                    <div class="kpi-value" style="color: var(--info);">${formatNumber(reportData.buildVolume)}</div>
                    <div class="kpi-change positive">Units Built</div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-label">Total Faults</div>
                    <div class="kpi-value" style="color: var(--danger);">${formatNumber(reportData.totalFaults)}</div>
                    <div class="kpi-change">Current Month</div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-label">YTD Improvement</div>
                    <div class="kpi-value" style="color: var(--success);">${((20.17 - reportData.currentMonthDPU) / 20.17 * 100).toFixed(1)}%</div>
                    <div class="kpi-change positive">${formatDPU(20.17 - reportData.currentMonthDPU)} DPU reduction</div>
                </div>
            </div>
        </section>

        <!-- Performance Insights -->
        <section class="card">
            <div class="card-header">
                <div class="section-header">
                    <div class="section-icon">📊</div>
                    <div>
                        <h2 class="section-title">Performance Insights</h2>
                        <p class="section-subtitle">Key insights and story behind this month's performance</p>
                    </div>
                </div>
            </div>
            <div class="card-body">
                ${insights.map(insight => `
                    <div class="insight-card ${insight.type}">
                        <div class="insight-header">
                            <span class="insight-icon">${insight.icon}</span>
                            <h3 class="insight-title">${insight.title}</h3>
                        </div>
                        <p class="insight-message">${insight.message}</p>
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- Performance Trajectory Chart -->
        <section class="card">
            <div class="card-header">
                <div class="section-header">
                    <div class="section-icon">📈</div>
                    <div>
                        <h2 class="section-title">Performance Trajectory</h2>
                        <p class="section-subtitle">DPU trend and build volume correlation over time</p>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="chart-container">
                    <div class="chart-grid">
                        ${data.filter(month => month.totalDpu > 0).map(month => `
                            <div class="chart-bar">
                                <div class="bar-label">${month.date}</div>
                                <div class="bar" style="height: ${Math.min(150, (month.totalDpu / 25) * 150)}px;">
                                    <div class="bar-value">${formatDPU(month.totalDpu)}</div>
                                </div>
                                <div class="bar-volume">${formatNumber(month.stages.find(s => s.name === 'SIGN')?.inspected || 0)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; background: var(--gradient-primary); border-radius: 4px;"></div>
                            <span class="text-sm">DPU (Bar Height)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; background: var(--info); border-radius: 4px;"></div>
                            <span class="text-sm">Build Volume</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Critical Focus Areas -->
        <section class="card">
            <div class="card-header">
                <div class="section-header">
                    <div class="section-icon">🎯</div>
                    <div>
                        <h2 class="section-title">Critical Focus Areas</h2>
                        <p class="section-subtitle">Top 5 stages requiring immediate attention</p>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Stage</th>
                            <th>Current DPU</th>
                            <th>Trend</th>
                            <th>Status</th>
                            <th>Action Required</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.stagePerformance.slice(0, 5).map((stage, index) => `
                            <tr>
                                <td class="font-bold">${index + 1}</td>
                                <td class="font-semibold">${stage.name}</td>
                                <td class="font-bold" style="color: ${stage.dpu > 2 ? 'var(--danger)' : stage.dpu > 1 ? 'var(--warning)' : 'var(--success)'};">
                                    ${formatDPU(stage.dpu)}
                                </td>
                                <td style="text-align: center; font-size: 1.25rem;">
                                    ${stage.status === 'Improved' ? '📈' : stage.status === 'Deteriorated' ? '📉' : '➡️'}
                                </td>
                                <td>
                                    <span class="badge ${stage.status === 'Improved' ? 'success' : stage.status === 'Deteriorated' ? 'danger' : 'warning'}">
                                        ${stage.status}
                                    </span>
                                </td>
                                <td>
                                    ${stage.status === 'Deteriorated' ? 'Immediate review required' : 
                                      stage.status === 'Improved' ? 'Continue improvement' : 
                                      'Monitor closely'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Strategic Recommendations -->
        <section class="grid grid-cols-2">
            <!-- Immediate Actions -->
            <div class="card">
                <div class="card-header">
                    <div class="section-header">
                        <div class="section-icon" style="background: var(--danger);">🚨</div>
                        <div>
                            <h2 class="section-title">Immediate Actions</h2>
                            <p class="section-subtitle">Next 30 days priorities</p>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    ${recommendations.immediate.map(action => `
                        <div class="action-card ${action.priority}">
                            <div class="action-header">
                                <h4 class="action-title">${action.action}</h4>
                                <span class="priority-badge ${action.priority}">${action.priority}</span>
                            </div>
                            <div class="action-meta">
                                <span>⏱️ ${action.timeline}</span>
                                <span>👤 ${action.owner}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Medium-term Initiatives -->
            <div class="card">
                <div class="card-header">
                    <div class="section-header">
                        <div class="section-icon" style="background: var(--info);">📋</div>
                        <div>
                            <h2 class="section-title">Medium-term Initiatives</h2>
                            <p class="section-subtitle">Next quarter priorities</p>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    ${recommendations.mediumTerm.map(action => `
                        <div class="action-card ${action.priority}">
                            <div class="action-header">
                                <h4 class="action-title">${action.action}</h4>
                                <span class="priority-badge ${action.priority}">${action.priority}</span>
                            </div>
                            <div class="action-meta">
                                <span>⏱️ ${action.timeline}</span>
                                <span>👤 ${action.owner}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- Monthly Summary Data -->
        <section class="card">
            <div class="card-header">
                <div class="section-header">
                    <div class="section-icon">📋</div>
                    <div>
                        <h2 class="section-title">Monthly Summary Data</h2>
                        <p class="section-subtitle">Detailed monthly performance data for reference</p>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Total Inspections</th>
                            <th>Total Faults</th>
                            <th>Total DPU</th>
                            <th>Build Volume</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.filter(month => month.totalDpu > 0).map(month => {
                            const buildVolume = month.stages.find(s => s.name === 'SIGN')?.inspected || 0;
                            const status = month.totalDpu <= 10 ? 'excellent' : month.totalDpu <= 15 ? 'good' : 'attention';
                            return `
                                <tr>
                                    <td class="font-semibold">${month.date}</td>
                                    <td>${formatNumber(month.totalInspections)}</td>
                                    <td>${formatNumber(month.totalFaults)}</td>
                                    <td class="font-bold" style="color: ${status === 'excellent' ? 'var(--success)' : status === 'good' ? 'var(--warning)' : 'var(--danger)'};">
                                        ${formatDPU(month.totalDpu)}
                                    </td>
                                    <td class="font-semibold" style="color: var(--info);">${formatNumber(buildVolume)}</td>
                                    <td>
                                        <span class="badge ${status === 'excellent' ? 'success' : status === 'good' ? 'warning' : 'danger'}">
                                            ${status === 'excellent' ? '✅ Excellent' : status === 'good' ? '⚠️ Good' : '🔴 Attention'}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <div class="footer-content">
                <img src="/jcb-logo.png" alt="JCB Logo" class="footer-logo" />
                <strong>JCB Digital Factory - Confidential Quality Performance Report</strong>
            </div>
            <p>Generated: ${new Date().toLocaleString('en-GB')} | Target: 8.2 DPU by December 2025</p>
            <p class="text-sm" style="margin-top: 0.5rem; opacity: 0.7;">
                J.C.Bamford Excavators Limited © ${new Date().getFullYear()} | Rocester, Staffordshire, UK
            </p>
        </footer>
    </div>
</body>
</html>
  `;
};
