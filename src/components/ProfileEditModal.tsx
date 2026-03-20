import React, { useState, useRef } from 'react';
import { X, Upload, Camera, User, Image as ImageIcon, Check, Loader2, Keyboard, Settings, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShortcutSettings } from './ShortcutSettings';
import { TrashPanel } from './TrashPanel';
import clsx from 'clsx';

interface ProfileEditModalProps {
  onClose: () => void;
}

type Tab = 'profile' | 'shortcuts' | 'trash';

export function ProfileEditModal({ onClose }: ProfileEditModalProps) {
  const { profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [name, setName] = useState(profile?.name || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [coverURL, setCoverURL] = useState(profile?.coverURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = 500 * 1024; // 500KB limit for Firestore user document
    if (file.size > maxSize) {
      setError(`O arquivo é muito grande. Máximo de 500KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'avatar') {
        setPhotoURL(base64String);
      } else {
        setCoverURL(base64String);
      }
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile({
        name,
        description,
        photoURL,
        coverURL,
      });
      onClose();
    } catch (err) {
      setError('Erro ao salvar o perfil. Tente novamente.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Configurações</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-zinc-800 bg-zinc-950/30">
          <button
            onClick={() => setActiveTab('profile')}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'profile' ? "bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <User className="w-4 h-4" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'shortcuts' ? "bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <Keyboard className="w-4 h-4" />
            Atalhos
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'trash' ? "bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <Trash2 className="w-4 h-4" />
            Lixeira
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                {/* Cover Upload */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-400">Imagem de Capa</label>
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Alterar Capa
                    </button>
                  </div>
                  <div 
                    className="relative h-32 w-full rounded-2xl overflow-hidden bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 transition-colors cursor-pointer group"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverURL ? (
                      <img src={coverURL} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs">Clique para fazer upload</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500">
                      Recomendado: 1500x400 px • JPG/PNG • Máx 500KB
                    </p>
                    <button
                      onClick={() => setActiveTab('trash')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-medium transition-all border border-zinc-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Ver Lixeira
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={coverInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'cover')}
                  />
                </div>

                {/* Avatar Upload */}
                <div className="flex items-start gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-400">Logo / Avatar</label>
                    <div 
                      className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 transition-colors cursor-pointer group"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {photoURL ? (
                        <img src={photoURL} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      400x400 px • PNG/JPG • Máx 500KB
                    </p>
                    <input
                      type="file"
                      ref={photoInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'avatar')}
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-400">Nome / Empresa</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Designer Esportivo"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-400">Descrição Curta</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Especialista em Identidade Visual"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'shortcuts' ? (
              <motion.div
                key="shortcuts"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <ShortcutSettings />
              </motion.div>
            ) : (
              <motion.div
                key="trash"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <TrashPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-zinc-400 hover:text-white transition-colors font-medium"
          >
            Cancelar
          </button>
          {activeTab === 'profile' && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
