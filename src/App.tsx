/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatProvider } from './contexts/ChatContext';
import { GrowthProvider } from './contexts/GrowthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { MainLayout } from './components/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomCursor } from './components/CustomCursor';

function AppContent() {
  return (
    <>
      <CustomCursor />
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
    </>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
