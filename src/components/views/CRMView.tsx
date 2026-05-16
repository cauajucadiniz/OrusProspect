import { useState, useEffect } from 'react';
import { Phone, MessageCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const initialColumns = {
  'Nova Oportunidade': { id: 'Nova Oportunidade', title: 'Novos Leads', color: 'bg-blue-500/20 text-blue-400' },
  'Em Negociação': { id: 'Em Negociação', title: 'Em Negociação', color: 'bg-orus-gold/20 text-orus-gold' },
  'Reunião Marcada': { id: 'Reunião Marcada', title: 'Reunião Marcada', color: 'bg-purple-500/20 text-purple-400' },
  'Fechado/Ganho': { id: 'Fechado/Ganho', title: 'Fechado/Ganho', color: 'bg-green-500/20 text-green-400' },
};

export function CRMView() {
  const [cards, setCards] = useState<any[]>([]);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const { user, profile } = useAuth();
  
  const role = profile?.role || 'free';

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);
      
    if (!error && data) {
      setCards(data.map(lead => ({
        id: lead.id,
        columnId: lead.status === 'new' ? 'Nova Oportunidade' : (lead.status || 'Nova Oportunidade'),
        company: lead.company_name || 'Desconhecido',
        contact: lead.industry || 'Sem Segmento',
        phone: lead.phone || '', 
        ...lead
      })));
    }
  };

  const handleMoveCard = async (cardId: string, direction: 'prev' | 'next') => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const columnsArray = Object.keys(initialColumns);
    const currentIndex = columnsArray.indexOf(card.columnId);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) newIndex--;
    if (direction === 'next' && currentIndex < columnsArray.length - 1) newIndex++;

    if (newIndex !== currentIndex) {
      const newColumnId = columnsArray[newIndex];
      // Optimistic update
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, columnId: newColumnId } : c));
      await supabase.from('leads').update({ status: newColumnId }).eq('id', cardId);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setLeadToDelete(id);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    setCards(prev => prev.filter(c => c.id !== leadToDelete));
    await supabase.from('leads').delete().eq('id', leadToDelete);
    setLeadToDelete(null);
  };

  const handleExport = () => {
    if (role === 'free') return;
    
    // Simulate export
    alert(`Exportando para ${role === 'premium' ? 'CSV e Excel' : 'CSV'}...`);
  };

  const columns = Object.values(initialColumns).map(col => ({
    ...col,
    cards: cards.filter(c => c.columnId === col.id)
  }));

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium mb-2">Pipeline de Vendas</h1>
          <p className="text-gray-400">Avance ou retroceda suas negociações utilizando os botões de ação do cartão.</p>
        </div>
        <div>
          <button 
            onClick={handleExport}
            disabled={role === 'free'}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-orus-gold flex items-center gap-2"
            title={role === 'free' ? 'Upgrade necessário para exportar' : 'Exportar Leads'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar {role === 'premium' ? '(CSV/Excel)' : (role !== 'free' ? '(CSV)' : '')}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-y-auto md:overflow-x-auto pb-4 custom-scrollbar">
          {columns.map(column => (
            <KanbanColumn key={column.id} column={column} onDelete={handleDeleteRequest} onMove={handleMoveCard} role={role} />
          ))}
      </div>

      <AnimatePresence>
        {leadToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#111] border border-orus-gold/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <h3 className="text-xl font-display font-medium text-white mb-2">Excluir Lead</h3>
              <p className="text-gray-400 text-sm mb-6">Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setLeadToDelete(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                <button onClick={confirmDelete} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors">Confirmar Exclusão</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KanbanColumn({ column, onDelete, onMove, role }: any) {
  return (
    <div className="w-full md:min-w-[320px] md:w-[320px] flex flex-col glass-card rounded-sm bg-surface/30">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-display font-medium text-gray-200 uppercase tracking-widest">{column.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${column.color}`}>
          {column.cards.length}
        </span>
      </div>
      
      <div className="flex-1 p-3 flex flex-col gap-3 min-h-[150px]">
          {column.cards.map((card: any) => (
            <KanbanCard key={card.id} card={card} onDelete={onDelete} onMove={onMove} role={role} />
          ))}
          {column.cards.length === 0 && (
             <div className="flex-1 rounded-sm border-2 border-dashed border-white/5 flex items-center justify-center text-sm text-gray-600">
               Nenhum lead nesta etapa
             </div>
          )}
      </div>
    </div>
  );
}

function KanbanCard({ card, onDelete, onMove, role }: any) {
  return (
    <div 
      className="p-4 rounded-xl bg-[#1A1A1A] border border-white/5 shadow-lg group hover:border-white/10 transition-colors relative"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 w-full min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center font-display font-bold text-gray-400">
            {card.company?.charAt(0) || 'L'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-gray-200 leading-tight truncate block">{card.company}</h4>
            <span className="text-xs text-gray-500 truncate block">{card.contact}</span>
          </div>
        </div>
      </div>
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-gray-400 truncate pr-2">
          <Phone size={12} className="text-gray-500 shrink-0" /> <span className="truncate">{card.phone || 'Sem contato'}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0 z-10">
          {onMove && (
            <div className="flex bg-white/5 rounded-full border border-white/10 mr-1">
              <button 
                onClick={(e) => { e.stopPropagation(); onMove(card.id, 'prev'); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                title="Voltar Processo"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="w-[1px] bg-white/10"></div>
              <button 
                onClick={(e) => { e.stopPropagation(); onMove(card.id, 'next'); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                title="Avançar Processo"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <button 
            onClick={(e) => {
               e.stopPropagation();
               if(onDelete) onDelete(card.id);
            }} 
            className="w-8 h-8 flex items-center justify-center rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
            onPointerDown={(e) => e.stopPropagation()}
            title="Excluir Lead"
          >
            <Trash2 size={14} />
          </button>
          
          {role !== 'free' && (
            card.phone ? (
              <a
                href={(() => {
                  const cleaned = card.phone.replace(/\D/g, '');
                  return cleaned.startsWith('55') 
                    ? `https://wa.me/${cleaned}` 
                    : `https://wa.me/55${cleaned}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full bg-green-500 hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20 text-[#111]"
                title="Chamar no WhatsApp"
              >
                 <MessageCircle size={14} />
              </a>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 cursor-not-allowed opacity-50 text-gray-500">
                 <MessageCircle size={14} />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
