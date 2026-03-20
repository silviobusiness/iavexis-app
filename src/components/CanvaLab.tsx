import React, { useState } from 'react';
import { ExternalLink, Search, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'Todos',
  'Remoção de fundo',
  'Mockups',
  'Geração de imagens com IA',
  'Efeitos visuais',
  'Ferramentas de vídeo',
  'Upscale de imagem',
  'Ferramentas de texto',
  'Texturas e efeitos'
];

const TOOLS = [
  {
    id: '1',
    name: 'Removedor de Fundo',
    description: 'Remova o fundo de qualquer imagem em um clique com alta precisão.',
    category: 'Remoção de fundo',
    suggestion: 'Ideal para recortar jogadores e criar composições limpas para matchdays.',
    url: 'https://www.canva.com/features/background-remover/'
  },
  {
    id: '2',
    name: 'Smartmockups',
    description: 'Crie mockups realistas de produtos diretamente no Canva.',
    category: 'Mockups',
    suggestion: 'Aplique escudos e artes em camisas, canecas e produtos do clube.',
    url: 'https://www.canva.com/apps/AAFDFH1-mockups'
  },
  {
    id: '3',
    name: 'Mídia Mágica (IA)',
    description: 'Gere imagens e vídeos a partir de descrições em texto.',
    category: 'Geração de imagens com IA',
    suggestion: 'Crie texturas exclusivas, estádios futuristas ou elementos abstratos para fundos.',
    url: 'https://www.canva.com/features/ai-image-generator/'
  },
  {
    id: '4',
    name: 'Duotone',
    description: 'Aplique efeitos de duas cores vibrantes em suas fotos.',
    category: 'Efeitos visuais',
    suggestion: 'Padronize fotos de jogadores com as cores oficiais do time.',
    url: 'https://www.canva.com/features/photo-effects/'
  },
  {
    id: '5',
    name: 'Enhancer (Upscale)',
    description: 'Aumente a resolução e melhore a qualidade de imagens de baixa qualidade.',
    category: 'Upscale de imagem',
    suggestion: 'Melhore fotos antigas do clube ou imagens de baixa resolução enviadas por clientes.',
    url: 'https://www.canva.com/features/image-enhancer/'
  },
  {
    id: '6',
    name: 'TypeCraft',
    description: 'Distorça, curve e modifique textos livremente.',
    category: 'Ferramentas de texto',
    suggestion: 'Crie tipografias dinâmicas e agressivas para anúncios de jogos e placares.',
    url: 'https://www.canva.com/apps/AAFDFH1-typecraft'
  },
  {
    id: '7',
    name: 'Sombras',
    description: 'Adicione sombras projetadas, brilhantes ou contornos às imagens.',
    category: 'Efeitos visuais',
    suggestion: 'Destaque jogadores do fundo adicionando contornos brilhantes (glow) ou sombras.',
    url: 'https://www.canva.com/features/photo-effects/'
  },
  {
    id: '8',
    name: 'Removedor de Fundo de Vídeo',
    description: 'Remova o fundo de vídeos com um clique.',
    category: 'Ferramentas de vídeo',
    suggestion: 'Isole jogadores em movimento para criar vídeos promocionais dinâmicos.',
    url: 'https://www.canva.com/features/video-background-remover/'
  }
];

export function CanvaLab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filteredTools = TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-full bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md z-10 shrink-0 p-8 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00C4CC] via-[#7D2AE8] to-[#FF007F] flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#7D2AE8]" />
            Laboratório de Ferramentas
          </h2>
          <p className="text-zinc-400 mt-2 text-lg">
            Descubra aplicativos e ferramentas que podem acelerar seu trabalho dentro do Canva.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative max-w-2xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar ferramentas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-11 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#7D2AE8] focus:ring-1 focus:ring-[#7D2AE8] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category 
                    ? 'bg-neon-gradient text-zinc-950 shadow-lg shadow-emerald-500/20' 
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map(tool => (
            <div key={tool.id} className="bg-zinc-900 border border-zinc-800 rounded-md p-6 flex flex-col hover:border-emerald-500/50 transition-colors group">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
                  {tool.category}
                </span>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{tool.name}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-zinc-800/50">
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Uso no Design Esportivo</h4>
                  <p className="text-sm text-emerald-400/90 italic">
                    "{tool.suggestion}"
                  </p>
                </div>
                
                <a 
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-colors text-sm group-hover:bg-neon-gradient group-hover:text-zinc-950"
                >
                  Abrir no Canva
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">Nenhuma ferramenta encontrada para esta busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
