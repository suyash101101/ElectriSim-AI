<!-- 1f9f2151-ed50-4024-a286-43fd9ca9d58c 253a66eb-59a9-47ef-a794-c16130626696 -->
# ElectriSim AI - Implementation Plan

## Overview

Complete web application with circuit design, AI chatbot, image analysis, and safety assessment - all using free tools and services.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **AI/ML**: Google Gemini API (free tier), TensorFlow.js
- **Circuit Simulation**: circuitjs1 / custom JS implementation
- **Deployment**: Local development

---

## Phase 1: Project Setup & Foundation

### Step 1.1: Initialize React Project

```bash
npx create-react-app electrisim-ai --template typescript
cd electrisim-ai
npm install tailwindcss @headlessui/react lucide-react
npm install axios react-markdown
```

### Step 1.2: Setup Google Gemini AI

**USER ACTION REQUIRED:**

- Visit https://makersuite.google.com/app/apikey
- Create a free Google Gemini API key
- Free tier: 60 requests per minute

Create `.env` file in project root:

```
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

### Step 1.3: Project Structure

```
src/
├── components/
│   ├── CircuitCanvas/
│   ├── ChatInterface/
│   ├── SafetyPanel/
│   └── ComponentLibrary/
├── agents/
│   ├── CircuitAnalysisAgent.ts
│   ├── SafetyAssessmentAgent.ts
│   ├── ImageRecognitionAgent.ts
│   └── ChatbotAgent.ts
├── utils/
│   ├── circuitSimulator.ts
│   └── electricalCalculations.ts
├── types/
│   └── circuit.types.ts
└── App.tsx
```

---

## Phase 2: Circuit Design Interface

### Step 2.1: Create Circuit Canvas Component

- Implement drag-and-drop using React DnD or custom implementation
- HTML5 Canvas for drawing circuits
- Component library (resistors, capacitors, power sources, etc.)

### Step 2.2: Circuit Data Model

```typescript
interface Component {
  id: string;
  type: 'resistor' | 'capacitor' | 'battery' | 'led' | 'switch';
  value: number;
  position: { x: number; y: number };
  connections: string[];
}

interface Circuit {
  components: Component[];
  connections: Connection[];
  metadata: {
    voltage: number;
    frequency?: number;
  };
}
```

### Step 2.3: Integrate Circuit Simulation

- Use existing library like `circuit-solver` or implement basic Kirchhoff's laws
- Real-time voltage/current calculations
- Visual feedback on circuit behavior

---

## Phase 3: AI Agent Implementation

### Step 3.1: Circuit Analysis Agent

**File**: `src/agents/CircuitAnalysisAgent.ts`

```typescript
class CircuitAnalysisAgent {
  analyzeCircuit(circuit: Circuit) {
    // Calculate voltages, currents using circuit laws
    // Detect series/parallel configurations
    // Calculate power consumption
    return analysisResults;
  }
}
```

### Step 3.2: Safety Assessment Agent

**File**: `src/agents/SafetyAssessmentAgent.ts`

```typescript
class SafetyAssessmentAgent {
  assessSafety(analysis: CircuitAnalysis) {
    // Check against electrical safety standards
    // Identify overcurrent, overvoltage conditions
    // Calculate safety score
    // Generate recommendations
    return safetyReport;
  }
}
```

### Step 3.3: Chatbot Communication Agent

**File**: `src/agents/ChatbotAgent.ts`

**USER ACTION REQUIRED:**

Install Gemini SDK:

```bash
npm install @google/generative-ai
```

Implementation:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

class ChatbotAgent {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
  }
  
  async processQuery(query: string, circuitContext: any) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are an electrical safety expert. 
    Current circuit context: ${JSON.stringify(circuitContext)}
    User question: ${query}
    Provide safety analysis and recommendations.`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
```

### Step 3.4: Image Recognition Agent

**USER ACTION REQUIRED:**

Install TensorFlow.js:

```bash
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd
```

**File**: `src/agents/ImageRecognitionAgent.ts`

```typescript
import * as tf from '@tensorflow/tfjs';

class ImageRecognitionAgent {
  async processCircuitImage(imageFile: File) {
    // Simple approach: Use Gemini Vision API (free)
    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const imageParts = await this.fileToGenerativePart(imageFile);
    const prompt = "Analyze this electrical circuit diagram. Identify all components, their values, and connections. Return as JSON.";
    
    const result = await model.generateContent([prompt, imageParts]);
    return this.parseCircuitFromResponse(result.response.text());
  }
}
```

---

## Phase 4: Chat Interface

### Step 4.1: Chat UI Component

**File**: `src/components/ChatInterface/ChatInterface.tsx`

- Message display with markdown support
- Input field with send button
- Conversation history
- Loading states for AI responses
- Display circuit context awareness

### Step 4.2: Multi-Agent Coordination

```typescript
class AgentOrchestrator {
  private circuitAgent: CircuitAnalysisAgent;
  private safetyAgent: SafetyAssessmentAgent;
  private chatbotAgent: ChatbotAgent;
  
  async handleUserQuery(query: string, circuit: Circuit) {
    // Analyze circuit
    const analysis = this.circuitAgent.analyzeCircuit(circuit);
    
    // Assess safety
    const safety = this.safetyAgent.assessSafety(analysis);
    
    // Generate AI response with context
    const context = { analysis, safety, circuit };
    const response = await this.chatbotAgent.processQuery(query, context);
    
    return response;
  }
}
```

---

## Phase 5: Safety Analysis Panel

### Step 5.1: Real-Time Safety Metrics

**File**: `src/components/SafetyPanel/SafetyPanel.tsx`

- Display safety score (0-100)
- List detected hazards with severity
- Show electrical parameters (V, I, P)
- Compliance indicators
- Recommendations list

### Step 5.2: Visual Indicators

- Color-coded safety levels (green/yellow/red)
- Real-time updates as circuit changes
- Alert badges for critical issues

---

## Phase 6: Image Upload Feature

### Step 6.1: Image Upload Component

```typescript
const ImageUpload = () => {
  const handleImageUpload = async (file: File) => {
    const agent = new ImageRecognitionAgent();
    const detectedCircuit = await agent.processCircuitImage(file);
    
    // Convert to circuit data and load into canvas
    loadCircuitToCanvas(detectedCircuit);
  };
};
```

### Step 6.2: Gemini Vision Integration

**USER ACTION REQUIRED:**

- Gemini Pro Vision is included in free tier
- Same API key as regular Gemini
- Analyze circuit images and extract components

---

## Phase 7: UI/UX Polish

### Step 7.1: Responsive Design

- Mobile-friendly layout
- Collapsible panels
- Touch-friendly controls

### Step 7.2: Component Library Sidebar

- Searchable component list
- Drag-and-drop to canvas
- Component properties editor

### Step 7.3: Help & Tutorials

- Interactive onboarding
- Sample circuits
- Safety tips

---

## Phase 8: Testing & Documentation

### Step 8.1: Testing

- Test circuit calculations manually
- Verify AI responses for accuracy
- Test image upload with various circuit diagrams
- Safety analysis validation

### Step 8.2: Documentation

Create `README.md`:

```markdown
# ElectriSim AI

## Setup
1. Clone repository
2. Run `npm install`
3. Get free Gemini API key from https://makersuite.google.com/app/apikey
4. Create `.env` file with `REACT_APP_GEMINI_API_KEY=your_key`
5. Run `npm start`

## Features
- Circuit design with drag-and-drop
- AI chatbot for safety guidance
- Image upload for circuit analysis
- Real-time safety assessment
```

---

## Required User Actions Summary

### 1. Get Google Gemini API Key

- **When**: Before Phase 3
- **Where**: https://makersuite.google.com/app/apikey
- **What**: Free API key (60 requests/min)
- **Add to**: `.env` file as `REACT_APP_GEMINI_API_KEY=your_key_here`

### 2. Install Dependencies

All installations are automated via npm - no manual configuration needed.

### 3. Optional: Get Test Circuit Images

- Find or draw sample circuit diagrams for testing image recognition
- Simple circuits work best initially

---

## Free Service Limits

### Google Gemini Free Tier

- **Gemini Pro**: 60 requests/minute
- **Gemini Pro Vision**: 60 requests/minute
- **Cost**: Free forever for development
- **Limits**: Sufficient for local development and testing

### TensorFlow.js

- **Cost**: Completely free
- **Runs**: Client-side in browser
- **No**: Server or API required

---

## Development Order

1. **Week 1**: Setup project, basic circuit canvas, component library
2. **Week 2**: Circuit simulation, electrical calculations
3. **Week 3**: Gemini API integration, chatbot interface
4. **Week 4**: Safety analysis agent, real-time feedback
5. **Week 5**: Image upload and recognition
6. **Week 6**: UI polish, testing, documentation

---

## Next Steps After Plan Approval

1. Initialize React TypeScript project
2. Setup folder structure
3. Install all dependencies
4. Create base components
5. Implement circuit canvas
6. Integrate Gemini AI
7. Build remaining features

All code will be production-ready, well-commented, and follow React best practices.

### To-dos

- [ ] Initialize React TypeScript project with all dependencies and folder structure
- [ ] Build drag-and-drop circuit canvas with component library and visual rendering
- [ ] Implement circuit simulation engine with electrical calculations and real-time analysis
- [ ] Integrate Google Gemini API for chatbot and image recognition agents
- [ ] Implement Circuit Analysis, Safety Assessment, and Chatbot agents with multi-agent coordination
- [ ] Build chat interface with conversation history and context-aware responses
- [ ] Create safety analysis panel with real-time metrics and visual indicators
- [ ] Implement image upload feature with Gemini Vision for circuit recognition
- [ ] Polish UI/UX with responsive design, help tutorials, and sample circuits
- [ ] Write tests, documentation, and setup instructions