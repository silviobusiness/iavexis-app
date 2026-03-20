import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { Folder as FolderIcon, MessageSquare, LayoutGrid, List as ListIcon, MoreVertical, Star, Pin, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Tooltip } from './Tooltip';

interface FolderViewProps {
  folderId: string;
  onOpenChat: (id: string) => void;
  onOpenFolder: (id: string) => void;
}

export function FolderView({ folderId, onOpenChat, onOpenFolder }: FolderViewProps) {
  const { folders, chats, updateFolder, deleteFolder, updateChat, deleteChat, setActiveChatId } = useChat();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const currentFolder = folders.find(f => f.id === folderId);
  if (!currentFolder) return null;

  const handleOpenChat = (id: string) => {
    setActiveChatId(id);
    onOpenChat(id);
  };

  const subfolders = folders.filter(f => f.parentId === folderId && !f.deleted);
  const folderChats = chats.filter(c => c.folderId === folderId);

  // Build breadcrumb
  const breadcrumbs = [];
  let curr: any = currentFolder;
  while (curr) {
    breadcrumbs.unshift(curr);
    curr = folders.find(f => f.id === curr.parentId);
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 p-8 overflow-y-auto">
      {/* Header & Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.id}>
              {i > 0 && <ChevronRight className="w-4 h-4" />}
              <button 
                onClick={() => onOpenFolder(b.id)}
                className="hover:text-emerald-400 transition-colors"
                style={{
                  color: b.color,
                  fontWeight: b.typography?.weight || 'normal',
                  textTransform: b.typography?.transform as any || 'none'
                }}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800"
              style={{ borderColor: currentFolder.color ? `${currentFolder.color}40` : undefined }}
            >
              {currentFolder.icon ? (
                <span className="text-2xl">{currentFolder.icon}</span>
              ) : (
                <FolderIcon className="w-6 h-6" style={{ color: currentFolder.color || '#10b981' }} />
              )}
            </div>
            <h1 
              className="text-3xl font-bold"
              style={{
                color: currentFolder.color,
                fontWeight: currentFolder.typography?.weight || 'bold',
                textTransform: currentFolder.typography?.transform as any || 'none'
              }}
            >
              {currentFolder.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx("p-2 rounded-md transition-colors", viewMode === 'grid' ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx("p-2 rounded-md transition-colors", viewMode === 'list' ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {subfolders.length === 0 && folderChats.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
          <FolderIcon className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg mb-4">Nenhuma pasta ou chat criado ainda</p>
        </div>
      ) : (
        <div className={clsx(
          "gap-4",
          viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col"
        )}>
          {/* Subfolders */}
          {subfolders.map(folder => (
            <motion.div
              layout
              key={folder.id}
              onClick={() => onOpenFolder(folder.id)}
              className={clsx(
                "group cursor-pointer bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5",
                viewMode === 'grid' ? "p-6 flex flex-col items-center text-center gap-3" : "p-4 flex items-center gap-4"
              )}
            >
              <div 
                className={clsx(
                  "flex items-center justify-center rounded-lg bg-zinc-800/50",
                  viewMode === 'grid' ? "w-16 h-16" : "w-10 h-10"
                )}
              >
                {folder.icon ? (
                  <span className={viewMode === 'grid' ? "text-3xl" : "text-xl"}>{folder.icon}</span>
                ) : (
                  <FolderIcon className={viewMode === 'grid' ? "w-8 h-8" : "w-5 h-5"} style={{ color: folder.color || '#10b981' }} />
                )}
              </div>
              <div className={clsx("flex-1", viewMode === 'list' && "flex items-center justify-between")}>
                <h3 
                  className="font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors"
                  style={{
                    color: folder.color,
                    fontWeight: folder.typography?.weight || 'normal',
                    textTransform: folder.typography?.transform as any || 'none'
                  }}
                >
                  {folder.name}
                </h3>
                {viewMode === 'list' && (
                  <span className="text-xs text-zinc-500">
                    {new Date(folder.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </motion.div>
          ))}

          {/* Chats */}
          {folderChats.map(chat => (
            <motion.div
              layout
              key={chat.id}
              onClick={() => handleOpenChat(chat.id)}
              className={clsx(
                "group cursor-pointer bg-zinc-900/30 border border-zinc-800/50 hover:border-emerald-500/30 rounded-xl transition-all duration-300",
                viewMode === 'grid' ? "p-6 flex flex-col items-center text-center gap-3" : "p-4 flex items-center gap-4"
              )}
            >
              <div 
                className={clsx(
                  "flex items-center justify-center rounded-lg bg-zinc-800/30",
                  viewMode === 'grid' ? "w-16 h-16" : "w-10 h-10"
                )}
              >
                <MessageSquare className={clsx("text-zinc-400 group-hover:text-emerald-400 transition-colors", viewMode === 'grid' ? "w-8 h-8" : "w-5 h-5")} />
              </div>
              <div className={clsx("flex-1", viewMode === 'list' && "flex items-center justify-between")}>
                <h3 className="font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {chat.title}
                </h3>
                {viewMode === 'list' && (
                  <span className="text-xs text-zinc-500">
                    {new Date(chat.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
