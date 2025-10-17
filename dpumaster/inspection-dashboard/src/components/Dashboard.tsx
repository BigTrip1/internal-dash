'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { getStagePerformanceSummary, formatNumber, formatDPU } from '@/utils/dataUtils';
import { YearTarget } from '@/types';
import { getStageTarget } from '@/utils/targetCalculations';
import { InterventionPlan } from '@/types/interventions';
import InterventionModal from './InterventionModal';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart
} from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, BarChart3, ArrowUp, ArrowDown, Minus, Info, Target as TargetIcon } from 'lucide-react';

// Tooltip Component
const TooltipCard: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute top-8 right-0 z-50 w-80 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-white text-sm">
          <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-800 border-l border-t border-gray-600 transform rotate-45"></div>
          {content}
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { data, error } = useData();
  const [selectedStage, setSelectedStage] = useState<string>('COMBINED TOTALS');
  const [yearTargets, setYearTargets] = useState<YearTarget | null>(null);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [interventionPlan, setInterventionPlan] = useState<InterventionPlan | null>(null);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const performanceSummary = getStagePerformanceSummary(data);

  // Fetch targets for current year
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const response = await fetch(`/api/targets?year=${currentYear}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.target) {
            setYearTargets(result.target);
          }
        }
      } catch (error) {
        console.error('Error fetching targets:', error);
      } finally {
        setTargetsLoading(false);
      }
    };

    fetchTargets();
  }, []);

  // Fetch intervention plan for selected stage
  useEffect(() => {
    const fetchInterventionPlan = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const response = await fetch(`/api/interventions?stage=${encodeURIComponent(selectedStage)}&year=${currentYear}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.plan) {
            setInterventionPlan(result.plan);
          } else {
            setInterventionPlan(null);
          }
        }
      } catch (error) {
        console.error('Error fetching intervention plan:', error);
        setInterventionPlan(null);
      }
    };

    if (selectedStage) {
      fetchInterventionPlan();
    }
  }, [selectedStage]);

  // Helper function to check if selected filter is a totals option
  const isTotalsFilter = () => {
    return ['PRODUCTION TOTALS', 'DPDI TOTALS', 'COMBINED TOTALS'].includes(selectedStage);
  };

  // Get available stages for dropdown - collect from all months to ensure new stages are included
  const allStages = data.length > 0 
    ? Array.from(new Set(data.flatMap(month => month.stages.map(stage => stage.name))))
    : [];
  const availableStages = ['PRODUCTION TOTALS', 'DPDI TOTALS', 'COMBINED TOTALS', ...allStages];

  // Calculate overall trends - use current month data (including Sep)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  
  // Get current month data (including Sep if it has data)
  const currentMonthData = data.filter(month => {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month.date.substring(0, 3));
    const combinedDpu = month.combinedTotalDpu ?? 0;
    return combinedDpu > 0 && monthIndex <= currentMonth;
  });
  
  // Get completed months for improvement calculation (exclude current month)
  const completedMonths = data.filter(month => {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month.date.substring(0, 3));
    const combinedDpu = month.combinedTotalDpu ?? 0;
    return combinedDpu > 0 && monthIndex < currentMonth;
  });
  
  const latestCurrentMonth = currentMonthData[currentMonthData.length - 1] || data[data.length - 1];
  const latestCompletedMonth = completedMonths[completedMonths.length - 1] || data[0];
  const firstMonth = data[0];

  // Early return if no data available
  if (!data || data.length === 0 || !latestCurrentMonth) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">No data available</div>
            <div className="text-gray-500 text-sm">Please check your data source or try again later.</div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate month-to-month differences for KPI cards
  const previousMonth = latestCurrentMonth ? data[data.indexOf(latestCurrentMonth) - 1] : undefined;
  const currentCombinedDpu = latestCurrentMonth?.combinedTotalDpu ?? 0;
  const previousCombinedDpu = previousMonth?.combinedTotalDpu ?? 0;
  const currentDpuChange = latestCurrentMonth && previousMonth ? currentCombinedDpu - previousCombinedDpu : 0;
  const currentBuildVolumeChange = latestCurrentMonth && previousMonth ? 
    ((latestCurrentMonth?.signoutVolume ?? latestCurrentMonth?.stages?.find(s => s.name === 'SIGN')?.inspected) || 0) - 
    ((previousMonth?.signoutVolume ?? previousMonth?.stages?.find(s => s.name === 'SIGN')?.inspected) || 0) : 0;
  const currentCombinedFaults = latestCurrentMonth?.combinedTotalFaults ?? 0;
  const previousCombinedFaults = previousMonth?.combinedTotalFaults ?? 0;
  const currentFaultsChange = latestCurrentMonth && previousMonth ? currentCombinedFaults - previousCombinedFaults : 0;
  const firstCombinedDpu = firstMonth?.combinedTotalDpu ?? 0;
  const completedCombinedDpu = latestCompletedMonth?.combinedTotalDpu ?? 0;
  const dpuImprovement = firstCombinedDpu - completedCombinedDpu;
  const dpuImprovementPercent = firstCombinedDpu > 0 ? ((dpuImprovement / firstCombinedDpu) * 100).toFixed(1) : '0.0';

  // Calculate YTD Build Volume (sum of all signout volume data)
  const ytdBuildVolume = data.reduce((total, month) => {
    const buildVolume = month.signoutVolume ?? month.stages.find(stage => stage.name === 'SIGN')?.inspected ?? 0;
    return total + buildVolume;
  }, 0);

  // Calculate YTD Total Faults
  const ytdTotalFaults = data.reduce((total, month) => {
    const faults = month.combinedTotalFaults ?? 0;
    return total + faults;
  }, 0);

  // Calculate Fault Rate per 1000 Units
  const faultRatePer1000 = ytdBuildVolume > 0 ? ((ytdTotalFaults / ytdBuildVolume) * 1000).toFixed(1) : '0.0';

  // Prepare chart data based on selected stage - PULL FROM ADMIN TABLE DATA
  const monthlyTrendData = data.map(month => {
    if (selectedStage === 'PRODUCTION TOTALS') {
      return {
        month: month.date,
        totalDpu: month.productionTotalDpu ?? 0,
        totalFaults: month.productionTotalFaults ?? 0,
        buildVolume: month.signoutVolume ?? month.stages.find(s => s.name === 'SIGN')?.inspected ?? 0
      };
    } else if (selectedStage === 'DPDI TOTALS') {
      return {
        month: month.date,
        totalDpu: month.dpdiTotalDpu ?? 0,
        totalFaults: month.dpdiTotalFaults ?? 0,
        buildVolume: month.signoutVolume ?? month.stages.find(s => s.name === 'SIGN')?.inspected ?? 0
      };
    } else if (selectedStage === 'COMBINED TOTALS') {
      return {
        month: month.date,
        totalDpu: month.combinedTotalDpu ?? 0,
        totalFaults: month.combinedTotalFaults ?? 0,
        buildVolume: month.signoutVolume ?? month.stages.find(s => s.name === 'SIGN')?.inspected ?? 0
      };
    } else {
      // Use stage-specific data from admin table
      const selectedStageData = month.stages.find(stage => stage.name === selectedStage);
      const stageDpu = selectedStageData ? selectedStageData.dpu : 0;
      const stageInspected = selectedStageData ? selectedStageData.inspected : 0;
      
      return {
        month: month.date,
        totalDpu: stageDpu, // This should match admin table stage DPU column
        totalFaults: selectedStageData ? selectedStageData.faults : 0, // This should match admin table stage FAULTS column
        buildVolume: stageInspected // Use stage INSPECTED for individual stages
      };
    }
  });

  // Fix fault contributors data - ensure we have actual data
  const topStagesData = performanceSummary
    .filter(stage => stage.totalFaults > 0) // Only include stages with actual faults
    .slice(0, 5)
    .map(stage => ({
      name: stage.name,
      avgDpu: stage.avgDpu,
      totalFaults: stage.totalFaults,
      percentage: ((stage.totalFaults / performanceSummary.reduce((sum, s) => sum + s.totalFaults, 0)) * 100).toFixed(1)
    }));

  // Color scheme for charts
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  // Performance thresholds
  const PERFORMANCE_THRESHOLDS = {
    DPU: { excellent: 10, good: 15, poor: 20 },
    BUILD_VOLUME: { excellent: 1500, good: 1000, poor: 500 },
    FAULT_RATE: { excellent: 1000, good: 5000, poor: 10000 }
  };

  // Trend calculation function
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    const threshold = 0.05; // 5% threshold for considering a change significant
    const change = (current - previous) / previous;
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  // Performance status function
  const getPerformanceStatus = (metric: string, value: number): 'excellent' | 'good' | 'poor' => {
    const thresholds = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return 'good';
    
    if (value <= thresholds.excellent) return 'excellent';
    if (value <= thresholds.good) return 'good';
    return 'poor';
  };

  // Get previous month data for trend calculations
  const getPreviousMonthData = (currentData: any) => {
    const currentMonthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(currentData.date.substring(0, 3));
    const previousMonthIndex = currentMonthIndex - 1;
    
    if (previousMonthIndex < 0) return null;
    
    return data.find(month => {
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month.date.substring(0, 3));
      return monthIndex === previousMonthIndex && (month.combinedTotalDpu > 0 || month.productionTotalDpu > 0);
    });
  };

  // Forecasting function - Enhanced trend prediction with smoothing
  const generateForecast = (data: any[], key: string, months: number = 3) => {
    if (data.length < 2) return [];
    
    const validData = data.filter(d => d[key] > 0);
    if (validData.length < 2) return [];
    
    // Use the last 4-6 months for more accurate forecasting
    const recentData = validData.slice(-Math.min(6, validData.length));
    const n = recentData.length;
    
    // Calculate trend using linear regression
    const sumX = recentData.reduce((sum, _, i) => sum + i, 0);
    const sumY = recentData.reduce((sum, d) => sum + d[key], 0);
    const sumXY = recentData.reduce((sum, d, i) => sum + (i * d[key]), 0);
    const sumXX = recentData.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Get the last actual value and calculate average
    const lastValue = recentData[recentData.length - 1][key];
    const avgValue = sumY / n;
    
    const forecast = [];
    for (let i = 0; i < months; i++) {
      // Use a combination of trend and baseline
      let predictedValue = slope * (n + i) + intercept;
      
      // Apply smoothing factor to prevent extreme predictions
      const smoothingFactor = 0.7;
      predictedValue = (predictedValue * smoothingFactor) + (lastValue * (1 - smoothingFactor));
      
      // Apply realistic constraints
      if (key === 'totalDpu') {
        // DPU should be between 8 and 20 for realistic predictions
        predictedValue = Math.max(8, Math.min(20, predictedValue));
      } else if (key === 'buildVolume') {
        // Build volume should be between 1000 and 1800 for realistic predictions
        predictedValue = Math.max(1000, Math.min(1800, predictedValue));
      }
      
      // Add slight variation to make it look more natural
      const variation = (Math.random() - 0.5) * (key === 'totalDpu' ? 1 : 100);
      predictedValue += variation;
      
      forecast.push({
        month: `Forecast-${i + 1}`,
        [key]: Math.round(predictedValue * 100) / 100,
        isForecast: true
      });
    }
    
    return forecast;
  };

  // Filter to show year-to-date data plus add future months for target trajectory
  const today = new Date();
  const thisMonth = today.getMonth(); // 0-11 (0 = January)
  
  // Remove the problematic filtering that's causing issues
  const ytdChartData = monthlyTrendData;

  // Use the original monthly trend data directly (this works!)
  const extendedChartData = monthlyTrendData;

  // Calculate correlation coefficient between DPU and Build Volume
  const calculateCorrelation = (data: any[]) => {
    const validData = data.filter(d => (d.totalDpu > 0 || d.buildVolume > 0));
    if (validData.length < 2) return 0;
    
    const n = validData.length;
    const sumX = validData.reduce((sum, d) => sum + d.totalDpu, 0);
    const sumY = validData.reduce((sum, d) => sum + d.buildVolume, 0);
    const sumXY = validData.reduce((sum, d) => sum + (d.totalDpu * d.buildVolume), 0);
    const sumXX = validData.reduce((sum, d) => sum + (d.totalDpu * d.totalDpu), 0);
    const sumYY = validData.reduce((sum, d) => sum + (d.buildVolume * d.buildVolume), 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Use extended data (YTD + future months) for complete trajectory visualization
  const chartData = extendedChartData;
  const correlationCoefficient = calculateCorrelation(chartData);

  // Get dynamic target based on saved targets or defaults
  const getTargetForStage = (stageName: string, currentDPU: number): number => {
    if (!yearTargets) {
      // Fallback to defaults if no targets set
      if (stageName === 'COMBINED TOTALS') return 8.2;
      if (stageName === 'PRODUCTION TOTALS') return 8.2;
      if (stageName === 'DPDI TOTALS') return 1.8;
      return Math.max(0.1, currentDPU * 0.5); // 50% reduction for individual stages
    }

    // Use saved targets
    if (stageName === 'COMBINED TOTALS') return yearTargets.combinedTarget;
    if (stageName === 'PRODUCTION TOTALS') return yearTargets.productionTarget;
    if (stageName === 'DPDI TOTALS') return yearTargets.dpdiTarget;
    
    // Get stage-specific target
    const stageTarget = getStageTarget(yearTargets.stageTargets, stageName);
    return stageTarget > 0 ? stageTarget : Math.max(0.1, currentDPU * 0.5);
  };

  // Get baseline DPU for the selected stage (starting point for glide path)
  const getBaselineForStage = (stageName: string): number => {
    // Get first month with data for this stage
    const firstMonthData = monthlyTrendData.find(m => m.totalDpu > 0);
    if (!firstMonthData) return 20.17;

    // Use yearTargets baseline if available and matches the stage type
    if (yearTargets?.baseline) {
      if (stageName === 'COMBINED TOTALS') return yearTargets.baseline.combinedDpu;
      if (stageName === 'PRODUCTION TOTALS') return yearTargets.baseline.productionDpu;
      if (stageName === 'DPDI TOTALS') return yearTargets.baseline.dpdiDpu;
    }

    // Otherwise use actual first month data for this stage
    return firstMonthData.totalDpu;
  };

  // Get current DPU for the selected stage (from filtered monthlyTrendData)
  const getCurrentDPUForStage = (): number => {
    const latestData = monthlyTrendData.filter(m => m.totalDpu > 0).pop();
    return latestData?.totalDpu || 0;
  };

  // Get YTD Build Volume for selected stage
  const getYTDBuildVolumeForStage = (): number => {
    return monthlyTrendData.reduce((total, month) => total + (month.buildVolume || 0), 0);
  };

  // Get YTD Total Faults for selected stage
  const getYTDFaultsForStage = (): number => {
    return monthlyTrendData.reduce((total, month) => total + (month.totalFaults || 0), 0);
  };

  // Get Fault Rate per 1000 for selected stage
  const getFaultRateForStage = (): string => {
    const volume = getYTDBuildVolumeForStage();
    const faults = getYTDFaultsForStage();
    return volume > 0 ? ((faults / volume) * 1000).toFixed(1) : '0.0';
  };

  // Get DPU Improvement for selected stage
  const getDPUImprovementForStage = (): { improvement: number; percent: string } => {
    const monthsWithData = monthlyTrendData.filter(m => m.totalDpu > 0);
    if (monthsWithData.length < 2) return { improvement: 0, percent: '0.0' };
    
    const firstDpu = monthsWithData[0].totalDpu;
    const latestDpu = monthsWithData[monthsWithData.length - 1].totalDpu;
    const improvement = firstDpu - latestDpu;
    const percent = firstDpu > 0 ? ((improvement / firstDpu) * 100).toFixed(1) : '0.0';
    
    return { improvement, percent };
  };

  // Calculate DPU trendline data extending through future months to show complete trajectory to target
  const calculateDPUTrendline = (data: any[]) => {
    // Find the last month with actual data
    const lastActualDataIndex = data.findIndex(d => d.totalDpu === 0 || d.totalDpu === null || !d.totalDpu) - 1;
    const actualDataLength = lastActualDataIndex >= 0 ? lastActualDataIndex + 1 : data.filter(d => d.totalDpu > 0).length;
    
    if (actualDataLength < 1) return [];

    // Find the first month with data for this stage
    const firstMonthWithData = data.findIndex(d => d.totalDpu > 0);
    const startingDPU = getBaselineForStage(selectedStage);
    const currentDPU = data[actualDataLength - 1]?.totalDpu || 12.87;
    
    // Get target DPU based on selected stage and saved targets
    const targetDPU = getTargetForStage(selectedStage, currentDPU);
    
    // Calculate months available from first data to December
    const monthsAvailable = 12 - firstMonthWithData; // e.g., DPDI starts month 3 (Apr=index 3) → 12-3=9 months
    const totalReductionNeeded = startingDPU - targetDPU;
    const expectedReductionPerMonth = totalReductionNeeded / monthsAvailable;
    
    // For future months projection
    const monthsToTarget = 3; // Oct, Nov, Dec (3 months to reach target)
    const monthlyReduction = (currentDPU - targetDPU) / monthsToTarget;
    
    return data.map((item, index) => {
      if (index < actualDataLength) {
        // Before stage started - no glide path
        if (index < firstMonthWithData) {
          return {
            month: item.month,
            trendlineDPU: null,
            isAboveTarget: false,
            actualDPU: null,
            variance: 0,
            isFuture: false
          };
        }
        
        // Historical months - show what the ideal target trajectory should have been
        const monthsFromStart = index - firstMonthWithData;
        const targetForThisMonth = startingDPU - (expectedReductionPerMonth * monthsFromStart);
        
        // Debug logging for first month
        if (index === 0) {
          console.log('🎯 Target Trajectory Debug:', {
            startingDPU,
            targetDPU,
            totalReductionNeeded,
            expectedReductionPerMonth,
            targetForThisMonth,
            monthsFromStart,
            month: item.month
          });
        }
        
        const actualDPU = item.totalDpu || 0;
        const isAboveTarget = actualDPU > targetForThisMonth;
        
        return {
          month: item.month,
          trendlineDPU: targetForThisMonth, // Remove Math.max to allow proper trajectory
          isAboveTarget: isAboveTarget,
          actualDPU: actualDPU,
          variance: actualDPU - targetForThisMonth,
          isFuture: false
        };
      } else {
        // Future months - show target trajectory from current position
        const monthsFromCurrent = index - (actualDataLength - 1);
        const targetForThisMonth = currentDPU - (monthlyReduction * monthsFromCurrent);
        
        return {
          month: item.month,
          trendlineDPU: Math.max(targetForThisMonth, targetDPU), // Use dynamic target based on stage
          isAboveTarget: false,
          actualDPU: null,
          variance: 0,
          isFuture: true
        };
      }
    });
  };

  const dpuTrendlineData = calculateDPUTrendline(chartData);

  // Calculate Performance Trajectory (actual trend line)
  const calculatePerformanceTrendline = (data: any[]) => {
    const actualDataPoints = data.filter(item => item.totalDpu > 0);
    if (actualDataPoints.length < 2) return data.map(() => null);
    
    // Calculate linear regression for actual performance
    const n = actualDataPoints.length;
    const sumX = actualDataPoints.reduce((sum, _, index) => sum + index, 0);
    const sumY = actualDataPoints.reduce((sum, item) => sum + item.totalDpu, 0);
    const sumXY = actualDataPoints.reduce((sum, item, index) => sum + (index * item.totalDpu), 0);
    const sumXX = actualDataPoints.reduce((sum, _, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate trend line for all months
    return data.map((_, index) => {
      const trendValue = intercept + (slope * index);
      return Math.max(trendValue, 0); // Don't go below 0
    });
  };

  const performanceTrendline = calculatePerformanceTrendline(chartData);

  // Merge all data - trendline and performance trajectory
  const chartDataWithTrendline = chartData.map((item, index) => ({
    ...item,
    trendlineDPU: dpuTrendlineData[index]?.trendlineDPU || 0,
    performanceTrend: performanceTrendline[index],
    isAboveTarget: dpuTrendlineData[index]?.isAboveTarget || false,
    targetVariance: dpuTrendlineData[index]?.variance || 0,
    isFuture: dpuTrendlineData[index]?.isFuture || false
  }));

  // Calculate dynamic Y-axis domain based on filtered data
  const calculateDynamicDomain = (data: any[], key: string) => {
    const validData = data.filter(d => d[key] > 0);
    if (validData.length === 0) return [0, 10];
    
    const values = validData.map(d => d[key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Add 20% padding above and below
    const padding = (max - min) * 0.2;
    const domainMin = Math.max(0, min - padding);
    const domainMax = max + padding;
    
    // Round to nice numbers
    const niceMin = Math.floor(domainMin * 10) / 10;
    const niceMax = Math.ceil(domainMax * 10) / 10;
    
    return [niceMin, niceMax];
  };

  // Get dynamic domains for both axes
  const dpuDomain = calculateDynamicDomain(chartDataWithTrendline, 'totalDpu');
  const volumeDomain = calculateDynamicDomain(chartDataWithTrendline, 'buildVolume');

  // Debug: Log the data structure to understand what we're working with
  console.log('First month from admin table:', data[0]);
  console.log('Chart data sample:', chartDataWithTrendline[0]);

  // Enhanced tooltip recommendations
  const getRecommendation = (value: number, metric: string) => {
    if (metric === 'totalDpu') {
      if (value < 10) return '🎯 Excellent performance - keep up the great work!';
      if (value < 15) return '✅ Good performance - minor improvements possible';
      return '🚨 Needs immediate attention - review processes';
    }
    
    if (metric === 'buildVolume') {
      if (value > 1500) return '📈 High production volume - excellent!';
      if (value > 1000) return '📊 Good production levels';
      return '📉 Low production - investigate bottlenecks';
    }
    
    return '';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Error indicator */}
      {error && (
        <div className="mb-4">
          <div className="text-sm text-yellow-600 bg-yellow-100 bg-opacity-90 border border-yellow-400 px-3 py-1 rounded">
            ⚠️ {error}
          </div>
        </div>
      )}

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 via-yellow-900/20 to-black border border-yellow-600/30 rounded-xl shadow-2xl hover:shadow-yellow-500/40 transition-all duration-300 hover:scale-105">
            {/* Performance Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white shadow-lg">
                Excellent
              </div>
            </div>
            
            {/* JCB Industrial pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FCB026' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            
            {/* JCB Yellow glow overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 p-2 rounded-md shadow-lg">
                    <TrendingDown className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-right">
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {isTotalsFilter() ? 'Total DPU Improvement YTD' : `${selectedStage} DPU Improvement YTD`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">
                    {getDPUImprovementForStage().percent}%
                  </span>
                  <div className="flex items-center space-x-1">
                    {getDPUImprovementForStage().improvement >= 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">Improving</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400 font-medium">Worsening</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">
                    {formatDPU(Math.abs(getDPUImprovementForStage().improvement))} DPU {getDPUImprovementForStage().improvement >= 0 ? 'reduction' : 'increase'} YTD
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-yellow-900/30 border border-yellow-600/40 rounded-xl shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 hover:scale-105">
            {/* Performance Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-600 text-black shadow-lg font-bold">
                Needs Attention
              </div>
            </div>
            
            {/* JCB Warning pattern */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FCB026' fill-opacity='0.1'%3E%3Cpath d='M0 0h20L0 20z'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            
            {/* JCB Yellow warning glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/15 via-transparent to-yellow-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-yellow-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 p-2 rounded-md shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-right">
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {isTotalsFilter() ? 'Current Month DPU' : `${selectedStage} Current DPU`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                    {isTotalsFilter()
                      ? formatDPU(
                          selectedStage === 'PRODUCTION TOTALS' ? (latestCurrentMonth?.productionTotalDpu ?? 0) :
                          selectedStage === 'DPDI TOTALS' ? (latestCurrentMonth?.dpdiTotalDpu ?? 0) :
                          (latestCurrentMonth?.combinedTotalDpu ?? 0)
                        )
                      : formatDPU(latestCurrentMonth?.stages?.find(s => s.name === selectedStage)?.dpu ?? 0)
                    }
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs text-blue-400 font-medium">Current</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{latestCurrentMonth?.date || 'No data'}</p>
                  {/* Trend Indicator */}
                  <div className="flex items-center space-x-1">
                    {currentDpuChange < 0 ? (
                      <>
                        <ArrowDown className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400">{formatDPU(Math.abs(currentDpuChange))} vs last month</span>
                      </>
                    ) : currentDpuChange > 0 ? (
                      <>
                        <ArrowUp className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400">+{formatDPU(currentDpuChange)} vs last month</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">No change</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-yellow-900/25 border border-yellow-600/25 rounded-xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105">
            {/* Performance Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white shadow-lg">
                Good
              </div>
            </div>
            
            {/* JCB Success pattern */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FCB026' fill-opacity='0.1'%3E%3Ccircle cx='15' cy='15' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            
            {/* JCB Yellow success glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/8 via-transparent to-yellow-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-yellow-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-lg opacity-25 group-hover:opacity-45 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 p-2 rounded-md shadow-lg">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-right">
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {isTotalsFilter() ? 'SIGNOUT VOLUME' : `${selectedStage} Inspected`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
                    {isTotalsFilter()
                      ? formatNumber(latestCurrentMonth?.signoutVolume ?? latestCurrentMonth?.stages?.find(s => s.name === 'SIGN')?.inspected ?? 0)
                      : formatNumber(latestCurrentMonth?.stages?.find(s => s.name === selectedStage)?.inspected ?? 0)
                    }
                  </span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-medium">Units</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{latestCurrentMonth?.date || 'No data'}</p>
                  {/* Trend Indicator */}
                  <div className="flex items-center space-x-1">
                    {currentBuildVolumeChange > 0 ? (
                      <>
                        <ArrowUp className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400">+{formatNumber(currentBuildVolumeChange)} vs last month</span>
                      </>
                    ) : currentBuildVolumeChange < 0 ? (
                      <>
                        <ArrowDown className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400">{formatNumber(currentBuildVolumeChange)} vs last month</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">No change</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-black via-red-900/20 to-gray-900 border border-red-600/40 rounded-xl shadow-2xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105">
            {/* Performance Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white shadow-lg font-bold">
                Critical
              </div>
            </div>
            
            {/* JCB Critical warning pattern */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='25' height='25' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FF0000' fill-opacity='0.1'%3E%3Cpath d='M12.5 0L25 25H0z'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            
            {/* JCB Critical glow with yellow accent */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/15 via-yellow-500/5 to-red-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-md shadow-lg">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-right">
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {isTotalsFilter() ? 'Current Faults' : `${selectedStage} Faults`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300">
                    {isTotalsFilter()
                      ? formatNumber(
                          selectedStage === 'PRODUCTION TOTALS' ? (latestCurrentMonth?.productionTotalFaults ?? 0) :
                          selectedStage === 'DPDI TOTALS' ? (latestCurrentMonth?.dpdiTotalFaults ?? 0) :
                          (latestCurrentMonth?.combinedTotalFaults ?? 0)
                        )
                      : formatNumber(latestCurrentMonth?.stages?.find(s => s.name === selectedStage)?.faults ?? 0)
                    }
                  </span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Issues</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{latestCurrentMonth?.date || 'No data'}</p>
                  {/* Trend Indicator */}
                  <div className="flex items-center space-x-1">
                    {currentFaultsChange > 0 ? (
                      <>
                        <ArrowUp className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400">+{formatNumber(currentFaultsChange)} vs last month</span>
                      </>
                    ) : currentFaultsChange < 0 ? (
                      <>
                        <ArrowDown className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400">{formatNumber(currentFaultsChange)} vs last month</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">No change</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analytical KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          {/* Highest Fault Area */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-xl shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:scale-105">
            {/* Performance Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                Critical
              </div>
            </div>
            
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 via-transparent to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-md shadow-lg">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-right">
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Highest Fault Area</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors duration-300">
                    {performanceSummary[0]?.name || 'N/A'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">Critical</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{formatNumber(performanceSummary[0]?.totalFaults || 0)} total faults</p>
                  {/* Trend Indicator */}
                  <div className="flex items-center space-x-1">
                    <ArrowUp className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-orange-400">vs avg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Build Volume YTD */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-xl shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105">
            {/* Performance Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                Excellent
              </div>
            </div>
            
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-md shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-right">
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {isTotalsFilter() ? 'Build Volume YTD' : `${selectedStage} Volume YTD`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
                    {formatNumber(getYTDBuildVolumeForStage())}
                  </span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Units</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">
                    {isTotalsFilter() ? 'Total units built' : `${selectedStage} inspected`}
                  </p>
                  {/* Trend Indicator */}
                  <div className="flex items-center space-x-1">
                    <ArrowUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">vs last year</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fault Rate per 1000 Units */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-xl shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 hover:scale-105">
            {/* Performance Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                Poor
              </div>
            </div>
            
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/20 via-transparent to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 rounded-md shadow-lg">
                    <AlertTriangle className="w-4 h-4 text-black" />
                  </div>
                </div>
                <div className="text-right">
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {isTotalsFilter() ? 'Fault Rate per 1000 Units' : `${selectedStage} Fault Rate`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
                    {getFaultRateForStage()}
                  </span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">Rate</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">
                    {isTotalsFilter() ? 'Faults per 1000 units built' : `${selectedStage} faults per 1000`}
                  </p>
                  {/* Trend Indicator */}
                  <div className="flex items-center space-x-1">
                    <ArrowUp className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">vs target</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced DPU Trend vs Build Volume Chart */}
        <div className="mb-3">
          <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/40 rounded-xl shadow-2xl hover:shadow-yellow-500/20 transition-all duration-500">
            {/* JCB Industrial Header Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"></div>
            
            {/* JCB Industrial background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FCB026' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569-13.431-30-30-30v30h30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            
            {/* JCB Yellow industrial glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/8 via-transparent to-yellow-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative p-3 pb-8">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-lg shadow-lg border border-yellow-400/30">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                         <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
                           {isTotalsFilter() ? `${selectedStage} DPU vs Signout Volume` : `${selectedStage} DPU vs ${selectedStage} Inspected`}
                         </h3>
                         <p className="text-sm text-gray-400 font-medium">Interactive Performance Analytics with DPU Trendline - Year to Date</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                       {/* Trajectory Analysis Status */}
                       <div className="bg-gradient-to-r from-gray-900 to-black border border-yellow-600/30 rounded-lg px-3 py-2 shadow-lg">
                         <div className="text-xs text-yellow-400 font-medium uppercase tracking-wider">Trajectory Analysis</div>
                         <div className="flex items-center space-x-2">
                           <span className="text-xs font-bold text-green-400">
                             Target: {chartDataWithTrendline.filter(d => d.isAboveTarget).length > chartDataWithTrendline.length / 2 ? 
                               '🔴 Behind' : '🟢 On Track'}
                           </span>
                           <span className="text-xs font-bold text-blue-400">
                             Trend: {(() => {
                               const actualData = chartDataWithTrendline.filter(d => d.totalDpu > 0);
                               if (actualData.length < 2) return '🟡 Limited';
                               const latest = actualData[actualData.length - 1];
                               const previous = actualData[actualData.length - 2];
                               const improving = latest.totalDpu < previous.totalDpu;
                               return improving ? '🟢 Improving' : '🔴 Worsening';
                             })()}
                           </span>
                           <span className="text-xs text-gray-400">
                             ({chartDataWithTrendline.filter(d => !d.isAboveTarget).length}/{chartDataWithTrendline.length} on track)
                           </span>
                         </div>
                       </div>
                  
                  {/* Stage Filter */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Stage Filter:</label>
                    <div className="relative">
                         <select 
                           value={selectedStage} 
                           onChange={(e) => setSelectedStage(e.target.value)}
                           className="bg-gradient-to-r from-gray-900 to-black border border-yellow-600/40 text-white px-4 py-2 rounded-lg text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all duration-200 shadow-lg hover:shadow-yellow-500/20 cursor-pointer"
                         >
                        {availableStages.map(stage => (
                          <option key={stage} value={stage} className="bg-gray-800">
                            {stage}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
             <ResponsiveContainer width="100%" height={420}>
               <ComposedChart data={chartDataWithTrendline}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                 <XAxis 
                   dataKey="month" 
                   stroke="#FFFFFF" 
                   tick={{ fontSize: 12 }}
                 />
                  <YAxis yAxisId="dpu" stroke="#FFFFFF" domain={dpuDomain} label={{ value: isTotalsFilter() ? `${selectedStage} DPU` : `${selectedStage} DPU`, angle: -90, position: 'insideLeft' }} />
                 <YAxis yAxisId="volume" orientation="right" stroke="#FFFFFF" domain={volumeDomain} label={{ value: isTotalsFilter() ? 'Signout Volume' : `${selectedStage} Inspected`, angle: 90, position: 'insideRight' }} />
                 <Tooltip 
                   contentStyle={{
                     backgroundColor: '#2D2D2D',
                     border: '1px solid #404040',
                     color: '#FFFFFF',
                     borderRadius: '8px',
                     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                     fontSize: '12px',
                     fontWeight: 'bold'
                   }}
                   labelStyle={{
                     color: '#FFFFFF',
                     fontSize: '13px',
                     fontWeight: 'bold'
                   }}
                   itemStyle={{
                     color: '#FFFFFF',
                     fontSize: '12px',
                     fontWeight: 'normal'
                   }}
                   formatter={(value, name, props) => {
                     const monthData = props.payload;
                     console.log('🔍 Tooltip Debug:', { value, name, monthData });
                     // Get actual data from admin table source
                     const actualMonthRecord = data.find(m => m.date === monthData.month);
                     
                     if (name === 'totalDpu') {
                       return [
                         formatDPU(Number(value)),
                         `${monthData.month} DPU`
                       ];
                     } else if (name === 'trendlineDPU') {
                       if (monthData.isFuture) {
                         return [
                           `${formatDPU(Number(value))} 🎯`,
                           'Glide Path (Future)'
                         ];
                       } else {
                         const variance = monthData.targetVariance || 0;
                         const status = variance > 0 ? 'Above Target' : variance < -0.5 ? 'Below Target' : 'On Target';
                         const statusColor = variance > 0 ? '🔴' : variance < -0.5 ? '🟢' : '🟡';
                         
                         return [
                           `${formatDPU(Number(value))} ${statusColor}`,
                           `Target Glide Path (${status})`
                         ];
                       }
                     } else if (name === 'performanceTrend') {
                       const currentDPU = monthData.totalDpu || 0;
                       const trendValue = Number(value);
                       const variance = currentDPU - trendValue;
                       const status = Math.abs(variance) < 0.5 ? 'On Trend' : variance > 0 ? 'Above Trend' : 'Below Trend';
                       const statusColor = Math.abs(variance) < 0.5 ? '🟡' : variance > 0 ? '🔴' : '🟢';
                       
                       return [
                         `${formatDPU(trendValue)} ${statusColor}`,
                         `Performance Trajectory (${status})`
                       ];
                     } else if (name === 'buildVolume') {
                       return [
                         formatNumber(Number(value)),
                         isTotalsFilter() ? 'Signout Volume' : `${selectedStage} Inspected`
                       ];
                     }
                     
                     return [formatNumber(Number(value)), name];
                   }}
                   labelFormatter={(label, payload) => {
                     if (payload && payload.length > 0) {
                       const monthData = payload[0].payload;
                       // Get actual admin table data
                       const actualMonthRecord = data.find(m => m.date === monthData.month);
                       
                       if (isTotalsFilter()) {
                         return `${label} - Total Faults: ${formatNumber(actualMonthRecord?.combinedTotalFaults || 0)} | Total Inspections: ${formatNumber(actualMonthRecord?.combinedTotalInspections || 0)}`;
                       } else {
                         const stageData = actualMonthRecord?.stages.find(s => s.name === selectedStage);
                         return `${label} - ${selectedStage} Faults: ${formatNumber(stageData?.faults || 0)} | ${selectedStage} Inspected: ${formatNumber(stageData?.inspected || 0)}`;
                       }
                     }
                     return label;
                   }}
                 />
                 <Legend 
                   wrapperStyle={{ paddingTop: '20px' }}
                 />
                 {/* DPU as Bars */}
                 <Bar 
                   yAxisId="dpu"
                   dataKey="totalDpu" 
                   fill="#FCB026" 
                   opacity={0.95}
                   name={isTotalsFilter() ? `${selectedStage} DPU` : `${selectedStage} DPU`}
                   label={{ 
                     position: 'center', 
                     fill: '#000000', 
                     fontSize: 11,
                     fontWeight: 'bold',
                     formatter: (value) => (value && typeof value === 'number' && value > 0) ? formatDPU(value) : ''
                   }}
                 />
                 {/* Build Volume Line */}
                 <Line 
                   yAxisId="volume"
                   type="monotone" 
                   dataKey="buildVolume" 
                   stroke="#3B82F6" 
                   strokeWidth={4}
                   dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                   connectNulls={false}
                   name={isTotalsFilter() ? 'Signout Volume' : `${selectedStage} Inspected`}
                   label={{ 
                     position: 'top', 
                     fill: '#FFFFFF', 
                     fontSize: 10,
                     fontWeight: 'bold',
                     offset: 25,
                     formatter: (value) => (value && typeof value === 'number' && value > 0) ? formatNumber(value) : ''
                   }}
                 />
                 {/* Target Glide Path - Required path to reach 8.2 DPU */}
                 <Line 
                   yAxisId="dpu"
                   type="monotone" 
                   dataKey="trendlineDPU" 
                   stroke="#10B981"
                   strokeWidth={3}
                   strokeDasharray="8 4"
                   dot={false}
                   name="Target Glide Path"
                 />
                 {/* Performance Trajectory - Actual trend line */}
                 <Line 
                   yAxisId="dpu"
                   type="monotone" 
                   dataKey="performanceTrend" 
                   stroke="#3B82F6"
                   strokeWidth={2}
                   strokeDasharray="4 2"
                   dot={false}
                   name="Performance Trajectory"
                 />
               </ComposedChart>
             </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trajectory Performance Analysis Summary */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/40 rounded-xl shadow-2xl p-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"></div>
            
            <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                📊
              </div>
              Trajectory Performance Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Target Glide Path Analysis */}
              <div 
                className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-600/30 rounded-lg p-4 relative cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                onClick={() => setIsInterventionModalOpen(true)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-green-400 font-bold flex items-center gap-2">
                    🎯 Target Glide Path
                    {interventionPlan && interventionPlan.interventions.length > 0 && (
                      <span className="px-2 py-1 bg-yellow-600 text-black text-xs font-bold rounded">
                        {interventionPlan.interventions.filter(i => i.status !== 'Cancelled').length}
                      </span>
                    )}
                  </h4>
                  <TooltipCard content={`The Target Glide Path shows the planned trajectory to achieve the year-end goal of ${getTargetForStage(selectedStage, getCurrentDPUForStage())} DPU. Click to add improvement plans.`}>
                    <Info className="w-4 h-4 text-green-400 hover:text-green-300 transition-colors" />
                  </TooltipCard>
                </div>
                <div className="text-white text-sm space-y-1">
                  {(() => {
                    const currentDPU = getCurrentDPUForStage();
                    const startingDPU = getBaselineForStage(selectedStage);
                    const targetDPU = getTargetForStage(selectedStage, currentDPU);
                    const totalReduction = startingDPU - targetDPU;
                    
                    // Calculate months available (from first data to December)
                    const firstMonthWithData = monthlyTrendData.findIndex(m => m.totalDpu > 0);
                    const monthsAvailable = firstMonthWithData >= 0 ? 12 - firstMonthWithData : 11;
                    const requiredRate = (totalReduction / monthsAvailable).toFixed(3);
                    
                    // Progress: how much of total reduction has been achieved
                    const actualReduction = startingDPU - currentDPU;
                    const progressPercent = Math.round((actualReduction / totalReduction) * 100);
                    
                    // Status: are we on track based on months elapsed vs progress made
                    const monthsElapsed = monthlyTrendData.filter(m => m.totalDpu > 0).length;
                    const expectedProgress = (monthsElapsed / monthsAvailable) * 100;
                    const isOnTrack = progressPercent >= (expectedProgress - 10); // Within 10% tolerance
                    
                    return (
                      <>
                        <div><strong>Path:</strong> {startingDPU.toFixed(2)} → {targetDPU.toFixed(2)} DPU</div>
                        <div><strong>Required Rate:</strong> {requiredRate} DPU/month ({monthsAvailable} months)</div>
                        <div><strong>Status:</strong> {isOnTrack ? '🟢 On Track' : '🔴 Behind Schedule'}</div>
                        <div><strong>Progress:</strong> {isNaN(progressPercent) ? 0 : progressPercent}% Complete (expected {Math.round(expectedProgress)}%)</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Performance Trajectory Analysis */}
              <div 
                className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-600/30 rounded-lg p-4 relative cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                onClick={() => setIsInterventionModalOpen(true)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-blue-400 font-bold flex items-center gap-2">
                    📈 Performance Trajectory
                    {interventionPlan && interventionPlan.interventions.length > 0 && (
                      <span className="px-2 py-1 bg-yellow-600 text-black text-xs font-bold rounded">
                        {interventionPlan.interventions.filter(i => i.status !== 'Cancelled').length}
                      </span>
                    )}
                  </h4>
                  <TooltipCard content="The Performance Trajectory analyzes the actual trend in DPU performance over time. Click to add improvement plans.">
                    <Info className="w-4 h-4 text-blue-400 hover:text-blue-300 transition-colors" />
                  </TooltipCard>
                </div>
                <div className="text-white text-sm space-y-1">
                  {(() => {
                    const actualData = chartDataWithTrendline.filter(d => d.totalDpu > 0);
                    if (actualData.length < 2) return <div>Insufficient data</div>;
                    
                    // Calculate actual improvement rate from trendline
                    const firstTrend = performanceTrendline[0] ?? 0;
                    const lastTrend = performanceTrendline[actualData.length - 1] ?? 0;
                    const totalChange = firstTrend - lastTrend; // Positive = improving (DPU decreased)
                    const monthlyRate = totalChange / actualData.length;
                    const trend = totalChange > 0 ? 'Improving' : 'Deteriorating';
                    
                    return (
                      <>
                        <div><strong>Trend:</strong> {trend === 'Improving' ? '🟢' : '🔴'} {trend}</div>
                        <div><strong>Current Rate:</strong> {Math.abs(monthlyRate).toFixed(3)} DPU/month {trend === 'Improving' ? 'reduction' : 'increase'}</div>
                        <div><strong>Projection:</strong> {(() => {
                          const currentDPU = getCurrentDPUForStage();
                          const targetDPU = getTargetForStage(selectedStage, currentDPU);
                          const startingDPU = getBaselineForStage(selectedStage);
                          const firstMonthWithData = monthlyTrendData.findIndex(m => m.totalDpu > 0);
                          const monthsAvailable = firstMonthWithData >= 0 ? 12 - firstMonthWithData : 11;
                          const requiredRate = (startingDPU - targetDPU) / monthsAvailable;
                          
                          if (trend === 'Deteriorating') return '🔴 Will miss target';
                          return Math.abs(monthlyRate) >= requiredRate ? '🟢 Will meet target' : '🟡 May miss target';
                        })()}</div>
                        <div><strong>Consistency:</strong> {
                          actualData.every((d, i) => i === 0 || d.totalDpu <= actualData[i-1].totalDpu) ? 
                          '🟢 Steady' : '🟡 Variable'
                        }</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Gap Analysis */}
              <div 
                className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border border-orange-600/30 rounded-lg p-4 relative cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
                onClick={() => setIsInterventionModalOpen(true)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-orange-400 font-bold flex items-center gap-2">
                    ⚡ Gap Analysis
                    {interventionPlan && interventionPlan.interventions.length > 0 && (
                      <span className="px-2 py-1 bg-yellow-600 text-black text-xs font-bold rounded">
                        {interventionPlan.interventions.filter(i => i.status !== 'Cancelled').length}
                      </span>
                    )}
                  </h4>
                  <TooltipCard content="Gap Analysis compares current performance against where you should be according to the target glide path. Click to add improvement plans.">
                    <Info className="w-4 h-4 text-orange-400 hover:text-orange-300 transition-colors" />
                  </TooltipCard>
                </div>
                <div className="text-white text-sm space-y-1">
                  {(() => {
                    const currentDPU = getCurrentDPUForStage();
                    const targetDPU = getTargetForStage(selectedStage, currentDPU);
                    const startingDPU = getBaselineForStage(selectedStage);
                    
                    // Calculate months available from first data
                    const firstMonthWithData = monthlyTrendData.findIndex(m => m.totalDpu > 0);
                    const monthsAvailable = firstMonthWithData >= 0 ? 12 - firstMonthWithData : 11;
                    const requiredRate = (startingDPU - targetDPU) / monthsAvailable;
                    
                    // Find where we SHOULD be on the glide path right now
                    const monthsElapsed = monthlyTrendData.filter(m => m.totalDpu > 0).length;
                    const expectedDPUNow = startingDPU - (requiredRate * monthsElapsed);
                    
                    // Gap = how far we are from where we should be (positive = behind)
                    const gap = currentDPU - expectedDPUNow;
                    const monthsRemaining = monthsAvailable - monthsElapsed;
                    const accelerationNeeded = (gap > 0 ? requiredRate + (gap / monthsRemaining) : requiredRate).toFixed(3);
                    
                    return (
                      <>
                        <div><strong>Current Gap:</strong> {gap > 0 ? '🔴' : '🟢'} {Math.abs(gap).toFixed(2)} DPU {gap > 0 ? 'behind' : 'ahead'}</div>
                        <div><strong>Expected Now:</strong> {expectedDPUNow.toFixed(2)} DPU</div>
                        <div><strong>Actual DPU:</strong> {currentDPU.toFixed(2)} DPU</div>
                        <div><strong>End Target:</strong> {targetDPU.toFixed(2)} DPU</div>
                        <div><strong>Acceleration Needed:</strong> {accelerationNeeded} DPU/month</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Forecast */}
              <div 
                className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-600/30 rounded-lg p-4 relative cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                onClick={() => {
                  const currentDPU = getCurrentDPUForStage();
                  const targetDPU = getTargetForStage(selectedStage, currentDPU);
                  const firstMonthWithData = monthlyTrendData.findIndex(m => m.totalDpu > 0);
                  const monthsAvailable = firstMonthWithData >= 0 ? 12 - firstMonthWithData : 11;
                  const monthsElapsed = monthlyTrendData.filter(m => m.totalDpu > 0).length;
                  const monthsRemaining = monthsAvailable - monthsElapsed;
                  const requiredRate = (getBaselineForStage(selectedStage) - targetDPU) / monthsAvailable;
                  
                  setIsInterventionModalOpen(true);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-purple-400 font-bold flex items-center gap-2">
                    🔮 Forecast
                    {interventionPlan && interventionPlan.interventions.length > 0 && (
                      <span className="px-2 py-1 bg-yellow-600 text-black text-xs font-bold rounded">
                        {interventionPlan.interventions.filter(i => i.status !== 'Cancelled').length} Plans
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2">
                    <TooltipCard content={`The Forecast predicts December performance based on current trends and calculates the likelihood of meeting the ${getTargetForStage(selectedStage, getCurrentDPUForStage())} DPU target. Click to add improvement plans and see adjusted projections.`}>
                      <Info className="w-4 h-4 text-purple-400 hover:text-purple-300 transition-colors" />
                    </TooltipCard>
                    <TargetIcon className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <div className="text-white text-sm space-y-1">
                  {(() => {
                    const actualData = chartDataWithTrendline.filter(d => d.totalDpu > 0);
                    if (actualData.length < 2) return <div>Insufficient data</div>;
                    
                    const currentDPU = getCurrentDPUForStage();
                    const targetDPU = getTargetForStage(selectedStage, currentDPU);
                    const startingDPU = getBaselineForStage(selectedStage);
                    const firstMonthWithData = monthlyTrendData.findIndex(m => m.totalDpu > 0);
                    const monthsAvailable = firstMonthWithData >= 0 ? 12 - firstMonthWithData : 11;
                    const monthsElapsed = monthlyTrendData.filter(m => m.totalDpu > 0).length;
                    const monthsRemaining = monthsAvailable - monthsElapsed;
                    
                    // Calculate actual performance rate
                    const firstTrend = performanceTrendline[0] ?? 0;
                    const lastTrend = performanceTrendline[actualData.length - 1] ?? 0;
                    const totalChange = firstTrend - lastTrend;
                    const monthlyRate = totalChange / actualData.length;
                    const trend = totalChange > 0 ? 'Improving' : 'Deteriorating';
                    
                    // Baseline projection
                    let baselineProjected;
                    if (trend === 'Deteriorating') {
                      baselineProjected = currentDPU + (Math.abs(monthlyRate) * monthsRemaining);
                    } else {
                      baselineProjected = currentDPU - (Math.abs(monthlyRate) * monthsRemaining);
                    }
                    
                    const baselineLikelihood = baselineProjected <= targetDPU ? 'High' : baselineProjected <= targetDPU * 1.2 ? 'Medium' : 'Low';
                    const baselineTargetMissPercentage = ((baselineProjected - targetDPU) / targetDPU) * 100;
                    const baselineRiskLevel = baselineTargetMissPercentage <= 20 ? 'Low' : baselineTargetMissPercentage <= 50 ? 'Medium' : 'High';
                    
                    // With interventions (if any)
                    const hasInterventions = interventionPlan && interventionPlan.interventions.length > 0;
                    
                    return (
                      <>
                        <div className="mb-2">
                          <div className="text-xs text-purple-400 font-semibold mb-1">Current Trajectory:</div>
                          <div><strong>Dec Projection:</strong> {baselineProjected.toFixed(2)} DPU</div>
                          <div><strong>Success Likelihood:</strong> {
                            baselineLikelihood === 'High' ? '🟢' : baselineLikelihood === 'Medium' ? '🟡' : '🔴'
                          } {baselineLikelihood}</div>
                          <div><strong>Risk Level:</strong> {
                            baselineRiskLevel === 'High' ? '🔴 High' : 
                            baselineRiskLevel === 'Medium' ? '🟡 Medium' : '🟢 Low'
                          } ({baselineTargetMissPercentage > 0 ? '+' : ''}{baselineTargetMissPercentage.toFixed(0)}%)</div>
                        </div>
                        
                        {hasInterventions && interventionPlan!.projections && (
                          <>
                            <div className="border-t border-purple-600/30 pt-2 mt-2">
                              <div className="text-xs text-green-400 font-semibold mb-1">With Interventions:</div>
                              <div><strong>Adjusted Projection:</strong> {interventionPlan!.projections.adjustedProjection.toFixed(2)} DPU</div>
                              <div><strong>Expected Impact:</strong> {interventionPlan!.projections.totalExpectedImpact.toFixed(2)} DPU</div>
                              <div><strong>Confidence:</strong> {interventionPlan!.projections.confidenceScore}%</div>
                              <div className="text-xs text-green-400 mt-1">
                                Improvement: {(baselineProjected - interventionPlan!.projections.adjustedProjection).toFixed(2)} DPU better
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="mt-2 pt-2 border-t border-purple-600/30">
                          <button className="text-xs text-purple-400 hover:text-purple-300 font-semibold">
                            👆 Click to {hasInterventions ? 'edit' : 'add'} improvement plans
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Data Table */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/30 rounded-xl shadow-2xl">
          {/* JCB Industrial Header Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"></div>
          
          <div className="relative p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full mr-3"></div>
              Monthly Summary
            </h3>
          <div className="overflow-x-auto">
            <table className="jcb-table min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border-b border-yellow-600/30">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Month
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Total Inspections
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Total Faults
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Total DPU
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    DPU Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((month, index) => {
                  const prevMonth = index > 0 ? data[index - 1] : null;
                  const dpuChange = prevMonth ? (month.combinedTotalDpu ?? 0) - (prevMonth.combinedTotalDpu ?? 0) : 0;
                  
                     return (
                       <tr key={month.id} className={`${index % 2 === 0 ? 'bg-gray-900/50' : 'bg-black/50'} hover:bg-yellow-600/10 transition-colors duration-200 border-b border-gray-700/50`}>
                         <td className="whitespace-nowrap text-sm font-medium text-white py-3 px-4">
                           <div className="flex items-center">
                             <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                             {month.date}
                           </div>
                         </td>
                         <td className="whitespace-nowrap text-sm text-white text-right py-3 px-4 font-mono">
                           {formatNumber(month.combinedTotalInspections)}
                         </td>
                         <td className="whitespace-nowrap text-sm text-white text-right py-3 px-4 font-mono">
                           {formatNumber(month.combinedTotalFaults)}
                         </td>
                         <td className="whitespace-nowrap text-sm text-white text-right py-3 px-4 font-mono font-bold">
                           {formatDPU(month.combinedTotalDpu)}
                         </td>
                      <td className="whitespace-nowrap text-sm text-right py-3 px-4">
                        {index > 0 && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg border ${
                            dpuChange < 0 
                              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white border-green-400/30' 
                              : dpuChange > 0 
                              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-400/30' 
                              : 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black border-yellow-400/30'
                          }`}>
                            {dpuChange < 0 ? '↓' : dpuChange > 0 ? '↑' : '→'} {formatDPU(Math.abs(dpuChange))}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </div>

        {/* Stage Performance Summary */}
        <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/30 rounded-xl shadow-2xl">
          {/* JCB Industrial Header Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"></div>
          
          <div className="relative p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full mr-3"></div>
              Stage Performance Summary
            </h3>
          <div className="overflow-x-auto">
            <table className="jcb-table min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border-b border-yellow-600/30">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Stage
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Avg DPU
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Max DPU
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Min DPU
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4">
                    Total Faults
                  </th>
                </tr>
              </thead>
              <tbody>
                {performanceSummary.map((stage, index) => (
                  <tr key={stage.name} className={`${index % 2 === 0 ? 'bg-gray-900/50' : 'bg-black/50'} hover:bg-yellow-600/10 transition-colors duration-200 border-b border-gray-700/50`}>
                    <td className="whitespace-nowrap text-sm font-medium text-white py-3 px-4">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3 shadow-lg border border-white/20"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="font-semibold">{stage.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-sm text-white text-right py-3 px-4 font-mono font-bold">
                      {formatDPU(stage.avgDpu)}
                    </td>
                    <td className="whitespace-nowrap text-sm text-red-400 text-right py-3 px-4 font-mono font-bold">
                      {formatDPU(stage.maxDpu)}
                    </td>
                    <td className="whitespace-nowrap text-sm text-green-400 text-right py-3 px-4 font-mono font-bold">
                      {formatDPU(stage.minDpu)}
                    </td>
                    <td className="whitespace-nowrap text-sm text-yellow-400 text-right py-3 px-4 font-mono font-bold">
                      {formatNumber(stage.totalFaults)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>

        {/* Intervention Modal */}
        <InterventionModal
          isOpen={isInterventionModalOpen}
          onClose={() => setIsInterventionModalOpen(false)}
          stageName={selectedStage}
          currentState={{
            currentDPU: getCurrentDPUForStage(),
            targetDPU: getTargetForStage(selectedStage, getCurrentDPUForStage()),
            gap: getCurrentDPUForStage() - getTargetForStage(selectedStage, getCurrentDPUForStage()),
            monthsRemaining: (() => {
              const firstMonthWithData = monthlyTrendData.findIndex(m => m.totalDpu > 0);
              const monthsAvailable = firstMonthWithData >= 0 ? 12 - firstMonthWithData : 11;
              const monthsElapsed = monthlyTrendData.filter(m => m.totalDpu > 0).length;
              return monthsAvailable - monthsElapsed;
            })(),
            requiredRate: (() => {
              const firstMonthWithData = monthlyTrendData.findIndex(m => m.totalDpu > 0);
              const monthsAvailable = firstMonthWithData >= 0 ? 12 - firstMonthWithData : 11;
              return (getBaselineForStage(selectedStage) - getTargetForStage(selectedStage, getCurrentDPUForStage())) / monthsAvailable;
            })()
          }}
        />
    </div>
  );
};

export default Dashboard;
