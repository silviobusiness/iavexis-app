import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  Download, 
  ExternalLink, 
  Heart,
  Folder,
  Image as ImageIcon,
  Type,
  Palette,
  Zap,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { id: 'all', label: 'All Assets', icon: Grid },
  { id: 'templates', label: 'Templates', icon: ImageIcon },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'branding', label: 'Branding Kits', icon: Palette },
  { id: 'textures', label: 'Textures & Overlays', icon: Zap },
];

const assets = [
  { id: 1, title: 'NBA Finals Poster Template', category: 'templates', type: 'PSD', image: 'https://picsum.photos/seed/lib1/400/500', tags: ['NBA', 'Basketball', 'Modern'] },
  { id: 2, title: 'Dynamic Sports Font Pack', category: 'typography', type: 'OTF', image: 'https://picsum.photos/seed/lib2/400/500', tags: ['Bold', 'Italic', 'Aggressive'] },
  { id: 3, title: 'Soccer Jersey Mockup v2', category: 'templates', type: 'PSD', image: 'https://picsum.photos/seed/lib3/400/500', tags: ['Soccer', 'Jersey', 'Realistic'] },
  { id: 4, title: 'Grunge Texture Pack', category: 'textures', type: 'PNG', image: 'https://picsum.photos/seed/lib4/400/500', tags: ['Grunge', 'Overlay', 'Dark'] },
  { id: 5, title: 'Esports Team Branding Kit', category: 'branding', type: 'AI', image: 'https://picsum.photos/seed/lib5/400/500', tags: ['Esports', 'Logo', 'Vector'] },
  { id: 6, title: 'Stadium Light Overlays', category: 'textures', type: 'JPG', image: 'https://picsum.photos/seed/lib6/400/500', tags: ['Light', 'Stadium', 'FX'] },
];

export const Library: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = activeCategory === 'all' || asset.category === activeCategory;
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter text-white">SPORTS LIBRARY</h1>
          <p className="text-gray-400 font-medium">Your intelligent vault of premium sports design assets.</p>
        </div>
        <button className="px-6 py-3 bg-green-neon text-black rounded-xl text-sm font-bold hover:bg-green-neon/90 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Upload Asset
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-surface-1 border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets, tags, or styles..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
            />
          </div>
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-8 w-px bg-white/10" />

          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  activeCategory === cat.id 
                    ? "bg-green-neon text-black" 
                    : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/10 hover:text-white"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
      )}>
        <AnimatePresence mode="popLayout">
          {filteredAssets.map((asset) => (
            <motion.div
              key={asset.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5 }}
              className={cn(
                "bg-surface-1 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all",
                viewMode === 'list' && "flex items-center gap-6 p-4"
              )}
            >
              <div className={cn(
                "relative overflow-hidden bg-surface-2",
                viewMode === 'grid' ? "aspect-[3/4]" : "w-32 h-32 rounded-xl shrink-0"
              )}>
                <img 
                  src={asset.image} 
                  alt={asset.title} 
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                  <button className="p-3 bg-white text-black rounded-full hover:scale-110 transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-green-neon text-black rounded-full hover:scale-110 transition-all">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
                <button className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all hover:text-red-500">
                  <Heart className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                  {asset.type}
                </div>
              </div>

              <div className={cn("p-5 space-y-4", viewMode === 'list' && "flex-1 p-0")}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white group-hover:text-green-neon transition-all">{asset.title}</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{asset.category}</p>
                  </div>
                  <button className="text-gray-500 hover:text-white transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-gray-400 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                    Use in Project
                  </button>
                  <button className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                    <Folder className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-600" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">No assets found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
          <button 
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
            className="text-green-neon font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
