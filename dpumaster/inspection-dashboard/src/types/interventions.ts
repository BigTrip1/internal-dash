// Intervention Tracking Types
export interface Intervention {
  id: string;
  title: string;
  description: string;
  type: 'Process' | 'Training' | 'Tooling' | 'Design' | 'Quality Check' | 'Supplier' | 'Other';
  estimatedDPUReduction: number; // Expected reduction in DPU (e.g., -1.5)
  cutInDate: string; // ISO date string
  investmentCost?: number; // Optional cost in currency
  owner: string; // Person responsible
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled' | 'Delayed';
  confidenceLevel: 'Low' | 'Medium' | 'High'; // Confidence in achieving impact
  actualImpact?: number; // Actual DPU reduction after completion
  completedDate?: string; // ISO date string
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionPlan {
  _id?: string;
  stageId: string;
  stageName: string;
  year: number;
  createdBy: string; // Area owner/team leader name
  createdAt: string;
  updatedAt: string;
  
  // Current state snapshot
  currentState: {
    currentDPU: number;
    targetDPU: number;
    gap: number;
    monthsRemaining: number;
    requiredRate: number;
  };
  
  // Interventions list
  interventions: Intervention[];
  
  // Calculated projections
  projections: {
    baselineProjection: number; // Without interventions
    adjustedProjection: number; // With interventions
    totalExpectedImpact: number;
    confidenceScore: number; // 0-100
  };
}

export interface ForecastScenario {
  name: 'Baseline' | 'With Interventions';
  projectedDec: number;
  successLikelihood: 'High' | 'Medium' | 'Low';
  riskLevel: 'High' | 'Medium' | 'Low';
  riskPercentage: number;
  description: string;
}

export interface DualForecast {
  baseline: ForecastScenario;
  withInterventions?: ForecastScenario;
  improvement?: {
    dpuReduction: number;
    riskReduction: number; // percentage points
    likelihoodChange: string;
  };
}

