import { useChat } from '../contexts/ChatContext';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

export function TrashPanel() {
  const { folders, restoreFolder, hardDeleteFolder, deleteFolder } = useChat();
  const deletedFolders = folders.filter(f => f.deleted);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lixeira</h2>
        <button onClick={() => setConfirmReset(true)} className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-sm">Resetar Biblioteca</button>
      </div>
      {deletedFolders.length === 0 ? (
        <p className="text-zinc-500">Lixeira vazia.</p>
      ) : (
        <div className="space-y-2">
          {deletedFolders.map(folder => (
            <div key={folder.id} className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
              <span>{folder.name}</span>
              <div className="flex gap-2">
                <button onClick={() => restoreFolder(folder.id)} className="p-1 hover:bg-zinc-700 rounded" title="Restaurar"><RotateCcw className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(folder.id)} className="p-1 hover:bg-red-900 rounded text-red-400" title="Excluir permanentemente"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
            <h3 className="text-lg font-bold mb-4">Excluir permanentemente?</h3>
            <p className="mb-6">Essa ação não pode ser desfeita. Deseja excluir permanentemente?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-zinc-700 rounded">Cancelar</button>
              <button onClick={() => { hardDeleteFolder(confirmDelete); setConfirmDelete(null); }} className="px-4 py-2 bg-red-600 rounded">Excluir</button>
            </div>
          </div>
        </div>
      )}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
            <h3 className="text-lg font-bold mb-4">Resetar Biblioteca?</h3>
            <p className="mb-6">Tem certeza que deseja mover todas as pastas para a lixeira?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmReset(false)} className="px-4 py-2 bg-zinc-700 rounded">Cancelar</button>
              <button onClick={() => { folders.forEach(f => !f.deleted && deleteFolder(f.id)); setConfirmReset(false); }} className="px-4 py-2 bg-red-600 rounded">Resetar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
