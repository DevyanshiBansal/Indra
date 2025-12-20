import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIChatbot } from './components/AIChatbot';

import { LandingPage } from './pages/urban/LandingPage';
import { AssessmentPage } from './pages/urban/AssessmentPage';
import { VisualizerPage } from './pages/urban/VisualizerPage';
import { VendorConnectPage } from './pages/urban/VendorConnectPage';

import { DashboardPage } from './pages/gramin/DashboardPage';
import { WaterManagementPage } from './pages/gramin/WaterManagementPage';
import { SmartCroppingPage } from './pages/gramin/SmartCroppingPage';

function AppContent() {
  const { mode } = useTheme();

  useEffect(() => {
    if (mode === 'rural' && window.location.pathname.startsWith('/gramin') === false) {
      window.location.href = '/gramin';
    } else if (mode === 'urban' && window.location.pathname.startsWith('/gramin')) {
      window.location.href = '/';
    }
  }, [mode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/visualizer" element={<VisualizerPage />} />
          <Route path="/vendors" element={<VendorConnectPage />} />

          <Route path="/gramin" element={<DashboardPage />} />
          <Route path="/gramin/water-management" element={<WaterManagementPage />} />
          <Route path="/gramin/smart-cropping" element={<SmartCroppingPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <AIChatbot />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
