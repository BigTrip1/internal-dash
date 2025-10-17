import { InspectionData, InspectionStage } from '@/types';

// Calculate DPU for a stage
export const calculateDPU = (inspected: number, faults: number): number => {
  if (inspected === 0) return 0;
  return Math.round((faults / inspected) * 100) / 100; // Round to 2 decimal places
};

// Calculate totals for a month
export const calculateTotals = (stages: InspectionStage[]) => {
  const totalInspections = stages.reduce((sum, stage) => sum + stage.inspected, 0);
  const totalFaults = stages.reduce((sum, stage) => sum + stage.faults, 0);
  // CORRECT: Total DPU is sum of all stage DPUs for that month
  const totalDpu = stages.reduce((sum, stage) => sum + stage.dpu, 0);
  
  return {
    totalInspections,
    totalFaults,
    totalDpu: Math.round(totalDpu * 100) / 100
  };
};

// Update stage data and recalculate DPU
export const updateStageData = (
  stage: InspectionStage,
  inspected?: number,
  faults?: number
): InspectionStage => {
  const newInspected = inspected !== undefined ? inspected : stage.inspected;
  const newFaults = faults !== undefined ? faults : stage.faults;
  const newDpu = calculateDPU(newInspected, newFaults);
  
  return {
    ...stage,
    inspected: newInspected,
    faults: newFaults,
    dpu: newDpu
  };
};

// Update inspection data for a month
export const updateInspectionData = (
  data: InspectionData,
  stageId: string,
  inspected?: number,
  faults?: number
): InspectionData => {
  const updatedStages = data.stages.map(stage => 
    stage.id === stageId 
      ? updateStageData(stage, inspected, faults)
      : stage
  );
  
  const totals = calculateTotals(updatedStages);
  
  return {
    ...data,
    stages: updatedStages,
    ...totals
  };
};

// Add a new stage to all months
export const addStageToAllMonths = (
  data: InspectionData[],
  stageName: string,
  stageId: string
): InspectionData[] => {
  const newStage: InspectionStage = {
    id: stageId,
    name: stageName,
    inspected: 0,
    faults: 0,
    dpu: 0
  };
  
  return data.map(month => {
    const updatedStages = [...month.stages, newStage];
    const totals = calculateTotals(updatedStages);
    
    return {
      ...month,
      stages: updatedStages,
      ...totals
    };
  });
};

// Remove a stage from all months
export const removeStageFromAllMonths = (
  data: InspectionData[],
  stageId: string
): InspectionData[] => {
  return data.map(month => {
    const updatedStages = month.stages.filter(stage => stage.id !== stageId);
    const totals = calculateTotals(updatedStages);
    
    return {
      ...month,
      stages: updatedStages,
      ...totals
    };
  });
};

// Generate unique stage ID from name
export const generateStageId = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Get all unique stage names from data
export const getAllStageNames = (data: InspectionData[]): string[] => {
  if (data.length === 0) return [];
  
  // Sort stages by their 'order' field if it exists, otherwise maintain current order
  const sortedStages = [...data[0].stages].sort((a: any, b: any) => {
    // If both have order field, sort by it
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // If only one has order, prioritize the one with order
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    // If neither has order, maintain current order
    return 0;
  });
  
  return sortedStages.map(stage => stage.name);
};

// Sort stages by name
export const sortStagesByName = (stages: InspectionStage[]): InspectionStage[] => {
  return [...stages].sort((a, b) => a.name.localeCompare(b.name));
};

// Get stage performance summary
export const getStagePerformanceSummary = (data: InspectionData[]) => {
  const stageNames = getAllStageNames(data);
  const summary = stageNames.map(name => {
    const stageData = data.map(month => 
      month.stages.find(stage => stage.name === name)
    ).filter(Boolean) as InspectionStage[];
    
    const totalInspected = stageData.reduce((sum, stage) => sum + stage.inspected, 0);
    const totalFaults = stageData.reduce((sum, stage) => sum + stage.faults, 0);
    const avgDpu = stageData.reduce((sum, stage) => sum + stage.dpu, 0) / stageData.length;
    
    return {
      name,
      totalInspected,
      totalFaults,
      avgDpu: Math.round(avgDpu * 100) / 100,
      maxDpu: Math.max(...stageData.map(s => s.dpu)),
      minDpu: Math.min(...stageData.map(s => s.dpu))
    };
  });
  
  return summary.sort((a, b) => b.avgDpu - a.avgDpu);
};

// Format number for display
export const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toLocaleString();
};

// Format DPU for display
export const formatDPU = (dpu: number | undefined): string => {
  if (dpu === undefined || dpu === null || isNaN(dpu)) return '0.00';
  return dpu.toFixed(2);
};

// Validate stage name
export const validateStageName = (name: string): boolean => {
  return name.trim().length > 0 && /^[A-Z0-9\s]+$/.test(name.trim());
};

