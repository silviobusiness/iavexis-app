/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GrowthProvider } from './contexts/GrowthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayout } from './components/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomCursor } from './components/CustomCursor';

function AppContent() {
  return (
    <>
      <CustomCursor />
      <AuthProvider>
        <DashboardProvider>
          <GrowthProvider>
            <FeedbackProvider>
              <ErrorBoundary>
                <MainLayout />
              </ErrorBoundary>
            </FeedbackProvider>
          </GrowthProvider>
        </DashboardProvider>
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
