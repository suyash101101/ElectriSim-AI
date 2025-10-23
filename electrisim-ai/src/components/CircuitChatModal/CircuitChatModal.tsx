import React, { useState, useRef, useEffect } from 'react';
import { ChatInterface } from '../ChatInterface/ChatInterface';
import { ChatbotAgent } from '../../agents/ChatbotAgent';
import type { Circuit, CircuitAnalysis, SafetyAssessment, ChatMessage } from '../../types/circuit.types';
import { X, MessageCircle } from 'lucide-react';

interface CircuitChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuit: Circuit | null;
  analysis: CircuitAnalysis | null;
  safety: SafetyAssessment | null;
  circuitType: 'manual' | 'ai-generated';
}

export const CircuitChatModal: React.FC<CircuitChatModalProps> = ({
  isOpen,
  onClose,
  circuit,
  analysis,
  safety,
  circuitType
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatbotAgent = new ChatbotAgent();

  // Initialize with welcome message when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        type: 'ai',
        content: `Hello! I'm here to help you with your ${circuitType === 'ai-generated' ? 'AI-generated' : 'manually built'} circuit. I can see you have a circuit with ${circuit?.components?.length || 0} components. How can I assist you today?`,
        timestamp: new Date(),
        circuitContext: circuit,
        analysisContext: analysis,
        safetyContext: safety
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, circuit, analysis, safety, circuitType]);

  // Handle chat messages
  const handleChatMessage = async (message: string) => {
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
    setIsLoading(true);

    try {
      const response = await chatbotAgent.processQuery(
        message,
        circuit,
        analysis,
        safety
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
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Circuit Assistant</h2>
              <p className="text-sm text-gray-600">
                Chat about your {circuitType === 'ai-generated' ? 'AI-generated' : 'manually built'} circuit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Circuit Context Bar */}
        {circuit && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  <strong>Components:</strong> {circuit.components.length}
                </span>
                {analysis && (
                  <span className="text-gray-600">
                    <strong>Total Power:</strong> {analysis.totalPower.toFixed(0)}W
                  </span>
                )}
                {safety && (
                  <span className="text-gray-600">
                    <strong>Safety Score:</strong> {safety.safetyScore}/100
                  </span>
                )}
              </div>
              <div className="text-gray-500">
                {circuitType === 'ai-generated' ? '🤖 AI-Generated Circuit' : '🔧 Manual Circuit'}
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatInterface
            messages={messages}
            onSendMessage={handleChatMessage}
            circuit={circuit}
            analysis={analysis}
            safety={safety}
          />
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
