import { InspectionData, StageTarget } from '@/types';

/**
 * Calculate proportional stage targets based on overall target
 * Each stage's target is proportional to its contribution to total DPU
 */
export function calculateProportionalTargets(
  baselineData: InspectionData,
  overallTarget: number,
  filterType: 'production' | 'dpdi' | 'combined' = 'combined'
): StageTarget[] {
  const stageTargets: StageTarget[] = [];
  
  // Get baseline DPU based on filter type
  let baselineTotalDpu: number;
  switch (filterType) {
    case 'production':
      baselineTotalDpu = baselineData.productionTotalDpu;
      break;
    case 'dpdi':
      baselineTotalDpu = baselineData.dpdiTotalDpu;
      break;
    case 'combined':
    default:
      baselineTotalDpu = baselineData.combinedTotalDpu;
  }

  if (baselineTotalDpu === 0) {
    console.warn('Baseline DPU is 0, cannot calculate proportional targets');
    return [];
  }

  // Calculate target for each stage proportionally
  baselineData.stages.forEach(stage => {
    if (stage.inspected === 0) {
      // Skip inactive stages
      stageTargets.push({
        stageName: stage.name,
        targetDpu: 0,
        isManual: false
      });
      return;
    }

    // Proportional calculation: (Stage DPU / Total DPU) × Target DPU
    const proportion = stage.dpu / baselineTotalDpu;
    const targetDpu = proportion * overallTarget;

    stageTargets.push({
      stageName: stage.name,
      targetDpu: Math.round(targetDpu * 100) / 100, // Round to 2 decimals
      isManual: false
    });
  });

  return stageTargets;
}

/**
 * Calculate weighted targets based on fault contribution
 * Stages with more faults get proportionally higher targets
 */
export function calculateWeightedTargets(
  baselineData: InspectionData,
  overallTarget: number
): StageTarget[] {
  const stageTargets: StageTarget[] = [];
  const totalFaults = baselineData.combinedTotalFaults;

  if (totalFaults === 0) {
    return calculateProportionalTargets(baselineData, overallTarget);
  }

  baselineData.stages.forEach(stage => {
    if (stage.inspected === 0) {
      stageTargets.push({
        stageName: stage.name,
        targetDpu: 0,
        isManual: false
      });
      return;
    }

    // Weight by fault contribution
    const faultProportion = stage.faults / totalFaults;
    const volumeAdjustment = baselineData.combinedTotalInspections / stage.inspected;
    const targetDpu = faultProportion * overallTarget * volumeAdjustment;

    stageTargets.push({
      stageName: stage.name,
      targetDpu: Math.round(targetDpu * 100) / 100,
      isManual: false
    });
  });

  return stageTargets;
}

/**
 * Calculate hybrid targets combining performance tier and contribution
 * Better performing stages get lower reduction targets
 */
export function calculateHybridTargets(
  baselineData: InspectionData,
  overallTarget: number
): StageTarget[] {
  const stageTargets: StageTarget[] = [];
  const reductionFactor = overallTarget / baselineData.combinedTotalDpu;

  baselineData.stages.forEach(stage => {
    if (stage.inspected === 0) {
      stageTargets.push({
        stageName: stage.name,
        targetDpu: 0,
        isManual: false
      });
      return;
    }

    // Determine performance tier and reduction factor
    let tierReduction: number;
    if (stage.dpu < 0.5) {
      tierReduction = 0.8; // Excellent: 20% reduction
    } else if (stage.dpu < 1.0) {
      tierReduction = 0.6; // Good: 40% reduction
    } else if (stage.dpu < 2.0) {
      tierReduction = 0.5; // Needs improvement: 50% reduction
    } else {
      tierReduction = 0.4; // Critical: 60% reduction
    }

    // Blend proportional and tier-based
    const proportionalTarget = (stage.dpu / baselineData.combinedTotalDpu) * overallTarget;
    const tierTarget = stage.dpu * tierReduction;
    const targetDpu = (proportionalTarget + tierTarget) / 2;

    stageTargets.push({
      stageName: stage.name,
      targetDpu: Math.round(targetDpu * 100) / 100,
      isManual: false
    });
  });

  return stageTargets;
}

/**
 * Get target for a specific stage from stage targets array
 */
export function getStageTarget(stageTargets: StageTarget[], stageName: string): number {
  const target = stageTargets.find(t => t.stageName === stageName);
  return target?.targetDpu || 0;
}

/**
 * Validate that stage targets sum approximately to overall target
 */
export function validateTargets(
  stageTargets: StageTarget[],
  overallTarget: number,
  tolerance: number = 0.1
): boolean {
  const sum = stageTargets.reduce((total, stage) => total + stage.targetDpu, 0);
  const difference = Math.abs(sum - overallTarget);
  return difference <= tolerance;
}

/**
 * Calculate overall reduction percentage needed
 */
export function calculateReductionPercentage(current: number, target: number): number {
  if (current === 0) return 0;
  return ((current - target) / current) * 100;
}

/**
 * Get performance tier label based on DPU
 */
export function getPerformanceTier(dpu: number): { label: string; color: string } {
  if (dpu < 0.5) return { label: 'Excellent', color: 'green' };
  if (dpu < 1.0) return { label: 'Good', color: 'blue' };
  if (dpu < 2.0) return { label: 'Needs Improvement', color: 'yellow' };
  return { label: 'Critical', color: 'red' };
}

