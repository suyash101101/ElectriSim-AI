// Chatbot Communication Agent
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Circuit, CircuitAnalysis, SafetyAssessment, ChatMessage, AgentResponse } from '../types/circuit.types';

export class ChatbotAgent {
  private genAI: GoogleGenerativeAI;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Main method to process user queries
  async processQuery(
    query: string, 
    circuitContext?: Circuit, 
    analysisContext?: CircuitAnalysis, 
    safetyContext?: SafetyAssessment
  ): Promise<AgentResponse> {
    try {
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // Build context-aware prompt
      const prompt = this.buildPrompt(query, circuitContext, analysisContext, safetyContext);
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Add to conversation history
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: query,
        timestamp: new Date(),
        circuitContext,
        analysisContext,
        safetyContext
      };

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response,
        timestamp: new Date(),
        circuitContext,
        analysisContext,
        safetyContext
      };

      this.conversationHistory.push(userMessage, aiMessage);

      // Parse response for suggestions and actions
      const { suggestions, actions } = this.parseResponse(response);

      return {
        message: response,
        suggestions,
        actions,
        confidence: 0.85 // Default confidence
      };

    } catch (error) {
      console.error('Error processing query:', error);
      return {
        message: "I'm sorry, I encountered an error processing your request. Please try again.",
        suggestions: ["Check your internet connection", "Verify the circuit is properly connected"],
        actions: [],
        confidence: 0.1
      };
    }
  }

  // Build context-aware prompt
  private buildPrompt(
    query: string, 
    circuitContext?: Circuit, 
    analysisContext?: CircuitAnalysis, 
    safetyContext?: SafetyAssessment
  ): string {
    let prompt = `You are ElectriSim AI, an expert electrical safety assistant. You help users understand electrical circuits, identify safety hazards, and provide recommendations for safe electrical practices.

User Question: ${query}

`;

    // Add circuit context
    if (circuitContext) {
      prompt += `CURRENT CIRCUIT CONTEXT:
- Circuit Name: ${circuitContext.name}
- Total Components: ${circuitContext.components.length}
- Component Types: ${circuitContext.components.map(c => c.type).join(', ')}
- Source Voltage: ${circuitContext.metadata.voltage}V
- Description: ${circuitContext.metadata.description || 'No description'}

`;
    }

    // Add analysis context
    if (analysisContext) {
      prompt += `CIRCUIT ANALYSIS:
- Total Power: ${analysisContext.totalPower.toFixed(2)}W
- Efficiency: ${analysisContext.efficiency.toFixed(1)}%
- Issues Found: ${analysisContext.issues.length}
- Key Voltages: ${Object.entries(analysisContext.voltages).slice(0, 3).map(([id, v]) => `${id}: ${v.toFixed(2)}V`).join(', ')}

`;
    }

    // Add safety context
    if (safetyContext) {
      prompt += `SAFETY ASSESSMENT:
- Safety Score: ${safetyContext.safetyScore}/100
- Risk Level: ${safetyContext.riskLevel.toUpperCase()}
- Hazards Found: ${safetyContext.hazards.length}
- Compliance Status: ${safetyContext.compliance.filter(c => c.status === 'compliant').length}/${safetyContext.compliance.length} standards met

`;
    }

    // Add conversation history for context
    if (this.conversationHistory.length > 0) {
      prompt += `RECENT CONVERSATION:
${this.conversationHistory.slice(-4).map(msg => 
  `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`
).join('\n')}

`;
    }

    prompt += `INSTRUCTIONS:
1. Provide clear, accurate electrical safety advice
2. Reference specific components or values when relevant
3. Always prioritize safety in your recommendations
4. Use technical terms appropriately but explain complex concepts
5. If there are safety hazards, emphasize them clearly
6. Provide actionable recommendations
7. Be encouraging and educational

Please respond to the user's question:`;

    return prompt;
  }

  // Parse AI response for suggestions and actions
  private parseResponse(response: string): { suggestions: string[]; actions: string[] } {
    const suggestions: string[] = [];
    const actions: string[] = [];

    // Extract suggestions (lines starting with "•", "-", or numbered)
    const suggestionMatches = response.match(/(?:^|\n)(?:\d+\.|\•|\-)\s*(.+?)(?=\n|$)/gm);
    if (suggestionMatches) {
      suggestionMatches.forEach(match => {
        const suggestion = match.replace(/^(?:\d+\.|\•|\-)\s*/, '').trim();
        if (suggestion.length > 0) {
          suggestions.push(suggestion);
        }
      });
    }

    // Extract actions (phrases containing action words)
    const actionWords = ['add', 'remove', 'replace', 'check', 'verify', 'install', 'connect', 'disconnect'];
    const sentences = response.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      actionWords.forEach(actionWord => {
        if (lowerSentence.includes(actionWord)) {
          const action = sentence.trim();
          if (action.length > 0 && !actions.includes(action)) {
            actions.push(action);
          }
        }
      });
    });

    return { suggestions, actions };
  }

  // Process image upload for circuit analysis
  async processCircuitImage(imageFile: File): Promise<AgentResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const imageParts = await this.fileToGenerativePart(imageFile);
      const prompt = `Analyze this electrical circuit diagram. Please:

1. Identify all components (resistors, capacitors, batteries, LEDs, etc.)
2. Note their values and ratings where visible
3. Identify the circuit connections
4. Assess any obvious safety concerns
5. Provide recommendations for safe operation

Return your analysis in a clear, structured format.`;

      const result = await model.generateContent([prompt, imageParts]);
      const response = result.response.text();

      return {
        message: response,
        suggestions: [
          "Verify component values match the diagram",
          "Check all connections are secure",
          "Test circuit with low voltage first"
        ],
        actions: [
          "Load detected circuit into simulator",
          "Run safety analysis",
          "Check component ratings"
        ],
        confidence: 0.8
      };

    } catch (error) {
      console.error('Error processing image:', error);
      return {
        message: "I'm sorry, I couldn't analyze the circuit image. Please ensure the image is clear and shows a valid circuit diagram.",
        suggestions: ["Try uploading a clearer image", "Draw the circuit manually"],
        actions: [],
        confidence: 0.1
      };
    }
  }

  // Convert file to Generative AI part
  private async fileToGenerativePart(file: File) {
    const base64 = await this.fileToBase64(file);
    return {
      inlineData: {
        data: base64,
        mimeType: file.type,
      },
    };
  }

  // Convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Get conversation history
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  // Clear conversation history
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Get conversation context for current circuit
  getCircuitContext(): { circuit?: Circuit; analysis?: CircuitAnalysis; safety?: SafetyAssessment } {
    const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
    if (lastMessage) {
      return {
        circuit: lastMessage.circuitContext,
        analysis: lastMessage.analysisContext,
        safety: lastMessage.safetyContext
      };
    }
    return {};
  }

  // Generate contextual suggestions based on current circuit
  generateContextualSuggestions(circuit?: Circuit, analysis?: CircuitAnalysis, safety?: SafetyAssessment): string[] {
    const suggestions: string[] = [];

    if (circuit) {
      suggestions.push(`Ask about the ${circuit.name} circuit`);
      suggestions.push("How can I improve this circuit's efficiency?");
      
      if (circuit.components.length === 0) {
        suggestions.push("Add components to start building your circuit");
      } else {
        suggestions.push("What safety measures should I consider?");
        suggestions.push("How do I calculate power consumption?");
      }
    }

    if (analysis && analysis.issues.length > 0) {
      suggestions.push("How do I fix the circuit issues?");
      suggestions.push("What caused these problems?");
    }

    if (safety && safety.safetyScore < 80) {
      suggestions.push("How can I improve the safety score?");
      suggestions.push("What are the main safety risks?");
    }

    return suggestions;
  }
}
