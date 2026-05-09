import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Search, Settings, Menu, ChevronLeft, ClipboardList, UserCircle, Triangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { DashboardView } from './views/DashboardView';
import { SearcherView } from './views/SearcherView';
import { CRMView } from './views/CRMView';
import { PlansView } from './views/PlansView';

export type ViewType = 'dashboard' | 'searcher' | 'crm' | 'plans' | 'profile';

export function Sidebar({ 
  currentView, 
  onViewChange 
}: { 
  currentView: ViewType; 
  onViewChange: (view: ViewType) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'searcher', label: 'Buscador', icon: Search },
    { id: 'crm', label: 'CRM', icon: ClipboardList },
    { id: 'plans', label: 'Planos', icon: Settings },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
  ] as const;

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isExpanded ? 240 : 72 }}
        className="hidden md:flex h-screen bg-surface border-r border-border flex-col pt-6 pb-4 relative z-50 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.5)] blueprint-grid"
      >
        <div className="flex items-center justify-between px-4 mb-8">
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="flex items-center justify-center text-orus-gold">
                <Triangle size={32} strokeWidth={1.5} className="mr-1" />
              </div>
              <span className="font-display font-bold text-2xl tracking-[0.2em] text-white">ORUS</span>
            </motion.div>
          )}
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-orus-gold/20 rounded-md text-orus-gold/80 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded text-sm transition-all relative overflow-hidden group",
                  isActive ? "bg-gradient-to-r from-orus-gold/20 to-transparent text-white border border-orus-gold/30" : "text-zinc-500 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={20} className={cn("shrink-0 relative z-10", isActive && "text-orus-gold")} />
                {isExpanded && <span className="font-medium tracking-wide relative z-10">{item.label}</span>}
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orus-gold" />}
              </button>
            );
          })}
        </div>
      </motion.aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-lg border-t border-surface-border flex items-center justify-around z-50">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                isActive ? "text-orus-gold" : "text-gray-500"
              )}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
