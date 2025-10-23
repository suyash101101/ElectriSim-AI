# ElectriSim AI - Intelligent Electrical Safety Simulator

A comprehensive web application that combines electrical circuit design with AI-powered safety analysis and intelligent chatbot assistance.

## 🚀 Features

### Core Functionality
- **Interactive Circuit Design**: Drag-and-drop interface for building electrical circuits
- **Real-Time Analysis**: Live voltage, current, and power calculations
- **AI-Powered Safety Assessment**: Comprehensive safety analysis with hazard detection
- **Intelligent Chatbot**: Context-aware AI assistant for electrical safety guidance
- **Image Recognition**: Upload circuit diagrams for automatic analysis
- **Multi-Agent System**: Specialized AI agents for different aspects of electrical safety

### Safety Features
- **Hazard Detection**: Identifies overcurrent, overvoltage, thermal, and arc flash hazards
- **Compliance Checking**: Validates against NEC, OSHA, and NFPA standards
- **Safety Scoring**: Real-time safety score (0-100) with risk level assessment
- **Recommendations**: AI-generated safety improvement suggestions

### AI Agents
1. **Circuit Analysis Agent**: Analyzes circuit topology and electrical parameters
2. **Safety Assessment Agent**: Evaluates safety hazards and compliance
3. **Chatbot Communication Agent**: Provides intelligent responses with context
4. **Image Recognition Agent**: Processes circuit diagrams using computer vision

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **AI/ML**: Google Gemini API (free tier)
- **Circuit Simulation**: Custom JavaScript implementation
- **Icons**: Lucide React
- **Markdown**: React Markdown for AI responses

## 📋 Prerequisites

- Node.js 16+ and npm
- Google Gemini API key (free from Google AI Studio)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd electrisim-ai
npm install
```

### 2. Setup Environment Variables
```bash
# Copy the example environment file
cp env.example .env

# Edit .env and add your Gemini API key
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a free account
3. Generate an API key
4. Add it to your `.env` file

### 4. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎯 Usage

### Building Circuits
1. **Add Components**: Drag components from the library to the canvas
2. **Connect Components**: Components automatically connect when placed nearby
3. **Real-Time Analysis**: See voltage, current, and power calculations instantly
4. **Safety Monitoring**: Monitor safety score and hazard detection

### AI Chatbot
1. **Ask Questions**: Type questions about your circuit or electrical safety
2. **Context Awareness**: The AI understands your current circuit design
3. **Safety Guidance**: Get personalized safety recommendations
4. **Learning**: Ask about electrical concepts and best practices

### Image Upload
1. **Upload Circuit Images**: Take photos or upload circuit diagrams
2. **Automatic Detection**: AI identifies components and connections
3. **Load to Canvas**: Detected circuits load directly into the simulator

## 🔧 Configuration

### Environment Variables
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (required)
- `VITE_DEBUG`: Enable debug mode (optional, default: false)

### API Limits
- **Gemini Free Tier**: 60 requests per minute
- **Cost**: Free for development and testing
- **Sufficient**: For local development and demonstration

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── CircuitCanvas/   # Main circuit design interface
│   ├── ChatInterface/   # AI chatbot interface
│   ├── SafetyPanel/     # Safety analysis display
│   └── ComponentLibrary/ # Component selection panel
├── agents/              # AI agent implementations
│   ├── CircuitAnalysisAgent.ts
│   ├── SafetyAssessmentAgent.ts
│   ├── ChatbotAgent.ts
│   └── ImageRecognitionAgent.ts
├── utils/               # Utility functions
│   ├── circuitSimulator.ts
│   └── electricalCalculations.ts
├── types/               # TypeScript type definitions
│   └── circuit.types.ts
└── App.tsx             # Main application component
```

## 🧪 Testing

### Manual Testing
1. **Circuit Analysis**: Verify calculations with known circuits
2. **Safety Assessment**: Test with circuits containing hazards
3. **AI Responses**: Validate chatbot accuracy and context awareness
4. **Image Recognition**: Test with various circuit diagram styles

### Sample Circuits
The application includes sample circuits for testing:
- Simple LED circuit with current limiting resistor
- Basic power supply circuit
- Series and parallel resistor configurations

## 🚨 Safety Features

### Hazard Detection
- **Overcurrent**: Detects excessive current flow
- **Overvoltage**: Identifies voltage rating violations
- **Thermal**: Monitors power dissipation and heat generation
- **Short Circuit**: Detects potential short circuit conditions
- **Ground Fault**: Validates proper grounding
- **Arc Flash**: Calculates arc flash energy and PPE requirements

### Compliance Standards
- **NEC (National Electrical Code)**: Voltage and current limits
- **OSHA**: Touch voltage and working distance requirements
- **NFPA**: Arc flash energy and incident energy limits

## 🤖 AI Agent Details

### Circuit Analysis Agent
- Analyzes circuit topology using Kirchhoff's laws
- Calculates voltages, currents, and power consumption
- Detects series and parallel configurations
- Identifies circuit issues and anomalies

### Safety Assessment Agent
- Evaluates safety hazards based on electrical parameters
- Checks compliance with industry standards
- Calculates safety scores and risk levels
- Generates mitigation recommendations

### Chatbot Communication Agent
- Processes natural language queries
- Maintains conversation context
- Provides educational explanations
- Offers personalized safety guidance

### Image Recognition Agent
- Processes circuit diagram images
- Identifies electrical components and values
- Extracts circuit topology and connections
- Validates detected circuit data

## 🔮 Future Enhancements

- **Advanced Simulation**: AC analysis, frequency response
- **3D Visualization**: Three-dimensional circuit representation
- **Collaborative Features**: Multi-user circuit design
- **Export Options**: PDF reports, SPICE netlists
- **Mobile App**: Native mobile application
- **IoT Integration**: Real-time sensor data integration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:
- Create an issue in the GitHub repository
- Check the documentation
- Review the troubleshooting section

## 🙏 Acknowledgments

- Google Gemini AI for providing the free API
- React and TypeScript communities
- Electrical engineering standards organizations (NEC, OSHA, NFPA)
- Open source circuit simulation libraries

---

**ElectriSim AI** - Making electrical safety accessible through intelligent technology.