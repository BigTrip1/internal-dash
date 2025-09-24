'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { InspectionStage } from '@/types';
import { formatNumber, formatDPU } from '@/utils/dataUtils';
import { Plus, Trash2, Save, X, Download } from 'lucide-react';
import MonthlyReportGenerator from './MonthlyReportGenerator';

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  type: 'inspected' | 'faults';
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onChange, type }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSave = () => {
    const numValue = parseInt(tempValue) || 0;
    onChange(numValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="jcb-input w-full text-sm"
        autoFocus
        min="0"
      />
    );
  }

  return (
    <div
      className="px-2 py-1 text-sm cursor-pointer hover:bg-orange-600 hover:text-white rounded transition-colors"
      onClick={() => setIsEditing(true)}
    >
      {formatNumber(value)}
    </div>
  );
};

interface AddStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stageName: string) => boolean;
}

const AddStageModal: React.FC<AddStageModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [stageName, setStageName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onAdd(stageName);
    if (success) {
      setStageName('');
      setError('');
      onClose();
    } else {
      setError('Invalid stage name or stage already exists');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="jcb-card w-96">
        <h3 className="text-lg font-semibold mb-4 text-white">Add New Inspection Stage</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stage Name
            </label>
            <input
              type="text"
              value={stageName}
              onChange={(e) => setStageName(e.target.value.toUpperCase())}
              className="jcb-input w-full"
              placeholder="e.g., SIP7, UV4"
              required
            />
            {error && (
              <p className="text-red-400 text-sm mt-1">{error}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="jcb-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="jcb-button"
            >
              Add Stage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminTable: React.FC = () => {
  const { data, loading, error, updateData, addStage, removeStage, getStageNames } = useData();
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const stageNames = getStageNames();

  const handleCellUpdate = async (monthId: string, stageId: string, type: 'inspected' | 'faults', value: number) => {
    try {
      setLocalError(null);
      if (type === 'inspected') {
        await updateData(monthId, stageId, value);
      } else {
        await updateData(monthId, stageId, undefined, value);
      }
    } catch (error) {
      setLocalError('Failed to update data. Please try again.');
      console.error('Error updating cell:', error);
    }
  };

  const handleAddStage = async (stageName: string) => {
    try {
      setLocalError(null);
      return await addStage(stageName);
    } catch (error) {
      setLocalError('Failed to add stage. Please try again.');
      console.error('Error adding stage:', error);
      return false;
    }
  };

  const handleRemoveStage = async (stageId: string) => {
    if (confirm('Are you sure you want to remove this stage? This action cannot be undone.')) {
      try {
        setLocalError(null);
        await removeStage(stageId);
      } catch (error) {
        setLocalError('Failed to remove stage. Please try again.');
        console.error('Error removing stage:', error);
      }
    }
  };

  const handleDownloadData = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Create comprehensive data export for AI analysis
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalMonths: data.length,
        totalStages: stageNames.length,
        stages: stageNames,
        description: "JCB Quality Inspection Data - Complete dataset for AI analysis"
      },
      summary: {
        totalInspections: data.reduce((sum, month) => sum + month.totalInspections, 0),
        totalFaults: data.reduce((sum, month) => sum + month.totalFaults, 0),
        averageDPU: data.reduce((sum, month) => sum + month.totalDpu, 0) / data.length,
        dateRange: data.length > 0 ? `${data[0].date} to ${data[data.length - 1].date}` : 'No data'
      },
      monthlyData: data.map(month => ({
        month: month.date,
        totalInspections: month.totalInspections,
        totalFaults: month.totalFaults,
        totalDPU: month.totalDpu,
        stages: month.stages.map(stage => ({
          stageName: stage.name,
          inspected: stage.inspected,
          faults: stage.faults,
          dpu: stage.dpu
        }))
      })),
      stageAnalysis: stageNames.map(stageName => {
        const stageData = data.flatMap(month => 
          month.stages.filter(stage => stage.name === stageName)
        );
        const totalInspected = stageData.reduce((sum, stage) => sum + stage.inspected, 0);
        const totalFaults = stageData.reduce((sum, stage) => sum + stage.faults, 0);
        const avgDPU = stageData.reduce((sum, stage) => sum + stage.dpu, 0) / stageData.length;
        
        return {
          stageName,
          totalInspected,
          totalFaults,
          averageDPU: avgDPU,
          monthsWithData: stageData.length
        };
      })
    };

    // Download JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const jsonBlob = new Blob([jsonString], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `jcb-quality-data-${timestamp}.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    // Create CSV data
    const csvRows = [];
    
    // Add metadata section
    csvRows.push('METADATA');
    csvRows.push('Export Date,' + new Date().toISOString());
    csvRows.push('Total Months,' + data.length);
    csvRows.push('Total Stages,' + stageNames.length);
    csvRows.push('Stages,' + stageNames.join(';'));
    csvRows.push('');
    
    // Add summary section
    csvRows.push('SUMMARY');
    csvRows.push('Metric,Value');
    csvRows.push('Total Inspections,' + exportData.summary.totalInspections);
    csvRows.push('Total Faults,' + exportData.summary.totalFaults);
    csvRows.push('Average DPU,' + exportData.summary.averageDPU.toFixed(2));
    csvRows.push('Date Range,' + exportData.summary.dateRange);
    csvRows.push('');
    
    // Add monthly data section
    csvRows.push('MONTHLY DATA');
    csvRows.push('Month,Total Inspections,Total Faults,Total DPU');
    exportData.monthlyData.forEach(month => {
      csvRows.push(`${month.month},${month.totalInspections},${month.totalFaults},${month.totalDPU.toFixed(2)}`);
    });
    csvRows.push('');
    
    // Add detailed stage data section
    csvRows.push('DETAILED STAGE DATA');
    const stageHeaders = ['Month', ...stageNames.map(stage => `${stage} Inspected,${stage} Faults,${stage} DPU`), 'Total Inspected,Total Faults,Total DPU'];
    csvRows.push(stageHeaders.join(','));
    
    data.forEach(month => {
      const row = [month.date];
      stageNames.forEach(stageName => {
        const stage = month.stages.find(s => s.name === stageName);
        if (stage) {
          row.push(`${stage.inspected},${stage.faults},${stage.dpu.toFixed(2)}`);
        } else {
          row.push('0,0,0.00');
        }
      });
      row.push(`${month.totalInspections},${month.totalFaults},${month.totalDpu.toFixed(2)}`);
      csvRows.push(row.join(','));
    });
    csvRows.push('');
    
    // Add stage analysis section
    csvRows.push('STAGE ANALYSIS');
    csvRows.push('Stage Name,Total Inspected,Total Faults,Average DPU,Months with Data');
    exportData.stageAnalysis.forEach(stage => {
      csvRows.push(`${stage.stageName},${stage.totalInspected},${stage.totalFaults},${stage.averageDPU.toFixed(2)},${stage.monthsWithData}`);
    });

    // Download CSV file
    const csvString = csvRows.join('\n');
    const csvBlob = new Blob([csvString], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = `jcb-quality-data-${timestamp}.csv`;
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
    URL.revokeObjectURL(csvUrl);
  };

  const getStageId = (stageName: string): string => {
    return stageName.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const getStageData = (monthId: string, stageName: string): InspectionStage | undefined => {
    const month = data.find(m => m.id === monthId);
    return month?.stages.find(s => s.name === stageName);
  };

  return (
    <div className="max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Panel - Inspection Data</h1>
        <div className="flex items-center space-x-4">
          {loading && (
            <div className="text-orange-400 text-sm">
              <span className="animate-spin">⏳</span> Saving...
            </div>
          )}
          <button
            onClick={handleDownloadData}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Data</span>
          </button>
          <a
            href="/seed"
            className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Seed Database</span>
          </a>
          <button
            onClick={() => setIsAddStageModalOpen(true)}
            className="jcb-button"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            Add Stage
          </button>
        </div>
      </div>

      {(error || localError) && (
        <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded-md">
          <p className="text-red-200 text-sm">
            {error || localError}
          </p>
        </div>
      )}

      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/30 rounded-xl shadow-2xl">
        {/* JCB Industrial Header Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"></div>
        
        <div className="relative p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full mr-3"></div>
            Inspection Data Management
          </h3>
          <div className="overflow-x-auto">
          <table className="jcb-table min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border-b border-yellow-600/30">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4 sticky left-0 z-10 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20">
                  Date
                </th>
                         {stageNames.map((stageName, index) => (
                           <th key={stageName} className={`text-center text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4 min-w-[240px] ${index > 0 ? 'border-l-2 border-yellow-600/40' : ''}`}>
                             <div className="flex items-center justify-between mb-3">
                               <span className="flex-1 text-yellow-400 font-bold text-sm">{stageName}</span>
                               <button
                                 onClick={() => handleRemoveStage(getStageId(stageName))}
                                 className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded transition-colors duration-200"
                                 title="Remove stage"
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                             </div>
                             <div className="grid grid-cols-3 gap-1 text-xs">
                               <div className="text-center font-bold text-yellow-300 bg-yellow-600/10 py-1 px-1 rounded text-[10px]">Inspected</div>
                               <div className="text-center font-bold text-yellow-300 bg-yellow-600/10 py-1 px-1 rounded text-[10px]">Faults</div>
                               <div className="text-center font-bold text-yellow-300 bg-yellow-600/10 py-1 px-1 rounded text-[10px]">DPU</div>
                             </div>
                           </th>
                         ))}
                <th className="text-center text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4 min-w-[240px] border-l-2 border-yellow-600/60">
                  <div className="font-bold text-yellow-400 text-sm mb-3">TOTALS</div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">Inspected</div>
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">Faults</div>
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">DPU</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((month, index) => (
                <tr key={month.id} className={`${index % 2 === 0 ? 'bg-gray-900/50' : 'bg-black/50'} hover:bg-yellow-600/10 transition-colors duration-200 border-b border-gray-700/50`}>
                  <td className="text-sm font-medium text-white sticky left-0 z-10 py-3 px-4" style={{backgroundColor: index % 2 === 0 ? 'rgba(17, 24, 39, 0.5)' : 'rgba(0, 0, 0, 0.5)'}}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      {month.date}
                    </div>
                  </td>
                  {stageNames.map((stageName) => {
                    const stageData = getStageData(month.id, stageName);
                    if (!stageData) return null;
                    
                    return (
                      <td key={`${month.id}-${stageName}`} className={`text-center py-3 px-4 ${stageNames.indexOf(stageName) > 0 ? 'border-l border-yellow-600/20' : ''}`}>
                        <div className="grid grid-cols-3 gap-1">
                          <div>
                            <EditableCell
                              value={stageData.inspected}
                              onChange={(value) => handleCellUpdate(month.id, stageData.id, 'inspected', value)}
                              type="inspected"
                            />
                          </div>
                          <div>
                            <EditableCell
                              value={stageData.faults}
                              onChange={(value) => handleCellUpdate(month.id, stageData.id, 'faults', value)}
                              type="faults"
                            />
                          </div>
                          <div className="text-center text-sm text-gray-300 flex items-center justify-center" style={{backgroundColor: '#3A3A3A'}}>
                            {formatDPU(stageData.dpu)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center py-3 px-4 border-l border-yellow-600/30">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 rounded py-2 shadow-lg border border-yellow-400/30">
                        {formatNumber(month.totalInspections)}
                      </div>
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 rounded py-2 shadow-lg border border-yellow-400/30">
                        {formatNumber(month.totalFaults)}
                      </div>
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 rounded py-2 shadow-lg border border-yellow-400/30">
                        {formatDPU(month.totalDpu)}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <AddStageModal
        isOpen={isAddStageModalOpen}
        onClose={() => setIsAddStageModalOpen(false)}
        onAdd={handleAddStage}
      />
      
      {/* Monthly Report Generator */}
      <div className="mt-8">
        <MonthlyReportGenerator />
      </div>
    </div>
  );
};

export default AdminTable;
