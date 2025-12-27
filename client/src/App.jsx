import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

import InitiatorDashboard from './pages/dashboard/InitiatorDashboard';
import ContributorDashboard from './pages/dashboard/ContributorDashboard';

import NewMissionPage from './pages/missions/NewMissionPage';
import ContributorApplication from './pages/applications/ContributorApplication';

import MissionExplorePage from './pages/missions/MissionExplorePage';
import MissionDetailsPage from './pages/missions/MissionDetailsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import ContactPage from './pages/ContactPage';
import NetworkPage from './pages/NetworkPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-white selection:text-black">
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<MissionExplorePage />} />
          <Route path="/missions/:id" element={<MissionDetailsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Auth */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Navigate to="/dashboard/contributor" replace />} />
          <Route path="/dashboard/initiator" element={<InitiatorDashboard />} />
          <Route path="/dashboard/contributor" element={<ContributorDashboard />} />
          <Route path="/dashboard/missions/:id" element={<div>Mission Details (Coming Soon)</div>} /> {/* Placeholder */}

          {/* Flows */}
          <Route path="/missions/new" element={<NewMissionPage />} />
          <Route path="/apply" element={<ContributorApplication />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
