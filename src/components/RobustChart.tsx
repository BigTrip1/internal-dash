'use client';

import React from 'react';
import { 
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { InspectionData } from '@/types';
import { formatNumber, formatDPU } from '@/utils/dataUtils';

interface RobustChartProps {
  data: InspectionData[];
  selectedStage: string;
}

interface ChartDataPoint {
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

const RobustChart: React.FC<RobustChartProps> = ({ data, selectedStage }) => {
  
  // Prepare clean chart data
  const prepareChartData = (): ChartDataPoint[] => {
    const allMonths = [
      'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
      'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'
    ];

    const currentMonth = new Date().getMonth(); // 0-11
    
    // Get valid data records
    const validData = data.filter(month => 
      month && 
      month.date && 
      month.totalDpu !== undefined &&
      month.totalDpu !== null
    );

    // Calculate target trajectory
    const latestValidMonth = validData[validData.length - 1];
    const currentDPU = latestValidMonth?.totalDpu || 12.87;
    const targetDPU = 8.2;
    const monthsToTarget = Math.max(12 - currentMonth - 1, 1);
    const monthlyReduction = (currentDPU - targetDPU) / monthsToTarget;

    return allMonths.map((monthName, index) => {
      const monthRecord = validData.find(m => m.date === monthName);
      const isHistorical = index <= currentMonth;
      const isFuture = !isHistorical;
      
      // Calculate target trajectory for this month
      const monthsFromCurrent = index - currentMonth;
      const targetTrajectory = currentDPU - (monthlyReduction * monthsFromCurrent);
      const clampedTarget = Math.max(targetTrajectory, targetDPU);
      
      if (monthRecord && isHistorical) {
        // Historical month with actual data
        let dpuValue, volumeValue, faultsValue, inspectedValue, variance;
        
        if (selectedStage === 'All Stages') {
          dpuValue = monthRecord.totalDpu;
          volumeValue = monthRecord.stages?.find(s => s.name === 'SIGN')?.inspected || 0;
          faultsValue = monthRecord.totalFaults;
          inspectedValue = monthRecord.totalInspections;
        } else {
          const stageData = monthRecord.stages?.find(s => s.name === selectedStage);
          dpuValue = stageData?.dpu || 0;
          volumeValue = stageData?.inspected || 0;
          faultsValue = stageData?.faults || 0;
          inspectedValue = stageData?.inspected || 0;
        }
        
        variance = dpuValue - clampedTarget;
        
        return {
          month: monthName,
          totalDpu: dpuValue,
          buildVolume: volumeValue,
          totalFaults: faultsValue,
          totalInspections: inspectedValue,
          targetTrajectory: clampedTarget,
          isAboveTarget: variance > 0,
          isFuture: false,
          variance: variance
        };
      } else {
        // Future month
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
  };

  const chartData = prepareChartData();

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const monthData = payload[0].payload as ChartDataPoint;
    const monthRecord = data.find(m => m && m.date === label);
    
    if (!monthRecord && !monthData.isFuture) return null;

    return (
      <div style={{
        backgroundColor: '#2D2D2D',
        border: '1px solid #404040',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header with admin table data */}
        <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #404040', paddingBottom: '4px' }}>
          {monthData.isFuture ? (
            `${label} - Future Target`
          ) : selectedStage === 'All Stages' ? (
            `${label} - Total Faults: ${formatNumber(monthData.totalFaults || 0)} | Total Inspections: ${formatNumber(monthData.totalInspections || 0)}`
          ) : (
            `${label} - ${selectedStage} Faults: ${formatNumber(monthData.totalFaults || 0)} | ${selectedStage} Inspected: ${formatNumber(monthData.totalInspections || 0)}`
          )}
        </div>
        
        {/* Data lines */}
        <div style={{ fontSize: '14px' }}>
          {payload.map((entry: any) => {
            const { name, value, color } = entry;
            
            if (name === 'totalDpu' || name === 'stageDpu') {
              return (
                <div key={name} style={{ color, marginBottom: '4px' }}>
                  {`${label} DPU: ${formatDPU(value)}`}
                </div>
              );
            } else if (name === 'buildVolume') {
              return (
                <div key={name} style={{ color, marginBottom: '4px' }}>
                  {selectedStage === 'All Stages' ? 'Build Volume' : `${selectedStage} Inspected`}: {formatNumber(value)}
                </div>
              );
            } else if (name === 'targetTrajectory') {
              const trendStatus = monthData.isFuture ? 'Future Target 🎯' : monthData.isAboveTarget ? 'Off Track 🔴' : 'On Track 🟢';
              return (
                <div key={name} style={{ color, marginBottom: '4px' }}>
                  Target Trajectory: {formatDPU(value)}
                </div>
              );
            }
            return null;
          })}
          
          {/* Trend deviation */}
          {!monthData.isFuture && (
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '4px', 
              borderTop: '1px solid #404040',
              color: monthData.isAboveTarget ? '#EF4444' : '#10B981',
              fontWeight: 'bold'
            }}>
              Trend Deviation: {formatDPU(Math.abs(monthData.variance))} ({monthData.isAboveTarget ? 'Off Track 🔴' : 'On Track 🟢'})
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ComposedChart data={chartData}>
        <defs>
          <linearGradient id="dynamicTrendlineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {chartData.map((item, index) => {
              const position = (index / (chartData.length - 1)) * 100;
              let color;
              
              if (item.isFuture) {
                color = '#3B82F6'; // Blue for future targets
              } else {
                color = item.isAboveTarget ? '#EF4444' : '#10B981'; // Red/Green for historical performance
              }
              
              return (
                <stop key={`gradient-${index}`} offset={`${position}%`} stopColor={color} />
              );
            })}
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
        
        <XAxis 
          dataKey="month" 
          stroke="#FFFFFF" 
          tick={{ fontSize: 12 }}
        />
        
        <YAxis 
          yAxisId="dpu" 
          stroke="#FFFFFF" 
          label={{ 
            value: selectedStage === 'All Stages' ? 'Total DPU' : `${selectedStage} DPU`, 
            angle: -90, 
            position: 'insideLeft' 
          }} 
        />
        
        <YAxis 
          yAxisId="volume" 
          orientation="right" 
          stroke="#FFFFFF" 
          domain={[0, 2200]} 
          label={{ 
            value: selectedStage === 'All Stages' ? 'Build Volume' : `${selectedStage} Inspected`, 
            angle: 90, 
            position: 'insideRight' 
          }} 
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        
        {/* DPU Bars - Only for months with actual data */}
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
            formatter: (value: number) => value ? formatDPU(value) : ''
          }}
        />
        
        {/* Build Volume Line - Only for months with actual data */}
        <Line 
          yAxisId="volume"
          type="monotone" 
          dataKey="buildVolume" 
          stroke="#3B82F6" 
          strokeWidth={4}
          dot={(props: any) => {
            const { cx, cy, payload, index } = props;
            if (!payload.buildVolume || payload.isFuture) return null;
            return (
              <circle 
                key={`build-volume-dot-${index}`} 
                cx={cx} 
                cy={cy} 
                fill="#3B82F6" 
                strokeWidth={2} 
                r={5} 
              />
            );
          }}
          connectNulls={false}
          name={selectedStage === 'All Stages' ? 'Build Volume' : `${selectedStage} Inspected`}
          label={{ 
            position: 'top', 
            fill: '#FFFFFF', 
            fontSize: 10,
            fontWeight: 'bold',
            offset: 25,
            formatter: (value: number) => value ? formatNumber(value) : ''
          }}
        />
        
        {/* Dynamic Target Trajectory - Complete line from Jan to Dec ending at 8.2 */}
        <Line 
          yAxisId="dpu"
          type="monotone" 
          dataKey="targetTrajectory" 
          stroke="url(#dynamicTrendlineGradient)"
          strokeWidth={3}
          strokeDasharray="8 4"
          dot={(props: any) => {
            const { cx, cy, payload, index } = props;
            
            if (payload.isFuture) {
              // Future months - blue target dots
              return (
                <circle 
                  key={`future-target-${index}`}
                  cx={cx} 
                  cy={cy} 
                  r={5} 
                  fill="#3B82F6"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              );
            } else {
              // Historical months - performance-based colors
              return (
                <circle 
                  key={`historical-target-${index}`}
                  cx={cx} 
                  cy={cy} 
                  r={4} 
                  fill={payload.isAboveTarget ? '#EF4444' : '#10B981'}
                  stroke={payload.isAboveTarget ? '#EF4444' : '#10B981'}
                  strokeWidth={2}
                />
              );
            }
          }}
          name="Target Trajectory"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default RobustChart;
