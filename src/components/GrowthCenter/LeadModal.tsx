import React, { useState, useEffect } from 'react';
import { LeadType, useGrowth, Lead } from '../../contexts/GrowthContext';
import { X } from 'lucide-react';

interface LeadModalProps {
  onClose: () => void;
  leadToEdit?: Lead | null;
}

export function LeadModal({ onClose, leadToEdit }: LeadModalProps) {
  const { createLead, updateLead } = useGrowth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: leadToEdit?.name || '',
    type: leadToEdit?.type || 'cliente' as LeadType,
    socialMedia: leadToEdit?.socialMedia || '',
    followers: leadToEdit?.followers?.toString() || '',
    serviceType: leadToEdit?.serviceType || '',
    notes: leadToEdit?.notes || '',
    niche: leadToEdit?.niche || '',
    engagement: leadToEdit?.engagement?.toString() || '',
    partnershipType: leadToEdit?.partnershipType || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        serviceType: formData.serviceType,
        socialMedia: formData.socialMedia,
        followers: formData.followers ? Number(formData.followers) : undefined,
        notes: formData.notes,
        ...(formData.type === 'influenciador' ? {
          niche: formData.niche,
          engagement: formData.engagement ? Number(formData.engagement) : undefined,
          partnershipType: formData.partnershipType
        } : {
          niche: '',
          engagement: undefined,
          partnershipType: ''
        })
      };

      if (leadToEdit) {
        await updateLead(leadToEdit.id, payload);
      } else {
        await createLead({
          ...payload,
          status: 'novo_lead',
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">{leadToEdit ? 'Editar Lead' : 'Novo Lead'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Nome</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Nome do cliente ou influenciador"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as LeadType})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="cliente">Cliente</option>
                  <option value="influenciador">Influenciador</option>
                  <option value="parceiro">Parceiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Serviço/Interesse</label>
                <input
                  required
                  type="text"
                  value={formData.serviceType}
                  onChange={e => setFormData({...formData, serviceType: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Identidade Visual"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Rede Social (@)</label>
                <input
                  type="text"
                  value={formData.socialMedia}
                  onChange={e => setFormData({...formData, socialMedia: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="@usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Seguidores</label>
                <input
                  type="number"
                  value={formData.followers}
                  onChange={e => setFormData({...formData, followers: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: 10000"
                />
              </div>
            </div>

            {formData.type === 'influenciador' && (
              <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 space-y-4">
                <h3 className="text-sm font-semibold text-emerald-400">Dados do Influenciador</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Nicho</label>
                    <input
                      type="text"
                      value={formData.niche}
                      onChange={e => setFormData({...formData, niche: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                      placeholder="Ex: Futebol"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Engajamento (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.engagement}
                      onChange={e => setFormData({...formData, engagement: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                      placeholder="Ex: 5.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo de Parceria</label>
                  <input
                    type="text"
                    value={formData.partnershipType}
                    onChange={e => setFormData({...formData, partnershipType: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Permuta, Divulgação paga"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Observações Iniciais</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 min-h-[80px] resize-none"
                placeholder="Detalhes adicionais..."
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="lead-form"
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-zinc-950 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : leadToEdit ? 'Salvar Alterações' : 'Criar Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
