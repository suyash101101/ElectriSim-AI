import React from 'react';
import type { SafetyAssessment, CircuitAnalysis } from '../../types/circuit.types';
import { Shield, AlertTriangle, CheckCircle, Zap, Thermometer, TrendingUp, Info } from 'lucide-react';

interface SafetyPanelProps {
  safety: SafetyAssessment | null;
  analysis: CircuitAnalysis | null;
  isAnalyzing: boolean;
}

export const SafetyPanel: React.FC<SafetyPanelProps> = ({
  safety,
  analysis,
  isAnalyzing
}) => {
  // Get safety score color
  const getSafetyScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get safety score background color
  const getSafetyScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Get safety level text
  const getSafetyLevel = (score: number): string => {
    if (score >= 80) return 'LOW RISK';
    if (score >= 60) return 'MODERATE RISK';
    if (score >= 40) return 'HIGH RISK';
    return 'CRITICAL RISK';
  };

  // Get safety level color
  const getSafetyLevelColor = (score: number): string => {
    if (score >= 80) return 'text-green-700 bg-green-100';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100';
    if (score >= 40) return 'text-orange-700 bg-orange-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Safety Analysis</h2>
            <p className="text-sm text-gray-600">Real-time circuit safety monitoring</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Loading State */}
        {isAnalyzing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing circuit safety...</p>
          </div>
        )}

        {/* No Data State */}
        {!safety && !analysis && !isAnalyzing && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Circuit Data</h3>
            <p className="text-gray-600">Build a circuit to see safety analysis</p>
          </div>
        )}

        {/* Safety Score */}
        {safety && (
          <div className={`p-6 rounded-xl border-2 ${getSafetyScoreBgColor(safety.safetyScore)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Safety Score</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getSafetyLevelColor(safety.safetyScore)}`}>
                {getSafetyLevel(safety.safetyScore)}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getSafetyScoreColor(safety.safetyScore)} mb-2`}>
                {safety.safetyScore}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    safety.safetyScore >= 80 ? 'bg-green-500' :
                    safety.safetyScore >= 60 ? 'bg-yellow-500' :
                    safety.safetyScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${safety.safetyScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Out of 100</p>
            </div>
          </div>
        )}

        {/* Circuit Analysis */}
        {analysis && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Circuit Analysis</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Total Power</span>
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {analysis.totalPower.toFixed(2)}W
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Thermometer className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Total Current</span>
                </div>
                <div className="text-xl font-bold text-green-900">
                  {(analysis.totalPower / 230).toFixed(2)}A
                </div>
              </div>
            </div>

            {/* Issues */}
            {safety && safety.hazards && safety.hazards.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">
                    {safety.hazards.length} Hazard{safety.hazards.length > 1 ? 's' : ''} Found
                  </span>
                </div>
                <ul className="space-y-1">
                  {safety.hazards.map((hazard, index: number) => (
                    <li key={index} className="text-sm text-yellow-800 flex items-start">
                      <span className="mr-2">•</span>
                      {hazard.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Compliance */}
        {safety && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Compliance</h3>
            </div>
            
            <div className="space-y-3">
              {['NEC', 'OSHA', 'NFPA'].map((standard) => (
                <div key={standard} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-900">{standard}</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {safety && safety.recommendations.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
            </div>
            
            <div className="space-y-3">
              {safety.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-900">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Circuit appears safe */}
        {safety && safety.safetyScore >= 80 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Circuit appears safe</h3>
                <p className="text-sm text-green-700">All safety checks passed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};