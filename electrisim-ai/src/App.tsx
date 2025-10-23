import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CircuitBuilder from './pages/CircuitBuilder';
import ChatPage from './pages/ChatPage';
import AICircuitBuilder from './pages/AICircuitBuilder';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const isFullScreenPage = location.pathname === '/chat' || location.pathname === '/builder' || location.pathname === '/ai-builder';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Only show on landing page */}
      {!isFullScreenPage && (
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  ElectriSim AI
                </Link>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Beta
                </span>
              </div>
              <nav className="flex items-center space-x-4">
                <Link 
                  to="/"
                  className="px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  to="/builder"
                  className="px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Circuit Builder
                </Link>
                <Link 
                  to="/ai-builder"
                  className="px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  AI Circuit Builder
                </Link>
                <Link 
                  to="/chat"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  AI Chat
                </Link>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Circuit
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Load Circuit
                </button>
              </nav>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={isFullScreenPage ? "h-screen" : "flex-1"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/builder" element={<CircuitBuilder />} />
          <Route path="/ai-builder" element={<AICircuitBuilder />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </main>

      {/* Footer - Only show on landing page */}
      {!isFullScreenPage && (
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                ElectriSim AI - Intelligent Electrical Safety Simulator
              </div>
              <div className="text-center">
                <div>Made as a course Project</div>
                <div>Electrisim AI</div>
              </div>
            </div>
      </div>
        </footer>
      )}
      </div>
  );
}

export default App;