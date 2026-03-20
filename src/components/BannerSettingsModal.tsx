import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash, GripVertical, Settings, Image as ImageIcon, Zap, Play, Pause, ArrowLeft, ArrowRight, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { BannerArt, BannerSettings } from '../types';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../firebase';
import clsx from 'clsx';

interface BannerSettingsModalProps {
  onClose: () => void;
}

export function BannerSettingsModal({ onClose }: BannerSettingsModalProps) {
  const { bannerArts, setBannerArts, bannerSettings, setBannerSettings } = useDashboard();
  const [localBannerArts, setLocalBannerArts] = useState<BannerArt[]>(bannerArts);
  const [localBannerSettings, setLocalBannerSettings] = useState<BannerSettings>(bannerSettings);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'arts' | 'settings'>('arts');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (localBannerArts.length >= 10) return;
    if (!auth.currentUser) {
      alert('Você precisa estar logado para fazer upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const file = files[0];
    const maxSize = 500 * 1024 * 1024; // 500MB limit
    
    if (file.size > maxSize) {
      alert('A imagem é muito grande. O limite é 500MB.');
      setIsUploading(false);
      return;
    }

    try {
      const artId = Math.random().toString(36).substr(2, 9);
      const storageRef = ref(storage, `banners/${auth.currentUser.uid}/${artId}_${file.name}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          }, 
          (error) => {
            reject(error);
          }, 
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });

      const newArt: BannerArt = {
        id: artId,
        url: downloadURL,
        title: file.name.split('.')[0]
      };

      setLocalBannerArts([...localBannerArts, newArt]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro no upload: ' + (error as Error).message + '. Tente novamente com uma conexão estável.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveArt = (id: string) => {
    setLocalBannerArts(localBannerArts.filter(a => a.id !== id));
  };

  const handleMoveArt = (index: number, direction: 'up' | 'down') => {
    const newArts = [...localBannerArts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newArts.length) return;
    
    [newArts[index], newArts[targetIndex]] = [newArts[targetIndex], newArts[index]];
    setLocalBannerArts(newArts);
  };

  const handleClearAll = () => {
    if (window.confirm('Tem certeza que deseja remover todas as artes?')) {
      setLocalBannerArts([]);
    }
  };

  const updateSetting = <K extends keyof BannerSettings>(key: K, value: BannerSettings[K]) => {
    setLocalBannerSettings({ ...localBannerSettings, [key]: value });
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setBannerArts(localBannerArts);
      await setBannerSettings(localBannerSettings);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar as alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl premium-glass rounded-[2.5rem] overflow-hidden border border-zinc-700/50 shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <ImageIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Configurações do Banner</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Personalize sua vitrine premium</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-zinc-800 rounded-2xl text-zinc-400 transition-all hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/50 bg-zinc-900/20">
          <button 
            onClick={() => setActiveTab('arts')}
            className={clsx(
              "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
              activeTab === 'arts' ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Suas Artes ({localBannerArts.length}/10)
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={clsx(
              "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
              activeTab === 'settings' ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Controles & Efeitos
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-zinc-950/40">
          {activeTab === 'arts' ? (
            <div className="space-y-6">
              {/* Add Art Form */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Adicionar nova arte</p>
                {localBannerArts.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || localBannerArts.length >= 10}
                className="w-full group relative py-8 border-2 border-dashed border-zinc-800 rounded-[2rem] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-4 bg-zinc-900 rounded-2xl group-hover:bg-emerald-500/10 transition-colors">
                  <Upload className={clsx("w-6 h-6 transition-colors", isUploading ? "text-emerald-500 animate-bounce" : "text-zinc-500 group-hover:text-emerald-400")} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">
                    {isUploading ? 'Processando imagem...' : 'Clique para selecionar do seu PC'}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                    Formatos suportados: JPG, PNG, GIF (Máx. 500MB/arte, 10 artes)
                  </p>
                </div>
              </button>

              {isUploading && (
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mt-2">
                  <motion.div 
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ type: 'tween', ease: 'linear' }}
                  />
                </div>
              )}

              {/* Arts List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {localBannerArts.map((art, idx) => (
                    <motion.div 
                      key={art.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative h-32 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/40"
                    >
                      <img 
                        src={art.url} 
                        alt={art.title} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                      
                      {/* Reorder Controls */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleMoveArt(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 bg-zinc-900/80 hover:bg-emerald-500/20 rounded-lg text-white disabled:opacity-30 transition-all border border-white/10"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleMoveArt(idx, 'down')}
                          disabled={idx === localBannerArts.length - 1}
                          className="p-1.5 bg-zinc-900/80 hover:bg-emerald-500/20 rounded-lg text-white disabled:opacity-30 transition-all border border-white/10"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">#{idx + 1}</span>
                        <button 
                          onClick={() => handleRemoveArt(art.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all opacity-0 group-hover:opacity-100 border border-red-500/20"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {localBannerArts.length === 0 && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-[2rem]">
                    <ImageIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Sua galeria está vazia</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Speed Control */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-widest">
                  <Zap className="w-4 h-4 text-emerald-500" /> Velocidade do Movimento
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['slow', 'medium', 'fast'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateSetting('speed', s)}
                      className={clsx(
                        "py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border",
                        localBannerSettings.speed === s ? "bg-emerald-500 text-zinc-950 border-emerald-500" : "bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {s === 'slow' ? 'Lento' : s === 'medium' ? 'Médio' : 'Rápido'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      {localBannerSettings.autoPlay ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5 text-zinc-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Auto-Play</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Movimento contínuo</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateSetting('autoPlay', !localBannerSettings.autoPlay)}
                    className={clsx(
                      "w-12 h-6 rounded-full relative transition-all duration-300",
                      localBannerSettings.autoPlay ? "bg-emerald-500" : "bg-zinc-800"
                    )}
                  >
                    <div className={clsx(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                      localBannerSettings.autoPlay ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <Settings className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Pause no Hover</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ao passar o mouse</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateSetting('pauseOnHover', !localBannerSettings.pauseOnHover)}
                    className={clsx(
                      "w-12 h-6 rounded-full relative transition-all duration-300",
                      localBannerSettings.pauseOnHover ? "bg-emerald-500" : "bg-zinc-800"
                    )}
                  >
                    <div className={clsx(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                      localBannerSettings.pauseOnHover ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              </div>

              {/* Direction Control */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-widest">
                  Direção do Fluxo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateSetting('direction', 'left')}
                    className={clsx(
                      "py-4 rounded-3xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest transition-all border",
                      localBannerSettings.direction === 'left' ? "bg-emerald-500 text-zinc-950 border-emerald-500" : "bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <ArrowLeft className="w-5 h-5" /> Esquerda
                  </button>
                  <button
                    onClick={() => updateSetting('direction', 'right')}
                    className={clsx(
                      "py-4 rounded-3xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest transition-all border",
                      localBannerSettings.direction === 'right' ? "bg-emerald-500 text-zinc-950 border-emerald-500" : "bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    Direita <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-800/50 bg-zinc-900/40 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="px-8 py-4 bg-emerald-500 text-zinc-950 font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
