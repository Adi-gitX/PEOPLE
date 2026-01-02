import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './components/auth/AuthGuard';


import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import InitiatorDashboard from './pages/dashboard/InitiatorDashboard';
import ContributorDashboard from './pages/dashboard/ContributorDashboard';
import ProfileSettings from './pages/dashboard/ProfileSettings';
import NewMissionPage from './pages/missions/NewMissionPage';
import ContributorApplication from './pages/applications/ContributorApplication';
import MyApplicationsPage from './pages/applications/MyApplicationsPage';
import MissionExplorePage from './pages/missions/MissionExplorePage';
import MissionDetailsPage from './pages/missions/MissionDetailsPage';
import MissionApplicationsPage from './pages/missions/MissionApplicationsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import ContactPage from './pages/ContactPage';
import NetworkPage from './pages/NetworkPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminMissionsPage from './pages/admin/AdminMissionsPage';
import AdminDisputesPage from './pages/admin/AdminDisputesPage';
import WalletPage from './pages/WalletPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import FAQPage from './pages/FAQPage';
import NotFoundPage from './pages/NotFoundPage';
import { AdminGuard } from './components/auth/AdminGuard';

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
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/faq" element={<FAQPage />} />


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

          <Route path="/missions/:id/applications" element={
            <AuthGuard requireRole="initiator">
              <MissionApplicationsPage />
            </AuthGuard>
          } />


          <Route path="/apply" element={
            <AuthGuard requireRole="contributor">
              <ContributorApplication />
            </AuthGuard>
          } />

          <Route path="/applications" element={
            <AuthGuard requireRole="contributor">
              <MyApplicationsPage />
            </AuthGuard>
          } />

          <Route path="/wallet" element={
            <AuthGuard>
              <WalletPage />
            </AuthGuard>
          } />

          <Route path="/notifications" element={
            <AuthGuard>
              <NotificationsPage />
            </AuthGuard>
          } />

          <Route path="/messages" element={
            <AuthGuard>
              <MessagesPage />
            </AuthGuard>
          } />

          <Route path="/admin" element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          } />
          <Route path="/admin/users" element={
            <AdminGuard>
              <AdminUsersPage />
            </AdminGuard>
          } />
          <Route path="/admin/missions" element={
            <AdminGuard>
              <AdminMissionsPage />
            </AdminGuard>
          } />
          <Route path="/admin/disputes" element={
            <AdminGuard>
              <AdminDisputesPage />
            </AdminGuard>
          } />


          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
