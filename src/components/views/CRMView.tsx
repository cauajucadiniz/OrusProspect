import { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor, 
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, MessageCircle, GripVertical, Trash2 } from 'lucide-react';
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
  const [activeId, setActiveId] = useState<string | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Card";
    const isOverTask = over.data.current?.type === "Card";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Moving card over another card
    if (isActiveTask && isOverTask) {
      setCards((cards) => {
        const activeIndex = cards.findIndex((t) => t.id === activeId);
        const overIndex = cards.findIndex((t) => t.id === overId);

        if (cards[activeIndex].columnId !== cards[overIndex].columnId) {
          const newArray = [...cards];
          newArray[activeIndex] = {
            ...cards[activeIndex],
            columnId: cards[overIndex].columnId,
          };
          return arrayMove(newArray, activeIndex, overIndex);
        }

        return arrayMove(cards, activeIndex, overIndex);
      });
    }

    const isOverAColumn = isOverColumn || Object.keys(initialColumns).includes(String(overId));

    // Moving card over a column
    if (isActiveTask && isOverAColumn) {
      setCards((cards) => {
        const activeIndex = cards.findIndex((t) => t.id === activeId);
        if (cards[activeIndex].columnId === overId) return cards;

        const newArray = [...cards];
        newArray[activeIndex] = {
          ...cards[activeIndex],
          columnId: String(overId),
        };
        return arrayMove(newArray, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const card = cards.find(c => c.id === activeId);
    if (!card) return;

    await supabase.from('leads').update({ status: card.columnId }).eq('id', activeId);
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

  const activeCardData = activeId ? cards.find(c => c.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium mb-2">Pipeline de Vendas</h1>
          <p className="text-gray-400">Arraste e solte para avançar suas negociações.</p>
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
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {columns.map(column => (
            <KanbanColumn key={column.id} column={column} onDelete={handleDeleteRequest} role={role} />
          ))}

          <DragOverlay>
            {activeCardData ? <KanbanCard card={activeCardData} isOverlay onDelete={handleDeleteRequest} role={role} /> : null}
          </DragOverlay>
        </DndContext>
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

function KanbanColumn({ column, onDelete, role }: any) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column }
  });

  return (
    <div className="w-full md:min-w-[320px] md:w-[320px] flex flex-col glass-card rounded-sm bg-surface/30">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-display font-medium text-gray-200 uppercase tracking-widest">{column.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${column.color}`}>
          {column.cards.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-3 flex flex-col gap-3 min-h-[150px]">
        <SortableContext 
          id={column.id}
          items={column.cards.map((c: any) => c.id)} 
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card: any) => (
            <SortableCard key={card.id} card={card} onDelete={onDelete} role={role} />
          ))}
          {column.cards.length === 0 && (
             <div className="flex-1 rounded-sm border-2 border-dashed border-white/5 flex items-center justify-center text-sm text-gray-600">
               Solte aqui
             </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function KanbanCard({ card, isOverlay = false, onDelete, dragListeners, dragAttributes, role }: any) {
  return (
    <div 
      className={`p-4 rounded-xl bg-[#1A1A1A] border ${isOverlay ? 'border-orus-gold shadow-2xl scale-105 rotate-2 cursor-grabbing' : 'border-white/5 shadow-lg cursor-grab hover:border-white/10'} group transition-colors relative touch-manipulation`}
      {...dragListeners}
      {...dragAttributes}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 max-w-[85%] min-w-0 pointer-events-none">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center font-display font-bold text-gray-400">
            {card.company?.charAt(0) || 'L'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-gray-200 leading-tight truncate block">{card.company}</h4>
            <span className="text-xs text-gray-500 truncate block">{card.contact}</span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 text-gray-500">
          <GripVertical size={16} />
        </div>
      </div>
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-gray-400 truncate pr-2 pointer-events-none">
          <Phone size={12} className="text-gray-500 shrink-0" /> <span className="truncate">{card.phone || 'Sem contato'}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0 z-10">
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
                onPointerDown={(e) => e.stopPropagation()}
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

function SortableCard({ card, onDelete, role }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id, data: { type: 'Card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="outline-none touch-manipulation">
      <KanbanCard card={card} onDelete={onDelete} dragListeners={listeners} dragAttributes={attributes} role={role} />
    </div>
  );
}
