import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Shield, 
  Brain, 
  Settings, 
  BarChart3, 
  Users,
  ArrowRight,
  Play,
  BookOpen,
  Award,
  Grid3X3
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Intelligent Electrical
            <span className="text-blue-600"> Safety Simulator</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Build, analyze, and optimize electrical circuits with AI-powered safety recommendations. 
            Learn electrical engineering through interactive simulation and real-time analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/ai-builder"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="h-5 w-5 mr-2" />
              AI Circuit Builder
            </Link>
            <Link 
              to="/builder"
              className="inline-flex items-center px-8 py-4 border-2 border-blue-600 text-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
            >
              <Grid3X3 className="h-5 w-5 mr-2" />
              Manual Builder
            </Link>
            <Link 
              to="/chat"
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <Brain className="h-5 w-5 mr-2" />
              Ask AI Assistant
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Electrical Engineering
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to design, analyze, and learn about electrical circuits safely and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Settings className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Circuit Builder</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Drag and drop components to build complex electrical circuits with real-time visualization and analysis.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Professional component library</li>
                <li>• Interactive drag & drop</li>
                <li>• Real-time circuit analysis</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Safety Analysis</h3>
              </div>
              <p className="text-gray-600 mb-4">
                AI-powered safety assessment with hazard detection and compliance checking for electrical standards.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• NEC compliance checking</li>
                <li>• Hazard identification</li>
                <li>• Safety recommendations</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Brain className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">AI Assistant</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Get instant answers to electrical engineering questions with context-aware AI assistance.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Circuit-specific advice</li>
                <li>• Educational explanations</li>
                <li>• Troubleshooting help</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Real-time Analysis</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Advanced electrical calculations including voltage, current, power, and efficiency analysis.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Voltage & current calculations</li>
                <li>• Power consumption analysis</li>
                <li>• Efficiency optimization</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Educational</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Learn electrical engineering concepts through interactive simulation and guided tutorials.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Interactive learning</li>
                <li>• Component explanations</li>
                <li>• Best practices guide</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-teal-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Professional Tools</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Industry-standard components and measurements for professional electrical design and analysis.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Professional components</li>
                <li>• Measurement instruments</li>
                <li>• Industry standards</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Building?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students and professionals using ElectriSim AI for electrical circuit design and analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/builder"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link 
                to="/chat"
                className="inline-flex items-center px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
              >
                Try AI Assistant
                <Brain className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
