import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, Heart, Download, Eye, X, Image as ImageIcon, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useLibrary, LibraryItem } from '../contexts/LibraryContext';
import { useChat } from '../contexts/ChatContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import clsx from 'clsx';

const CATEGORIES = [
  'Texturas',
  'Luzes',
  'Fumaça',
  'Partículas',
  'Gramado',
  'Estádios',
  'Overlays',
  'Tipografia esportiva'
];

export function SportsLibrary({ onOpenChat }: { onOpenChat?: () => void }) {
  const { items, createItem, deleteItem, toggleFavorite } = useLibrary();
  const { sendMessage } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'assets' | 'references' | 'vestiario'>('assets');
  const [refSport, setRefSport] = useState<string>('All');
  const [refStyle, setRefStyle] = useState<string>('All');
  const [refType, setRefType] = useState<string>('All');
  const [vestiarioCategory, setVestiarioCategory] = useState<string>('All');

  const handleUseAsBase = async (item: LibraryItem) => {
    const prompt = `Gostaria de usar esta referência como base para uma nova arte.
Nome: ${item.title}
Esporte: ${item.sport || 'N/A'}
Estilo: ${item.style || 'N/A'}
Tipo: ${item.referenceType || 'N/A'}
${item.analysis ? `
Análise da Arte:
- Tipografia: ${item.analysis.typography}
- Cores: ${item.analysis.colors}
- Estilo: ${item.analysis.style}
` : ''}
Por favor, me ajude a criar um prompt detalhado para gerar uma imagem semelhante ou me dê ideias de como aplicar este estilo.`;

    let base64Data;
    let mimeType;
    if (item.imageUrl.startsWith('data:')) {
      const parts = item.imageUrl.split(',');
      base64Data = parts[1];
      mimeType = parts[0].split(':')[1].split(';')[0];
    }

    await sendMessage(prompt, item.imageUrl, base64Data, mimeType);
    if (onOpenChat) {
      onOpenChat();
    } else {
      alert('Referência enviada para o chat!');
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const isReference = item.itemType === 'reference';
    const isTemplate = item.itemType === 'template';
    
    if (viewMode === 'assets' && (isReference || isTemplate)) return false;
    if (viewMode === 'references' && !isReference) return false;
    if (viewMode === 'vestiario' && !isTemplate) return false;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      item.title.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)));
    
    if (viewMode === 'assets') {
      const matchesCategory = 
        activeCategory === 'All' ? true : 
        activeCategory === 'Favorites' ? item.isFavorite : 
        item.category === activeCategory;
      return matchesSearch && matchesCategory;
    } else if (viewMode === 'references') {
      const matchesSport = refSport === 'All' ? true : item.sport === refSport;
      const matchesStyle = refStyle === 'All' ? true : item.style === refStyle;
      const matchesType = refType === 'All' ? true : item.referenceType === refType;
      return matchesSearch && matchesSport && matchesStyle && matchesType;
    } else {
      // Vestiario filters
      const matchesCategory = vestiarioCategory === 'All' ? true : item.category === vestiarioCategory;
      return matchesSearch && matchesCategory;
    }
  });

  const handleDownload = (e: React.MouseEvent, item: LibraryItem) => {
    e.stopPropagation();
    if (item.imageUrl) {
      // Create a temporary link to trigger download
      const a = document.createElement('a');
      a.href = item.imageUrl;
      a.download = item.title || 'asset';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, item: LibraryItem) => {
    e.stopPropagation();
    toggleFavorite(item.id, !!item.isFavorite);
  };

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header & Search Area */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md z-10 shrink-0 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Sistema Criativo</h2>
            <p className="text-zinc-400 text-sm mt-1">Biblioteca, referências e vestiário criativo.</p>
          </div>
          
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('assets')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                viewMode === 'assets' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Assets
            </button>
            <button
              onClick={() => setViewMode('references')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                viewMode === 'references' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Referências
            </button>
            <button
              onClick={() => setViewMode('vestiario')}
              className={clsx(
                "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                viewMode === 'vestiario' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Vestiário
            </button>
          </div>

          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors text-sm shadow-lg shadow-emerald-500/20"
          >
            <Upload className="w-4 h-4" />
            {viewMode === 'assets' ? 'Upload Asset' : viewMode === 'references' ? 'Nova Referência' : 'Novo Template'}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder={viewMode === 'assets' ? "Buscar assets (ex: luzes, textura, background)..." : "Buscar referências (ex: match day, poster agressivo...)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {viewMode === 'assets' ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <FilterButton 
                label="All" 
                isActive={activeCategory === 'All'} 
                onClick={() => setActiveCategory('All')} 
              />
              <FilterButton 
                label="Favorites" 
                isActive={activeCategory === 'Favorites'} 
                onClick={() => setActiveCategory('Favorites')} 
                icon={<Heart className="w-3.5 h-3.5" />}
              />
              <div className="w-px h-6 bg-zinc-800 mx-2 shrink-0" />
              {CATEGORIES.map(cat => (
                <FilterButton 
                  key={cat} 
                  label={cat} 
                  isActive={activeCategory === cat} 
                  onClick={() => setActiveCategory(cat)} 
                />
              ))}
            </div>
          ) : viewMode === 'references' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2">Esporte</span>
                <FilterButton label="Todos" isActive={refSport === 'All'} onClick={() => setRefSport('All')} />
                {['Futebol', 'Basquete', 'UFC'].map(cat => (
                  <FilterButton key={cat} label={cat} isActive={refSport === cat} onClick={() => setRefSport(cat)} />
                ))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2">Estilo</span>
                <FilterButton label="Todos" isActive={refStyle === 'All'} onClick={() => setRefStyle('All')} />
                {['Clean', 'Agressivo', 'Premium', 'Dark'].map(cat => (
                  <FilterButton key={cat} label={cat} isActive={refStyle === cat} onClick={() => setRefStyle(cat)} />
                ))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2">Tipo</span>
                <FilterButton label="Todos" isActive={refType === 'All'} onClick={() => setRefType('All')} />
                {['Match Day', 'Anúncio', 'Stats', 'Escalação'].map(cat => (
                  <FilterButton key={cat} label={cat} isActive={refType === cat} onClick={() => setRefType(cat)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <FilterButton label="Todos" isActive={vestiarioCategory === 'All'} onClick={() => setVestiarioCategory('All')} />
              <FilterButton label="Kits de Marca" isActive={vestiarioCategory === 'Kits de Marca'} onClick={() => setVestiarioCategory('Kits de Marca')} />
              <FilterButton label="Templates PSD" isActive={vestiarioCategory === 'Templates PSD'} onClick={() => setVestiarioCategory('Templates PSD')} />
              <FilterButton label="Mockups" isActive={vestiarioCategory === 'Mockups'} onClick={() => setVestiarioCategory('Mockups')} />
            </div>
          )}
        </div>
      </header>

      {/* Asset Grid */}
      <div className="p-6">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-zinc-600" />
            </div>
            <p>Nenhum asset encontrado.</p>
            {activeCategory !== 'All' && (
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-700 transition-all shadow-sm hover:shadow-xl"
                onClick={() => setPreviewItem(item)}
              >
                {/* Image Container */}
                <div className="aspect-square bg-zinc-950 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-zinc-800" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                      className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => handleDownload(e, item)}
                      className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Favorite Badge (Always visible if favorited, or on hover) */}
                  <button 
                    onClick={(e) => handleToggleFavorite(e, item)}
                    className={clsx(
                      "absolute top-3 right-3 p-2 rounded-full transition-all z-10",
                      item.isFavorite 
                        ? "bg-zinc-900/80 text-red-500 opacity-100" 
                        : "bg-zinc-900/80 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-400"
                    )}
                  >
                    <Heart className={clsx("w-4 h-4", item.isFavorite && "fill-current")} />
                  </button>
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <h3 className="font-medium text-zinc-100 truncate" title={item.title}>{item.title}</h3>
                  {viewMode === 'assets' || viewMode === 'vestiario' ? (
                    <>
                      <p className="text-xs text-zinc-500 mt-1 truncate">{item.category}</p>
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[10px] text-zinc-500 px-1">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(item.imageUrl || '');
                            alert('Link copiado!');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-1.5 rounded-lg transition-colors"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Link
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(item.canvaUrl || 'https://www.canva.com/design', '_blank');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs py-1.5 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Canva
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500 mt-1 truncate">{item.style || 'Sem estilo'}</p>
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(item);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Detalhes
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseAsBase(item);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs py-1.5 rounded-lg transition-colors"
                        >
                          <ImageIcon className="w-3 h-3" />
                          Usar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <PreviewModal 
          item={previewItem} 
          onClose={() => setPreviewItem(null)} 
          onDownload={(e) => handleDownload(e, previewItem)}
          onToggleFavorite={(e) => handleToggleFavorite(e, previewItem)}
          onUseAsBase={() => handleUseAsBase(previewItem)}
          onDelete={() => {
            if (window.confirm('Tem certeza que deseja excluir este asset?')) {
              deleteItem(previewItem.id);
              setPreviewItem(null);
            }
          }}
        />
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal 
          viewMode={viewMode}
          onClose={() => setIsUploadModalOpen(false)} 
          onSubmit={async (data) => {
            await createItem(data);
            setIsUploadModalOpen(false);
          }} 
        />
      )}
    </div>
  );
}

function FilterButton({ label, isActive, onClick, icon }: { label: string, isActive: boolean, onClick: () => void, icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
        isActive 
          ? "bg-zinc-100 text-zinc-900" 
          : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PreviewModal({ item, onClose, onDownload, onToggleFavorite, onUseAsBase, onDelete }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-full overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Image Section */}
        <div className="flex-1 bg-zinc-900 relative min-h-[300px] flex items-center justify-center">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <ImageIcon className="w-24 h-24 text-zinc-800" />
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:hidden p-2 bg-zinc-900/80 text-zinc-400 hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Section */}
        <div className="w-full md:w-96 bg-zinc-950 p-6 md:p-8 flex flex-col border-l border-zinc-800 overflow-y-auto">
          <div className="flex justify-end hidden md:flex mb-6">
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium rounded-full mb-4">
                {item.itemType === 'reference' ? item.style || 'Referência' : item.itemType === 'template' ? item.category || 'Template' : item.category}
              </div>
              <h2 className="text-2xl font-bold text-zinc-100 leading-tight">{item.title}</h2>
              
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {item.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {item.description && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Descrição</h3>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            {item.itemType === 'reference' && item.analysis && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Análise da Arte</h3>
                <div className="space-y-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                  {item.analysis.typography && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-zinc-500 w-24 shrink-0">Tipografia:</span>
                      <span className="text-zinc-300">{item.analysis.typography}</span>
                    </div>
                  )}
                  {item.analysis.colors && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-zinc-500 w-24 shrink-0">Cores:</span>
                      <span className="text-zinc-300">{item.analysis.colors}</span>
                    </div>
                  )}
                  {item.analysis.style && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-zinc-500 w-24 shrink-0">Estilo:</span>
                      <span className="text-zinc-300">{item.analysis.style}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 space-y-3">
              {item.itemType === 'reference' ? (
                <button 
                  onClick={() => {
                    onUseAsBase();
                    onClose();
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                  Usar como base
                </button>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={onDownload}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(item.imageUrl || '');
                      alert('Link copiado!');
                    }}
                    className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    title="Copiar Link"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              {item.canvaUrl && (
                <button 
                  onClick={() => {
                    window.open(item.canvaUrl, '_blank');
                  }}
                  className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/20 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Abrir no Canva
                </button>
              )}
              
              <button 
                onClick={onToggleFavorite}
                className={clsx(
                  "w-full font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border",
                  item.isFavorite 
                    ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                )}
              >
                <Heart className={clsx("w-5 h-5", item.isFavorite && "fill-current")} />
                {item.isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </button>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-zinc-800">
            <button 
              onClick={onDelete}
              className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
            >
              Excluir este {item.itemType === 'reference' ? 'item' : item.itemType === 'template' ? 'template' : 'asset'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function UploadModal({ onClose, onSubmit, viewMode = 'assets' }: { onClose: () => void, onSubmit: (data: Partial<LibraryItem>) => void, viewMode?: 'assets' | 'references' | 'vestiario' }) {
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    description: '',
    imageUrl: '',
    tags: '',
    canvaUrl: '',
    sport: 'Futebol',
    style: 'Clean',
    referenceType: 'Match Day',
    analysisTypography: '',
    analysisColors: '',
    analysisStyle: ''
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 500 * 1024 * 1024; // 500MB limit
      if (file.size > maxSize) {
        alert('O arquivo é muito grande. O tamanho máximo é 500MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUploading(true);
    setUploadProgress(0);
    let finalImageUrl = formData.imageUrl;

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const storageRef = ref(storage, `library/guest-user/${fileName}`);
        
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        finalImageUrl = await new Promise<string>((resolve, reject) => {
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
      } else if (!finalImageUrl && !formData.canvaUrl) {
        alert('Por favor, selecione uma imagem ou adicione um link do Canva.');
        setIsUploading(false);
        return;
      }

      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
        
      if (viewMode === 'references') {
        onSubmit({
          title: formData.title,
          category: 'Referência',
          description: formData.description,
          imageUrl: finalImageUrl,
          tags: tagsArray,
          itemType: 'reference',
          sport: formData.sport,
          style: formData.style,
          referenceType: formData.referenceType,
          analysis: {
            typography: formData.analysisTypography,
            colors: formData.analysisColors,
            style: formData.analysisStyle
          }
        });
      } else if (viewMode === 'vestiario') {
        onSubmit({
          title: formData.title,
          category: formData.category,
          description: formData.description,
          imageUrl: finalImageUrl,
          tags: tagsArray,
          canvaUrl: formData.canvaUrl,
          itemType: 'template'
        });
      } else {
        onSubmit({
          title: formData.title,
          category: formData.category,
          description: formData.description,
          imageUrl: finalImageUrl,
          tags: tagsArray,
          canvaUrl: formData.canvaUrl,
          itemType: 'asset'
        });
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro no upload: ' + (error as Error).message + '. Tente novamente com uma conexão estável.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold text-zinc-100">
            {viewMode === 'assets' ? 'Upload de Asset' : viewMode === 'references' ? 'Nova Referência' : 'Adicionar ao Vestiário'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-6">
          <form id="upload-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-400">
                {viewMode === 'assets' ? 'Imagem do Asset' : viewMode === 'references' ? 'Imagem da Referência' : 'Imagem do Template'}
              </label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative",
                  previewUrl ? "border-zinc-700 bg-zinc-950" : "border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/5 bg-zinc-950"
                )}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Trocar Imagem</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-zinc-500">
                    <Upload className="w-8 h-8 mb-3" />
                    <span className="text-sm font-medium">Clique para fazer upload</span>
                    <span className="text-xs mt-1">PNG, JPG ou WEBP (Max 500MB)</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-xs text-zinc-500 font-medium">OU</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
              
              <div>
                <input 
                  type="url" 
                  placeholder="Colar URL da imagem..."
                  value={formData.imageUrl && !formData.imageUrl.startsWith('data:') ? formData.imageUrl : ''}
                  onChange={(e) => {
                    setFormData({...formData, imageUrl: e.target.value});
                    setPreviewUrl(e.target.value);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder={viewMode === 'assets' ? "Ex: Textura Grunge Escura" : viewMode === 'references' ? "Ex: Match Day Flamengo" : "Ex: Template Match Day"}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
              
              {viewMode === 'assets' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Categoria</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Link do Canva (Opcional)</label>
                    <input 
                      type="url" 
                      value={formData.canvaUrl}
                      onChange={(e) => setFormData({...formData, canvaUrl: e.target.value})}
                      placeholder="https://www.canva.com/design/..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </>
              ) : viewMode === 'vestiario' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all appearance-none"
                    >
                      <option value="Kits de Marca">Kits de Marca</option>
                      <option value="Templates PSD">Templates PSD</option>
                      <option value="Mockups">Mockups</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Link do Canva/Drive (Opcional)</label>
                    <input 
                      type="url" 
                      value={formData.canvaUrl}
                      onChange={(e) => setFormData({...formData, canvaUrl: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Esporte</label>
                      <select 
                        value={formData.sport}
                        onChange={(e) => setFormData({...formData, sport: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all appearance-none"
                      >
                        {['Futebol', 'Basquete', 'UFC'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Estilo</label>
                      <select 
                        value={formData.style}
                        onChange={(e) => setFormData({...formData, style: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all appearance-none"
                      >
                        {['Clean', 'Agressivo', 'Premium', 'Dark'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo</label>
                    <select 
                      value={formData.referenceType}
                      onChange={(e) => setFormData({...formData, referenceType: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all appearance-none"
                    >
                      {['Match Day', 'Anúncio', 'Stats', 'Escalação'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-3 pt-2 border-t border-zinc-800/50">
                    <h4 className="text-sm font-medium text-zinc-300">Análise da Arte</h4>
                    <div>
                      <input 
                        type="text" 
                        value={formData.analysisTypography}
                        onChange={(e) => setFormData({...formData, analysisTypography: e.target.value})}
                        placeholder="Tipografia (ex: forte, condensada)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={formData.analysisColors}
                        onChange={(e) => setFormData({...formData, analysisColors: e.target.value})}
                        placeholder="Cores (ex: alto contraste, neon)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={formData.analysisStyle}
                        onChange={(e) => setFormData({...formData, analysisStyle: e.target.value})}
                        placeholder="Estilo (ex: agressivo, minimalista)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tags (separadas por vírgula)</label>
                <input 
                  type="text" 
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="Ex: grunge, dark, stadium..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descrição (Opcional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes sobre o uso ou estilo..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-zinc-800 flex flex-col gap-4 shrink-0 bg-zinc-900/50">
          {isUploading && (
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ type: 'tween', ease: 'linear' }}
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-100 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              form="upload-form"
              disabled={!formData.title || (!formData.imageUrl && !previewUrl && !formData.canvaUrl) || isUploading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-zinc-950 font-semibold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                viewMode === 'assets' ? 'Salvar Asset' : viewMode === 'references' ? 'Salvar Referência' : 'Salvar Template'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
