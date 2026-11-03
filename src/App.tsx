import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { CookieProvider } from '@/context/CookieContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Main App Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { SavingsPage } from '@/pages/SavingsPage';
import { PredictionsPage } from '@/pages/PredictionsPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { LearnPage } from '@/pages/LearnPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AiAssistantPage } from '@/pages/AiAssistantPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PrivacyDataPage } from '@/pages/PrivacyDataPage';
import { HelpSupportPage } from '@/pages/HelpSupportPage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';

// Legal Pages
import { PrivacyPolicyPage } from '@/pages/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/legal/TermsOfServicePage';
import { RefundPolicyPage } from '@/pages/legal/RefundPolicyPage';
import { CookiePolicyPage } from '@/pages/legal/CookiePolicyPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FinanceProvider>
          <CookieProvider>
            <Routes>
              {/* Public Authentication Pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* Public Legal & Policy Pages */}
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />

              {/* Protected Main Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/budgets" element={<BudgetsPage />} />
                  <Route path="/savings" element={<SavingsPage />} />
                  <Route path="/predictions" element={<PredictionsPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/learn" element={<LearnPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/ai-assistant" element={<AiAssistantPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/privacy-data" element={<PrivacyDataPage />} />
                  <Route path="/help" element={<HelpSupportPage />} />
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CookieProvider>
        </FinanceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
