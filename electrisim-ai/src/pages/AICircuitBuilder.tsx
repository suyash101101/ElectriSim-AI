import React, { useState, useEffect } from 'react';
import { AICircuitBuilderAgent, type CircuitPrompt, type CircuitRecommendation } from '../agents/AICircuitBuilderAgent';
import { CircuitCanvas } from '../components/CircuitCanvas/CircuitCanvas';
import { SafetyPanel } from '../components/SafetyPanel/SafetyPanel';
import { CircuitChatModal } from '../components/CircuitChatModal/CircuitChatModal';
import { CircuitAnalysisAgent } from '../agents/CircuitAnalysisAgent';
import { SafetyAssessmentAgent } from '../agents/SafetyAssessmentAgent';
import type { Circuit, CircuitAnalysis, SafetyAssessment } from '../types/circuit.types';
import { ArrowLeft, Home, Zap, Loader, CheckCircle, AlertTriangle, Info, PanelLeft, PanelRight, X, MessageCircle } from 'lucide-react';

const AICircuitBuilder: React.FC = () => {
  // State management
  const [circuitPrompt, setCircuitPrompt] = useState<CircuitPrompt>({
    appliances: {},
    requirements: '',
    voltage: 230,
    phase: 'single'
  });
  const [additionalRequirements, setAdditionalRequirements] = useState<string>('');
  const [manualComponents, setManualComponents] = useState<string>('');
  const [circuit, setCircuit] = useState<Circuit | null>(null);
  const [analysis, setAnalysis] = useState<CircuitAnalysis | null>(null);
  const [safety, setSafety] = useState<SafetyAssessment | null>(null);
  const [recommendation, setRecommendation] = useState<CircuitRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');

  // Initialize agents
  const aiCircuitBuilderAgent = new AICircuitBuilderAgent();
  const circuitAnalysisAgent = new CircuitAnalysisAgent();
  const safetyAssessmentAgent = new SafetyAssessmentAgent();

  // Generate AI summary when circuit changes
  useEffect(() => {
    if (circuit && analysis && safety) {
      generateAISummary();
    }
  }, [circuit, analysis, safety]);

  const generateAISummary = async () => {
    if (!circuit || !analysis || !safety) return;
    
    try {
      const complianceChecks = safety.compliance || [];
      const hasComplianceData = complianceChecks.length > 0;
      const allCompliant = hasComplianceData && complianceChecks.every(check => check.status === 'compliant');
      const nonCompliantSummary = complianceChecks
        .filter(check => check.status !== 'compliant')
        .map(check => `${check.standard} (${check.status.replace(/_/g, ' ')})`)
        .join(', ');
      const complianceSummary = hasComplianceData
        ? (allCompliant ? 'Meets NEC, OSHA, and NFPA standards' : `Attention needed: ${nonCompliantSummary}`)
        : 'Compliance data unavailable';

      const summary = `
        This AI-generated circuit includes ${circuit.components.length} components designed for ${circuitPrompt.voltage}V ${circuitPrompt.phase}-phase operation.
        
        Key Features:
        • Total Power: ${analysis.totalPower.toFixed(0)}W
        • Safety Score: ${safety.safetyScore}/100 (${safety.riskLevel} risk)
        • Protection: Includes MCB and RCCB for safety
        • Compliance: ${complianceSummary}
        
        The circuit is designed with proper grounding, appropriate wire sizing, and comprehensive protection devices to ensure safe operation.
      `;
      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
    }
  };

  // Handle circuit generation
  const handleGenerateCircuit = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Combine all requirements
      const combinedRequirements = [
        circuitPrompt.requirements || '',
        additionalRequirements || '',
        manualComponents ? `Additional Components: ${manualComponents}` : ''
      ].filter(Boolean).join('\n\n');

      const enhancedPrompt = {
        ...circuitPrompt,
        requirements: combinedRequirements
      };

      const result = await aiCircuitBuilderAgent.generateCircuitFromPrompt(enhancedPrompt);
      
      setCircuit(result.circuit);
      setRecommendation(result);
      
      // Analyze the generated circuit
      const circuitAnalysis = circuitAnalysisAgent.analyzeCircuit(result.circuit);
      const safetyAssessment = safetyAssessmentAgent.assessSafety(circuitAnalysis, result.circuit);
      
      setAnalysis(circuitAnalysis);
      setSafety(safetyAssessment);
      
    } catch (err) {
      console.error('Error generating circuit:', err);
      setError('Failed to generate circuit. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle circuit updates
  const handleCircuitUpdate = (updatedCircuit: Circuit) => {
    setCircuit(updatedCircuit);
    
    // Re-analyze the circuit
    const circuitAnalysis = circuitAnalysisAgent.analyzeCircuit(updatedCircuit);
    const safetyAssessment = safetyAssessmentAgent.assessSafety(circuitAnalysis, updatedCircuit);
    
    setAnalysis(circuitAnalysis);
    setSafety(safetyAssessment);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Sidebar Toggle Buttons */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="p-3 bg-white border border-gray-300 rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-xl"
          title={leftSidebarOpen ? "Hide Requirements Panel" : "Show Requirements Panel"}
        >
          {leftSidebarOpen ? <X className="h-5 w-5 text-gray-600" /> : <PanelLeft className="h-5 w-5 text-gray-600" />}
        </button>
      </div>
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className="p-3 bg-white border border-gray-300 rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-xl"
          title={rightSidebarOpen ? "Hide Safety Panel" : "Show Safety Panel"}
        >
          {rightSidebarOpen ? <X className="h-5 w-5 text-gray-600" /> : <PanelRight className="h-5 w-5 text-gray-600" />}
        </button>
      </div>

      {/* Chat Icon */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={() => setShowChat(!showChat)}
          className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-xl"
          title="Chat about your circuit"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Circuit Builder</h1>
              <p className="text-sm text-gray-600">Generate circuits from natural language prompts</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Circuit Prompt */}
        {leftSidebarOpen && (
          <div className="w-96 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto shadow-lg">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Circuit Requirements</h2>
              
              {/* Appliances Section */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Appliances</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Fans</label>
                    <input
                      type="number"
                      min="0"
                      value={circuitPrompt.appliances.fans || 0}
                      onChange={(e) => setCircuitPrompt(prev => ({
                        ...prev,
                        appliances: { ...prev.appliances, fans: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Lights</label>
                    <input
                      type="number"
                      min="0"
                      value={circuitPrompt.appliances.lights || 0}
                      onChange={(e) => setCircuitPrompt(prev => ({
                        ...prev,
                        appliances: { ...prev.appliances, lights: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">AC Units</label>
                    <input
                      type="number"
                      min="0"
                      value={circuitPrompt.appliances.ac || 0}
                      onChange={(e) => setCircuitPrompt(prev => ({
                        ...prev,
                        appliances: { ...prev.appliances, ac: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Heaters</label>
                    <input
                      type="number"
                      min="0"
                      value={circuitPrompt.appliances.heater || 0}
                      onChange={(e) => setCircuitPrompt(prev => ({
                        ...prev,
                        appliances: { ...prev.appliances, heater: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">TVs</label>
                    <input
                      type="number"
                      min="0"
                      value={circuitPrompt.appliances.tv || 0}
                      onChange={(e) => setCircuitPrompt(prev => ({
                        ...prev,
                        appliances: { ...prev.appliances, tv: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Motors</label>
                    <input
                      type="number"
                      min="0"
                      value={circuitPrompt.appliances.motor || 0}
                      onChange={(e) => setCircuitPrompt(prev => ({
                        ...prev,
                        appliances: { ...prev.appliances, motor: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* System Configuration */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">System Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Voltage (V)</label>
                    <select
                      value={circuitPrompt.voltage || 230}
                      onChange={(e) => setCircuitPrompt(prev => ({
                        ...prev,
                        voltage: parseInt(e.target.value)
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value={110}>110V</option>
                      <option value={220}>220V</option>
                      <option value={230}>230V</option>
                      <option value={240}>240V</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phase</label>
                    <select
                      value={circuitPrompt.phase || 'single'}
                      onChange={(e) => setCircuitPrompt(prev => ({
                        ...prev,
                        phase: e.target.value as 'single' | 'three'
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="single">Single Phase</option>
                      <option value="three">Three Phase</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Requirements */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Additional Requirements</h3>
                <textarea
                  value={circuitPrompt.requirements || ''}
                  onChange={(e) => setCircuitPrompt(prev => ({
                    ...prev,
                    requirements: e.target.value
                  }))}
                  placeholder="e.g., Energy efficient, Industrial grade, Home automation..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                />
              </div>

              {/* Priority Requirements */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Priority Requirements</h3>
                <textarea
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  placeholder="e.g., Safety first, UPS backup, Industry standards compliance, Energy efficiency, Cost optimization..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                />
              </div>

              {/* Manual Components */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Additional Components</h3>
                <textarea
                  value={manualComponents}
                  onChange={(e) => setManualComponents(e.target.value)}
                  placeholder="e.g., 2x MCB 32A, 1x RCCB 30mA, 1x UPS 2kVA, 1x Inverter 3kW, Custom sensors..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateCircuit}
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Generating Circuit...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Generate Circuit
                  </>
                )}
              </button>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {recommendation && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3">AI Recommendations</h3>
                  <div className="space-y-2">
                    {recommendation.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Safety Notes</h4>
                    <div className="space-y-1">
                      {recommendation.safetyNotes.map((note, index) => (
                        <div key={index} className="flex items-start">
                          <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Circuit Summary</h4>
                    <div className="text-sm text-blue-800">
                      <p><strong>Total Load:</strong> {recommendation.totalLoad}W</p>
                      <p><strong>Suggested MCB:</strong> {recommendation.suggestedProtection.mcb}A</p>
                      <p><strong>Suggested Fuse:</strong> {recommendation.suggestedProtection.fuse}A</p>
                      <p><strong>RCCB Required:</strong> {recommendation.suggestedProtection.rccb ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Circuit Analysis */}
              {circuit && analysis && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3">Circuit Analysis</h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Circuit Overview</h4>
                      <p className="text-sm text-blue-800">
                        This circuit includes {circuit?.components?.length || 0} components with proper safety protection.
                        The system operates at {circuit?.metadata?.voltage || 230}V with comprehensive MCB and RCCB protection.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Load Analysis</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <p>• Total Power Consumption: {analysis?.totalPower?.toFixed(0) || '0'}W</p>
                        <p>• Total Current: {analysis?.totalPower ? (analysis.totalPower / 230).toFixed(2) : '0.00'}A</p>
                        <p>• Main MCB Rating: 32A (Recommended)</p>
                        <p>• RCCB Sensitivity: 30mA</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Why This Approach?</h4>
                      <div className="text-sm text-yellow-800 space-y-1">
                        <p>• <strong>Safety First:</strong> MCB protects against overload, RCCB against earth leakage</p>
                        <p>• <strong>Proper Grounding:</strong> All appliances connected to ground for safety</p>
                        <p>• <strong>Load Distribution:</strong> Components arranged to prevent overloading</p>
                        <p>• <strong>Code Compliance:</strong> Meets electrical safety standards</p>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Key Metrics</h4>
                      <div className="text-sm text-purple-800 space-y-1">
                        <p>• Circuit Efficiency: {analysis?.totalPower ? ((analysis.totalPower / (analysis.totalPower + 50)) * 100).toFixed(1) : '0.0'}%</p>
                        <p>• Safety Score: {safety?.safetyScore || 85}/100</p>
                        <p>• Wire Gauge Required: 2.5mm² (for 32A MCB)</p>
                        <p>• Installation Complexity: Medium</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Center - Circuit Canvas */}
        <div className="flex-1 flex flex-col min-h-0 bg-white mx-4 my-4 rounded-xl shadow-lg border border-gray-200">
          {circuit ? (
            <CircuitCanvas
              circuit={circuit}
              analysis={analysis}
              onCircuitUpdate={handleCircuitUpdate}
              onImageUpload={() => {}}
              isAnalyzing={false}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Circuit Generated</h3>
                <p className="text-gray-600">Configure your requirements and click "Generate Circuit" to get started.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Safety Analysis & AI Summary */}
        {rightSidebarOpen && (
          <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto shadow-lg">
            <div className="h-full flex flex-col">
              {/* Safety Panel */}
              <div className="flex-1">
                <SafetyPanel
                  safety={safety}
                  analysis={analysis}
                  isAnalyzing={false}
                />
              </div>
              
              {/* AI Summary Section */}
              {aiSummary && (
                <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">AI Circuit Summary</h3>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {aiSummary}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <CircuitChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        circuit={circuit}
        analysis={analysis}
        safety={safety}
        circuitType="ai-generated"
      />
    </div>
  );
};

export default AICircuitBuilder;
