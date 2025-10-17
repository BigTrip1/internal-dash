export interface InspectionStage {
  id: string;
  name: string;
  inspected: number;
  faults: number;
  dpu: number;
}

export interface InspectionData {
  id: string;
  date: string; // Format: "Jan-25", "Feb-25", etc.
  year: number; // Year: 2025, 2026, etc.
  stages: InspectionStage[];
  productionTotalInspections: number;
  productionTotalFaults: number;
  productionTotalDpu: number;
  dpdiTotalInspections: number;
  dpdiTotalFaults: number;
  dpdiTotalDpu: number;
  combinedTotalInspections: number;
  combinedTotalFaults: number;
  combinedTotalDpu: number;
  signoutVolume: number;
}

export interface DashboardData {
  inspections: InspectionData[];
  stages: string[]; // List of all stage names
}

// Target Management Types
export interface StageTarget {
  stageName: string;
  targetDpu: number;
  isManual: boolean; // Whether target was manually set or calculated
}

export interface YearTarget {
  _id?: string;
  year: number;
  combinedTarget: number;
  productionTarget: number;
  dpdiTarget: number;
  allocationStrategy: 'proportional' | 'weighted' | 'hybrid' | 'manual';
  stageTargets: StageTarget[];
  baseline: {
    month: string; // e.g., "Sep-25"
    combinedDpu: number;
    productionDpu: number;
    dpdiDpu: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Default stages based on your data
export const DEFAULT_STAGES = [
  'BOOMS',
  'SIP1',
  'SIP1A',
  'SIP2',
  'SIP3',
  'SIP4',
  'RR',
  'UVI',
  'SIP5',
  'FTEST',
  'LECREC',
  'CT',
  'UV2',
  'CABWT',
  'SIP6',
  'CFC',
  'CABSIP',
  'UV3',
  'SIGN'
];

// Initial seed data from your provided dataset
export const INITIAL_DATA: InspectionData[] = [
  {
    id: 'jan-25',
    date: 'Jan-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1446, faults: 1018, dpu: 0.7 },
      { id: 'sip1', name: 'SIP1', inspected: 1468, faults: 606, dpu: 0.41 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1466, faults: 620, dpu: 0.42 },
      { id: 'sip2', name: 'SIP2', inspected: 1459, faults: 845, dpu: 0.58 },
      { id: 'sip3', name: 'SIP3', inspected: 1461, faults: 1858, dpu: 1.27 },
      { id: 'sip4', name: 'SIP4', inspected: 1461, faults: 1514, dpu: 1.04 },
      { id: 'rr', name: 'RR', inspected: 1451, faults: 319, dpu: 0.22 },
      { id: 'uvi', name: 'UVI', inspected: 1451, faults: 167, dpu: 0.12 },
      { id: 'sip5', name: 'SIP5', inspected: 1442, faults: 2585, dpu: 1.79 },
      { id: 'ftest', name: 'FTEST', inspected: 1440, faults: 713, dpu: 0.5 },
      { id: 'lecrec', name: 'LECREC', inspected: 1439, faults: 41, dpu: 0.03 },
      { id: 'ct', name: 'CT', inspected: 1420, faults: 1518, dpu: 1.07 },
      { id: 'uv2', name: 'UV2', inspected: 1415, faults: 392, dpu: 0.28 },
      { id: 'cabwt', name: 'CABWT', inspected: 1415, faults: 42, dpu: 0.03 },
      { id: 'sip6', name: 'SIP6', inspected: 1394, faults: 3591, dpu: 2.58 },
      { id: 'cfc', name: 'CFC', inspected: 1384, faults: 12630, dpu: 9.13 },
      { id: 'cabsip', name: 'CABSIP', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 1434, faults: 1, dpu: 0 }
    ],
    productionTotalInspections: 24446,
    productionTotalFaults: 28460,
    productionTotalDpu: 20.17,
    dpdiTotalInspections: 0,
    dpdiTotalFaults: 0,
    dpdiTotalDpu: 0,
    combinedTotalInspections: 24446,
    combinedTotalFaults: 28460,
    combinedTotalDpu: 20.17,
    signoutVolume: 1434
  }
];

// Utility function to generate a new year's data
export const generateYearData = (year: number): InspectionData[] => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return months.map((month, index) => {
    const monthId = `${month.toLowerCase()}-${year.toString().slice(-2)}`;
    const date = `${month}-${year.toString().slice(-2)}`;
    
    // Create stages with default values (0) for new year
    const stages: InspectionStage[] = DEFAULT_STAGES.map(stageName => ({
      id: stageName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: stageName,
      inspected: 0,
      faults: 0,
      dpu: 0
    }));
    
    return {
      id: monthId,
      date,
      year,
      stages,
      productionTotalInspections: 0,
      productionTotalFaults: 0,
      productionTotalDpu: 0,
      dpdiTotalInspections: 0,
      dpdiTotalFaults: 0,
      dpdiTotalDpu: 0,
      combinedTotalInspections: 0,
      combinedTotalFaults: 0,
      combinedTotalDpu: 0,
      signoutVolume: 0
    };
  });
};
