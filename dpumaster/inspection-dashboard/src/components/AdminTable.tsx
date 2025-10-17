'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { InspectionStage } from '@/types';
import { formatNumber, formatDPU } from '@/utils/dataUtils';
import { Plus, Trash2, Save, X, Download, Lock, Unlock, Upload, CheckCircle, AlertTriangle, Target } from 'lucide-react';
import TargetManagementModal from './TargetManagementModal';

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  type: 'inspected' | 'faults';
  isLocked?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onChange, type, isLocked = false }) => {
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
      className={`px-2 py-1 text-sm rounded transition-colors ${
        isLocked 
          ? 'cursor-not-allowed opacity-70 bg-gray-800' 
          : 'cursor-pointer hover:bg-orange-600 hover:text-white'
      }`}
      onClick={() => {
        if (isLocked) {
          alert('Table is locked. Please unlock to edit data.');
        } else {
          setIsEditing(true);
        }
      }}
    >
      {formatNumber(value)}
      {isLocked && <Lock className="w-3 h-3 inline ml-1 opacity-50" />}
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
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Lock system state
  const [isLocked, setIsLocked] = useState(true); // Default to locked for safety

  // CSV Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadSummary, setShowUploadSummary] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<{
    success: boolean;
    monthsProcessed: number;
    monthsUpdated: string[];
    newStagesAdded: string[];
    errors: string[];
    warnings: string[];
  } | null>(null);

  // Protected core stages that cannot be deleted
  const PROTECTED_STAGES = [
    'UV2', 'CABWT', 'SIP6', 'CFC', 'CABSIP', 'UV3', 'SIGN',
    'SIP1', 'SIP2', 'SIP3', 'SIP4', 'SIP5', 'SIP7', 'SIP8',
    'LECREC', 'CT', 'CABIP', 'CABWT2', 'UV4', 'FINAL'
  ];

  const stageNames = getStageNames();

  // Lock system functions
  const handleLockToggle = () => {
    setIsLocked(!isLocked);
  };

  // CSV Upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setLocalError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setLocalError(result.error || 'Failed to upload CSV file');
        if (result.errors && result.errors.length > 0) {
          setLocalError(result.errors.join(', '));
        }
        setIsUploading(false);
        return;
      }

      // Show summary modal
      setUploadSummary(result);
      setShowUploadSummary(true);
      setIsUploading(false);

    } catch (error) {
      console.error('Error uploading CSV:', error);
      setLocalError('Failed to upload CSV file. Please try again.');
      setIsUploading(false);
    }

    // Reset file input
    event.target.value = '';
  };

  // Modified functions to check lock status
  const handleCellUpdate = async (monthId: string, stageId: string, type: 'inspected' | 'faults', value: number) => {
    if (isLocked) {
      alert('Table is locked. Please unlock to make changes.');
      return;
    }
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
    if (isLocked) {
      alert('Table is locked. Please unlock to add stages.');
      return false;
    }
    try {
      setLocalError(null);
      return await addStage(stageName);
    } catch (error) {
      setLocalError('Failed to add stage. Please try again.');
      console.error('Error adding stage:', error);
      return false;
    }
  };

  // Wrapper function for the modal
  const handleAddStageSync = (stageName: string): boolean => {
    handleAddStage(stageName);
    return true; // Return true to close modal, actual result handled in async function
  };

  const handleRemoveStage = async (stageId: string) => {
    if (isLocked) {
      alert('Table is locked. Please unlock to remove stages.');
      return;
    }

    // Get the stage name from the stageId
    const stageName = stageId.replace(/-\d+$/, '').toUpperCase();
    
    // Check if this is a protected stage
    if (PROTECTED_STAGES.includes(stageName)) {
      const confirmed = confirm(
        `⚠️ WARNING: "${stageName}" is a PROTECTED CORE STAGE!\n\n` +
        `Removing this stage may break the production tracking system.\n\n` +
        `Are you absolutely sure you want to remove this critical stage?\n\n` +
        `This action cannot be undone and may require database restoration.`
      );
      
      if (!confirmed) return;
      
      // Double confirmation for protected stages
      const doubleConfirmed = confirm(
        `🚨 FINAL WARNING: You are about to delete a PROTECTED STAGE!\n\n` +
        `Stage: ${stageName}\n` +
        `This will affect all historical data and may break reports.\n\n` +
        `Type "DELETE" in the next prompt to confirm this destructive action.`
      );
      
      if (!doubleConfirmed) return;
      
      const deleteConfirmation = prompt(
        `Type "DELETE" to permanently remove the protected stage "${stageName}":`
      );
      
      if (deleteConfirmation !== 'DELETE') {
        alert('Protected stage deletion cancelled.');
        return;
      }
    } else {
      // Regular confirmation for non-protected stages
      if (!confirm('Are you sure you want to remove this stage? This action cannot be undone.')) {
        return;
      }
    }

    try {
      setLocalError(null);
      await removeStage(stageId);
    } catch (error) {
      setLocalError('Failed to remove stage. Please try again.');
      console.error('Error removing stage:', error);
    }
  };

  const handleDownloadJSON = () => {
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
        productionTotalInspections: data.reduce((sum, month) => sum + month.productionTotalInspections, 0),
        productionTotalFaults: data.reduce((sum, month) => sum + month.productionTotalFaults, 0),
        dpdiTotalInspections: data.reduce((sum, month) => sum + month.dpdiTotalInspections, 0),
        dpdiTotalFaults: data.reduce((sum, month) => sum + month.dpdiTotalFaults, 0),
        combinedTotalInspections: data.reduce((sum, month) => sum + month.combinedTotalInspections, 0),
        combinedTotalFaults: data.reduce((sum, month) => sum + month.combinedTotalFaults, 0),
        averageDPU: data.reduce((sum, month) => sum + month.combinedTotalDpu, 0) / data.length,
        dateRange: data.length > 0 ? `${data[0].date} to ${data[data.length - 1].date}` : 'No data'
      },
      monthlyData: data.map(month => ({
        month: month.date,
        productionTotalInspections: month.productionTotalInspections,
        productionTotalFaults: month.productionTotalFaults,
        productionTotalDPU: month.productionTotalDpu,
        dpdiTotalInspections: month.dpdiTotalInspections,
        dpdiTotalFaults: month.dpdiTotalFaults,
        dpdiTotalDPU: month.dpdiTotalDpu,
        combinedTotalInspections: month.combinedTotalInspections,
        combinedTotalFaults: month.combinedTotalFaults,
        combinedTotalDPU: month.combinedTotalDpu,
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
    csvRows.push('Production Total Inspections,' + exportData.summary.productionTotalInspections);
    csvRows.push('Production Total Faults,' + exportData.summary.productionTotalFaults);
    csvRows.push('DPDI Total Inspections,' + exportData.summary.dpdiTotalInspections);
    csvRows.push('DPDI Total Faults,' + exportData.summary.dpdiTotalFaults);
    csvRows.push('Combined Total Inspections,' + exportData.summary.combinedTotalInspections);
    csvRows.push('Combined Total Faults,' + exportData.summary.combinedTotalFaults);
    csvRows.push('Average DPU,' + exportData.summary.averageDPU.toFixed(2));
    csvRows.push('Date Range,' + exportData.summary.dateRange);
    csvRows.push('');
    
    // Add monthly data section
    csvRows.push('MONTHLY DATA');
    csvRows.push('Month,Production Inspections,Production Faults,Production DPU,DPDI Inspections,DPDI Faults,DPDI DPU,Combined Inspections,Combined Faults,Combined DPU');
    exportData.monthlyData.forEach(month => {
      csvRows.push(`${month.month},${month.productionTotalInspections},${month.productionTotalFaults},${month.productionTotalDPU.toFixed(2)},${month.dpdiTotalInspections},${month.dpdiTotalFaults},${month.dpdiTotalDPU.toFixed(2)},${month.combinedTotalInspections},${month.combinedTotalFaults},${month.combinedTotalDPU.toFixed(2)}`);
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
      row.push(`${month.productionTotalInspections},${month.productionTotalFaults},${month.productionTotalDpu.toFixed(2)}`);
      row.push(`${month.dpdiTotalInspections},${month.dpdiTotalFaults},${month.dpdiTotalDpu.toFixed(2)}`);
      row.push(`${month.combinedTotalInspections},${month.combinedTotalFaults},${month.combinedTotalDpu.toFixed(2)}`);
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

  const handleDownloadCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Create CSV data in the same format as your screenshots
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
    csvRows.push('Production Total Inspections,' + data.reduce((sum, month) => sum + month.productionTotalInspections, 0));
    csvRows.push('Production Total Faults,' + data.reduce((sum, month) => sum + month.productionTotalFaults, 0));
    csvRows.push('DPDI Total Inspections,' + data.reduce((sum, month) => sum + month.dpdiTotalInspections, 0));
    csvRows.push('DPDI Total Faults,' + data.reduce((sum, month) => sum + month.dpdiTotalFaults, 0));
    csvRows.push('Combined Total Inspections,' + data.reduce((sum, month) => sum + month.combinedTotalInspections, 0));
    csvRows.push('Combined Total Faults,' + data.reduce((sum, month) => sum + month.combinedTotalFaults, 0));
    csvRows.push('Average DPU,' + (data.reduce((sum, month) => sum + month.combinedTotalDpu, 0) / data.length).toFixed(2));
    csvRows.push('Date Range,' + (data.length > 0 ? `${data[0].date} to ${data[data.length - 1].date}` : 'No data'));
    csvRows.push('');

    // Add monthly data section
    csvRows.push('MONTHLY DATA');
    csvRows.push('Month,Production Inspections,Production Faults,Production DPU,DPDI Inspections,DPDI Faults,DPDI DPU,Combined Inspections,Combined Faults,Combined DPU');
    data.forEach(month => {
      csvRows.push(`${month.date},${month.productionTotalInspections},${month.productionTotalFaults},${month.productionTotalDpu},${month.dpdiTotalInspections},${month.dpdiTotalFaults},${month.dpdiTotalDpu},${month.combinedTotalInspections},${month.combinedTotalFaults},${month.combinedTotalDpu}`);
    });
    csvRows.push('');

    // Add detailed stage data section
    csvRows.push('DETAILED STAGE DATA');
    const stageHeaders = ['Month'];
    stageNames.forEach(stageName => {
      stageHeaders.push(`${stageName} Inspected`);
      stageHeaders.push(`${stageName} Faults`);
      stageHeaders.push(`${stageName} DPU`);
    });
    csvRows.push(stageHeaders.join(','));

    data.forEach(month => {
      const row = [month.date];
      stageNames.forEach(stageName => {
        const stage = month.stages.find(s => s.name === stageName);
        row.push(String(stage?.inspected || 0));
        row.push(String(stage?.faults || 0));
        row.push(String(stage?.dpu || 0));
      });
      csvRows.push(row.join(','));
    });
    csvRows.push('');

    // Add stage analysis section
    csvRows.push('STAGE ANALYSIS');
    csvRows.push('Stage Name,Total Inspected,Total Faults,Average DPU,Months with Data');
    stageNames.forEach(stageName => {
      const stageData = data.flatMap(month => 
        month.stages.filter(stage => stage.name === stageName)
      );
      const totalInspected = stageData.reduce((sum, stage) => sum + stage.inspected, 0);
      const totalFaults = stageData.reduce((sum, stage) => sum + stage.faults, 0);
      const avgDPU = stageData.length > 0 ? stageData.reduce((sum, stage) => sum + stage.dpu, 0) / stageData.length : 0;
      const monthsWithData = stageData.length;
      
      csvRows.push(`${stageName},${totalInspected},${totalFaults},${avgDPU.toFixed(2)},${monthsWithData}`);
    });

    const csvContent = csvRows.join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = `jcb-inspection-data-${timestamp}.csv`;
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
            onClick={handleLockToggle}
            className={`px-4 py-2 font-bold rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-2 ${
              isLocked 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
          </button>
          
          {/* Target Management Button */}
          <button
            onClick={() => setIsTargetModalOpen(true)}
            className="px-4 py-2 bg-yellow-600 text-black font-bold rounded-lg shadow-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Target className="w-4 h-4" />
            <span>Set Targets</span>
          </button>

          {/* CSV Upload Button */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload-input"
              disabled={isUploading}
            />
            <label
              htmlFor="csv-upload-input"
              className={`px-4 py-2 font-bold rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-2 cursor-pointer ${
                isUploading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin">⏳</div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload CSV</span>
                </>
              )}
            </label>
          </div>
          
          <button
            onClick={handleDownloadJSON}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
                   <a
                     href="/seed"
                     className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                   >
                     <Plus className="w-4 h-4" />
                     <span>Seed Database</span>
                   </a>
                   <button
                     onClick={async () => {
                       if (!confirm('This will add missing core stages to existing data. Continue?')) return;
                       
                       try {
                         const response = await fetch('/api/add-missing-stages', { method: 'POST' });
                         const result = await response.json();
                         
                         if (result.success) {
                           alert(`✅ Success! Added ${result.details.totalStagesAdded} missing stages to ${result.details.monthsUpdated} months.`);
                           window.location.reload(); // Refresh to show updated data
                         } else {
                           alert(`❌ Error: ${result.error}`);
                         }
                       } catch (error) {
                         alert('❌ Failed to add missing stages: ' + error);
                       }
                     }}
                     className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                   >
                     <Plus className="w-4 h-4" />
                     <span>Add Missing Stages</span>
                   </button>
                   <button
                     onClick={async () => {
                       if (!confirm('This will recalculate all totals using the correct formula (Total DPU = Sum of all stage DPUs). Continue?')) return;
                       
                       try {
                         const response = await fetch('/api/recalculate-totals', { method: 'POST' });
                         const result = await response.json();
                         
                         if (result.success) {
                           alert(`✅ Success! Recalculated totals for ${result.details.monthsUpdated} months using correct DPU formula.`);
                           window.location.reload(); // Refresh to show updated data
                         } else {
                           alert(`❌ Error: ${result.error}`);
                         }
                       } catch (error) {
                         alert('❌ Failed to recalculate totals: ' + error);
                       }
                     }}
                     className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
                   >
                     <Download className="w-4 h-4" />
                     <span>Fix DPU Totals</span>
                   </button>
                   <button
                     onClick={() => {
                       const input = document.createElement('input');
                       input.type = 'file';
                       input.accept = '.json';
                       input.onchange = async (e) => {
                         const file = (e.target as HTMLInputElement).files?.[0];
                         if (!file) return;

                         try {
                           const text = await file.text();
                           const backupData = JSON.parse(text);
                           
                           // Handle both old format (array) and new format (object with metadata)
                           let actualData = backupData;
                           if (backupData.data && Array.isArray(backupData.data)) {
                             actualData = backupData.data;
                           } else if (!Array.isArray(backupData)) {
                             alert('❌ Invalid backup file format. Please select a valid backup file.');
                             return;
                           }

                           if (!confirm(
                             `⚠️ WARNING: This will REPLACE ALL existing data with the backup data!\n\n` +
                             `Backup contains ${actualData.length} months of data.\n\n` +
                             `This action cannot be undone. Are you sure you want to continue?`
                           )) return;

                           // Show loading
                           const loadingMsg = document.createElement('div');
                           loadingMsg.innerHTML = '🔄 Restoring backup data...';
                           loadingMsg.style.cssText = `
                             position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                             background: #1a1a1a; color: white; padding: 20px; border-radius: 8px;
                             z-index: 1000; border: 2px solid #FCB026;
                           `;
                           document.body.appendChild(loadingMsg);

                           const response = await fetch('/api/restore-data', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ backupData: actualData })
                           });

                           const result = await response.json();
                           document.body.removeChild(loadingMsg);

                           if (result.success) {
                             alert(`✅ Success! Restored ${result.details.monthsRestored} months of data.\n\nDate range: ${result.details.dateRange}\nTotal stages: ${result.details.totalStages}\nFormat: ${result.details.formatDetected || 'Standard'}`);
                             window.location.reload();
                           } else {
                             alert(`❌ Error: ${result.error}`);
                           }
                         } catch (error) {
                           alert('❌ Failed to restore backup: ' + error);
                         }
                       };
                       input.click();
                     }}
                     className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg shadow-lg hover:bg-orange-700 transition-colors duration-200 flex items-center space-x-2"
                   >
                     <Download className="w-4 h-4" />
                     <span>Restore JSON</span>
                   </button>
                   <button
                     onClick={() => {
                       const input = document.createElement('input');
                       input.type = 'file';
                       input.accept = '.csv';
                       input.onchange = async (e) => {
                         const file = (e.target as HTMLInputElement).files?.[0];
                         if (!file) return;

                         try {
                           const csvContent = await file.text();
                           
                           // Basic CSV validation
                           if (!csvContent.includes(',') || csvContent.split('\n').length < 2) {
                             alert('❌ Invalid CSV file format. Please select a valid CSV file.');
                             return;
                           }

                           if (!confirm(
                             `⚠️ WARNING: This will REPLACE ALL existing data with the CSV data!\n\n` +
                             `CSV file: ${file.name}\n` +
                             `This action cannot be undone. Are you sure you want to continue?`
                           )) return;

                           // Show loading
                           const loadingMsg = document.createElement('div');
                           loadingMsg.innerHTML = '🔄 Restoring CSV data...';
                           loadingMsg.style.cssText = `
                             position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                             background: #1a1a1a; color: white; padding: 20px; border-radius: 8px;
                             z-index: 1000; border: 2px solid #FCB026;
                           `;
                           document.body.appendChild(loadingMsg);

                           const response = await fetch('/api/restore-csv', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ csvContent })
                           });

                           const result = await response.json();
                           document.body.removeChild(loadingMsg);

                           if (result.success) {
                             alert(`✅ Success! Restored ${result.details.monthsRestored} months of CSV data.\n\nDate range: ${result.details.dateRange}\nTotal stages: ${result.details.totalStages}\nCSV rows: ${result.details.csvRows}`);
                             window.location.reload();
                           } else {
                             alert(`❌ Error: ${result.error}`);
                           }
                         } catch (error) {
                           alert('❌ Failed to restore CSV: ' + error);
                         }
                       };
                       input.click();
                     }}
                     className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                   >
                     <Download className="w-4 h-4" />
                     <span>Restore CSV</span>
                   </button>
          <button
            onClick={() => {
              if (isLocked) {
                alert('Table is locked. Please unlock to add stages.');
              } else {
                setIsAddStageModalOpen(true);
              }
            }}
            className={`jcb-button ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading || isLocked}
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
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full mr-3"></div>
            Inspection Data Management
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
            isLocked 
              ? 'bg-red-900/50 border border-red-600/50' 
              : 'bg-green-900/50 border border-green-600/50'
          }`}>
            {isLocked ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
            <span className={`text-sm font-medium ${isLocked ? 'text-red-400' : 'text-green-400'}`}>
              {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </span>
          </div>
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
                               <div className="flex items-center flex-1">
                                 <span className="text-yellow-400 font-bold text-sm">{stageName}</span>
                                 {PROTECTED_STAGES.includes(stageName) && (
                                   <span className="ml-2 px-1 py-0.5 bg-blue-600 text-white text-xs rounded font-bold" title="Protected Core Stage">
                                     🔒
                                   </span>
                                 )}
                               </div>
                               <button
                                 onClick={() => handleRemoveStage(getStageId(stageName))}
                                 className={`ml-2 p-1 rounded transition-colors duration-200 ${
                                   isLocked 
                                     ? 'text-gray-600 cursor-not-allowed opacity-50' 
                                     : PROTECTED_STAGES.includes(stageName)
                                     ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-900/50'
                                     : 'text-red-400 hover:text-red-300 hover:bg-red-900/50'
                                 }`}
                                 title={
                                   isLocked 
                                     ? "Table is locked" 
                                     : PROTECTED_STAGES.includes(stageName)
                                     ? "Remove protected stage (requires admin confirmation)"
                                     : "Remove stage"
                                 }
                                 disabled={isLocked}
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
                  <div className="font-bold text-yellow-400 text-sm mb-3">PRODUCTION TOTALS</div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">Inspected</div>
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">Faults</div>
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">DPU</div>
                  </div>
                </th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4 min-w-[240px] border-l-2 border-yellow-600/60">
                  <div className="font-bold text-yellow-400 text-sm mb-3">DPDI TOTALS</div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">Inspected</div>
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">Faults</div>
                    <div className="text-center font-bold text-yellow-300 bg-yellow-600/20 py-1 px-1 rounded text-[10px]">DPU</div>
                  </div>
                </th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-yellow-400 py-3 px-4 min-w-[240px] border-l-2 border-yellow-600/60">
                  <div className="font-bold text-yellow-400 text-sm mb-3">COMBINED TOTALS</div>
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
                              isLocked={isLocked}
                            />
                          </div>
                          <div>
                            <EditableCell
                              value={stageData.faults}
                              onChange={(value) => handleCellUpdate(month.id, stageData.id, 'faults', value)}
                              type="faults"
                              isLocked={isLocked}
                            />
                          </div>
                          <div className="text-center text-sm text-gray-300 flex items-center justify-center" style={{backgroundColor: '#3A3A3A'}}>
                            {formatDPU(stageData.dpu)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  {/* Production Totals */}
                  <td className="text-center py-3 px-4 border-l-2 border-yellow-600/60">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 rounded py-2 shadow-lg border border-yellow-400/30">
                        {formatNumber(month.productionTotalInspections)}
                      </div>
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 rounded py-2 shadow-lg border border-yellow-400/30">
                        {formatNumber(month.productionTotalFaults)}
                      </div>
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 rounded py-2 shadow-lg border border-yellow-400/30">
                        {formatDPU(month.productionTotalDpu)}
                      </div>
                    </div>
                  </td>
                  {/* DPDI Totals */}
                  <td className="text-center py-3 px-4 border-l-2 border-yellow-600/60">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 rounded py-2 shadow-lg border border-blue-400/30">
                        {formatNumber(month.dpdiTotalInspections)}
                      </div>
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 rounded py-2 shadow-lg border border-blue-400/30">
                        {formatNumber(month.dpdiTotalFaults)}
                      </div>
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 rounded py-2 shadow-lg border border-blue-400/30">
                        {formatDPU(month.dpdiTotalDpu)}
                      </div>
                    </div>
                  </td>
                  {/* Combined Totals */}
                  <td className="text-center py-3 px-4 border-l-2 border-yellow-600/60">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 rounded py-2 shadow-lg border border-green-400/30">
                        {formatNumber(month.combinedTotalInspections)}
                      </div>
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 rounded py-2 shadow-lg border border-green-400/30">
                        {formatNumber(month.combinedTotalFaults)}
                      </div>
                      <div className="text-sm font-bold text-black flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 rounded py-2 shadow-lg border border-green-400/30">
                        {formatDPU(month.combinedTotalDpu)}
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
        onAdd={handleAddStageSync}
      />

      {/* Target Management Modal */}
      <TargetManagementModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        currentData={data}
      />

      {/* Upload Summary Modal */}
      {showUploadSummary && uploadSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/30 rounded-xl shadow-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-t-xl"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                  CSV Upload Summary
                </h3>
                <button
                  onClick={() => {
                    setShowUploadSummary(false);
                    window.location.reload();
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Success Message */}
                <div className="bg-green-900/50 border border-green-600 rounded-lg p-4">
                  <p className="text-green-200 font-medium">
                    ✅ Successfully uploaded and processed CSV file!
                  </p>
                </div>

                {/* Months Processed */}
                <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-bold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Months Processed: {uploadSummary.monthsProcessed}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {uploadSummary.monthsUpdated.map((month, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium"
                      >
                        {month}
                      </span>
                    ))}
                  </div>
                </div>

                {/* New Stages Added */}
                {uploadSummary.newStagesAdded.length > 0 && (
                  <div className="bg-purple-900/50 border border-purple-600 rounded-lg p-4">
                    <h4 className="text-purple-300 font-bold mb-2 flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      New Stages Added: {uploadSummary.newStagesAdded.length}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {uploadSummary.newStagesAdded.map((stage, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium"
                        >
                          {stage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {uploadSummary.warnings.length > 0 && (
                  <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
                    <h4 className="text-yellow-300 font-bold mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Warnings: {uploadSummary.warnings.length}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-yellow-200 text-sm max-h-40 overflow-y-auto">
                      {uploadSummary.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setShowUploadSummary(false);
                      window.location.reload();
                    }}
                    className="px-6 py-2 bg-yellow-600 text-black font-bold rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                  >
                    Close & Reload Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AdminTable;
