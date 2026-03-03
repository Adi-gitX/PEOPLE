import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './components/auth/AuthGuard';
import { useAuthStore } from './store/useAuthStore';
import { getDefaultPathForRole } from './lib/roleRouting';


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
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminAdminsPage from './pages/admin/AdminAdminsPage';
import AdminSecurityPage from './pages/admin/AdminSecurityPage';
import WalletPage from './pages/WalletPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import FAQPage from './pages/FAQPage';
import NotFoundPage from './pages/NotFoundPage';
import PricingPage from './pages/PricingPage';
import WorkflowsPage from './pages/WorkflowsPage';
import DeveloperPlatformPage from './pages/DeveloperPlatformPage';
import WaitlistPage from './pages/WaitlistPage';
import HelpCenterPage from './pages/HelpCenterPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import CareersPage from './pages/CareersPage';
import { AdminGuard } from './components/auth/AdminGuard';
import { AdminScopeGuard } from './components/auth/AdminScopeGuard';

function DashboardRoleRedirect() {
  const { role, adminAccess } = useAuthStore();
  const effectiveRole = role === 'admin' && !adminAccess ? 'contributor' : role;
  return <Navigate to={getDefaultPathForRole(effectiveRole)} replace />;
}

function RoleScopedPageRedirect({ suffix }) {
  const { role, adminAccess } = useAuthStore();
  const effectiveRole = role === 'admin' && !adminAccess ? 'contributor' : role;

  if (effectiveRole === 'initiator') {
    return <Navigate to={`/dashboard/initiator/${suffix}`} replace />;
  }

  if (effectiveRole === 'admin') {
    if (suffix === 'messages') return <Navigate to="/admin/messages" replace />;
    if (suffix === 'wallet') return <Navigate to="/admin/payments" replace />;
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to={`/dashboard/contributor/${suffix}`} replace />;
}

function InitiatorMissionApplicationsRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/initiator/missions/${id}/applications`} replace />;
}

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
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/developers" element={<DeveloperPlatformPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/careers" element={<CareersPage />} />


          <Route path="/login" element={
            <GuestGuard><AuthPage /></GuestGuard>
          } />
          <Route path="/signup" element={
            <GuestGuard><AuthPage /></GuestGuard>
          } />




          <Route path="/dashboard" element={
            <AuthGuard>
              <DashboardRoleRedirect />
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

          <Route path="/dashboard/contributor/explore" element={
            <AuthGuard requireRole="contributor">
              <MissionExplorePage />
            </AuthGuard>
          } />

          <Route path="/dashboard/contributor/missions/:id" element={
            <AuthGuard requireRole="contributor">
              <MissionDetailsPage />
            </AuthGuard>
          } />

          <Route path="/dashboard/initiator/network" element={
            <AuthGuard requireRole="initiator">
              <NetworkPage />
            </AuthGuard>
          } />

          <Route path="/dashboard/initiator/missions/:id" element={
            <AuthGuard requireRole="initiator">
              <MissionDetailsPage />
            </AuthGuard>
          } />


          <Route path="/dashboard/profile" element={
            <AuthGuard>
              <ProfileSettings />
            </AuthGuard>
          } />

          <Route path="/dashboard/settings" element={
            <AuthGuard>
              <Navigate to="/dashboard/profile" replace />
            </AuthGuard>
          } />


          <Route path="/dashboard/initiator/missions/new" element={
            <AuthGuard requireRole="initiator">
              <NewMissionPage />
            </AuthGuard>
          } />

          <Route path="/missions/new" element={
            <AuthGuard requireRole="initiator">
              <Navigate to="/dashboard/initiator/missions/new" replace />
            </AuthGuard>
          } />

          <Route path="/dashboard/initiator/missions/:id/applications" element={
            <AuthGuard requireRole="initiator">
              <MissionApplicationsPage />
            </AuthGuard>
          } />

          <Route path="/missions/:id/applications" element={
            <AuthGuard requireRole="initiator">
              <InitiatorMissionApplicationsRedirect />
            </AuthGuard>
          } />


          <Route path="/apply" element={
            <AuthGuard requireRole="contributor">
              <ContributorApplication />
            </AuthGuard>
          } />

          <Route path="/dashboard/contributor/applications" element={
            <AuthGuard requireRole="contributor">
              <MyApplicationsPage />
            </AuthGuard>
          } />

          <Route path="/applications" element={
            <AuthGuard requireRole="contributor">
              <Navigate to="/dashboard/contributor/applications" replace />
            </AuthGuard>
          } />

          <Route path="/wallet" element={
            <AuthGuard>
              <RoleScopedPageRedirect suffix="wallet" />
            </AuthGuard>
          } />

          <Route path="/notifications" element={
            <AuthGuard>
              <RoleScopedPageRedirect suffix="notifications" />
            </AuthGuard>
          } />

          <Route path="/messages" element={
            <AuthGuard>
              <RoleScopedPageRedirect suffix="messages" />
            </AuthGuard>
          } />

          <Route path="/dashboard/contributor/messages" element={
            <AuthGuard requireRole="contributor">
              <MessagesPage />
            </AuthGuard>
          } />

          <Route path="/dashboard/initiator/messages" element={
            <AuthGuard requireRole="initiator">
              <MessagesPage />
            </AuthGuard>
          } />

          <Route path="/dashboard/contributor/notifications" element={
            <AuthGuard requireRole="contributor">
              <NotificationsPage />
            </AuthGuard>
          } />

          <Route path="/dashboard/initiator/notifications" element={
            <AuthGuard requireRole="initiator">
              <NotificationsPage />
            </AuthGuard>
          } />

          <Route path="/dashboard/contributor/wallet" element={
            <AuthGuard requireRole="contributor">
              <WalletPage />
            </AuthGuard>
          } />

          <Route path="/dashboard/initiator/wallet" element={
            <AuthGuard requireRole="initiator">
              <WalletPage />
            </AuthGuard>
          } />

          <Route path="/admin" element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          } />
          <Route path="/admin/users" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['users.read']}>
                <AdminUsersPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/missions" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['missions.read']}>
                <AdminMissionsPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/disputes" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['disputes.read']}>
                <AdminDisputesPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/support" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['support.read']}>
                <AdminSupportPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/messages" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['messages.read']}>
                <AdminMessagesPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/withdrawals" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['withdrawals.read']}>
                <AdminWithdrawalsPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/payments" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['payments.read', 'escrow.read']}>
                <AdminPaymentsPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/audit" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['audit.read']}>
                <AdminAuditLogsPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/admins" element={
            <AdminGuard>
              <AdminScopeGuard requiredScopes={['admins.manage']}>
                <AdminAdminsPage />
              </AdminScopeGuard>
            </AdminGuard>
          } />
          <Route path="/admin/security" element={
            <AdminGuard>
              <AdminSecurityPage />
            </AdminGuard>
          } />
          <Route path="/admin/settings" element={
            <AdminGuard>
              <Navigate to="/admin/security" replace />
            </AdminGuard>
          } />
          <Route path="/admin/*" element={
            <AdminGuard>
              <Navigate to="/admin" replace />
            </AdminGuard>
          } />


          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
