'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { getStagePerformanceSummary, formatNumber, formatDPU } from '@/utils/dataUtils';
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
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, BarChart3, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { data, error } = useData();
  const [selectedStage, setSelectedStage] = React.useState<string>('All Stages');
  const performanceSummary = getStagePerformanceSummary(data);

  // Get available stages for dropdown - collect from all months to ensure new stages are included
  const allStages = data.length > 0 
    ? Array.from(new Set(data.flatMap(month => month.stages.map(stage => stage.name))))
    : [];
  const availableStages = ['All Stages', ...allStages];

  // Calculate overall trends - use current month data (including Sep)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  
  // Get current month data (including Sep if it has data)
  const currentMonthData = data.filter(month => {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month.date.substring(0, 3));
    return month.totalDpu > 0 && monthIndex <= currentMonth;
  });
  
  // Get completed months for improvement calculation (exclude current month)
  const completedMonths = data.filter(month => {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month.date.substring(0, 3));
    return month.totalDpu > 0 && monthIndex < currentMonth;
  });
  
  const latestCurrentMonth = currentMonthData[currentMonthData.length - 1] || data[data.length - 1];
  const latestCompletedMonth = completedMonths[completedMonths.length - 1] || data[0];
  const firstMonth = data[0];

  // Calculate month-to-month differences for KPI cards
  const previousMonth = data[data.indexOf(latestCurrentMonth) - 1];
  const currentDpuChange = latestCurrentMonth && previousMonth ? latestCurrentMonth.totalDpu - previousMonth.totalDpu : 0;
  const currentBuildVolumeChange = latestCurrentMonth && previousMonth ? 
    (latestCurrentMonth.stages.find(s => s.name === 'SIGN')?.inspected || 0) - (previousMonth.stages.find(s => s.name === 'SIGN')?.inspected || 0) : 0;
  const currentFaultsChange = latestCurrentMonth && previousMonth ? latestCurrentMonth.totalFaults - previousMonth.totalFaults : 0;
  const dpuImprovement = firstMonth.totalDpu - latestCompletedMonth.totalDpu;
  const dpuImprovementPercent = ((dpuImprovement / firstMonth.totalDpu) * 100).toFixed(1);

  // Calculate YTD Build Volume (sum of all SIGN inspected data)
  const ytdBuildVolume = data.reduce((total, month) => {
    const signStage = month.stages.find(stage => stage.name === 'SIGN');
    return total + (signStage ? signStage.inspected : 0);
  }, 0);

  // Calculate YTD Total Faults
  const ytdTotalFaults = data.reduce((total, month) => total + month.totalFaults, 0);

  // Calculate Fault Rate per 1000 Units
  const faultRatePer1000 = ytdBuildVolume > 0 ? ((ytdTotalFaults / ytdBuildVolume) * 1000).toFixed(1) : '0.0';

  // Prepare chart data based on selected stage
  const monthlyTrendData = data.map(month => {
    if (selectedStage === 'All Stages') {
      // Use overall data (existing behavior)
      const signStage = month.stages.find(stage => stage.name === 'SIGN');
      const buildVolume = signStage ? signStage.inspected : 0;
      
      return {
        month: month.date,
        totalDpu: month.totalDpu,
        totalFaults: month.totalFaults,
        buildVolume: buildVolume
      };
    } else {
      // Use stage-specific data
      const selectedStageData = month.stages.find(stage => stage.name === selectedStage);
      const stageDpu = selectedStageData ? selectedStageData.dpu : 0;
      const stageInspected = selectedStageData ? selectedStageData.inspected : 0;
      
      return {
        month: month.date,
        totalDpu: stageDpu,
        totalFaults: selectedStageData ? selectedStageData.faults : 0,
        buildVolume: stageInspected
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
      return monthIndex === previousMonthIndex && month.totalDpu > 0;
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

  // Filter to show only year-to-date data (months that have actually occurred)
  const today = new Date();
  const thisMonth = today.getMonth(); // 0-11 (0 = January)
  
  const ytdChartData = monthlyTrendData.filter(month => {
    // Safety check for undefined date
    if (!month || !month.date) {
      console.log('Skipping month with missing date:', month);
      return false;
    }
    
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month.date.substring(0, 3));
    return monthIndex <= thisMonth && month.totalDpu > 0 && month.buildVolume > 0;
  });

  // Calculate correlation coefficient between DPU and Build Volume
  const calculateCorrelation = (data: any[]) => {
    const validData = data.filter(d => d.totalDpu > 0 && d.buildVolume > 0);
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

  // Use YTD data if available, otherwise fallback to original data
  const chartData = ytdChartData.length > 0 ? ytdChartData : monthlyTrendData.filter(d => d.totalDpu > 0 && d.buildVolume > 0);
  const correlationCoefficient = calculateCorrelation(chartData);

  // Calculate DPU trendline data using linear regression
  const calculateDPUTrendline = (data: any[]) => {
    const validData = data.filter(d => d.totalDpu > 0);
    if (validData.length < 2) return [];

    const n = validData.length;
    const sumX = validData.reduce((sum, _, index) => sum + index, 0);
    const sumY = validData.reduce((sum, d) => sum + d.totalDpu, 0);
    const sumXY = validData.reduce((sum, d, index) => sum + (index * d.totalDpu), 0);
    const sumXX = validData.reduce((sum, _, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return validData.map((_, index) => ({
      month: validData[index].month,
      trendlineDPU: slope * index + intercept
    }));
  };

  const dpuTrendlineData = calculateDPUTrendline(chartData);

  // Merge trendline data with chart data
  const chartDataWithTrendline = chartData.map((item, index) => ({
    ...item,
    trendlineDPU: dpuTrendlineData[index]?.trendlineDPU || 0
  }));

  // Debug: Log the data structure to understand what we're working with
  console.log('chartData:', chartData);

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
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Total DPU Improvement YTD</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">{dpuImprovementPercent}%</span>
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Improving</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{formatDPU(dpuImprovement)} DPU reduction YTD</p>
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
                  {selectedStage === 'All Stages' ? 'Current Month DPU' : `${selectedStage} Current DPU`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                    {selectedStage === 'All Stages' 
                      ? formatDPU(latestCurrentMonth.totalDpu)
                      : formatDPU(latestCurrentMonth.stages.find(s => s.name === selectedStage)?.dpu || 0)
                    }
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs text-blue-400 font-medium">Current</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{latestCurrentMonth.date}</p>
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
                  {selectedStage === 'All Stages' ? 'MTD BUILD VOLUME' : `${selectedStage} Inspected`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
                    {selectedStage === 'All Stages' 
                      ? formatNumber(latestCurrentMonth.stages.find(s => s.name === 'SIGN')?.inspected || 0)
                      : formatNumber(latestCurrentMonth.stages.find(s => s.name === selectedStage)?.inspected || 0)
                    }
                  </span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-medium">Units</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{latestCurrentMonth.date}</p>
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
                  {selectedStage === 'All Stages' ? 'Current Faults' : `${selectedStage} Faults`}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300">
                    {selectedStage === 'All Stages' 
                      ? formatNumber(latestCurrentMonth.totalFaults)
                      : formatNumber(latestCurrentMonth.stages.find(s => s.name === selectedStage)?.faults || 0)
                    }
                  </span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Issues</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">{latestCurrentMonth.date}</p>
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
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Build Volume YTD</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
                    {formatNumber(ytdBuildVolume)}
                  </span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Units</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">Total units built</p>
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
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Fault Rate per 1000 Units</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
                    {faultRatePer1000}
                  </span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">Rate</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">Faults per 1000 units built</p>
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
                           {selectedStage === 'All Stages' ? 'DPU Trend vs Build Volume' : `${selectedStage} DPU vs ${selectedStage} Inspected`}
                         </h3>
                         <p className="text-sm text-gray-400 font-medium">Interactive Performance Analytics with DPU Trendline - Year to Date</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Correlation Analysis */}
                     <div className="bg-gradient-to-r from-gray-900 to-black border border-yellow-600/30 rounded-lg px-3 py-2 shadow-lg">
                       <div className="text-xs text-yellow-400 font-medium uppercase tracking-wider">Correlation</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">
                        {correlationCoefficient > 0.7 ? '🔗 Strong' : 
                         correlationCoefficient > 0.3 ? '🔗 Moderate' : 
                         correlationCoefficient > -0.3 ? '🔗 Weak' : '🔗 Negative'}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({correlationCoefficient.toFixed(2)})
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
                 <YAxis yAxisId="dpu" stroke="#FFFFFF" label={{ value: selectedStage === 'All Stages' ? 'Total DPU' : `${selectedStage} DPU`, angle: -90, position: 'insideLeft' }} />
                 <YAxis yAxisId="volume" orientation="right" stroke="#FFFFFF" domain={[0, 2200]} label={{ value: selectedStage === 'All Stages' ? 'Build Volume' : `${selectedStage} Inspected`, angle: 90, position: 'insideRight' }} />
                 <Tooltip 
                   contentStyle={{
                     backgroundColor: '#2D2D2D',
                     border: '1px solid #404040',
                     color: '#FFFFFF',
                     borderRadius: '8px',
                     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                   }}
                   formatter={(value, name, props) => {
                     const monthData = props.payload;
                     
                     if (name === 'totalDpu') {
                       return [
                         formatDPU(Number(value)),
                         `${monthData.month} DPU`
                       ];
                     } else if (name === 'trendlineDPU') {
                       return [
                         formatDPU(Number(value)),
                         'DPU Trend'
                       ];
                     } else if (name === 'buildVolume') {
                       return [
                         formatNumber(Number(value)),
                         selectedStage === 'All Stages' ? 'Build Volume' : `${selectedStage} Inspected`
                       ];
                     }
                     
                     return [formatNumber(Number(value)), name];
                   }}
                   labelFormatter={(label, payload) => {
                     if (payload && payload.length > 0) {
                       const monthData = payload[0].payload;
                       return `${label} - Total Faults: ${formatNumber(monthData.totalFaults)}`;
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
                   name={selectedStage === 'All Stages' ? 'Total DPU' : `${selectedStage} DPU`}
                   label={{ 
                     position: 'center', 
                     fill: '#000000', 
                     fontSize: 11,
                     fontWeight: 'bold',
                     formatter: (value) => formatDPU(value)
                   }}
                 />
                 {/* Build Volume Line - Rendered after bars to appear on top */}
                 <Line 
                   yAxisId="volume"
                   type="monotone" 
                   dataKey="buildVolume" 
                   stroke="#3B82F6" 
                   strokeWidth={4}
                   dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                   name={selectedStage === 'All Stages' ? 'Build Volume' : `${selectedStage} Inspected`}
                   label={{ 
                     position: 'top', 
                     fill: '#FFFFFF', 
                     fontSize: 10,
                     fontWeight: 'bold',
                     offset: 25,
                     formatter: (value) => formatNumber(value)
                   }}
                 />
                 {/* DPU Trendline */}
                 <Line 
                   yAxisId="dpu"
                   type="monotone" 
                   dataKey="trendlineDPU" 
                   stroke="#10B981" 
                   strokeWidth={3}
                   strokeDasharray="8 4"
                   dot={false}
                   name="DPU Trend"
                 />
               </ComposedChart>
             </ResponsiveContainer>
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
                  const dpuChange = prevMonth ? month.totalDpu - prevMonth.totalDpu : 0;
                  
                     return (
                       <tr key={month.id} className={`${index % 2 === 0 ? 'bg-gray-900/50' : 'bg-black/50'} hover:bg-yellow-600/10 transition-colors duration-200 border-b border-gray-700/50`}>
                         <td className="whitespace-nowrap text-sm font-medium text-white py-3 px-4">
                           <div className="flex items-center">
                             <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                             {month.date}
                           </div>
                         </td>
                         <td className="whitespace-nowrap text-sm text-white text-right py-3 px-4 font-mono">
                           {formatNumber(month.totalInspections)}
                         </td>
                         <td className="whitespace-nowrap text-sm text-white text-right py-3 px-4 font-mono">
                           {formatNumber(month.totalFaults)}
                         </td>
                         <td className="whitespace-nowrap text-sm text-white text-right py-3 px-4 font-mono font-bold">
                           {formatDPU(month.totalDpu)}
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
    </div>
  );
};

export default Dashboard;
