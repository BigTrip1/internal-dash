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
  totalInspections: number;
  totalFaults: number;
  totalDpu: number;
}

export interface DashboardData {
  inspections: InspectionData[];
  stages: string[]; // List of all stage names
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
    totalInspections: 24446,
    totalFaults: 28460,
    totalDpu: 20.17
  },
  {
    id: 'feb-25',
    date: 'Feb-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1509, faults: 1074, dpu: 0.71 },
      { id: 'sip1', name: 'SIP1', inspected: 1497, faults: 524, dpu: 0.35 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1499, faults: 441, dpu: 0.29 },
      { id: 'sip2', name: 'SIP2', inspected: 1501, faults: 811, dpu: 0.54 },
      { id: 'sip3', name: 'SIP3', inspected: 1489, faults: 1706, dpu: 1.14 },
      { id: 'sip4', name: 'SIP4', inspected: 1501, faults: 1232, dpu: 0.82 },
      { id: 'rr', name: 'RR', inspected: 1497, faults: 271, dpu: 0.18 },
      { id: 'uvi', name: 'UVI', inspected: 1497, faults: 127, dpu: 0.08 },
      { id: 'sip5', name: 'SIP5', inspected: 1506, faults: 2379, dpu: 1.58 },
      { id: 'ftest', name: 'FTEST', inspected: 1505, faults: 625, dpu: 0.42 },
      { id: 'lecrec', name: 'LECREC', inspected: 1506, faults: 36, dpu: 0.02 },
      { id: 'ct', name: 'CT', inspected: 1506, faults: 1429, dpu: 0.95 },
      { id: 'uv2', name: 'UV2', inspected: 1510, faults: 252, dpu: 0.17 },
      { id: 'cabwt', name: 'CABWT', inspected: 1510, faults: 52, dpu: 0.03 },
      { id: 'sip6', name: 'SIP6', inspected: 1525, faults: 3519, dpu: 2.31 },
      { id: 'cfc', name: 'CFC', inspected: 1527, faults: 12169, dpu: 7.97 },
      { id: 'cabsip', name: 'CABSIP', inspected: 89, faults: 0, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 1499, faults: 0, dpu: 0 }
    ],
    totalInspections: 25683,
    totalFaults: 26647,
    totalDpu: 17.56
  },
  {
    id: 'mar-25',
    date: 'Mar-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1686, faults: 1029, dpu: 0.61 },
      { id: 'sip1', name: 'SIP1', inspected: 1693, faults: 477, dpu: 0.28 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1693, faults: 469, dpu: 0.28 },
      { id: 'sip2', name: 'SIP2', inspected: 1690, faults: 1004, dpu: 0.59 },
      { id: 'sip3', name: 'SIP3', inspected: 1687, faults: 2034, dpu: 1.21 },
      { id: 'sip4', name: 'SIP4', inspected: 1690, faults: 1213, dpu: 0.72 },
      { id: 'rr', name: 'RR', inspected: 1697, faults: 301, dpu: 0.18 },
      { id: 'uvi', name: 'UVI', inspected: 1697, faults: 113, dpu: 0.07 },
      { id: 'sip5', name: 'SIP5', inspected: 1687, faults: 1954, dpu: 1.16 },
      { id: 'ftest', name: 'FTEST', inspected: 1685, faults: 698, dpu: 0.41 },
      { id: 'lecrec', name: 'LECREC', inspected: 1684, faults: 15, dpu: 0.01 },
      { id: 'ct', name: 'CT', inspected: 1679, faults: 1525, dpu: 0.91 },
      { id: 'uv2', name: 'UV2', inspected: 1680, faults: 241, dpu: 0.14 },
      { id: 'cabwt', name: 'CABWT', inspected: 1680, faults: 69, dpu: 0.04 },
      { id: 'sip6', name: 'SIP6', inspected: 1683, faults: 4171, dpu: 2.48 },
      { id: 'cfc', name: 'CFC', inspected: 1695, faults: 8613, dpu: 5.08 },
      { id: 'cabsip', name: 'CABSIP', inspected: 875, faults: 0, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 1706, faults: 0, dpu: 0 }
    ],
    totalInspections: 29587,
    totalFaults: 23926,
    totalDpu: 14.17
  },
  {
    id: 'apr-25',
    date: 'Apr-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1672, faults: 915, dpu: 0.55 },
      { id: 'sip1', name: 'SIP1', inspected: 1672, faults: 754, dpu: 0.45 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1672, faults: 485, dpu: 0.29 },
      { id: 'sip2', name: 'SIP2', inspected: 1674, faults: 1540, dpu: 0.92 },
      { id: 'sip3', name: 'SIP3', inspected: 1674, faults: 2079, dpu: 1.24 },
      { id: 'sip4', name: 'SIP4', inspected: 1673, faults: 1261, dpu: 0.75 },
      { id: 'rr', name: 'RR', inspected: 1668, faults: 333, dpu: 0.2 },
      { id: 'uvi', name: 'UVI', inspected: 1667, faults: 124, dpu: 0.07 },
      { id: 'sip5', name: 'SIP5', inspected: 1665, faults: 2416, dpu: 1.45 },
      { id: 'ftest', name: 'FTEST', inspected: 1668, faults: 764, dpu: 0.46 },
      { id: 'lecrec', name: 'LECREC', inspected: 1666, faults: 9, dpu: 0.01 },
      { id: 'ct', name: 'CT', inspected: 1665, faults: 1584, dpu: 0.95 },
      { id: 'uv2', name: 'UV2', inspected: 1662, faults: 246, dpu: 0.15 },
      { id: 'cabwt', name: 'CABWT', inspected: 1661, faults: 41, dpu: 0.02 },
      { id: 'sip6', name: 'SIP6', inspected: 1653, faults: 3883, dpu: 2.35 },
      { id: 'cfc', name: 'CFC', inspected: 1651, faults: 5936, dpu: 3.6 },
      { id: 'cabsip', name: 'CABSIP', inspected: 1684, faults: 1, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 1676, faults: 0, dpu: 0 }
    ],
    totalInspections: 30023,
    totalFaults: 22371,
    totalDpu: 13.46
  },
  {
    id: 'may-25',
    date: 'May-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1525, faults: 888, dpu: 0.58 },
      { id: 'sip1', name: 'SIP1', inspected: 1524, faults: 1129, dpu: 0.74 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1530, faults: 728, dpu: 0.48 },
      { id: 'sip2', name: 'SIP2', inspected: 1520, faults: 1201, dpu: 0.79 },
      { id: 'sip3', name: 'SIP3', inspected: 1523, faults: 2334, dpu: 1.53 },
      { id: 'sip4', name: 'SIP4', inspected: 1518, faults: 1425, dpu: 0.94 },
      { id: 'rr', name: 'RR', inspected: 1513, faults: 288, dpu: 0.19 },
      { id: 'uvi', name: 'UVI', inspected: 1514, faults: 106, dpu: 0.07 },
      { id: 'sip5', name: 'SIP5', inspected: 1515, faults: 3337, dpu: 2.2 },
      { id: 'ftest', name: 'FTEST', inspected: 1514, faults: 816, dpu: 0.54 },
      { id: 'lecrec', name: 'LECREC', inspected: 1516, faults: 18, dpu: 0.01 },
      { id: 'ct', name: 'CT', inspected: 1539, faults: 1958, dpu: 1.27 },
      { id: 'uv2', name: 'UV2', inspected: 1540, faults: 321, dpu: 0.21 },
      { id: 'cabwt', name: 'CABWT', inspected: 1541, faults: 47, dpu: 0.03 },
      { id: 'sip6', name: 'SIP6', inspected: 1540, faults: 3947, dpu: 2.56 },
      { id: 'cfc', name: 'CFC', inspected: 1559, faults: 3642, dpu: 2.34 },
      { id: 'cabsip', name: 'CABSIP', inspected: 1518, faults: 6, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 1501, faults: 1, dpu: 0 }
    ],
    totalInspections: 27450,
    totalFaults: 22192,
    totalDpu: 14.48
  },
  {
    id: 'jun-25',
    date: 'Jun-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1941, faults: 991, dpu: 0.51 },
      { id: 'sip1', name: 'SIP1', inspected: 1944, faults: 1085, dpu: 0.56 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1943, faults: 683, dpu: 0.35 },
      { id: 'sip2', name: 'SIP2', inspected: 1942, faults: 1645, dpu: 0.85 },
      { id: 'sip3', name: 'SIP3', inspected: 1939, faults: 2864, dpu: 1.48 },
      { id: 'sip4', name: 'SIP4', inspected: 1943, faults: 1856, dpu: 0.96 },
      { id: 'rr', name: 'RR', inspected: 1952, faults: 660, dpu: 0.34 },
      { id: 'uvi', name: 'UVI', inspected: 1952, faults: 142, dpu: 0.07 },
      { id: 'sip5', name: 'SIP5', inspected: 1951, faults: 3511, dpu: 1.8 },
      { id: 'ftest', name: 'FTEST', inspected: 1949, faults: 1194, dpu: 0.61 },
      { id: 'lecrec', name: 'LECREC', inspected: 1948, faults: 18, dpu: 0.01 },
      { id: 'ct', name: 'CT', inspected: 1922, faults: 2355, dpu: 1.23 },
      { id: 'uv2', name: 'UV2', inspected: 1922, faults: 250, dpu: 0.13 },
      { id: 'cabwt', name: 'CABWT', inspected: 1921, faults: 39, dpu: 0.02 },
      { id: 'sip6', name: 'SIP6', inspected: 1923, faults: 4231, dpu: 2.2 },
      { id: 'cfc', name: 'CFC', inspected: 1925, faults: 4140, dpu: 2.15 },
      { id: 'cabsip', name: 'CABSIP', inspected: 1948, faults: 1, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 1968, faults: 0, dpu: 0 }
    ],
    totalInspections: 34933,
    totalFaults: 25665,
    totalDpu: 13.27
  },
  {
    id: 'jul-25',
    date: 'Jul-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1247, faults: 593, dpu: 0.48 },
      { id: 'sip1', name: 'SIP1', inspected: 1241, faults: 634, dpu: 0.51 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1241, faults: 395, dpu: 0.32 },
      { id: 'sip2', name: 'SIP2', inspected: 1242, faults: 1038, dpu: 0.84 },
      { id: 'sip3', name: 'SIP3', inspected: 1243, faults: 1560, dpu: 1.21 },
      { id: 'sip4', name: 'SIP4', inspected: 1241, faults: 1269, dpu: 1.02 },
      { id: 'rr', name: 'RR', inspected: 1238, faults: 476, dpu: 0.38 },
      { id: 'uvi', name: 'UVI', inspected: 1238, faults: 101, dpu: 0.08 },
      { id: 'sip5', name: 'SIP5', inspected: 1236, faults: 2842, dpu: 1.89 },
      { id: 'ftest', name: 'FTEST', inspected: 1237, faults: 729, dpu: 0.59 },
      { id: 'lecrec', name: 'LECREC', inspected: 1239, faults: 6, dpu: 0 },
      { id: 'ct', name: 'CT', inspected: 1252, faults: 1456, dpu: 1.16 },
      { id: 'uv2', name: 'UV2', inspected: 1250, faults: 189, dpu: 0.15 },
      { id: 'cabwt', name: 'CABWT', inspected: 1251, faults: 48, dpu: 0.04 },
      { id: 'sip6', name: 'SIP6', inspected: 1252, faults: 3105, dpu: 2.48 },
      { id: 'cfc', name: 'CFC', inspected: 1252, faults: 2518, dpu: 2.01 },
      { id: 'cabsip', name: 'CABSIP', inspected: 1236, faults: 1, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 1214, faults: 0, dpu: 0 }
    ],
    totalInspections: 22350,
    totalFaults: 16401,
    totalDpu: 13.16
  },
  {
    id: 'aug-25',
    date: 'Aug-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1440, faults: 595, dpu: 0.41 },
      { id: 'sip1', name: 'SIP1', inspected: 1451, faults: 740, dpu: 0.51 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1425, faults: 565, dpu: 0.4 },
      { id: 'sip2', name: 'SIP2', inspected: 1427, faults: 1337, dpu: 0.87 },
      { id: 'sip3', name: 'SIP3', inspected: 1429, faults: 1926, dpu: 1.13 },
      { id: 'sip4', name: 'SIP4', inspected: 1426, faults: 1902, dpu: 1.33 },
      { id: 'rr', name: 'RR', inspected: 1436, faults: 504, dpu: 0.35 },
      { id: 'uvi', name: 'UVI', inspected: 1436, faults: 163, dpu: 0.11 },
      { id: 'sip5', name: 'SIP5', inspected: 1450, faults: 2516, dpu: 1.74 },
      { id: 'ftest', name: 'FTEST', inspected: 1452, faults: 777, dpu: 0.54 },
      { id: 'lecrec', name: 'LECREC', inspected: 1449, faults: 4, dpu: 0 },
      { id: 'ct', name: 'CT', inspected: 1441, faults: 1835, dpu: 1.27 },
      { id: 'uv2', name: 'UV2', inspected: 1443, faults: 309, dpu: 0.21 },
      { id: 'cabwt', name: 'CABWT', inspected: 1443, faults: 44, dpu: 0.03 },
      { id: 'sip6', name: 'SIP6', inspected: 1426, faults: 3252, dpu: 2.28 },
      { id: 'cfc', name: 'CFC', inspected: 1429, faults: 3417, dpu: 2.39 },
      { id: 'cabsip', name: 'CABSIP', inspected: 1438, faults: 0, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 1333, faults: 73, dpu: 0.05 },
      { id: 'sign', name: 'SIGN', inspected: 1422, faults: 1, dpu: 0 }
    ],
    totalInspections: 27196,
    totalFaults: 19559,
    totalDpu: 13.62
  },
  {
    id: 'sep-25',
    date: 'Sep-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 1434, faults: 576, dpu: 0.4 },
      { id: 'sip1', name: 'SIP1', inspected: 1443, faults: 629, dpu: 0.44 },
      { id: 'sip1a', name: 'SIP1A', inspected: 1444, faults: 662, dpu: 0.46 },
      { id: 'sip2', name: 'SIP2', inspected: 1442, faults: 1069, dpu: 0.74 },
      { id: 'sip3', name: 'SIP3', inspected: 1442, faults: 1406, dpu: 0.98 },
      { id: 'sip4', name: 'SIP4', inspected: 1444, faults: 1392, dpu: 0.96 },
      { id: 'rr', name: 'RR', inspected: 1432, faults: 333, dpu: 0.23 },
      { id: 'uvi', name: 'UVI', inspected: 1432, faults: 131, dpu: 0.09 },
      { id: 'sip5', name: 'SIP5', inspected: 1422, faults: 2556, dpu: 1.8 },
      { id: 'ftest', name: 'FTEST', inspected: 1420, faults: 706, dpu: 0.5 },
      { id: 'lecrec', name: 'LECREC', inspected: 1419, faults: 1, dpu: 0 },
      { id: 'ct', name: 'CT', inspected: 1432, faults: 1904, dpu: 1.33 },
      { id: 'uv2', name: 'UV2', inspected: 1427, faults: 235, dpu: 0.16 },
      { id: 'cabwt', name: 'CABWT', inspected: 1427, faults: 40, dpu: 0.03 },
      { id: 'sip6', name: 'SIP6', inspected: 1443, faults: 3453, dpu: 2.39 },
      { id: 'cfc', name: 'CFC', inspected: 1416, faults: 3101, dpu: 2.19 },
      { id: 'cabsip', name: 'CABSIP', inspected: 1443, faults: 5, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 1441, faults: 240, dpu: 0.17 },
      { id: 'sign', name: 'SIGN', inspected: 1515, faults: 0, dpu: 0 }
    ],
    totalInspections: 27318,
    totalFaults: 18440,
    totalDpu: 12.87
  },
  {
    id: 'oct-25',
    date: 'Oct-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip1', name: 'SIP1', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip1a', name: 'SIP1A', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip2', name: 'SIP2', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip3', name: 'SIP3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip4', name: 'SIP4', inspected: 0, faults: 0, dpu: 0 },
      { id: 'rr', name: 'RR', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uvi', name: 'UVI', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip5', name: 'SIP5', inspected: 0, faults: 0, dpu: 0 },
      { id: 'ftest', name: 'FTEST', inspected: 0, faults: 0, dpu: 0 },
      { id: 'lecrec', name: 'LECREC', inspected: 0, faults: 0, dpu: 0 },
      { id: 'ct', name: 'CT', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uv2', name: 'UV2', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cabwt', name: 'CABWT', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip6', name: 'SIP6', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cfc', name: 'CFC', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cabsip', name: 'CABSIP', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 0, faults: 0, dpu: 0 }
    ],
    totalInspections: 0,
    totalFaults: 0,
    totalDpu: 0
  },
  {
    id: 'nov-25',
    date: 'Nov-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip1', name: 'SIP1', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip1a', name: 'SIP1A', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip2', name: 'SIP2', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip3', name: 'SIP3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip4', name: 'SIP4', inspected: 0, faults: 0, dpu: 0 },
      { id: 'rr', name: 'RR', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uvi', name: 'UVI', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip5', name: 'SIP5', inspected: 0, faults: 0, dpu: 0 },
      { id: 'ftest', name: 'FTEST', inspected: 0, faults: 0, dpu: 0 },
      { id: 'lecrec', name: 'LECREC', inspected: 0, faults: 0, dpu: 0 },
      { id: 'ct', name: 'CT', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uv2', name: 'UV2', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cabwt', name: 'CABWT', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip6', name: 'SIP6', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cfc', name: 'CFC', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cabsip', name: 'CABSIP', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 0, faults: 0, dpu: 0 }
    ],
    totalInspections: 0,
    totalFaults: 0,
    totalDpu: 0
  },
  {
    id: 'dec-25',
    date: 'Dec-25',
    year: 2025,
    stages: [
      { id: 'booms', name: 'BOOMS', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip1', name: 'SIP1', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip1a', name: 'SIP1A', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip2', name: 'SIP2', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip3', name: 'SIP3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip4', name: 'SIP4', inspected: 0, faults: 0, dpu: 0 },
      { id: 'rr', name: 'RR', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uvi', name: 'UVI', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip5', name: 'SIP5', inspected: 0, faults: 0, dpu: 0 },
      { id: 'ftest', name: 'FTEST', inspected: 0, faults: 0, dpu: 0 },
      { id: 'lecrec', name: 'LECREC', inspected: 0, faults: 0, dpu: 0 },
      { id: 'ct', name: 'CT', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uv2', name: 'UV2', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cabwt', name: 'CABWT', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sip6', name: 'SIP6', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cfc', name: 'CFC', inspected: 0, faults: 0, dpu: 0 },
      { id: 'cabsip', name: 'CABSIP', inspected: 0, faults: 0, dpu: 0 },
      { id: 'uv3', name: 'UV3', inspected: 0, faults: 0, dpu: 0 },
      { id: 'sign', name: 'SIGN', inspected: 0, faults: 0, dpu: 0 }
    ],
    totalInspections: 0,
    totalFaults: 0,
    totalDpu: 0
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
      totalInspections: 0,
      totalFaults: 0,
      totalDpu: 0
    };
  });
};
