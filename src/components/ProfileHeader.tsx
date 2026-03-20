import React, { useState } from 'react';
import { Camera, Edit2, User as UserIcon, Image as ImageIcon, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileEditModal } from './ProfileEditModal';
import { BannerMarquee } from './BannerMarquee';
import { BannerSettingsModal } from './BannerSettingsModal';

export function ProfileHeader() {
  const { profile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const defaultAvatar = ""; // Will show UserIcon if empty

  return (
    <div className="relative w-full mb-8 group">
      {/* Dynamic Banner Section */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden rounded-[2rem] bg-zinc-900 shadow-2xl border border-zinc-800/50 z-10">
        <BannerMarquee />
        
        <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all z-20">
          <button
            onClick={() => setIsBannerModalOpen(true)}
            className="p-3 bg-zinc-900/40 hover:bg-emerald-500/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/10 hover:border-emerald-500/30 shadow-xl flex items-center gap-2"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Galeria</span>
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-3 bg-zinc-900/40 hover:bg-emerald-500/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/10 hover:border-emerald-500/30 shadow-xl"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="px-10 -mt-16 relative flex flex-col md:flex-row md:items-end gap-8 z-20">
        {/* Avatar */}
        <div className="relative group/avatar">
          <div className="w-40 h-40 rounded-[2rem] border-8 border-zinc-950 bg-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center relative">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserIcon className="w-20 h-20 text-zinc-800" />
            )}
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 rounded-[2rem] backdrop-blur-sm"
          >
            <Edit2 className="w-8 h-8 text-emerald-400 text-glow-emerald" />
          </button>
        </div>

        {/* Text Info */}
        <div className="flex-1 pb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-white tracking-tight">
              {profile?.name || 'Designer'}
            </h1>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 bg-zinc-900/50 hover:bg-emerald-500/10 rounded-xl text-zinc-500 hover:text-emerald-400 transition-all border border-zinc-800/50 hover:border-emerald-500/20"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
            {profile?.description || 'Designer Esportivo & Criativo'}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <ProfileEditModal onClose={() => setIsEditModalOpen(false)} />
        )}
        {isBannerModalOpen && (
          <BannerSettingsModal onClose={() => setIsBannerModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
