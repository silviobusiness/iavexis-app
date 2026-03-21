import React, { useState, useCallback, useRef } from 'react';
import { Tldraw, Editor, createShapeId, AssetRecordType } from 'tldraw';
import 'tldraw/tldraw.css';
import { useLibrary } from '../contexts/LibraryContext';
import { 
  Search, 
  Image as ImageIcon, 
  ChevronRight, 
  ChevronLeft, 
  Type, 
  Square, 
  Upload, 
  Layout, 
  Layers,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Palette,
  MousePointer2,
  Plus,
  Trello
} from 'lucide-react';
import { ProjectKanban } from './ProjectKanban';
import clsx from 'clsx';

type SidebarTab = 'library' | 'elements' | 'uploads' | 'text' | 'templates' | 'projects' | 'brand';

export function CreativeLocker() {
  const { items } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('library');
  const [selectedShapes, setSelectedShapes] = useState<any[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const editorRef = useRef<Editor | null>(null);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    
    // Listen for changes using the standard on('change') event
    editor.on('change', () => {
      const selected = editor.getSelectedShapes();
      setSelectedShapes(selected);
      setZoomLevel(editor.getZoomLevel());
    });
  }, []);

  const filteredItems = items.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  const addImageToCanvas = (url: string, title: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;

    const assetId = AssetRecordType.createId();
    
    editor.createAssets([
      {
        id: assetId,
        type: 'image',
        typeName: 'asset',
        props: {
          name: title,
          src: url,
          w: 400,
          h: 400,
          mimeType: 'image/png',
          isAnimated: false,
        },
        meta: {},
      } as any,
    ]);

    editor.createShape({
      type: 'image',
      x: editor.getViewportPageBounds().center.x - 200,
      y: editor.getViewportPageBounds().center.y - 200,
      props: {
        assetId,
        w: 400,
        h: 400,
      },
    } as any);
  };

  const addText = () => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    editor.createShape({
      type: 'text',
      x: editor.getViewportPageBounds().center.x - 100,
      y: editor.getViewportPageBounds().center.y - 20,
      props: {
        text: 'Novo Texto',
      },
    } as any);
  };

  const addShape = (type: 'geo', geo: 'rectangle' | 'ellipse' | 'triangle' | 'star') => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    editor.createShape({
      type,
      x: editor.getViewportPageBounds().center.x - 50,
      y: editor.getViewportPageBounds().center.y - 50,
      props: {
        geo,
        w: 100,
        h: 100,
        color: 'black',
        fill: 'none',
      },
    } as any);
  };

  const deleteSelected = () => {
    if (!editorRef.current) return;
    editorRef.current.deleteShapes(editorRef.current.getSelectedShapeIds());
  };

  const duplicateSelected = () => {
    if (!editorRef.current) return;
    editorRef.current.duplicateShapes(editorRef.current.getSelectedShapeIds());
  };

  const moveForward = () => {
    if (!editorRef.current) return;
    editorRef.current.bringToFront(editorRef.current.getSelectedShapeIds());
  };

  const moveBackward = () => {
    if (!editorRef.current) return;
    editorRef.current.sendToBack(editorRef.current.getSelectedShapeIds());
  };

  const changeColor = (color: string) => {
    if (!editorRef.current) return;
    editorRef.current.updateShapes(
      editorRef.current.getSelectedShapes().map(s => ({
        id: s.id,
        type: s.type,
        props: { ...s.props, color }
      })) as any
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
      {/* Top Contextual Toolbar */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-4 z-50">
        <div className="flex items-center gap-2 mr-4 border-r border-zinc-800 pr-4">
          <div className="w-8 h-8 bg-neon-gradient rounded-md flex items-center justify-center">
            <Layout className="w-5 h-5 text-zinc-950" />
          </div>
          <span className="text-sm font-bold text-zinc-100">Vestiário Criativo</span>
        </div>

        {activeTab === 'projects' ? (
          <div className="flex-1 flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-medium italic">
              Gerencie seus projetos e prazos esportivos
            </div>
          </div>
        ) : selectedShapes.length > 0 ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-md">
              <button 
                onClick={deleteSelected}
                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 rounded-md transition-colors" 
                title="Deletar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={duplicateSelected}
                className="p-1.5 hover:bg-zinc-700 text-zinc-400 rounded-md transition-colors" 
                title="Duplicar"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-zinc-800 mx-1" />

            <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-md">
              <button 
                onClick={moveForward}
                className="p-1.5 hover:bg-zinc-700 text-zinc-400 rounded-md transition-colors" 
                title="Trazer para frente"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button 
                onClick={moveBackward}
                className="p-1.5 hover:bg-zinc-700 text-zinc-400 rounded-md transition-colors" 
                title="Enviar para trás"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-zinc-800 mx-1" />

            <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded-md overflow-x-auto max-w-[400px] no-scrollbar">
              {['black', 'grey', 'light-grey', 'white', 'blue', 'light-blue', 'turquoise', 'green', 'light-green', 'yellow', 'orange', 'red', 'light-red', 'pink', 'light-pink', 'violet', 'light-violet'].map(color => (
                <button
                  key={color}
                  onClick={() => changeColor(color)}
                  className={clsx(
                    "w-5 h-5 rounded-full border border-zinc-700 transition-transform hover:scale-110 shrink-0",
                    `bg-tl-${color}`
                  )}
                  title={color}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-medium italic">
              Selecione um elemento para ver as opções
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Deseja limpar todo o quadro?')) {
                  editorRef.current?.selectAll().deleteShapes(editorRef.current.getSelectedShapeIds());
                }
              }}
              className="text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Limpar Quadro
            </button>
            <div className="h-6 w-px bg-zinc-800 mx-4" />
            <button 
              onClick={() => {
                // Tldraw export logic would go here, for now we'll just show a message
                alert('Funcionalidade de exportação (PNG/SVG) será integrada em breve!');
              }}
              className="px-4 py-1.5 bg-neon-gradient text-zinc-950 text-xs font-bold rounded-md hover:opacity-90 transition-all flex items-center gap-2"
            >
              Baixar Arte
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar (Canva Style) */}
        <div className="w-16 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-4 gap-4 z-50">
          {[
            { id: 'projects', icon: Trello, label: 'Projetos' },
            { id: 'brand', icon: Palette, label: 'Marca' },
            { id: 'templates', icon: Layout, label: 'Modelos' },
            { id: 'elements', icon: Square, label: 'Elementos' },
            { id: 'library', icon: ImageIcon, label: 'Biblioteca' },
            { id: 'text', icon: Type, label: 'Texto' },
            { id: 'uploads', icon: Upload, label: 'Uploads' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as SidebarTab);
                setIsSidebarOpen(true);
              }}
              className={clsx(
                "w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-all group",
                activeTab === tab.id && isSidebarOpen ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Expanded Sidebar Content */}
        <div
          className={clsx(
            "w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full z-40 transition-all duration-300 shadow-2xl overflow-hidden",
            isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none absolute"
          )}
        >
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
              {activeTab === 'projects' && 'Gestão de Projetos'}
              {activeTab === 'library' && 'Biblioteca Esportiva'}
              {activeTab === 'elements' && 'Elementos Gráficos'}
              {activeTab === 'uploads' && 'Meus Uploads'}
              {activeTab === 'text' && 'Ferramentas de Texto'}
              {activeTab === 'templates' && 'Modelos Prontos'}
            </h3>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'projects' && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Visualize e organize seus projetos ativos. Arraste os cards para mudar o status.
                </p>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <Trello className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Modo Kanban</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    O quadro completo está visível à direita.
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'brand' && (
              <div className="p-4 space-y-6">
                <section>
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Cores da Marca</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {['#00FF00', '#000000', '#FFFFFF', '#1A1A1A', '#333333', '#888888', '#EAEAEA', '#FF4444'].map(color => (
                      <button
                        key={color}
                        onClick={() => changeColor(color)}
                        className="aspect-square rounded-md border border-zinc-800 transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <button className="aspect-square rounded-md border border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Tipografia</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Anton', weight: 'Bold' },
                      { name: 'Inter', weight: 'Regular' },
                      { name: 'JetBrains Mono', weight: 'Medium' }
                    ].map(font => (
                      <button
                        key={font.name}
                        onClick={addText}
                        className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-md text-left hover:border-emerald-500/30 transition-all group"
                      >
                        <div className="text-sm font-bold text-white group-hover:text-emerald-400">{font.name}</div>
                        <div className="text-[10px] text-zinc-500">{font.weight}</div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
            {activeTab === 'library' && (
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['Todos', 'Camisas', 'Logos', 'Escudos', 'Shapes'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSearchQuery(cat === 'Todos' ? '' : cat)}
                      className={clsx(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                        (searchQuery === cat || (cat === 'Todos' && searchQuery === '')) 
                          ? "bg-emerald-500 text-zinc-950" 
                          : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        if (item.imageUrl) {
                          e.dataTransfer.setData('text/uri-list', item.imageUrl);
                          e.dataTransfer.setData('text/plain', item.imageUrl);
                        }
                      }}
                      onClick={() => item.imageUrl && addImageToCanvas(item.imageUrl, item.title)}
                      className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden group hover:border-emerald-500/50 transition-all text-left cursor-grab active:cursor-grabbing"
                    >
                      <div className="aspect-square relative flex items-center justify-center bg-zinc-900/50 p-2">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="max-w-full max-h-full object-contain pointer-events-none"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-zinc-700" />
                        )}
                      </div>
                      <div className="p-1.5 border-t border-zinc-800">
                        <p className="text-[10px] font-medium text-zinc-400 truncate">{item.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'elements' && (
              <div className="p-4 space-y-6">
                <section>
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Formas Básicas</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { geo: 'rectangle', icon: Square },
                      { geo: 'ellipse', icon: MousePointer2 },
                      { geo: 'triangle', icon: MousePointer2 },
                      { geo: 'star', icon: MousePointer2 },
                    ].map((shape, i) => (
                      <button
                        key={i}
                        onClick={() => addShape('geo', shape.geo as any)}
                        className="aspect-square bg-zinc-950 border border-zinc-800 rounded-md flex items-center justify-center hover:border-emerald-500/50 transition-all text-zinc-400 hover:text-emerald-400"
                      >
                        <shape.icon className="w-6 h-6" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="p-4 space-y-4">
                <button
                  onClick={addText}
                  className="w-full py-3 bg-neon-gradient text-zinc-950 font-bold rounded-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Texto
                </button>
                <div className="space-y-2">
                  <button onClick={addText} className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-md text-left hover:border-emerald-500/30 transition-all">
                    <h1 className="text-xl font-bold text-white">Título</h1>
                  </button>
                  <button onClick={addText} className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-md text-left hover:border-emerald-500/30 transition-all">
                    <h2 className="text-lg font-semibold text-zinc-200">Subtítulo</h2>
                  </button>
                  <button onClick={addText} className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-md text-left hover:border-emerald-500/30 transition-all">
                    <p className="text-sm text-zinc-400">Corpo de texto</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'uploads' && (
              <div className="p-4 flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-xs text-zinc-500 font-medium">Faça upload de suas próprias artes para usar no editor.</p>
                <button className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-all">
                  Fazer Upload
                </button>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="p-4 text-center py-12">
                <Layout className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-xs text-zinc-500">Modelos prontos estarão disponíveis em breve.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative h-full creative-locker-canvas">
          {activeTab === 'projects' ? (
            <div className="h-full p-6 overflow-y-auto custom-scrollbar bg-[#0B0B0B]">
              <ProjectKanban />
            </div>
          ) : (
            <>
              <Tldraw 
                persistenceKey="creative-locker-board-v2" 
                onMount={handleMount}
              />
              
              {/* Zoom Controls */}
              <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg shadow-2xl">
                <button 
                  onClick={() => editorRef.current?.zoomOut()}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-zinc-500 min-w-[40px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button 
                  onClick={() => editorRef.current?.zoomIn()}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          
          {/* Toggle Sidebar Button (when closed) */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-zinc-900 border border-zinc-800 p-1.5 rounded-r-xl shadow-lg text-zinc-400 hover:text-zinc-100 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
