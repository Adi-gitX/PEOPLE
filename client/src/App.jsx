import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

import InitiatorDashboard from './pages/dashboard/InitiatorDashboard';
import ContributorDashboard from './pages/dashboard/ContributorDashboard';

import NewMissionPage from './pages/missions/NewMissionPage';
import ContributorApplication from './pages/applications/ContributorApplication';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-white selection:text-black">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/dashboard/initiator" element={<InitiatorDashboard />} />
          <Route path="/dashboard/contributor" element={<ContributorDashboard />} />
          <Route path="/missions/new" element={<NewMissionPage />} />
          <Route path="/apply" element={<ContributorApplication />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
