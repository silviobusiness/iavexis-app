import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useChat } from '../contexts/ChatContext';
import { Plus, MessageSquare, Folder as FolderIcon, MoreVertical, Pin, Trash2, Search, Zap, TrendingUp, ChevronRight, ChevronDown, FolderOpen, LayoutDashboard, Library, Users, PenTool, Edit2, Star, X, Copy, DollarSign, Menu, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import { ViewType } from './MainLayout';
import { Tooltip } from './Tooltip';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onOpenFolder: (id: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ 
  activeView, 
  setActiveView, 
  onOpenFolder, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen,
  onToggleCollapse
}: SidebarProps) {
  const isAdmin = true;
  const { chats, folders, activeChatId, setActiveChatId, createChat, deleteChat, updateChat, createFolder, updateFolder, deleteFolder, duplicateFolder } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('expandedFolders');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('expandedFolders', JSON.stringify(expandedFolders));
  }, [expandedFolders]);
  const [creatingFolderParentId, setCreatingFolderParentId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeChatId) {
      const chat = chats.find(c => c.id === activeChatId);
      if (chat && chat.folderId) {
        const path: string[] = [];
        let currentFolderId: string | null | undefined = chat.folderId;
        
        while (currentFolderId) {
          path.push(currentFolderId);
          const folder = folders.find(f => f.id === currentFolderId);
          currentFolderId = folder?.parentId;
        }
        
        setExpandedFolders(prev => {
          const next = { ...prev };
          path.forEach(id => next[id] = true);
          return next;
        });
      }
    }
  }, [activeChatId, chats, folders]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), creatingFolderParentId);
      setNewFolderName('');
      setIsCreatingFolder(false);
      setCreatingFolderParentId(null);
    }
  };

  const handleChatSelect = (chatId: string, type: 'single' | 'toggle' | 'range') => {
    if (type === 'single') {
      setSelectedChatIds([chatId]);
    } else if (type === 'toggle') {
      setSelectedChatIds(prev => prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]);
    } else if (type === 'range') {
      setSelectedChatIds(prev => prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const searchQueryLower = searchQuery.toLowerCase();

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQueryLower) ||
    (chat.tags && chat.tags.some((tag: string) => tag.toLowerCase().includes(searchQueryLower)))
  );

  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const favoriteChats = filteredChats.filter(c => c.isFavorite);
  const mostUsedChats = [...filteredChats]
    .filter(c => !c.isPinned && !c.isFavorite)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  const unpinnedChats = filteredChats.filter(c => !c.isPinned && !c.isFavorite && !c.folderId);

  // Build tree structure
  const buildFolderTree = (parentId: string | null = null): any[] => {
    return folders
      .filter(f => f.parentId === parentId && !f.deleted)
      .map(folder => {
        const subfolders = buildFolderTree(folder.id);
        const chats = filteredChats.filter(c => c.folderId === folder.id);
        const totalChats = chats.length + subfolders.reduce((acc: number, sub: any) => acc + sub.totalChats, 0);
        return {
          ...folder,
          subfolders,
          chats,
          totalChats
        };
      });
  };

  const folderMatches = (folder: any): boolean => {
    const nameMatch = folder.name.toLowerCase().includes(searchQueryLower);
    const subfoldersMatch = folder.subfolders && folder.subfolders.some((sf: any) => folderMatches(sf));
    const chatsMatch = folder.chats && folder.chats.length > 0;
    
    return nameMatch || subfoldersMatch || chatsMatch;
  };

  const folderTree = buildFolderTree(null).filter(folder => folderMatches(folder));

  const navItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat Criativo', icon: MessageSquare },
    { id: 'library', label: 'Biblioteca Esportiva', icon: Library },
    { id: 'growth', label: 'Central de Crescimento', icon: TrendingUp },
    { id: 'whiteboard', label: 'Vestiário Criativo', icon: PenTool },
    ...(isAdmin ? [{ id: 'adminFeedback' as ViewType, label: 'Admin Feedback', icon: LayoutDashboard }] : []),
  ];

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Toggle Button */}
      <div className="fixed top-4 left-4 z-[110] lg:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all shadow-xl"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={clsx(
        "bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800 flex flex-col h-full shadow-2xl transition-all duration-300 z-[105]",
        isCollapsed ? "w-20" : "w-80",
        "fixed inset-y-0 left-0 lg:relative",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* User Profile & Toggle */}
        <div className={clsx(
          "p-4 border-b border-zinc-800 flex items-center bg-zinc-950/30 relative",
          isCollapsed ? "flex-col gap-4 justify-center" : "justify-between"
        )} ref={profileMenuRef}>
          <div 
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="relative">
              <img 
                src={`https://ui-avatars.com/api/?name=Convidado&background=8EB69B&color=051F20`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border border-zinc-700 group-hover:border-emerald-500/50 transition-all duration-300 shadow-lg"
              />
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-500 font-medium">Perfil</span>
                <ChevronDown className={clsx("w-3 h-3 text-zinc-500 transition-transform", isProfileOpen && "rotate-180")} />
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className={clsx(
              "p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-all hover:text-white hidden lg:flex",
              isCollapsed && "rotate-180"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={clsx(
                  "absolute mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50",
                  isCollapsed ? "left-full ml-2 top-0 w-64" : "top-full left-4 right-4"
                )}
              >
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-zinc-200 truncate">Usuário Convidado</h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Navigation */}
        <nav className="p-3 space-y-1 border-b border-zinc-800">
          {navItems.map((item) => (
            <Tooltip key={item.id} text={isCollapsed ? item.label : ''}>
              <button
                onClick={() => {
                  setActiveView(item.id);
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center rounded-lg text-sm font-medium sidebar-item-premium interactive-hover interactive-click transition-all duration-300",
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  activeView === item.id 
                    ? "sidebar-item-active" 
                    : "sidebar-item-inactive"
                )}
              >
                <item.icon className={clsx("w-5 h-5 transition-all duration-300", activeView === item.id && "icon-glow")} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            </Tooltip>
          ))}
        </nav>

        {/* Chat Section */}
        <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
          {/* New Chat Action */}
          <div className={clsx(
            "px-3 py-4 flex gap-2.5 items-center",
            isCollapsed ? "flex-col" : "justify-center"
          )}>
            <Tooltip text={isCollapsed ? "Novo Chat" : ""}>
              <motion.button 
                animate={isAnimating ? { rotate: [0, 20, -20, 0] } : {}}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                onClick={() => {
                  createChat();
                  setActiveView('chat');
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={clsx(
                  "sidebar-item-active text-emerald-400 font-semibold rounded-[6px] flex items-center justify-center shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 interactive-hover interactive-click",
                  isCollapsed ? "w-10 h-10 p-0" : "flex-1 py-2.5 px-3 gap-2"
                )}
              >
                <Plus className="w-5 h-5 icon-glow" />
                {!isCollapsed && <span>Chat</span>}
              </motion.button>
            </Tooltip>
            <Tooltip text={isCollapsed ? "Canva Lab" : ""}>
              <button 
                onClick={() => {
                  setActiveView('canvaLab');
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={clsx(
                  "bg-gradient-to-r from-[#00C4CC] via-[#7D2AE8] to-[#FF007F] hover:opacity-90 text-white font-bold rounded-[6px] flex items-center justify-center transition-all shadow-lg shadow-purple-500/20 bg-[length:200%_200%] animate-gradient-x relative overflow-hidden group interactive-hover interactive-click",
                  isCollapsed ? "w-10 h-10 p-0" : "flex-1 py-2.5 px-3 gap-2"
                )}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isCollapsed ? (
                  <span className="font-sans tracking-tighter text-lg italic relative z-10">C</span>
                ) : (
                  <span className="font-sans tracking-tighter text-lg italic relative z-10">Canva</span>
                )}
              </button>
            </Tooltip>
          </div>

          {/* Search */}
          {!isCollapsed && (
            <div className="px-3 pb-2">
              <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar chats..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/50 backdrop-blur-sm border border-zinc-800 rounded-[4px] pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 shadow-inner"
                />
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="px-3 pb-2 flex justify-center">
              <Tooltip text="Buscar chats">
                <button 
                  onClick={() => setIsCollapsed(false)}
                  className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-emerald-500 transition-all"
                >
                  <Search className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          )}

          {/* Folders List */}
          <div className={clsx("px-3 pb-2 mt-8", isCollapsed && "hidden")}>
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <FolderIcon className="w-3.5 h-3.5 text-yellow-500/80" />
              Pastas
            </h3>
            <Tooltip text="Organize seus chats em pastas">
              <button 
                onClick={() => setIsCreatingFolder(true)}
                className="p-1 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all duration-300"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
          
          {isCreatingFolder && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateFolder} 
              className="px-2 mb-4 space-y-2"
            >
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nome da pasta..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-[4px] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-semibold py-1.5 rounded-[6px] transition-colors interactive-hover interactive-click"
                >
                  Criar
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-1.5 rounded-[6px] transition-colors interactive-hover interactive-click"
                >
                  Cancelar
                </button>
              </div>
            </motion.form>
          )}

          <div 
            className="space-y-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e: React.DragEvent) => {
              const folderId = e.dataTransfer.getData('folderId');
              if (folderId) {
                updateFolder(folderId, { parentId: null });
              }
            }}
          >
            {folderTree.map(folder => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                level={0}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                updateChat={updateChat}
                deleteChat={deleteChat}
                activeChatId={activeChatId}
                activeView={activeView}
                setActiveChatId={setActiveChatId}
                setActiveView={setActiveView}
                folders={folders}
                updateFolder={updateFolder}
                deleteFolder={deleteFolder}
                duplicateFolder={duplicateFolder}
                onCreateSubfolder={(parentId: string) => {
                  setCreatingFolderParentId(parentId);
                  setIsCreatingFolder(true);
                }}
                selectedChatIds={selectedChatIds}
                onSelectChat={handleChatSelect}
                onOpenFolder={onOpenFolder}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
              />
            ))}
          </div>
        </div>

        {/* Chats List */}
        <div className={clsx("flex-1 px-3 py-2 space-y-4 border-t border-zinc-800 pt-4", isCollapsed && "hidden")}>
          {favoriteChats.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-2 mb-2 flex items-center gap-1"><span className="text-yellow-400">⭐</span> Favoritos</h3>
              <div className="space-y-1">
                {favoriteChats.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat} 
                    isActive={activeChatId === chat.id && activeView === 'chat'} 
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setActiveView('chat');
                      if (isMobileOpen) setIsMobileOpen(false);
                    }}
                    onRename={(title: string) => updateChat(chat.id, { title })}
                    onTogglePin={() => updateChat(chat.id, { isPinned: !chat.isPinned })}
                    onToggleFavorite={() => updateChat(chat.id, { isFavorite: !chat.isFavorite })}
                    onDelete={() => deleteChat(chat.id)}
                    folders={folders}
                    onMoveToFolder={(folderId: string | null) => updateChat(chat.id, { folderId })}
                    isSelected={selectedChatIds.includes(chat.id)}
                    onSelect={handleChatSelect}
                    selectedChatIds={selectedChatIds}
                  />
                ))}
              </div>
            </div>
          )}
          {pinnedChats.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-2 mb-2 flex items-center gap-1"><span className="text-emerald-400">📌</span> Fixados</h3>
              <div className="space-y-1">
                {pinnedChats.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat} 
                    isActive={activeChatId === chat.id && activeView === 'chat'} 
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setActiveView('chat');
                      if (isMobileOpen) setIsMobileOpen(false);
                    }}
                    onRename={(title: string) => updateChat(chat.id, { title })}
                    onTogglePin={() => updateChat(chat.id, { isPinned: !chat.isPinned })}
                    onToggleFavorite={() => updateChat(chat.id, { isFavorite: !chat.isFavorite })}
                    onDelete={() => deleteChat(chat.id)}
                    folders={folders}
                    onMoveToFolder={(folderId: string | null) => updateChat(chat.id, { folderId })}
                    isSelected={selectedChatIds.includes(chat.id)}
                    onSelect={handleChatSelect}
                    selectedChatIds={selectedChatIds}
                  />
                ))}
              </div>
            </div>
          )}

          {mostUsedChats.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-2 mb-2 flex items-center gap-1"><span className="text-orange-500">🔥</span> Mais usados</h3>
              <div className="space-y-1">
                {mostUsedChats.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat} 
                    isActive={activeChatId === chat.id && activeView === 'chat'} 
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setActiveView('chat');
                      if (isMobileOpen) setIsMobileOpen(false);
                    }}
                    onRename={(title: string) => updateChat(chat.id, { title })}
                    onTogglePin={() => updateChat(chat.id, { isPinned: !chat.isPinned })}
                    onToggleFavorite={() => updateChat(chat.id, { isFavorite: !chat.isFavorite })}
                    onDelete={() => deleteChat(chat.id)}
                    folders={folders}
                    onMoveToFolder={(folderId: string | null) => updateChat(chat.id, { folderId })}
                    isSelected={selectedChatIds.includes(chat.id)}
                    onSelect={handleChatSelect}
                    selectedChatIds={selectedChatIds}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-2 mb-2">Recentes</h3>
            <div className="space-y-1">
              {unpinnedChats.map(chat => (
                <ChatItem 
                  key={chat.id} 
                  chat={chat} 
                  isActive={activeChatId === chat.id && activeView === 'chat'} 
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setActiveView('chat');
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  onRename={(title: string) => updateChat(chat.id, { title })}
                  onTogglePin={() => updateChat(chat.id, { isPinned: !chat.isPinned })}
                  onToggleFavorite={() => updateChat(chat.id, { isFavorite: !chat.isFavorite })}
                  onDelete={() => deleteChat(chat.id)}
                  folders={folders}
                  onMoveToFolder={(folderId: string | null) => updateChat(chat.id, { folderId })}
                  isSelected={selectedChatIds.includes(chat.id)}
                  onSelect={handleChatSelect}
                  selectedChatIds={selectedChatIds}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}

function FolderTreeItem({ 
  folder, 
  level, 
  expandedFolders, 
  toggleFolder, 
  updateChat, 
  deleteChat, 
  activeChatId, 
  activeView, 
  setActiveChatId, 
  setActiveView, 
  folders, 
  updateFolder, 
  deleteFolder,
  duplicateFolder,
  onCreateSubfolder,
  selectedChatIds,
  onSelectChat,
  onOpenFolder,
  isMobileOpen,
  setIsMobileOpen
}: any) {
  const isExpanded = expandedFolders[folder.id];
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const chatId = e.dataTransfer.getData('chatId');
        const folderId = e.dataTransfer.getData('folderId');
        if (chatId) {
          updateChat(chatId, { folderId: folder.id });
        } else if (folderId && folderId !== folder.id) {
          // Check for loop: folder.id cannot be a descendant of folderId
          const isAncestor = (ancestorId: string, descendantId: string): boolean => {
            const descendantFolder = folders.find((f: any) => f.id === descendantId);
            if (!descendantFolder || !descendantFolder.parentId) return false;
            if (descendantFolder.parentId === ancestorId) return true;
            return isAncestor(ancestorId, descendantFolder.parentId);
          };

          if (!isAncestor(folderId, folder.id)) {
            updateFolder(folderId, { parentId: folder.id });
          } else {
            console.warn("Loop detected: Cannot move folder into its own descendant.");
          }
        }
      }}
      className={clsx(
        "transition-colors duration-200 rounded-[8px]",
        isDraggingOver && "bg-emerald-500/20 border border-emerald-500/30"
      )}
    >
      <FolderItem 
        folder={folder} 
        chats={folder.chats}
        onDelete={() => deleteFolder(folder.id)}
        onRename={(name: string) => updateFolder(folder.id, { name })}
        onToggle={() => toggleFolder(folder.id)}
        isExpanded={isExpanded}
        level={level}
        onCreateSubfolder={() => onCreateSubfolder(folder.id)}
        onOpenFolder={() => onOpenFolder(folder.id)}
        onUpdateFolder={updateFolder}
        onDuplicateFolder={() => duplicateFolder(folder.id)}
        folders={folders}
      />
      
      {isExpanded && (
        <div 
          className={clsx(
            "space-y-1 mt-1 mb-2 border-l",
            level === 0 ? "border-zinc-800" : "border-zinc-800/50"
          )}
          style={{ marginLeft: `${(level + 1) * 20}px` }}
        >
          {/* Subfolders */}
          {folder.subfolders.map((subfolder: any) => (
            <FolderTreeItem
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              updateChat={updateChat}
              deleteChat={deleteChat}
              activeChatId={activeChatId}
              activeView={activeView}
              setActiveChatId={setActiveChatId}
              setActiveView={setActiveView}
              folders={folders}
              updateFolder={updateFolder}
              deleteFolder={deleteFolder}
              duplicateFolder={duplicateFolder}
              onCreateSubfolder={onCreateSubfolder}
              selectedChatIds={selectedChatIds}
              onSelectChat={onSelectChat}
              onOpenFolder={onOpenFolder}
              isMobileOpen={isMobileOpen}
              setIsMobileOpen={setIsMobileOpen}
            />
          ))}

          {/* Chats */}
          {folder.chats.map((chat: any) => (
            <div key={chat.id} className="pl-2 pr-2 py-0.5">
              <ChatItem 
                chat={chat} 
                isActive={activeChatId === chat.id && activeView === 'chat'} 
                onClick={() => {
                  setActiveChatId(chat.id);
                  setActiveView('chat');
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                onRename={(title: string) => updateChat(chat.id, { title })}
                onTogglePin={() => updateChat(chat.id, { isPinned: !chat.isPinned })}
                onToggleFavorite={() => updateChat(chat.id, { isFavorite: !chat.isFavorite })}
                onDelete={() => deleteChat(chat.id)}
                folders={folders}
                onMoveToFolder={(chatId: string, folderId: string | null) => updateChat(chatId, { folderId })}
                isSelected={selectedChatIds.includes(chat.id)}
                onSelect={onSelectChat}
                selectedChatIds={selectedChatIds}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FolderItem({ folder, chats, onDelete, onRename, onToggle, isExpanded, level = 0, onCreateSubfolder, onOpenFolder, onUpdateFolder, onDuplicateFolder, folders }: any) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
        setShowIconPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#eab308', '#84cc16'];
  const icons = ['📁', '📂', '💼', '📊', '🎨', '📝', '🚀', '⭐', '🔥', '💡', '🛠️', '📦'];

  return (
    <div 
      className={clsx(
        "group flex items-center justify-between px-3 py-2.5 rounded-[6px] cursor-pointer transition-all duration-300 relative sidebar-item-premium sidebar-item-inactive",
        level > 0 && "py-2",
        folder.color && `border-l-2`
      )}
      style={{ 
        marginLeft: level > 0 ? `${level * 20}px` : '0',
        borderLeftColor: folder.color || 'transparent'
      }}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
      draggable
      onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('folderId', folder.id)}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1" onClick={onOpenFolder}>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="p-0.5 hover:bg-zinc-800 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          )}
        </button>
        
        {folder.icon ? (
          <span className="text-sm shrink-0">{folder.icon}</span>
        ) : isExpanded ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-emerald-500 icon-glow" style={{ color: folder.color }} />
        ) : (
          <FolderIcon className="w-4 h-4 shrink-0" style={{ color: folder.color }} />
        )}

        {isRenaming ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => { onRename(newName); setIsRenaming(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { onRename(newName); setIsRenaming(false); }
                  else if (e.key === 'Escape') { setNewName(folder.name); setIsRenaming(false); }
                }}
                className="bg-zinc-950 border border-zinc-800 rounded px-1 text-sm text-zinc-200 w-full"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
        ) : (
          <span 
            className="text-sm truncate flex-1" 
            onDoubleClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
            style={{
              fontWeight: folder.typography?.weight || 'normal',
              textTransform: folder.typography?.transform as any || 'none'
            }}
          >
            {folder.name}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
        <Tooltip text={folder.isPinned ? "Desfixar" : "Fixar"}>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdateFolder(folder.id, { isPinned: !folder.isPinned }); }}
            className={clsx("p-1 rounded-[4px] hover:bg-zinc-700 transition-colors interactive-hover interactive-click", folder.isPinned ? "text-emerald-400" : "text-zinc-400")}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text={folder.isFavorite ? "Remover dos Favoritos" : "Favoritar"}>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdateFolder(folder.id, { isFavorite: !folder.isFavorite }); }}
            className={clsx("p-1 rounded-[4px] hover:bg-zinc-700 transition-colors interactive-hover interactive-click", folder.isFavorite ? "text-yellow-400" : "text-zinc-400")}
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Opções">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowColorPicker(false); setShowIconPicker(false); }}
            className="p-1 hover:bg-zinc-700 rounded-[4px] text-zinc-400 hover:text-zinc-200 transition-all interactive-hover interactive-click"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        
        {showMenu && (
          <div 
            className="fixed w-48 bg-zinc-800 border border-zinc-700 rounded-[8px] shadow-xl z-[9999] py-1"
            style={{ 
              top: (menuRef.current?.getBoundingClientRect().bottom || 0) + 5,
              left: (menuRef.current?.getBoundingClientRect().right || 0) - 192
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => { onCreateSubfolder(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
            >
              <Plus className="w-4 h-4" />
              Nova Subpasta
            </button>
            <button 
              onClick={() => { setIsRenaming(true); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
            >
              <Edit2 className="w-4 h-4" />
              Renomear
            </button>
            <button 
              onClick={() => { onDuplicateFolder(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
            >
              <Copy className="w-4 h-4" />
              Duplicar
            </button>
            <button 
              onClick={() => { setShowColorPicker(true); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
            >
              <div className="w-4 h-4 rounded-full border border-zinc-600" style={{ backgroundColor: folder.color || 'transparent' }} />
              Alterar Cor
            </button>
            <button 
              onClick={() => { setShowIconPicker(true); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
            >
              <span className="w-4 h-4 flex items-center justify-center">{folder.icon || '📁'}</span>
              Alterar Ícone
            </button>
            <div className="h-px bg-zinc-700 my-1" />
            <button 
              onClick={() => { setShowConfirmDelete(true); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-all interactive-hover interactive-click"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        )}

        {showColorPicker && (
          <div 
            className="fixed w-48 bg-zinc-800 border border-zinc-700 rounded-[8px] shadow-xl z-[9999] p-3"
            style={{ 
              top: (menuRef.current?.getBoundingClientRect().bottom || 0) + 5,
              left: (menuRef.current?.getBoundingClientRect().right || 0) - 192
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-bold text-zinc-400 mb-2 uppercase">Cores</h4>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => { onUpdateFolder(folder.id, { color: null }); setShowColorPicker(false); }}
                className="w-8 h-8 rounded-full border border-zinc-600 flex items-center justify-center hover:bg-zinc-700 transition-all interactive-hover interactive-click"
                title="Padrão"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
              {colors.map(c => (
                <button 
                  key={c}
                  onClick={() => { onUpdateFolder(folder.id, { color: c }); setShowColorPicker(false); }}
                  className="w-8 h-8 rounded-full border border-zinc-600 hover:scale-110 transition-all interactive-hover interactive-click"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {showIconPicker && (
          <div 
            className="fixed w-48 bg-zinc-800 border border-zinc-700 rounded-[8px] shadow-xl z-[9999] p-3"
            style={{ 
              top: (menuRef.current?.getBoundingClientRect().bottom || 0) + 5,
              left: (menuRef.current?.getBoundingClientRect().right || 0) - 192
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-bold text-zinc-400 mb-2 uppercase">Ícones</h4>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => { onUpdateFolder(folder.id, { icon: null }); setShowIconPicker(false); }}
                className="w-8 h-8 rounded-[6px] border border-zinc-600 flex items-center justify-center hover:bg-zinc-700 text-xs transition-all interactive-hover interactive-click"
                title="Padrão"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
              {icons.map(icon => (
                <button 
                  key={icon}
                  onClick={() => { onUpdateFolder(folder.id, { icon }); setShowIconPicker(false); }}
                  className="w-8 h-8 rounded-[6px] border border-zinc-600 hover:bg-zinc-700 flex items-center justify-center text-lg transition-all interactive-hover interactive-click"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}

        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-zinc-800 p-6 rounded-[8px] border border-zinc-700">
              <h3 className="text-lg font-bold mb-4">Excluir pasta?</h3>
              <p className="mb-6">Tem certeza que deseja mover para a lixeira?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowConfirmDelete(false)} className="px-4 py-2 bg-zinc-700 rounded-[6px] transition-all interactive-hover interactive-click">Cancelar</button>
                <button onClick={() => { onDelete(); setShowConfirmDelete(false); }} className="px-4 py-2 bg-red-600 rounded-[6px] transition-all interactive-hover interactive-click">Excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatItem({ chat, isActive, onClick, onTogglePin, onToggleFavorite, onDelete, folders, onMoveToFolder, onRename, isSelected, onSelect, selectedChatIds }: any) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(chat.title);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSelect = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect(chat.id, 'toggle');
    } else if (e.shiftKey) {
      onSelect(chat.id, 'range');
    } else {
      onClick();
      onSelect(chat.id, 'single');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          "group flex items-center justify-between px-3 py-2.5 rounded-[6px] cursor-pointer transition-all duration-300 relative sidebar-item-premium interactive-hover interactive-click",
          isActive 
            ? "sidebar-item-active" 
            : "sidebar-item-inactive",
          isSelected && "bg-emerald-500/20 ring-1 ring-emerald-500/50"
        )}
        onClick={handleSelect}
        onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
      >
        <div 
          className="flex flex-col gap-1 overflow-hidden"
          draggable
          onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('chatId', chat.id)}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <MessageSquare className={clsx("w-4 h-4 shrink-0 transition-all duration-300", isActive && "icon-glow")} />
            {isRenaming ? (
              <input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => { onRename(newName); setIsRenaming(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { onRename(newName); setIsRenaming(false); }
                  else if (e.key === 'Escape') { setNewName(chat.title); setIsRenaming(false); }
                }}
                className="bg-zinc-950 border border-zinc-700 rounded px-1 text-sm text-zinc-100"
                autoFocus
              />
            ) : (
              <span className="text-sm truncate" onDoubleClick={() => setIsRenaming(true)}>{chat.title}</span>
            )}
            {chat.isFavorite && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
          </div>
          <div className="flex items-center gap-2 text-[9px] text-zinc-600 pl-7 font-medium uppercase tracking-wider">
            <span>{format(new Date(chat.createdAt || Date.now()), 'd MMM', { locale: ptBR })}</span>
            <span className="opacity-30">•</span>
            <span>{chat.duration || '0 min'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip text="Opções">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </motion.div>

      {showMenu && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-10 w-48 bg-zinc-800 border border-zinc-700 rounded-[8px] shadow-xl z-[100] py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { setIsRenaming(true); setShowMenu(false); }}
            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
          >
            <Edit2 className="w-4 h-4" />
            Renomear
          </button>
          <button 
            onClick={() => { onTogglePin(); setShowMenu(false); }}
            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
          >
            <Pin className={clsx("w-4 h-4", chat.isPinned && "fill-current")} />
            {chat.isPinned ? 'Desafixar' : 'Fixar'}
          </button>
          <button 
            onClick={() => { onToggleFavorite(); setShowMenu(false); }}
            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
          >
            <Star className={clsx("w-4 h-4", chat.isFavorite && "fill-current text-yellow-400")} />
            {chat.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          </button>
          
          {folders && folders.length > 0 && (
            <div className="border-t border-zinc-700 my-1 pt-1">
              <div className="px-4 py-1 text-xs font-semibold text-zinc-500 uppercase">Mover para</div>
              {chat.folderId && (
                <button 
                  onClick={() => { 
                    if (isSelected && selectedChatIds.length > 1) {
                      selectedChatIds.forEach((id: string) => onMoveToFolder(id, null));
                    } else {
                      onMoveToFolder(chat.id, null);
                    }
                    setShowMenu(false); 
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
                >
                  <FolderIcon className="w-4 h-4" />
                  Remover da pasta
                </button>
              )}
              {folders.filter((f: any) => f.id !== chat.folderId).map((folder: any) => (
                <button 
                  key={folder.id}
                  onClick={() => { 
                    if (isSelected && selectedChatIds.length > 1) {
                      selectedChatIds.forEach((id: string) => onMoveToFolder(id, folder.id));
                    } else {
                      onMoveToFolder(chat.id, folder.id);
                    }
                    setShowMenu(false); 
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all interactive-hover interactive-click"
                >
                  <FolderIcon className="w-4 h-4" />
                  {folder.name}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-700 my-1 pt-1">
            <button 
              onClick={() => { onDelete(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-all interactive-hover interactive-click"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
