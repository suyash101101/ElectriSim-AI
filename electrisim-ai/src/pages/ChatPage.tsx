import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/ChatInterface/ChatInterface';
import { CircuitAnalysisAgent } from '../agents/CircuitAnalysisAgent';
import { SafetyAssessmentAgent } from '../agents/SafetyAssessmentAgent';
import { ChatbotAgent } from '../agents/ChatbotAgent';
import type { Circuit, CircuitAnalysis, SafetyAssessment, ChatMessage } from '../types/circuit.types';
import { CircuitSimulator } from '../utils/circuitSimulator';
import { ArrowLeft, Home, Zap, Shield, Lightbulb, Settings } from 'lucide-react';

const ChatPage: React.FC = () => {
  // State management
  const [circuit, setCircuit] = useState<Circuit>(CircuitSimulator.createSampleCircuit());
  const [analysis, setAnalysis] = useState<CircuitAnalysis | null>(null);
  const [safety, setSafety] = useState<SafetyAssessment | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);
  const [chatMode, setChatMode] = useState<'layman' | 'engineer'>('layman');

  // Suggested questions
  const suggestedQuestions = [
    {
      id: 'safety',
      question: 'What safety measures should I consider?',
      icon: Shield,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'circuit',
      question: 'How do I optimize this circuit?',
      icon: Zap,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'components',
      question: 'What components do I need?',
      icon: Lightbulb,
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      id: 'troubleshoot',
      question: 'Help me troubleshoot issues',
      icon: Settings,
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  // Initialize agents
  const circuitAnalysisAgent = new CircuitAnalysisAgent();
  const safetyAssessmentAgent = new SafetyAssessmentAgent();
  const chatbotAgent = new ChatbotAgent();

  // Analyze circuit when it changes
  useEffect(() => {
    if (circuit.components.length > 0) {
      // Run analysis
      const circuitAnalysis = circuitAnalysisAgent.analyzeCircuit(circuit);
      const safetyAssessment = safetyAssessmentAgent.assessSafety(circuitAnalysis, circuit);
      
      setAnalysis(circuitAnalysis);
      setSafety(safetyAssessment);
    }
  }, [circuit]);

  // Handle chat messages
  const handleChatMessage = async (message: string) => {
    setShowSuggestedQuestions(false);
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
      circuitContext: circuit,
      analysisContext: analysis,
      safetyContext: safety
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // In layman mode, don't pass circuit context
      const response = await chatbotAgent.processQuery(
        message,
        chatMode === 'engineer' ? circuit : undefined,
        chatMode === 'engineer' ? analysis : undefined,
        chatMode === 'engineer' ? safety : undefined,
        chatMode
      );

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response.message,
        timestamp: new Date(),
        circuitContext: circuit,
        analysisContext: analysis,
        safetyContext: safety
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing chat message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        circuitContext: circuit,
        analysisContext: analysis,
        safetyContext: safety
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    handleChatMessage(question);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ElectriSim AI Assistant</h1>
              <p className="text-sm text-gray-600">
                {chatMode === 'layman' 
                  ? 'General electrical safety advice for homeowners'
                  : 'Technical electrical engineering assistance'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Chat Mode Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChatMode('layman')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  chatMode === 'layman'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Homeowner
              </button>
              <button
                onClick={() => setChatMode('engineer')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  chatMode === 'engineer'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Engineer
              </button>
            </div>
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
      <main className="flex-1 min-h-0 bg-white">
        <ChatInterface
          messages={messages}
          onSendMessage={handleChatMessage}
          circuit={circuit}
          analysis={analysis}
          safety={safety}
        />
      </main>
    </div>
  );
};

export default ChatPage;
