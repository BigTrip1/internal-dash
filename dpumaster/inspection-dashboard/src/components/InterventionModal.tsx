'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, Calendar, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Intervention, InterventionPlan } from '@/types/interventions';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageName: string;
  currentState: {
    currentDPU: number;
    targetDPU: number;
    gap: number;
    monthsRemaining: number;
    requiredRate: number;
  };
}

const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onClose,
  stageName,
  currentState
}) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<Partial<Intervention>>({
    title: '',
    description: '',
    type: 'Process',
    estimatedDPUReduction: 0,
    cutInDate: new Date().toISOString().split('T')[0],
    owner: '',
    status: 'Planned',
    confidenceLevel: 'Medium'
  });

  // Load existing interventions
  useEffect(() => {
    if (isOpen) {
      loadInterventions();
    }
  }, [isOpen, stageName]);

  const loadInterventions = async () => {
    try {
      const response = await fetch(`/api/interventions?stage=${encodeURIComponent(stageName)}&year=${new Date().getFullYear()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.plan) {
          setInterventions(data.plan.interventions || []);
        }
      }
    } catch (error) {
      console.error('Error loading interventions:', error);
    }
  };

  const calculateProjections = () => {
    const activeInterventions = interventions.filter(i => i.status !== 'Cancelled');
    
    const totalExpectedImpact = activeInterventions.reduce((sum, intervention) => {
      const confidenceMultiplier = {
        'High': 0.9,
        'Medium': 0.7,
        'Low': 0.5
      }[intervention.confidenceLevel];
      
      const statusMultiplier = {
        'Completed': 1.0,
        'In Progress': 0.8,
        'Planned': 0.6,
        'Delayed': 0.4,
        'Cancelled': 0
      }[intervention.status];
      
      return sum + (intervention.estimatedDPUReduction * confidenceMultiplier * statusMultiplier);
    }, 0);

    // Baseline: continue current trend
    const currentRate = currentState.gap / currentState.monthsRemaining;
    const baselineProjection = currentState.currentDPU + (currentRate * currentState.monthsRemaining);
    
    // With interventions
    const adjustedProjection = baselineProjection + totalExpectedImpact; // totalExpectedImpact is negative

    // Confidence score
    const avgConfidence = activeInterventions.reduce((sum, i) => {
      const score = { 'High': 0.9, 'Medium': 0.7, 'Low': 0.5 }[i.confidenceLevel];
      return sum + score;
    }, 0) / (activeInterventions.length || 1);

    const confidenceScore = Math.round(avgConfidence * 100);

    return {
      baselineProjection,
      adjustedProjection,
      totalExpectedImpact,
      confidenceScore
    };
  };

  const handleAddIntervention = () => {
    if (!formData.title || !formData.owner || formData.estimatedDPUReduction === 0) {
      setSaveMessage({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    const newIntervention: Intervention = {
      id: `INT-${Date.now()}`,
      title: formData.title!,
      description: formData.description || '',
      type: formData.type!,
      estimatedDPUReduction: formData.estimatedDPUReduction!,
      cutInDate: formData.cutInDate!,
      owner: formData.owner!,
      status: formData.status!,
      confidenceLevel: formData.confidenceLevel!,
      investmentCost: formData.investmentCost,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInterventions([...interventions, newIntervention]);
    setIsAddingNew(false);
    resetForm();
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const projections = calculateProjections();
      
      const planData: Partial<InterventionPlan> = {
        stageId: stageName.toLowerCase().replace(/\s+/g, '_'),
        stageName: stageName,
        year: new Date().getFullYear(),
        createdBy: 'Current User', // TODO: Get from auth
        currentState: currentState,
        interventions: interventions,
        projections: projections,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      const result = await response.json();

      if (result.success) {
        setSaveMessage({ type: 'success', message: 'Intervention plan saved successfully!' });
        setTimeout(() => {
          onClose();
          window.location.reload(); // Refresh to show updated forecast
        }, 1500);
      } else {
        setSaveMessage({ type: 'error', message: result.error || 'Failed to save plan' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'Error saving intervention plan' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIntervention = (id: string) => {
    setInterventions(interventions.filter(i => i.id !== id));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'Process',
      estimatedDPUReduction: 0,
      cutInDate: new Date().toISOString().split('T')[0],
      owner: '',
      status: 'Planned',
      confidenceLevel: 'Medium'
    });
  };

  if (!isOpen) return null;

  const projections = calculateProjections();

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/40 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="border-b border-yellow-600/30 p-6 bg-gradient-to-r from-yellow-600/20 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
                <TrendingDown className="w-8 h-8" />
                Intervention Plan - {stageName}
              </h2>
              <p className="text-gray-400 text-sm mt-1">Add and track improvement initiatives</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-3">Current Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Current DPU</p>
              <p className="text-xl font-bold text-red-400">{currentState.currentDPU.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Target DPU</p>
              <p className="text-xl font-bold text-green-400">{currentState.targetDPU.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Gap</p>
              <p className="text-xl font-bold text-orange-400">{currentState.gap.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Months Left</p>
              <p className="text-xl font-bold text-blue-400">{currentState.monthsRemaining}</p>
            </div>
          </div>
        </div>

        {/* Projections */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <h3 className="text-lg font-semibold text-white mb-3">Forecast Projections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <p className="text-xs text-red-400 font-semibold mb-2">Without Interventions</p>
              <p className="text-3xl font-bold text-red-400">{projections.baselineProjection.toFixed(2)} DPU</p>
              <p className="text-xs text-gray-400 mt-1">Current trajectory</p>
            </div>
            <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
              <p className="text-xs text-green-400 font-semibold mb-2">With Interventions ({interventions.filter(i => i.status !== 'Cancelled').length})</p>
              <p className="text-3xl font-bold text-green-400">{projections.adjustedProjection.toFixed(2)} DPU</p>
              <p className="text-xs text-gray-400 mt-1">
                Impact: {projections.totalExpectedImpact.toFixed(2)} DPU | Confidence: {projections.confidenceScore}%
              </p>
            </div>
          </div>
        </div>

        {/* Interventions List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Interventions</h3>
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Intervention
            </button>
          </div>

          {/* Add New Form */}
          {isAddingNew && (
            <div className="mb-6 p-4 bg-gray-800 border border-yellow-600/30 rounded-lg">
              <h4 className="text-white font-semibold mb-3">New Intervention</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  <option value="Process">Process Improvement</option>
                  <option value="Training">Training</option>
                  <option value="Tooling">Tooling/Equipment</option>
                  <option value="Design">Design Change</option>
                  <option value="Quality Check">Quality Check</option>
                  <option value="Supplier">Supplier Action</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Expected DPU Reduction *"
                  value={formData.estimatedDPUReduction}
                  onChange={(e) => setFormData({ ...formData, estimatedDPUReduction: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
                <input
                  type="date"
                  value={formData.cutInDate}
                  onChange={(e) => setFormData({ ...formData, cutInDate: e.target.value })}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
                <input
                  type="text"
                  placeholder="Owner *"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
                <select
                  value={formData.confidenceLevel}
                  onChange={(e) => setFormData({ ...formData, confidenceLevel: e.target.value as any })}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  <option value="High">High Confidence</option>
                  <option value="Medium">Medium Confidence</option>
                  <option value="Low">Low Confidence</option>
                </select>
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddIntervention}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => { setIsAddingNew(false); resetForm(); }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Interventions List */}
          <div className="space-y-3">
            {interventions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No interventions planned yet</p>
                <p className="text-sm">Add improvement plans to track progress and forecast impact</p>
              </div>
            ) : (
              interventions.map((intervention) => (
                <div key={intervention.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-semibold">{intervention.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          intervention.status === 'Completed' ? 'bg-green-600 text-white' :
                          intervention.status === 'In Progress' ? 'bg-blue-600 text-white' :
                          intervention.status === 'Delayed' ? 'bg-red-600 text-white' :
                          'bg-yellow-600 text-black'
                        }`}>
                          {intervention.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{intervention.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500">Type</p>
                          <p className="text-white">{intervention.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Impact</p>
                          <p className="text-green-400 font-bold">{intervention.estimatedDPUReduction.toFixed(2)} DPU</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Cut-in Date</p>
                          <p className="text-white">{new Date(intervention.cutInDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Owner</p>
                          <p className="text-white">{intervention.owner}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteIntervention(intervention.id)}
                      className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 bg-gray-900/50">
          {saveMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              saveMessage.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
            }`}>
              {saveMessage.message}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Intervention Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterventionModal;

