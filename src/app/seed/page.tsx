'use client';

import React, { useState } from 'react';
import { Database, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const SeedPage: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [seedResults, setSeedResults] = useState<any>(null);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedStatus('idle');
    setStatusMessage('Initializing database seed...');

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSeedStatus('success');
        setStatusMessage('Database seeded successfully!');
        setSeedResults(result);
      } else {
        setSeedStatus('error');
        setStatusMessage(result.error || 'Failed to seed database');
        setSeedResults(null);
      }
    } catch (error) {
      setSeedStatus('error');
      setStatusMessage('Network error: Could not connect to seed API');
      setSeedResults(null);
      console.error('Seed error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    setIsSeeding(true);
    setSeedStatus('idle');
    setStatusMessage('Clearing database...');

    try {
      const response = await fetch('/api/seed?clear=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSeedStatus('success');
        setStatusMessage('Database cleared successfully!');
        setSeedResults(result);
      } else {
        setSeedStatus('error');
        setStatusMessage(result.error || 'Failed to clear database');
        setSeedResults(null);
      }
    } catch (error) {
      setSeedStatus('error');
      setStatusMessage('Network error: Could not connect to clear API');
      setSeedResults(null);
      console.error('Clear error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* JCB Header */}
      <div className="jcb-header">
        <div className="w-full">
          <div className="relative flex items-center justify-center px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black">JCB Digital Factory</h1>
              <p className="text-lg text-black opacity-90 font-semibold">Database Seeding Tool</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 border-2 border-yellow-600/30 rounded-xl shadow-2xl p-8">
          {/* Header Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-t-xl"></div>
          
          <div className="relative">
            <div className="flex items-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 rounded-lg blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-lg shadow-lg border border-yellow-400/30">
                  <Database className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-white">Database Management</h2>
                <p className="text-gray-300">Initialize or manage your quality inspection database</p>
              </div>
            </div>

            {/* Information Section */}
            <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Database Seeding Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-yellow-400 mb-2">What gets seeded:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• 12 months of inspection data (Jan-25 to Dec-25)</li>
                    <li>• 7 inspection stages: UV2, CABWT, SIP6, CFC, CABSIP, UV3, SIGN</li>
                    <li>• Realistic DPU values and fault counts</li>
                    <li>• Progressive improvement trends toward 8.2 target</li>
                    <li>• Build volume data for production tracking</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-400 mb-2">Database Details:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Database: <code className="bg-gray-700 px-1 rounded">dpu_master</code></li>
                    <li>• Collection: <code className="bg-gray-700 px-1 rounded">Raw</code></li>
                    <li>• Records: ~12 monthly inspection records</li>
                    <li>• Stages: ~84 stage records total</li>
                    <li>• Connection: MongoDB (local or cloud)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-lg font-semibold transition-all duration-200 ${
                  isSeeding
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-green-500/25'
                } text-white`}
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Seeding Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    <span>Seed Database</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClearDatabase}
                disabled={isSeeding}
                className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-lg font-semibold transition-all duration-200 ${
                  isSeeding
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/25'
                } text-white`}
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Clear Database</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Display */}
            {statusMessage && (
              <div className={`p-4 rounded-lg border ${
                seedStatus === 'success'
                  ? 'bg-green-900/50 border-green-600 text-green-200'
                  : seedStatus === 'error'
                  ? 'bg-red-900/50 border-red-600 text-red-200'
                  : 'bg-blue-900/50 border-blue-600 text-blue-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {seedStatus === 'success' && <Check className="w-5 h-5" />}
                  {seedStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                  {seedStatus === 'idle' && <Loader2 className="w-5 h-5 animate-spin" />}
                  <span className="font-medium">{statusMessage}</span>
                </div>
              </div>
            )}

            {/* Results Display */}
            {seedResults && (
              <div className="mt-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-3">Seed Results:</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Records Created:</span>
                    <span className="ml-2 font-mono text-green-400">{seedResults.recordsCreated || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stages Seeded:</span>
                    <span className="ml-2 font-mono text-yellow-400">{seedResults.stagesCreated || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Duration:</span>
                    <span className="ml-2 font-mono text-blue-400">{seedResults.duration || 'N/A'}</span>
                  </div>
                </div>
                {seedResults.summary && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-gray-300 text-sm">{seedResults.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/"
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-black font-semibold rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                >
                  <span>Go to Dashboard</span>
                </a>
                <a
                  href="/admin"
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  <span>Go to Admin Panel</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="jcb-footer mt-8">
        <div className="flex items-center space-x-3">
          <span className="text-black font-medium text-sm">JCB DIGITAL FACTORY - DATABASE TOOLS</span>
        </div>
        <div className="text-black text-xs">
          J.C.Bamford Excavators © 2025
        </div>
      </div>
    </div>
  );
};

export default SeedPage;
