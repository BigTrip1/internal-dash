/**
 * JCB Quality Performance Glide Path Calculator
 * Calculates monthly DPU reduction targets to achieve year-end goal
 */

export interface GlidePathData {
  currentDPU: number;
  targetDPU: number;
  currentMonth: number; // 0-11 (0 = January)
  currentYear: number;
  targetMonth: number; // Target achievement month
  targetYear: number;
}

export interface GlidePathResult {
  monthsRemaining: number;
  requiredMonthlyReduction: number;
  monthlyTargets: Array<{
    month: string;
    targetDPU: number;
    cumulativeReduction: number;
    isAchievable: boolean;
  }>;
  riskAssessment: 'On Track' | 'At Risk' | 'Critical';
  dailyReductionRequired: number;
}

export const calculateGlidePath = (data: GlidePathData): GlidePathResult => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Calculate months remaining
  let monthsRemaining: number;
  if (data.targetYear > data.currentYear) {
    monthsRemaining = (12 - data.currentMonth - 1) + (data.targetMonth + 1);
  } else {
    monthsRemaining = data.targetMonth - data.currentMonth;
  }

  // Ensure we have at least 1 month remaining
  monthsRemaining = Math.max(monthsRemaining, 1);

  // Calculate required reduction
  const totalReductionNeeded = data.currentDPU - data.targetDPU;
  const requiredMonthlyReduction = totalReductionNeeded / monthsRemaining;
  const dailyReductionRequired = requiredMonthlyReduction / 30; // Average days per month

  // Generate monthly targets
  const monthlyTargets = [];
  let currentProjectedDPU = data.currentDPU;

  for (let i = 0; i < monthsRemaining; i++) {
    const monthIndex = (data.currentMonth + i + 1) % 12;
    const year = data.currentYear + Math.floor((data.currentMonth + i + 1) / 12);
    const targetDPU = currentProjectedDPU - requiredMonthlyReduction;
    const cumulativeReduction = (i + 1) * requiredMonthlyReduction;
    
    // Assess if target is achievable (realistic reduction rate)
    const isAchievable = requiredMonthlyReduction <= 2.0; // Max 2.0 DPU reduction per month is realistic

    monthlyTargets.push({
      month: `${monthNames[monthIndex]}-${year.toString().substr(-2)}`,
      targetDPU: Math.max(targetDPU, data.targetDPU),
      cumulativeReduction,
      isAchievable
    });

    currentProjectedDPU = targetDPU;
  }

  // Risk assessment
  let riskAssessment: 'On Track' | 'At Risk' | 'Critical';
  if (requiredMonthlyReduction <= 1.0) {
    riskAssessment = 'On Track';
  } else if (requiredMonthlyReduction <= 2.0) {
    riskAssessment = 'At Risk';
  } else {
    riskAssessment = 'Critical';
  }

  return {
    monthsRemaining,
    requiredMonthlyReduction,
    monthlyTargets,
    riskAssessment,
    dailyReductionRequired
  };
};

export const getCurrentGlidePath = (currentDPU: number): GlidePathResult => {
  const now = new Date();
  return calculateGlidePath({
    currentDPU,
    targetDPU: 8.2,
    currentMonth: now.getMonth(),
    currentYear: now.getFullYear(),
    targetMonth: 11, // December (0-indexed)
    targetYear: 2025
  });
};

export const formatDPU = (value: number): string => {
  return value.toFixed(2);
};

export const formatReduction = (value: number): string => {
  return value > 0 ? `-${value.toFixed(2)}` : `+${Math.abs(value).toFixed(2)}`;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'On Track': return '#10B981'; // Green
    case 'At Risk': return '#F59E0B';  // Amber
    case 'Critical': return '#EF4444'; // Red
    default: return '#6B7280';         // Gray
  }
};

export const getMonthlyProgress = (currentDPU: number, lastMonthDPU: number, targetReduction: number): {
  actualReduction: number;
  targetReduction: number;
  variance: number;
  status: 'Ahead' | 'On Track' | 'Behind';
} => {
  const actualReduction = lastMonthDPU - currentDPU;
  const variance = actualReduction - targetReduction;
  
  let status: 'Ahead' | 'On Track' | 'Behind';
  if (variance > 0.1) {
    status = 'Ahead';
  } else if (variance >= -0.1) {
    status = 'On Track';
  } else {
    status = 'Behind';
  }

  return {
    actualReduction,
    targetReduction,
    variance,
    status
  };
};
