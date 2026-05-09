import { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
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
import { Phone, Calendar, GripVertical, Trash2 } from 'lucide-react';
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
  const { user } = useAuth();

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
        columnId: lead.status || 'Nova Oportunidade',
        company: lead.name,
        contact: lead.industry,
        phone: '', // Mocked phone for design purposes
        ...lead
      })));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Is it a column or a card
    const isOverColumn = Object.keys(initialColumns).includes(String(overId));
    
    let newColumnId = '';

    setCards((prev) => {
      const activeIndex = prev.findIndex((c) => c.id === activeId);
      const activeCard = prev[activeIndex];
      
      if (isOverColumn) {
        if (activeCard.columnId !== overId) {
          newColumnId = String(overId);
          const newArray = [...prev];
          newArray[activeIndex] = { ...activeCard, columnId: newColumnId };
          return newArray;
        }
        return prev;
      }

      const overIndex = prev.findIndex((c) => c.id === overId);
      if (overIndex === -1) return prev;
      
      const overCard = prev[overIndex];

      if (activeCard.columnId !== overCard.columnId) {
         newColumnId = overCard.columnId;
         const newArray = [...prev];
         newArray[activeIndex] = { ...activeCard, columnId: newColumnId };
         return arrayMove(newArray, activeIndex, overIndex);
      }

      return arrayMove(prev, activeIndex, overIndex);
    });

    if (newColumnId) {
      await supabase.from('leads').update({ status: newColumnId }).eq('id', activeId);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este lead?')) return;
    setCards(prev => prev.filter(c => c.id !== id));
    await supabase.from('leads').delete().eq('id', id);
  };

  const columns = Object.values(initialColumns).map(col => ({
    ...col,
    cards: cards.filter(c => c.columnId === col.id)
  }));

  const activeCardData = activeId ? cards.find(c => c.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-display font-medium mb-2">Pipeline de Vendas</h1>
        <p className="text-gray-400">Arraste e solte para avançar suas negociações.</p>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-y-auto md:overflow-x-auto pb-4 custom-scrollbar">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {columns.map(column => (
            <KanbanColumn key={column.id} column={column} onDelete={handleDelete} />
          ))}

          <DragOverlay>
            {activeCardData ? <KanbanCard card={activeCardData} isOverlay onDelete={handleDelete} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function KanbanColumn({ column, onDelete }: any) {
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
            <SortableCard key={card.id} card={card} onDelete={onDelete} />
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

function KanbanCard({ card, isOverlay = false, onDelete }: any) {
  return (
    <div className={`p-4 rounded-xl bg-[#1A1A1A] border ${isOverlay ? 'border-orus-gold shadow-2xl scale-105 rotate-2' : 'border-white/5 shadow-lg'} group hover:border-white/10 transition-colors relative`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 max-w-[80%]">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center font-display font-bold text-gray-400">
            {card.company?.charAt(0) || 'L'}
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-200 leading-tight truncate">{card.company}</h4>
            <span className="text-xs text-gray-500 truncate block">{card.contact}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="text-gray-600 hover:text-gray-300 transition-opacity cursor-grab">
            <GripVertical size={16} />
          </button>
          <button 
            onClick={(e) => {
               e.stopPropagation();
               if(onDelete) onDelete(card.id);
            }} 
            className="text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity relative z-10"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <Phone size={12} className="text-gray-500" /> {card.phone || 'Sem contato'}
        </span>
        <button className="w-6 h-6 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
           <Calendar size={12} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}

function SortableCard({ card, onDelete }: any) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none touch-none">
      <KanbanCard card={card} onDelete={onDelete} />
    </div>
  );
}
