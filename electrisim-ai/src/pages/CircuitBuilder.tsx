import React, { useState, useEffect } from 'react';
import { CircuitCanvas } from '../components/CircuitCanvas/CircuitCanvas';
import { SafetyPanel } from '../components/SafetyPanel/SafetyPanel';
import { ComponentLibrary } from '../components/ComponentLibrary/ComponentLibrary';
import { CircuitChatModal } from '../components/CircuitChatModal/CircuitChatModal';
import { CircuitAnalysisAgent } from '../agents/CircuitAnalysisAgent';
import { SafetyAssessmentAgent } from '../agents/SafetyAssessmentAgent';
import { ImageRecognitionAgent } from '../agents/ImageRecognitionAgent';
import { CircuitSimulator } from '../utils/circuitSimulator';
import type { Circuit, CircuitAnalysis, SafetyAssessment, ChatMessage } from '../types/circuit.types';
import { PanelLeft, PanelRight, X, MessageCircle } from 'lucide-react';

const CircuitBuilder: React.FC = () => {
  // State management
  const [circuit, setCircuit] = useState<Circuit>(CircuitSimulator.createSampleCircuit());
  const [analysis, setAnalysis] = useState<CircuitAnalysis | null>(null);
  const [safety, setSafety] = useState<SafetyAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // Initialize agents
  const circuitAnalysisAgent = new CircuitAnalysisAgent();
  const safetyAssessmentAgent = new SafetyAssessmentAgent();
  const imageRecognitionAgent = new ImageRecognitionAgent();

  // Circuit simulator
  const [simulator] = useState(() => new CircuitSimulator(circuit));

  // Analyze circuit when it changes
  useEffect(() => {
    if (circuit.components.length > 0) {
      setIsAnalyzing(true);
      
      // Run analysis
      const circuitAnalysis = circuitAnalysisAgent.analyzeCircuit(circuit);
      const safetyAssessment = safetyAssessmentAgent.assessSafety(circuitAnalysis, circuit);
      
      setAnalysis(circuitAnalysis);
      setSafety(safetyAssessment);
      setIsAnalyzing(false);
    }
  }, [circuit]);

  // Handle circuit updates
  const handleCircuitUpdate = (updatedCircuit: Circuit) => {
    setCircuit(updatedCircuit);
    simulator.updateCircuit(updatedCircuit);
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      const result = await imageRecognitionAgent.processCircuitImage(file);
      
      if (result.confidence > 0.5) {
        setCircuit(result.circuit);
        simulator.updateCircuit(result.circuit);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Sidebar Toggle Buttons */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="p-3 bg-white border border-gray-300 rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-xl"
          title={leftSidebarOpen ? "Hide Component Library" : "Show Component Library"}
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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Library */}
        {leftSidebarOpen && (
          <div className="w-96 bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden shadow-lg">
            <ComponentLibrary onComponentSelect={(component) => {
              // Add component to circuit at default position
              const newComponent = {
                ...component,
                id: `${component.type}-${Date.now()}`,
                position: { x: 200, y: 200 }
              };
              
              const updatedCircuit = {
                ...circuit,
                components: [...circuit.components, newComponent],
                metadata: {
                  ...circuit.metadata,
                  updatedAt: new Date()
                }
              };
              
              handleCircuitUpdate(updatedCircuit);
            }} />
          </div>
        )}

        {/* Center - Circuit Canvas */}
        <div className="flex-1 flex flex-col min-h-0 bg-white mx-4 my-4 rounded-xl shadow-lg border border-gray-200">
          <CircuitCanvas
            circuit={circuit}
            analysis={analysis}
            onCircuitUpdate={handleCircuitUpdate}
            onImageUpload={handleImageUpload}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Right Sidebar - Safety Panel */}
        {rightSidebarOpen && (
          <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0 overflow-hidden shadow-lg">
            <SafetyPanel
              safety={safety}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
            />
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
        circuitType="manual"
      />
    </div>
  );
};

export default CircuitBuilder;
