import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, ViewType } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { SearcherView } from './components/views/SearcherView';
import { CRMView } from './components/views/CRMView';
import { PlansView } from './components/views/PlansView';
import { ProfileView } from './components/views/ProfileView';
import { ParticleBackground } from './components/ParticleBackground';
import { useAuth } from './contexts/AuthContext';
import { LoginView } from './components/views/LoginView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMounted, setIsMounted] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || loading) return <div className="flex h-screen bg-background items-center justify-center"><div className="w-8 h-8 rounded-sm bg-gradient-to-br from-orus-gold to-orus-gold-dark animate-pulse" /></div>;

  if (!user) {
    return (
      <div className="flex h-screen bg-background overflow-hidden selection:bg-orus-gold/30 selection:text-white text-gray-200">
        <ParticleBackground scrollContainerRef={mainRef} />
        <div className="fixed -top-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-orus-gold/20 via-orus-amber/5 to-transparent blur-[150px] pointer-events-none" />
        <div className="fixed -bottom-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-orus-gold/10 via-black to-transparent blur-[100px] pointer-events-none" />
        <LoginView />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-orus-gold/30 selection:text-white text-gray-200">
      <ParticleBackground scrollContainerRef={mainRef} />
      
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main ref={mainRef} className="flex-1 overflow-y-auto relative scroll-smooth flex flex-col z-10">
        {/* Decorative background glows */}
        <div className="fixed -top-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-orus-gold/20 via-orus-amber/5 to-transparent blur-[150px] pointer-events-none" />
        <div className="fixed -bottom-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-orus-gold/10 via-black to-transparent blur-[100px] pointer-events-none" />
        
        <div className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto flex flex-col relative z-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'searcher' && <SearcherView />}
              {currentView === 'crm' && <CRMView />}
              {currentView === 'plans' && <PlansView />}
              {currentView === 'profile' && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
