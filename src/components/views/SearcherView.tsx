import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Briefcase, Globe, Phone, Download, Filter, Triangle, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function SearcherView() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>(() => {
    const saved = localStorage.getItem('orus_search_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [showResults, setShowResults] = useState(() => {
    const saved = localStorage.getItem('orus_search_results');
    return saved ? JSON.parse(saved).length > 0 : false;
  });
  const [location, setLocation] = useState('');
  const [segment, setSegment] = useState('');
  const [limit, setLimit] = useState(10);
  const { profile, updateCredits, user } = useAuth();
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('orus_search_results', JSON.stringify(results));
  }, [results]);

  const handleSearch = async () => {
    setErrorInfo(null);
    if (!user) return;
    
    // Fallback current credits if profile context is somehow empty
    let currentCredits = profile?.credits_remaining;
    if (currentCredits === undefined) {
      const { data } = await supabase.from('profiles').select('credits_remaining').eq('id', user.id).single();
      currentCredits = data?.credits_remaining || 0;
    }

    if (currentCredits <= 0) {
      setErrorInfo('Seus créditos esgotaram. Aguarde o reset diário ou faça upgrade.');
      return;
    }
    
    setIsScanning(true);
    setShowResults(false);
    
    try {
      const response = await fetch('/.netlify/functions/fetch-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          searchTerm: segment,
          location: location,
          userId: user.id,
          limit: limit 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao buscar leads');
      }

      const data = await response.json();
      const generatedCount = data.resultsCount;

      if (generatedCount > 0) {
        const resultLeads = data.leads || [];
        setResults(resultLeads);
        setShowResults(true);
        
        // Insert into Supabase from frontend
        try {
           const leadsToInsert = resultLeads.map((r: any) => ({
             user_id: user.id,
             company_name: r.name || r.company_name || 'Local Sem Nome',
             industry: r.industry || segment || '',
             phone: r.phone || '',
             website: r.website || '',
             address: r.address || location || '',
             status: 'Nova Oportunidade',
           }));
           
           // Fetch a single row just to refresh schema definition on the client, or just do the query
           const { error: insertErr } = await supabase.from('leads').insert(leadsToInsert);
           
           if (insertErr) {
             console.error("Erro ao salvar leads no CRM: ", insertErr);
             alert("Erro ao salvar leads no CRM: " + insertErr.message);
             setResults(resultLeads.map((r: any) => ({ ...r, isSaved: false })));
           } else {
             console.log("Leads inseridos com sucesso.");
             setResults(resultLeads.map((r: any) => ({ ...r, isSaved: true })));
           }
        } catch (insertErr: any) {
           console.error("Exceção ao salvar leads no CRM: ", insertErr);
           alert("Erro ao salvar leads no CRM: " + insertErr.message);
           setResults(resultLeads.map((r: any) => ({ ...r, isSaved: false })));
        }

      } else {
        // fallback show empty results instead of crashing
        setResults([]);
        setShowResults(true);
        setErrorInfo('Nenhum resultado encontrado. Tente buscar por outros termos.');
      }
    } catch (err: any) {
      setErrorInfo(err.message || 'Ocorreu um erro na busca.');
    } finally {
      setIsScanning(false);
    }
  };

  const addAllToCRM = async () => {
    if (!user) return;
    try {
      const leadsToInsert = results.map(r => ({
        user_id: user.id,
        company_name: r.name || 'Local Sem Nome',
        industry: r.industry || segment || '',
        phone: r.phone || '',
        website: r.website || '',
        address: r.address || location || '',
        status: 'Nova Oportunidade',
      }));

      const { error } = await supabase.from('leads').insert(leadsToInsert);
      if (error) throw error;
      alert('Leads adicionados ao CRM com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao adicionar leads ao CRM: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-medium mb-2 flex items-center gap-3">
            Buscador Mágico <span className="px-2 py-0.5 text-xs font-sans tracking-wide bg-orus-gold/10 text-orus-gold border border-orus-gold/20 rounded-full">BETA</span>
          </h1>
          <p className="text-gray-400">Encontre os leads perfeitos baseados em segmento e localização.</p>
          {profile && (
            <p className="text-orus-gold text-sm mt-2 font-display font-semibold">Créditos disponíveis: {profile.credits_remaining}</p>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-visible pb-4 lg:pb-0">
        {/* Left Sidebar (Filters) */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border-t border-t-orus-gold/20 overflow-y-auto custom-scrollbar">
            <h3 className="font-display font-medium mb-6 text-orus-gold flex items-center gap-2 tracking-wide text-sm uppercase">
              <Filter size={16} /> Filtros de Busca
            </h3>

            {errorInfo && (
              <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-sm text-sm">
                {errorInfo}
              </div>
            )}
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Localização</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="CEP, bairro ou cidade..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orus-gold/50 focus:ring-1 focus:ring-orus-gold/50 transition-all text-gray-200 placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Segmento</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    placeholder="Ex: Clínicas odontológicas"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orus-gold/50 focus:ring-1 focus:ring-orus-gold/50 transition-all text-gray-200 placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Quantidade de Resultados</label>
                <div className="relative">
                   <select 
                     className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-orus-gold/50 focus:ring-1 focus:ring-orus-gold/50 transition-all text-gray-200 appearance-none"
                     value={limit}
                     onChange={(e) => setLimit(parseInt(e.target.value))}
                   >
                     <option value="5">5 Leads</option>
                     <option value="10">10 Leads</option>
                     <option value="15">15 Leads</option>
                     <option value="20">20 Leads</option>
                     <option value="50">50 Leads (Plus+)</option>
                     <option value="100">100 Leads (Plus+)</option>
                     <option value="150">150 Leads (Plus+)</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M1 1.5L6 6.5L11 1.5" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                   </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-4">
                <ToggleSwitch label="Exigir Site" defaultChecked />
                <ToggleSwitch label="Exigir Telefone" defaultChecked />
              </div>

              <button 
                onClick={handleSearch}
                disabled={isScanning || !segment}
                className={cn(
                  "w-full py-4 mt-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all relative overflow-hidden",
                  (isScanning || !segment)
                    ? "bg-white/5 text-gray-400 cursor-not-allowed border border-white/10" 
                    : "bg-orus-gold text-black hover:bg-orus-amber shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                )}
              >
                {isScanning ? (
                  <span className="flex items-center gap-2">
                    <Search size={18} className="animate-pulse" /> Escaneando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search size={18} /> INICIAR BUSCA
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col relative border-none bg-surface/40">
          <AnimatePresence mode="wait">
            {!isScanning && !showResults && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full text-center p-8 absolute inset-0 text-gray-500"
              >
                <div className="w-20 h-20 mb-6 rounded-full border border-dashed border-gray-600 flex items-center justify-center bg-white/5 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orus-gold/20 to-transparent rounded-full blur-xl animate-pulse" />
                  <Search size={32} className="text-gray-400 relative z-10" />
                </div>
                <h3 className="text-xl font-display font-medium text-gray-300 mb-2">Pronto para prospectar</h3>
                <p className="max-w-sm">Defina os parâmetros ao lado e clique em iniciar para buscar milhares de empresas na web.</p>
              </motion.div>
            )}

            {isScanning && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full absolute inset-0 bg-background"
              >
                <div className="relative w-48 h-48 flex items-center justify-center">
                   {/* Scanning radar effect */}
                   <div className="absolute inset-0 border border-orus-gold/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                   <div className="absolute inset-4 border border-orus-gold/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
                   
                   {/* Core */}
                   <div className="w-16 h-16 bg-gradient-to-br from-orus-gold to-orus-amber rounded-full shadow-[0_0_40px_rgba(212,175,55,0.8)] flex items-center justify-center">
                     <Triangle className="text-black" size={24} strokeWidth={2.5} />
                   </div>
                </div>
                <motion.h2 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="mt-8 text-xl font-display text-orus-gold tracking-widest uppercase"
                >
                  Robô Apify Trabalhando...
                </motion.h2>
                <p className="text-gray-500 mt-2 text-sm uppercase tracking-wider">Aguarde, extraindo leads em tempo real</p>
              </motion.div>
            )}

            {showResults && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col h-full relative z-10"
              >
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <span className="text-sm text-gray-400">Encontrados <strong className="text-white">{results.length}</strong> leads. Todos já foram salvos no seu CRM.</span>
                  <span className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                    Sincronizado via Apify
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {results.map((result, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-orus-gold/30 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-black/50 border border-white/10 flex items-center justify-center font-display font-bold text-lg">
                          {result.name?.charAt(0) || 'L'}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-200 group-hover:text-orus-gold transition-colors">{result.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{result.industry || segment}</p>
                          {result.phone && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Phone size={10}/> {result.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {result.isSaved !== false && (
                          <span className="px-3 py-1 flex items-center text-[10px] font-semibold uppercase tracking-wider rounded border border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                            <Check size={10} className="inline mr-1"/> No CRM
                          </span>
                        )}
                        {result.isSaved === false && (
                          <span className="px-3 py-1 flex items-center text-[10px] font-semibold uppercase tracking-wider rounded border border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                            Erro ao salvar
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ label, defaultChecked }: { label: string, defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{label}</span>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={() => setChecked(!checked)} />
        <div className={cn(
          "block w-10 h-6 rounded-full transition-colors duration-300",
          checked ? "bg-orus-gold" : "bg-white/10"
        )}></div>
        <div className={cn(
          "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300",
          checked ? "transform translate-x-4 shadow-[0_0_10px_rgba(255,255,255,0.8)]" : ""
        )}></div>
      </div>
    </label>
  );
}
