/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { GrowthProvider } from './contexts/GrowthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { MainLayout } from './components/MainLayout';
import { LoginScreen } from './components/LoginScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomCursor } from './components/CustomCursor';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <CustomCursor />
      {user ? (
        <DashboardProvider>
          <ChatProvider>
            <GrowthProvider>
              <FeedbackProvider>
                <ErrorBoundary>
                  <MainLayout />
                </ErrorBoundary>
              </FeedbackProvider>
            </GrowthProvider>
          </ChatProvider>
        </DashboardProvider>
      ) : <LoginScreen />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
