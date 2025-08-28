import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CacheProvider } from "./contexts/CacheContext";
import { Toaster } from "sonner";

// 基本的なページコンポーネント
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import DeployTest from "./pages/DeployTest";

// 求職者関連ページ
import JobSeekerLanding from "./pages/JobSeekerLanding";
import { JobSeekerLogin } from "./pages/JobSeekerLogin";
import JobSeekerRegister from "./pages/JobSeekerRegister";
import { RegistrationVerification } from "./components/RegistrationVerification";
import { JobSeekerDashboard } from "./pages/JobSeekerDashboard";
import { JobSeekerMyPage } from "./pages/JobSeekerMyPage";
import JobSeekerAuth from "./pages/JobSeekerAuth";

// 企業関連ページ
import EmployerLanding from "./pages/EmployerLanding";
import { EmployerLogin } from "./pages/EmployerLogin";
import EmployerDashboard from "./pages/EmployerDashboard";
import { CompanyMyPage } from "./pages/CompanyMyPage";

// 管理者関連ページ
import AdminLogin from "./pages/AdminLogin";
import { AdminOverview } from "./pages/AdminOverview";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import { AdminCompanies } from "./pages/AdminCompanies";
import { AdminJobSeekers } from "./pages/AdminJobSeekers";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminNotifications } from "./pages/AdminNotifications";
import { AdminNotificationHistory } from "./pages/AdminNotificationHistory";
import { AdminInterviewAnalytics } from "./pages/AdminInterviewAnalytics";

// その他のページ
import { JobSearch } from "./pages/JobSearch";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import JobSeekerForgotPassword from "./pages/JobSeekerForgotPassword";
import CompanyForgotPassword from "./pages/CompanyForgotPassword";

import Documents from "./pages/Documents";
import AccurateSkillSheetPage from "./pages/AccurateSkillSheetPage";
import { NotificationsPage } from "./pages/NotificationsPage";

// 法的事項ページ
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CommercialTransaction from "./pages/CommercialTransaction";

// フッターコンポーネント
import { Footer } from "./components/Footer";

// 保護されたルート
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthGuard } from "./components/AuthGuard";
import RedirectToJobSeekerMyPage from "./components/RedirectToJobSeekerMyPage";

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <AuthProvider>
          <CacheProvider>
            <Router>
            <div className="min-h-screen bg-background">
            <Routes>
              {/* パブリックルート */}
              <Route path="/" element={<RedirectToJobSeekerMyPage />} />
              <Route path="/index" element={<Index />} />
              <Route path="/deploy-test" element={<DeployTest />} />
              
              {/* 求職者関連 */}
              <Route path="/jobseeker" element={<JobSeekerLogin />} />
              <Route path="/jobseeker/login" element={<JobSeekerLogin />} />
              <Route path="/jobseeker/register" element={<JobSeekerRegister />} />
              <Route path="/register/verify/:token" element={<RegistrationVerification />} />
              <Route path="/jobseeker/auth" element={<JobSeekerAuth />} />
              <Route path="/jobseeker/dashboard" element={<JobSeekerDashboard />} />
              <Route path="/jobseeker/my-page" element={<JobSeekerMyPage />} />
              <Route path="/jobseeker/documents" element={<Documents />} />
              <Route path="/jobseeker/forgot-password" element={<JobSeekerForgotPassword />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              
              {/* 企業関連 */}
              <Route path="/employer" element={<EmployerLanding />} />
              <Route path="/employer/login" element={<EmployerLogin />} />
              <Route path="/employer/dashboard" element={<EmployerDashboard />} />
              <Route path="/employer/my-page" element={<CompanyMyPage />} />
              <Route path="/employer/documents" element={<Documents />} />
              <Route path="/employer/forgot-password" element={<CompanyForgotPassword />} />
              
              {/* 管理者関連 */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <AuthGuard requiredUserType="admin">
                  <AdminOverview />
                </AuthGuard>
              } />
              <Route path="/admin/overview" element={
                <AuthGuard requiredUserType="admin">
                  <AdminOverview />
                </AuthGuard>
              } />
              <Route path="/admin/dashboard" element={
                <AuthGuard requiredUserType="admin">
                  <AdminOverview />
                </AuthGuard>
              } />
              <Route path="/admin/settings" element={
                <AuthGuard requiredUserType="admin">
                  <AdminSettingsPage />
                </AuthGuard>
              } />
              <Route path="/admin/companies" element={
                <AuthGuard requiredUserType="admin">
                  <AdminCompanies />
                </AuthGuard>
              } />
              <Route path="/admin/jobseekers" element={
                <AuthGuard requiredUserType="admin">
                  <AdminJobSeekers />
                </AuthGuard>
              } />
              {/* 単数形のパスから複数形へのリダイレクト */}
              <Route path="/admin/jobseeker" element={
                <Navigate to="/admin/jobseekers" replace />
              } />
              <Route path="/admin/jobseeker/" element={
                <Navigate to="/admin/jobseekers" replace />
              } />
              <Route path="/admin/users" element={
                <AuthGuard requiredUserType="admin">
                  <AdminUsers />
                </AuthGuard>
              } />
              <Route path="/admin/notifications" element={
                <AuthGuard requiredUserType="admin">
                  <AdminNotifications />
                </AuthGuard>
              } />
              <Route path="/admin/notification-history" element={
                <AuthGuard requiredUserType="admin">
                  <AdminNotificationHistory />
                </AuthGuard>
              } />
              <Route path="/admin/interview-analytics" element={
                <AuthGuard requiredUserType="admin">
                  <AdminInterviewAnalytics />
                </AuthGuard>
              } />
              
              {/* その他のページ */}
              <Route path="/jobs" element={<JobSearch />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/password-reset" element={<ForgotPassword />} />

              <Route path="/documents" element={<Documents />} />
              <Route path="/skill-sheet" element={<AccurateSkillSheetPage />} />

              {/* 法的事項ページ */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/commercial-transaction" element={<CommercialTransaction />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
            <Toaster />
          </div>
        </Router>
          </CacheProvider>
        </AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
