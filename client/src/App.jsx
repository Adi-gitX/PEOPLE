import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './components/auth/AuthGuard';


import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import InitiatorDashboard from './pages/dashboard/InitiatorDashboard';
import ContributorDashboard from './pages/dashboard/ContributorDashboard';
import ProfileSettings from './pages/dashboard/ProfileSettings';
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

          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<MissionExplorePage />} />
          <Route path="/missions/:id" element={<MissionDetailsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/contact" element={<ContactPage />} />


          <Route path="/login" element={
            <GuestGuard><AuthPage /></GuestGuard>
          } />
          <Route path="/signup" element={
            <GuestGuard><AuthPage /></GuestGuard>
          } />




          <Route path="/dashboard" element={
            <AuthGuard>
              <Navigate to="/dashboard/contributor" replace />
            </AuthGuard>
          } />


          <Route path="/dashboard/initiator" element={
            <AuthGuard requireRole="initiator">
              <InitiatorDashboard />
            </AuthGuard>
          } />


          <Route path="/dashboard/contributor" element={
            <AuthGuard requireRole="contributor">
              <ContributorDashboard />
            </AuthGuard>
          } />


          <Route path="/dashboard/settings" element={
            <AuthGuard>
              <ProfileSettings />
            </AuthGuard>
          } />


          <Route path="/missions/new" element={
            <AuthGuard requireRole="initiator">
              <NewMissionPage />
            </AuthGuard>
          } />


          <Route path="/apply" element={
            <AuthGuard requireRole="contributor">
              <ContributorApplication />
            </AuthGuard>
          } />


          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-zinc-500 mb-6">Page not found</p>
                <a href="/" className="text-white underline">Go home</a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
