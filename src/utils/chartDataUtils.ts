/**
 * Robust Chart Data Utilities
 * Clean data pipeline for Dashboard chart with admin table integration
 */

import { InspectionData } from '@/types';

export interface ChartDataPoint {
  month: string;
  totalDpu: number | null;
  buildVolume: number | null;
  totalFaults: number | null;
  totalInspections: number | null;
  targetTrajectory: number;
  isAboveTarget: boolean;
  isFuture: boolean;
  variance: number;
}

export interface StageChartDataPoint {
  month: string;
  stageDpu: number | null;
  stageInspected: number | null;
  stageFaults: number | null;
  targetTrajectory: number;
  isAboveTarget: boolean;
  isFuture: boolean;
  variance: number;
}

/**
 * Prepare complete 12-month chart data with robust error handling
 */
export const prepareChartData = (
  data: InspectionData[], 
  selectedStage: string = 'All Stages'
): ChartDataPoint[] | StageChartDataPoint[] => {
  
  // Ensure we have valid data
  if (!data || !Array.isArray(data)) {
    console.warn('Invalid data provided to prepareChartData');
    return [];
  }

  // Define all 12 months for complete visualization
  const allMonths = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
    'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'
  ];

  // Get current month index (0-11)
  const currentMonth = new Date().getMonth();
  
  // Filter valid data records
  const validData = data.filter(month => 
    month && 
    month.date && 
    typeof month.date === 'string' &&
    month.totalDpu !== undefined &&
    month.totalDpu !== null
  );

  // Calculate target trajectory
  const latestValidMonth = validData[validData.length - 1];
  const currentDPU = latestValidMonth?.totalDpu || 12.87;
  const targetDPU = 8.2;
  const monthsRemaining = Math.max(12 - currentMonth - 1, 1); // Months from current to Dec
  const monthlyReduction = (currentDPU - targetDPU) / monthsRemaining;

  if (selectedStage === 'All Stages') {
    // Prepare data for all stages view
    return allMonths.map((monthName, index) => {
      // Find actual data for this month
      const monthRecord = validData.find(m => m.date === monthName);
      const isHistorical = index <= currentMonth;
      const isFuture = !isHistorical;
      
      // Calculate target trajectory for this month
      const monthsFromCurrent = index - currentMonth;
      const targetTrajectory = currentDPU - (monthlyReduction * monthsFromCurrent);
      const clampedTarget = Math.max(targetTrajectory, targetDPU);
      
      if (monthRecord && isHistorical) {
        // Historical month with actual data
        const buildVolume = monthRecord.stages?.find(s => s.name === 'SIGN')?.inspected || 0;
        const variance = monthRecord.totalDpu - clampedTarget;
        
        return {
          month: monthName,
          totalDpu: monthRecord.totalDpu,
          buildVolume: buildVolume,
          totalFaults: monthRecord.totalFaults,
          totalInspections: monthRecord.totalInspections,
          targetTrajectory: clampedTarget,
          isAboveTarget: variance > 0,
          isFuture: false,
          variance: variance
        };
      } else {
        // Future month or missing data
        return {
          month: monthName,
          totalDpu: null,
          buildVolume: null,
          totalFaults: null,
          totalInspections: null,
          targetTrajectory: clampedTarget,
          isAboveTarget: false,
          isFuture: true,
          variance: 0
        };
      }
    });
  } else {
    // Prepare data for specific stage view
    return allMonths.map((monthName, index) => {
      const monthRecord = validData.find(m => m.date === monthName);
      const isHistorical = index <= currentMonth;
      const isFuture = !isHistorical;
      
      // Calculate target trajectory for this stage
      const monthsFromCurrent = index - currentMonth;
      const stageCurrentDPU = latestValidMonth?.stages?.find(s => s.name === selectedStage)?.dpu || 0;
      const stageTargetDPU = Math.max(stageCurrentDPU * 0.6, 0.5); // Target 40% reduction for stages
      const stageMonthlyReduction = (stageCurrentDPU - stageTargetDPU) / monthsRemaining;
      const targetTrajectory = stageCurrentDPU - (stageMonthlyReduction * monthsFromCurrent);
      const clampedTarget = Math.max(targetTrajectory, stageTargetDPU);
      
      if (monthRecord && isHistorical) {
        // Historical month with actual stage data
        const stageData = monthRecord.stages?.find(s => s.name === selectedStage);
        const variance = (stageData?.dpu || 0) - clampedTarget;
        
        return {
          month: monthName,
          stageDpu: stageData?.dpu || 0,
          stageInspected: stageData?.inspected || 0,
          stageFaults: stageData?.faults || 0,
          targetTrajectory: clampedTarget,
          isAboveTarget: variance > 0,
          isFuture: false,
          variance: variance
        };
      } else {
        // Future month or missing data
        return {
          month: monthName,
          stageDpu: null,
          stageInspected: null,
          stageFaults: null,
          targetTrajectory: clampedTarget,
          isAboveTarget: false,
          isFuture: true,
          variance: 0
        };
      }
    });
  }
};

/**
 * Get tooltip data directly from admin table
 */
export const getTooltipData = (
  monthName: string, 
  selectedStage: string, 
  allData: InspectionData[]
) => {
  const monthRecord = allData.find(m => m && m.date === monthName);
  
  if (!monthRecord) {
    return {
      month: monthName,
      dpu: 'No Data',
      faults: 'No Data',
      inspected: 'No Data',
      isFuture: true
    };
  }

  if (selectedStage === 'All Stages') {
    return {
      month: monthName,
      dpu: monthRecord.totalDpu,
      faults: monthRecord.totalFaults,
      inspected: monthRecord.totalInspections,
      buildVolume: monthRecord.stages?.find(s => s.name === 'SIGN')?.inspected || 0,
      isFuture: false
    };
  } else {
    const stageData = monthRecord.stages?.find(s => s.name === selectedStage);
    return {
      month: monthName,
      dpu: stageData?.dpu || 0,
      faults: stageData?.faults || 0,
      inspected: stageData?.inspected || 0,
      isFuture: false
    };
  }
};

/**
 * Calculate dynamic trendline color based on performance
 */
export const getTrendlineColor = (isAboveTarget: boolean, isFuture: boolean): string => {
  if (isFuture) return '#3B82F6'; // Blue for future targets
  return isAboveTarget ? '#EF4444' : '#10B981'; // Red for above target, Green for below target
};

/**
 * Format tooltip content with proper admin table data
 */
export const formatTooltipContent = (
  monthName: string,
  selectedStage: string,
  allData: InspectionData[],
  targetTrajectory: number,
  isAboveTarget: boolean,
  isFuture: boolean
) => {
  const tooltipData = getTooltipData(monthName, selectedStage, allData);
  
  if (tooltipData.isFuture) {
    return {
      header: `${monthName} - Future Target`,
      lines: [
        `Target Trajectory: ${targetTrajectory.toFixed(2)} 🎯`,
        'No actual data yet'
      ]
    };
  }

  const trendStatus = isFuture ? 'Future Target' : isAboveTarget ? 'Off Track 🔴' : 'On Track 🟢';
  const variance = Math.abs(Number(tooltipData.dpu) - targetTrajectory);

  if (selectedStage === 'All Stages') {
    return {
      header: `${monthName} - Total Faults: ${tooltipData.faults?.toLocaleString() || 0} | Total Inspections: ${tooltipData.inspected?.toLocaleString() || 0}`,
      lines: [
        `${monthName} DPU: ${Number(tooltipData.dpu).toFixed(2)}`,
        `Build Volume: ${tooltipData.buildVolume?.toLocaleString() || 0}`,
        `Target Trajectory: ${targetTrajectory.toFixed(2)}`,
        `Trend Deviation: ${variance.toFixed(2)} (${trendStatus})`
      ]
    };
  } else {
    return {
      header: `${monthName} - ${selectedStage} Faults: ${tooltipData.faults?.toLocaleString() || 0} | ${selectedStage} Inspected: ${tooltipData.inspected?.toLocaleString() || 0}`,
      lines: [
        `${selectedStage} DPU: ${Number(tooltipData.dpu).toFixed(2)}`,
        `${selectedStage} Inspected: ${tooltipData.inspected?.toLocaleString() || 0}`,
        `Target Trajectory: ${targetTrajectory.toFixed(2)}`,
        `Trend Deviation: ${variance.toFixed(2)} (${trendStatus})`
      ]
    };
  }
};
