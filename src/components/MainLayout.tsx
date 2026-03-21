import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import clsx from 'clsx';
import { LibraryPanel } from './LibraryPanel';
import { Dashboard } from './Dashboard';
import { SportsLibrary } from './SportsLibrary';
import { CreativeLocker } from './CreativeLocker';
import { CanvaLab } from './CanvaLab';
import { GrowthCenter } from './GrowthCenter/GrowthCenter';
import { TrashPanel } from './TrashPanel';
import { FolderView } from './FolderView';
import { ChatProvider } from '../contexts/ChatContext';
import { LibraryProvider } from '../contexts/LibraryContext';
import { ShortcutProvider } from '../contexts/ShortcutContext';

import { FeedbackButton } from './Feedback/FeedbackButton';
import { AdminFeedback } from './Admin/AdminFeedback';

import { useAuth } from '../contexts/AuthContext';

export type ViewType = 'dashboard' | 'chat' | 'library' | 'whiteboard' | 'canvaLab' | 'growth' | 'trash' | 'folder' | 'adminFeedback';

export function MainLayout() {
  const { isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenFolder = (id: string) => {
    setSelectedFolderId(id);
    setActiveView('folder');
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
  };

  return (
    <ChatProvider>
      <LibraryProvider>
        <ShortcutProvider>
          <div className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden font-sans bg-grid-premium">
            <Sidebar 
              activeView={activeView} 
              setActiveView={setActiveView} 
              onOpenFolder={handleOpenFolder}
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
              isMobileOpen={isMobileMenuOpen}
              setIsMobileOpen={setIsMobileMenuOpen}
              onToggleCollapse={toggleSidebar}
            />
            <main className={clsx(
              "flex-1 overflow-y-auto overflow-x-hidden relative min-w-0 transition-all duration-300",
              isSidebarCollapsed ? "ml-0" : "ml-0" // The flex container handles this, but we might need it for mobile
            )}>
              {activeView === 'dashboard' && <Dashboard />}
              {activeView === 'chat' && (
                <div className="flex h-full w-full overflow-hidden">
                  <ChatArea onToggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)} isLibraryOpen={isLibraryOpen} />
                  {isLibraryOpen && <LibraryPanel onClose={() => setIsLibraryOpen(false)} />}
                </div>
              )}
              {activeView === 'folder' && selectedFolderId && (
                <FolderView 
                  folderId={selectedFolderId} 
                  onOpenChat={(id) => {
                    setActiveView('chat');
                  }}
                  onOpenFolder={handleOpenFolder}
                />
              )}
              {activeView === 'library' && <SportsLibrary onOpenChat={() => setActiveView('chat')} />}
              {activeView === 'whiteboard' && <CreativeLocker />}
              {activeView === 'canvaLab' && <CanvaLab />}
              {activeView === 'growth' && <GrowthCenter />}
              {activeView === 'trash' && <TrashPanel />}
              {activeView === 'adminFeedback' && isAdmin && <AdminFeedback />}
            </main>
            <FeedbackButton />
          </div>
        </ShortcutProvider>
      </LibraryProvider>
    </ChatProvider>
  );
}
