import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Search, Bookmark, Trash2 } from 'lucide-react';

export function LibraryPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'libraryItems'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Library snapshot error:', error);
    });

    return () => unsubscribe();
  }, []);

  const categories = Array.from(new Set(items.map(item => item.category)));

  const filteredItems = items.filter(item => 
    (activeCategory ? item.category === activeCategory : true) &&
    (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'libraryItems', id));
  };

  return (
    <aside className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full absolute right-0 top-0 bottom-0 z-20 shadow-2xl">
      {/* Header */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold">
          <Bookmark className="w-5 h-5 text-emerald-400" />
          Biblioteca
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-zinc-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar itens salvos..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${!activeCategory ? 'bg-neon-gradient text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-neon-gradient text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm mt-10">
            Nenhum item encontrado.
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-md p-3 group relative">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-semibold text-zinc-200 truncate pr-6">{item.title}</h4>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-3">{item.content}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                  {item.category}
                </span>
                <button className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors">
                  Usar no chat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
