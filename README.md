# ElectriSim AI: Advanced Electrical Safety Simulator

<div align="center">

![ElectriSim AI Logo](https://img.shields.io/badge/ElectriSim-AI-blue?style=for-the-badge&logo=lightning&logoColor=white)

**A comprehensive electrical engineering application combining AI-powered circuit design with real-time safety analysis**

[![React](https://img.shields.io/badge/React-19.1.1-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-purple?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.15-teal?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%202.5-orange?style=flat-square&logo=google)](https://ai.google.dev/)

</div>

## 🚀 Overview

ElectriSim AI is a cutting-edge web application that revolutionizes electrical circuit design and safety analysis. Built with modern web technologies and powered by Google's Gemini AI, it provides both manual circuit building capabilities and intelligent AI-generated circuit designs with comprehensive safety assessments.

### Key Features

- 🎯 **AI-Powered Circuit Generation** - Create circuits from natural language descriptions
- 🔧 **Manual Circuit Builder** - Drag-and-drop interface for precise circuit design
- ⚡ **Real-Time Safety Analysis** - Comprehensive safety assessment with compliance checking
- 🤖 **Intelligent Chatbot** - Context-aware AI assistant for electrical engineering guidance
- 📊 **Advanced Electrical Calculations** - Professional-grade calculations with power factor analysis
- 🏠 **30+ Electrical Appliances** - Complete library of household and industrial components
- 🛡️ **Safety Standards Compliance** - NEC, OSHA, and NFPA standards validation

## 🏗️ Architecture

### Frontend Stack
- **React 19.1.1** - Modern component-based UI framework
- **TypeScript 5.9.3** - Type-safe development with comprehensive interfaces
- **Vite 7.1.7** - Lightning-fast build tool and development server
- **Tailwind CSS 4.1.15** - Utility-first CSS framework for responsive design
- **React Router 7.9.4** - Client-side routing for seamless navigation

### AI Integration
- **Google Gemini 2.5 Flash** - Advanced language model for circuit generation and analysis
- **Multi-Agent Architecture** - Specialized AI agents for different engineering tasks
- **Real-Time API Integration** - Dynamic circuit analysis and safety assessment

### Core Technologies
- **Canvas API** - Interactive circuit visualization and manipulation
- **React DnD** - Drag-and-drop functionality for component placement
- **Lucide React** - Consistent iconography throughout the application

## 📁 Project Structure

```
electrisim-ai/
├── src/
│   ├── agents/                    # AI Agent System
│   │   ├── AICircuitBuilderAgent.ts    # Circuit generation from prompts
│   │   ├── ChatbotAgent.ts            # Natural language processing
│   │   ├── CircuitAnalysisAgent.ts    # Electrical calculations
│   │   ├── ImageRecognitionAgent.ts    # Circuit diagram analysis
│   │   └── SafetyAssessmentAgent.ts   # Safety compliance checking
│   ├── components/               # Reusable UI Components
│   │   ├── ChatInterface/            # AI chatbot interface
│   │   ├── CircuitCanvas/            # Interactive circuit canvas
│   │   ├── CircuitChatModal/         # Context-aware chat modal
│   │   ├── ComponentLibrary/         # Component selection panel
│   │   └── SafetyPanel/             # Safety analysis display
│   ├── pages/                    # Application Pages
│   │   ├── AICircuitBuilder.tsx       # AI-powered circuit generation
│   │   ├── ChatPage.tsx              # Dedicated chat interface
│   │   ├── CircuitBuilder.tsx        # Manual circuit construction
│   │   └── LandingPage.tsx          # Application homepage
│   ├── types/                    # TypeScript Definitions
│   │   └── circuit.types.ts          # Circuit and component interfaces
│   ├── utils/                    # Utility Functions
│   │   ├── circuitSimulator.ts       # Circuit simulation logic
│   │   └── electricalCalculations.ts  # Electrical engineering calculations
│   ├── App.tsx                   # Main application component
│   ├── App.css                   # Global styles
│   ├── index.css                 # Tailwind CSS imports
│   └── main.tsx                  # Application entry point
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
├── env.example                   # Environment variables template
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Google Gemini API Key** (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd electrisim-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your Google Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env` file

**Free Tier Limits:**
- 60 requests per minute
- 1 million tokens per day
- Perfect for development and testing

## 🎯 Usage Guide

### Manual Circuit Builder

1. **Navigate to Circuit Builder** (`/builder`)
2. **Select Components** from the left sidebar library
3. **Drag and Drop** components onto the canvas
4. **Connect Components** by clicking and dragging between connection points
5. **Edit Properties** by double-clicking components
6. **View Analysis** in the right sidebar safety panel

### AI Circuit Builder

1. **Navigate to AI Circuit Builder** (`/ai-builder`)
2. **Enter Requirements**:
   - Number of appliances (fans, lights, AC, etc.)
   - System voltage (230V, 400V)
   - Phase type (single/three-phase)
   - Additional requirements and priorities
3. **Click Generate Circuit**
4. **Review Generated Circuit** with safety analysis
5. **Chat with AI** about the circuit design

### AI Chat Assistant

1. **Navigate to Chat** (`/chat`) or use the chat button in builders
2. **Ask Questions** about electrical engineering concepts
3. **Get Context-Aware Help** based on your current circuit
4. **Receive Safety Recommendations** and technical guidance

## 🔧 Component Library

### Basic Components
- **Resistors** (1Ω - 1MΩ) with power ratings
- **Capacitors** (1pF - 1000μF) with voltage ratings
- **Inductors** (1μH - 100mH) with current ratings
- **Diodes** with forward/reverse voltage specifications
- **LEDs** with color and current ratings
- **Transformers** with turns ratio and voltage ratings

### Protection Devices
- **MCBs** (Miniature Circuit Breakers) - 6A to 63A
- **RCCBs** (Residual Current Circuit Breakers) - 30mA sensitivity
- **Fuses** - Slow, fast, and time-delay types
- **Circuit Breakers** - Overload and short-circuit protection

### Control Devices
- **Contactors** with coil voltage specifications
- **Relays** for control circuit applications
- **Timers** - On-delay, off-delay, and interval types
- **Sensors** - Temperature, motion, light, pressure, current

### Measurement Instruments
- **Voltmeters** - Digital and analog displays
- **Ammeters** - Current measurement with ranges
- **Wattmeters** - Power measurement and analysis

### Major Appliances (30+ Components)

#### Power Systems
- **UPS Systems** (1000VA) - Battery backup with runtime
- **Power Inverters** (2000W) - DC to AC conversion
- **Electric Boilers** (6000W) - High-power heating

#### Household Appliances
- **Refrigerators** (150W) - Energy-efficient cooling
- **Washing Machines** (2000W) - Capacity-based sizing
- **Microwave Ovens** (1200W) - Frequency specifications
- **Dishwashers** (1800W) - Water heating capabilities
- **Water Heaters** (3000W) - Resistive and induction types
- **Electric Stoves** (4000W) - Multi-burner configurations
- **Electric Ovens** (2500W) - Temperature range control
- **Heat Pumps** (3000W) - Heating and cooling capacity

#### Basic Appliances
- **Fans** (75W) - Ceiling and exhaust fans
- **Lights** (10-100W) - LED, CFL, and incandescent
- **TVs** (100-500W) - Screen size-based power
- **Air Conditioners** (2000W) - Cooling capacity (BTU)
- **Motors** (500-3000W) - Induction, brushless, stepper

## ⚡ Electrical Calculations

### AC Circuit Analysis
- **Power Factor Calculations** - Real and apparent power
- **Three-Phase Power** - Line and phase relationships
- **Load Calculations** - Total system load analysis
- **Current Calculations** - Based on voltage and power

### Safety Calculations
- **Arc Flash Energy** - Simplified arc flash analysis
- **Ground Fault Current** - Fault current calculations
- **Protection Device Sizing** - MCB, RCCB, and fuse ratings
- **Wire Sizing** - Current capacity and voltage drop

### Component Analysis
- **Voltage Distribution** - Across circuit components
- **Current Flow** - Through series and parallel paths
- **Power Consumption** - Individual and total power
- **Efficiency Calculations** - System efficiency analysis

## 🛡️ Safety Analysis

### Safety Assessment Features
- **Safety Score** (0-100) - Overall circuit safety rating
- **Risk Level** - Low, Medium, High, Critical classification
- **Hazard Detection** - Specific safety issues identification
- **Compliance Checking** - NEC, OSHA, NFPA standards validation
- **Recommendations** - Actionable safety improvements

### Standards Compliance
- **NEC (National Electrical Code)** - US electrical standards
- **OSHA** - Occupational safety requirements
- **NFPA** - Fire protection standards
- **IEC** - International electrical standards

### Safety Checks
- **Overcurrent Protection** - MCB and fuse validation
- **Ground Fault Protection** - RCCB sensitivity checking
- **Voltage Compatibility** - Component voltage ratings
- **Power Rating Validation** - Component power limits
- **Connection Safety** - Proper wiring and grounding

## 🤖 AI Features

### Multi-Agent Architecture

#### Circuit Analysis Agent
- **Electrical Calculations** - Voltage, current, power analysis
- **Load Analysis** - Total system load calculations
- **Efficiency Assessment** - Power factor and efficiency analysis
- **Issue Detection** - Electrical problems identification

#### Safety Assessment Agent
- **Compliance Checking** - Standards validation
- **Hazard Analysis** - Safety risk assessment
- **Recommendation Engine** - Safety improvement suggestions
- **Risk Scoring** - Quantitative safety evaluation

#### Image Recognition Agent
- **Circuit Diagram Analysis** - Component identification
- **Connection Recognition** - Wire and connection analysis
- **Component Extraction** - Circuit element identification
- **Safety Assessment** - Image-based safety analysis

#### Chatbot Agent
- **Natural Language Processing** - Query understanding
- **Context-Aware Responses** - Circuit-specific assistance
- **Technical Guidance** - Electrical engineering help
- **Safety Recommendations** - Real-time safety advice

#### AI Circuit Builder Agent
- **Prompt Interpretation** - Natural language to circuit conversion
- **Intelligent Design** - Safe circuit architecture generation
- **Component Selection** - Appropriate component choices
- **Safety-First Approach** - Compliance-focused design

### AI Circuit Generation Process

1. **Prompt Analysis** - Understanding user requirements
2. **Component Selection** - Choosing appropriate components
3. **Circuit Architecture** - Designing safe circuit topology
4. **Connection Planning** - Proper wiring and grounding
5. **Safety Validation** - Compliance checking
6. **Analysis Generation** - Electrical calculations and safety assessment

## 🎨 User Interface

### Design System
- **Modern UI** - Clean, professional interface design
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Accessibility** - WCAG compliant design patterns
- **Dark/Light Themes** - User preference support

### Interactive Features
- **Drag-and-Drop** - Intuitive component placement
- **Zoom and Pan** - Canvas navigation for large circuits
- **Grid System** - Precise component alignment
- **Connection Management** - Visual wire routing
- **Real-Time Updates** - Live analysis and safety assessment

### Navigation
- **Landing Page** - Feature overview and quick access
- **Circuit Builder** - Manual circuit construction
- **AI Circuit Builder** - Intelligent circuit generation
- **Chat Interface** - AI assistant and guidance

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Code Quality
- **TypeScript** - Full type safety and IntelliSense
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting (recommended)
- **Git Hooks** - Pre-commit validation (recommended)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📊 Performance

### Optimization Features
- **React.memo** - Component re-render optimization
- **useCallback** - Event handler optimization
- **Lazy Loading** - Code splitting for faster loads
- **Efficient State Management** - Minimal re-renders

### Bundle Size
- **Production Build** - Optimized for minimal size
- **Tree Shaking** - Unused code elimination
- **Code Splitting** - Route-based splitting
- **Asset Optimization** - Compressed images and fonts

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- **Vercel** - Recommended for React applications
- **Netlify** - Easy deployment with CI/CD
- **GitHub Pages** - Free hosting for public repositories
- **AWS S3** - Scalable cloud hosting
- **Docker** - Containerized deployment

### Environment Variables
```env
VITE_GEMINI_API_KEY=your_production_api_key
VITE_DEBUG=false
VITE_APP_ENV=production
```

## 🐛 Troubleshooting

### Common Issues

#### API Key Issues
```bash
# Check if API key is set
echo $VITE_GEMINI_API_KEY

# Verify API key format
# Should be: AIzaSy...
```

#### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

#### Development Server Issues
```bash
# Check if port is available
lsof -ti:5173

# Kill process if needed
kill -9 $(lsof -ti:5173)
```

### Debug Mode
Enable debug mode in `.env`:
```env
VITE_DEBUG=true
```

## 📚 Documentation

### API Reference
- **Circuit Types** - TypeScript interfaces and types
- **Agent APIs** - AI agent method documentation
- **Component Library** - Available components and properties
- **Calculation Methods** - Electrical engineering formulas

### Tutorials
- **Getting Started** - Basic usage guide
- **Circuit Design** - Best practices and tips
- **Safety Analysis** - Understanding safety assessments
- **AI Features** - Leveraging AI capabilities

## 🤝 Support

### Getting Help
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Comprehensive guides and references
- **Community** - User discussions and support

### Contributing
We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - Advanced language model capabilities
- **React Team** - Excellent UI framework
- **Tailwind CSS** - Beautiful utility-first CSS
- **Lucide** - Comprehensive icon library
- **Electrical Engineering Community** - Standards and best practices

## 📈 Roadmap

### Upcoming Features
- **3D Circuit Visualization** - Three-dimensional circuit representation
- **Simulation Engine** - Real-time circuit behavior simulation
- **Export Functionality** - CAD integration and file export
- **Collaborative Features** - Team-based circuit design
- **Mobile Application** - Native mobile app development
- **Advanced AI Models** - Enhanced circuit generation capabilities

### Performance Improvements
- **WebGL Rendering** - Hardware-accelerated graphics
- **Web Workers** - Background calculation processing
- **Caching System** - Improved response times
- **Progressive Web App** - Offline functionality

---

<div align="center">

**Made with ❤️ by Suyash, Keya, Isha under Prof. Dastagiri**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=flat-square&logo=github)](https://github.com/your-username/electrisim-ai)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green?style=flat-square&logo=vercel)](https://electrisim-ai.vercel.app)

</div>
