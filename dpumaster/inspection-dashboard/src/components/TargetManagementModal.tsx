'use client';

import React, { useState, useEffect } from 'react';
import { X, Target, TrendingDown, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { InspectionData, YearTarget, StageTarget } from '@/types';
import { 
  calculateProportionalTargets, 
  calculateWeightedTargets, 
  calculateHybridTargets,
  calculateReductionPercentage,
  getPerformanceTier
} from '@/utils/targetCalculations';
import { formatDPU, formatNumber } from '@/utils/dataUtils';

interface TargetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: InspectionData[];
}

const TargetManagementModal: React.FC<TargetManagementModalProps> = ({ 
  isOpen, 
  onClose,
  currentData
}) => {
  const [year, setYear] = useState(2025);
  const [combinedTarget, setCombinedTarget] = useState(10.0);
  const [productionTarget, setProductionTarget] = useState(8.2);
  const [dpdiTarget, setDpdiTarget] = useState(1.8);
  const [allocationStrategy, setAllocationStrategy] = useState<'proportional' | 'weighted' | 'hybrid'>('proportional');
  const [baselineMonth, setBaselineMonth] = useState('Sep-25');
  const [previewTargets, setPreviewTargets] = useState<StageTarget[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Calculate YTD averages
  const calculateYTDAverage = (targetYear: number) => {
    const yearData = currentData.filter(m => m.year === targetYear && m.combinedTotalDpu > 0);
    if (yearData.length === 0) return { combined: 0, production: 0, dpdi: 0 };
    
    return {
      combined: yearData.reduce((sum, m) => sum + m.combinedTotalDpu, 0) / yearData.length,
      production: yearData.reduce((sum, m) => sum + m.productionTotalDpu, 0) / yearData.length,
      dpdi: yearData.reduce((sum, m) => sum + m.dpdiTotalDpu, 0) / yearData.length
    };
  };

  // Get latest month with data as default baseline
  useEffect(() => {
    if (currentData && currentData.length > 0) {
      const latestMonth = currentData.filter(m => m.combinedTotalDpu > 0).pop();
      if (latestMonth) {
        setBaselineMonth(latestMonth.date);
      }
    }
  }, [currentData]);

  // Calculate preview targets when inputs change
  const handleCalculatePreview = () => {
    const baseline = currentData.find(m => m.date === baselineMonth);
    if (!baseline) {
      alert('Baseline month not found');
      return;
    }

    let calculatedTargets: StageTarget[];
    
    switch (allocationStrategy) {
      case 'weighted':
        calculatedTargets = calculateWeightedTargets(baseline, combinedTarget);
        break;
      case 'hybrid':
        calculatedTargets = calculateHybridTargets(baseline, combinedTarget);
        break;
      case 'proportional':
      default:
        calculatedTargets = calculateProportionalTargets(baseline, combinedTarget, 'combined');
    }

    setPreviewTargets(calculatedTargets);
  };

  // Auto-calculate on mount and when strategy changes
  useEffect(() => {
    if (currentData && currentData.length > 0) {
      handleCalculatePreview();
    }
  }, [allocationStrategy, baselineMonth, combinedTarget]);

  // Save targets to database
  const handleSaveTargets = async () => {
    const baseline = currentData.find(m => m.date === baselineMonth);
    if (!baseline) {
      setSaveMessage({ type: 'error', message: 'Baseline month not found' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const targetData: YearTarget = {
        year,
        combinedTarget,
        productionTarget,
        dpdiTarget,
        allocationStrategy,
        stageTargets: previewTargets,
        baseline: {
          month: baselineMonth,
          combinedDpu: baseline.combinedTotalDpu,
          productionDpu: baseline.productionTotalDpu,
          dpdiDpu: baseline.dpdiTotalDpu
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetData)
      });

      const result = await response.json();

      if (result.success) {
        setSaveMessage({ type: 'success', message: `✅ Targets for ${year} saved successfully!` });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSaveMessage({ type: 'error', message: `❌ Error: ${result.error}` });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: `❌ Failed to save targets: ${error}` });
    } finally {
      setIsSaving(false);
    }
  };

  // Update stage target manually
  const handleManualTargetChange = (stageName: string, newTarget: number) => {
    setPreviewTargets(prev => 
      prev.map(t => 
        t.stageName === stageName 
          ? { ...t, targetDpu: newTarget, isManual: true }
          : t
      )
    );
  };

  if (!isOpen) return null;

  const baseline = currentData.find(m => m.date === baselineMonth);
  const reductionPercent = baseline ? calculateReductionPercentage(baseline.combinedTotalDpu, combinedTarget) : 0;
  const ytdAverages = calculateYTDAverage(year);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/30 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative p-6 border-b border-yellow-600/30">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <Target className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Target Management</h2>
                <p className="text-sm text-gray-400">Set DPU targets for future years with smart allocation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Configuration Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column - Inputs */}
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4">Target Configuration</h3>
                
                {/* Year Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:border-yellow-500 focus:outline-none"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                  </select>
                </div>

                {/* Baseline Month */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Baseline Month</label>
                  <select
                    value={baselineMonth}
                    onChange={(e) => setBaselineMonth(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:border-yellow-500 focus:outline-none"
                  >
                    {currentData.filter(m => m.combinedTotalDpu > 0).map(month => (
                      <option key={month.id} value={month.date}>{month.date}</option>
                    ))}
                  </select>
                  {baseline && (
                    <p className="text-xs text-gray-400 mt-1">
                      Current: {formatDPU(baseline.combinedTotalDpu)} Combined DPU
                    </p>
                  )}
                </div>

                {/* Combined Target */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Combined Target DPU</label>
                  <input
                    type="number"
                    step="0.1"
                    value={combinedTarget}
                    onChange={(e) => setCombinedTarget(parseFloat(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  {baseline && (
                    <p className="text-xs text-gray-400 mt-1">
                      Current month: {formatDPU(baseline.combinedTotalDpu)} Combined DPU / YTD Avg: {formatDPU(ytdAverages.combined)} DPU
                    </p>
                  )}
                </div>

                {/* Production Target */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Production Target DPU</label>
                  <input
                    type="number"
                    step="0.1"
                    value={productionTarget}
                    onChange={(e) => setProductionTarget(parseFloat(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  {baseline && (
                    <p className="text-xs text-gray-400 mt-1">
                      Current month: {formatDPU(baseline.productionTotalDpu)} Production DPU / YTD Avg: {formatDPU(ytdAverages.production)} DPU
                    </p>
                  )}
                </div>

                {/* DPDI Target */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">DPDI Target DPU</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dpdiTarget}
                    onChange={(e) => setDpdiTarget(parseFloat(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  {baseline && baseline.dpdiTotalDpu > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Current month: {formatDPU(baseline.dpdiTotalDpu)} DPDI DPU / YTD Avg: {formatDPU(ytdAverages.dpdi)} DPU
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Allocation Strategy */}
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4">Allocation Strategy</h3>
                
                <div className="space-y-3">
                  {/* Proportional */}
                  <label className={`relative flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    allocationStrategy === 'proportional' 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="strategy"
                      value="proportional"
                      checked={allocationStrategy === 'proportional'}
                      onChange={(e) => setAllocationStrategy(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">Proportional (Recommended)</div>
                        <button
                          type="button"
                          onMouseEnter={() => setShowTooltip('proportional')}
                          onMouseLeave={() => setShowTooltip(null)}
                          className="ml-2 text-gray-400 hover:text-yellow-400 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Each stage's target proportional to its current DPU contribution
                      </div>
                      {showTooltip === 'proportional' && (
                        <div className="absolute z-10 left-0 right-0 mt-2 p-3 bg-gray-900 border border-yellow-500/50 rounded-lg shadow-xl text-xs text-gray-300">
                          <div className="font-bold text-yellow-400 mb-1">Proportional Allocation Formula:</div>
                          <div className="mb-2">Stage Target = (Stage DPU / Total DPU) × Overall Target</div>
                          <div className="text-gray-400">
                            <strong>Example:</strong> If DPDI is 10.10 DPU out of 22.86 total (44%), and target is 10.0, 
                            then DPDI target = 4.42 DPU. All stages maintain their relative performance contribution.
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Weighted */}
                  <label className={`relative flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    allocationStrategy === 'weighted' 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="strategy"
                      value="weighted"
                      checked={allocationStrategy === 'weighted'}
                      onChange={(e) => setAllocationStrategy(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">Fault-Weighted</div>
                        <button
                          type="button"
                          onMouseEnter={() => setShowTooltip('weighted')}
                          onMouseLeave={() => setShowTooltip(null)}
                          className="ml-2 text-gray-400 hover:text-yellow-400 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Higher targets for stages with more faults
                      </div>
                      {showTooltip === 'weighted' && (
                        <div className="absolute z-10 left-0 right-0 mt-2 p-3 bg-gray-900 border border-yellow-500/50 rounded-lg shadow-xl text-xs text-gray-300">
                          <div className="font-bold text-yellow-400 mb-1">Fault-Weighted Allocation:</div>
                          <div className="mb-2">Stage Target = (Stage Faults / Total Faults) × Target × Volume Adjustment</div>
                          <div className="text-gray-400">
                            <strong>Best for:</strong> Focusing reduction efforts on stages contributing most faults. 
                            Stages with higher fault counts get proportionally higher reduction targets.
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Hybrid */}
                  <label className={`relative flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    allocationStrategy === 'hybrid' 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="strategy"
                      value="hybrid"
                      checked={allocationStrategy === 'hybrid'}
                      onChange={(e) => setAllocationStrategy(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">Hybrid</div>
                        <button
                          type="button"
                          onMouseEnter={() => setShowTooltip('hybrid')}
                          onMouseLeave={() => setShowTooltip(null)}
                          className="ml-2 text-gray-400 hover:text-yellow-400 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Performance tier-based with proportional adjustment
                      </div>
                      {showTooltip === 'hybrid' && (
                        <div className="absolute z-10 left-0 right-0 mt-2 p-3 bg-gray-900 border border-yellow-500/50 rounded-lg shadow-xl text-xs text-gray-300">
                          <div className="font-bold text-yellow-400 mb-1">Hybrid Tier-Based Allocation:</div>
                          <div className="mb-2">
                            • Excellent (&lt;0.5 DPU): 20% reduction<br/>
                            • Good (0.5-1.0): 40% reduction<br/>
                            • Needs Improvement (1.0-2.0): 50% reduction<br/>
                            • Critical (&gt;2.0): 60% reduction
                          </div>
                          <div className="text-gray-400">
                            <strong>Best for:</strong> Balanced approach rewarding good performers while pushing critical areas harder.
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Summary Card */}
                {baseline && (
                  <div className="mt-4 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Required Reduction</span>
                      <span className="text-lg font-bold text-yellow-400">
                        <TrendingDown className="w-4 h-4 inline" /> {reductionPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      From {formatDPU(baseline.combinedTotalDpu)} to {formatDPU(combinedTarget)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stage Targets Preview */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Stage-Specific Targets Preview</h3>
              <button
                onClick={handleCalculatePreview}
                className="px-4 py-2 bg-yellow-600 text-black font-bold rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                Recalculate
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left text-gray-400 font-medium p-2">Stage</th>
                    <th className="text-right text-gray-400 font-medium p-2">Current DPU</th>
                    <th className="text-right text-gray-400 font-medium p-2">Target DPU</th>
                    <th className="text-right text-gray-400 font-medium p-2">Reduction</th>
                    <th className="text-center text-gray-400 font-medium p-2">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {previewTargets.map((target, idx) => {
                    const currentStage = baseline?.stages.find(s => s.name === target.stageName);
                    if (!currentStage || currentStage.inspected === 0) return null;
                    
                    const reduction = calculateReductionPercentage(currentStage.dpu, target.targetDpu);
                    const tier = getPerformanceTier(currentStage.dpu);
                    
                    return (
                      <tr key={target.stageName} className={`${idx % 2 === 0 ? 'bg-gray-900/30' : ''} hover:bg-gray-800/50`}>
                        <td className="p-2 text-white font-medium">{target.stageName}</td>
                        <td className="p-2 text-right text-gray-300">{formatDPU(currentStage.dpu)}</td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={target.targetDpu}
                            onChange={(e) => handleManualTargetChange(target.stageName, parseFloat(e.target.value))}
                            className="w-20 bg-gray-900 border border-gray-700 text-white px-2 py-1 rounded text-right focus:border-yellow-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-right text-green-400 font-bold">
                          -{reduction.toFixed(1)}%
                        </td>
                        <td className="p-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            tier.color === 'green' ? 'bg-green-600/20 text-green-400' :
                            tier.color === 'blue' ? 'bg-blue-600/20 text-blue-400' :
                            tier.color === 'yellow' ? 'bg-yellow-600/20 text-yellow-400' :
                            'bg-red-600/20 text-red-400'
                          }`}>
                            {tier.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
              saveMessage.type === 'success' 
                ? 'bg-green-600/20 border border-green-600/30 text-green-400'
                : 'bg-red-600/20 border border-red-600/30 text-red-400'
            }`}>
              {saveMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{saveMessage.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-yellow-600/30 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTargets}
            disabled={isSaving}
            className={`px-6 py-2 font-bold rounded-lg transition-colors flex items-center space-x-2 ${
              isSaving
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-yellow-600 text-black hover:bg-yellow-700'
            }`}
          >
            {isSaving && <div className="animate-spin">⏳</div>}
            <span>{isSaving ? 'Saving...' : 'Save Targets'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetManagementModal;

