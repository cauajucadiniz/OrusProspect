import { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadialBarChart, RadialBar, Legend } from 'recharts';
import { TrendingUp, Orbit, Crosshair, Activity, Loader2, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';

export function DashboardView() {
  const { user, profile } = useAuth();
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setLeadsData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Derived calculations
  const stats = useMemo(() => {
    const totalLeads = leadsData.length;
    const closedLeads = leadsData.filter((l) => l.status === 'Fechado/Ganho').length;
    const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0.0';

    return {
      totalLeads,
      conversionRate: `${conversionRate}%`
    };
  }, [leadsData]);

  // Chart data
  const areaData = useMemo(() => {
    if (leadsData.length === 0) return [];
    const groupedByDate: Record<string, number> = {};
    leadsData.forEach(lead => {
      if (!lead.created_at) return;
      // Group by day format DD/MM
      const date = new Date(lead.created_at);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const key = `${day}/${month}`;
      groupedByDate[key] = (groupedByDate[key] || 0) + 1;
    });

    let cumulative = 0;
    return Object.entries(groupedByDate).map(([name, count]) => {
      cumulative += count;
      return { name, leads: cumulative };
    });
  }, [leadsData]);

  const barData = useMemo(() => {
    const segments: Record<string, number> = {};
    leadsData.forEach(lead => {
      const industry = lead.industry || 'Outros';
      segments[industry] = (segments[industry] || 0) + 1;
    });
    return Object.entries(segments)
      .map(([name, valor]) => ({ name, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5); // top 5
  }, [leadsData]);

  const radialData = useMemo(() => {
     // example 1000 base if user is premium maybe? Just display based on current credits
     const remaining = profile?.credits_remaining || 0;
     const consumed = leadsData.length; // Approximate "consumed" if 1 lead = 1 credit or something
     // A more realistic meter: Assuming max credits depends on the plan, let's just make it visually relative
     return [
       { name: 'Consumidos', value: consumed > 0 ? consumed : 1, fill: '#C9B076' },
       { name: 'Restantes', value: remaining, fill: '#1A1A1A' }
     ];
  }, [leadsData, profile]);

  const creditPercentage = useMemo(() => {
     const remaining = profile?.credits_remaining || 0;
     const consumed = leadsData.length;
     const total = remaining + consumed;
     if (total === 0) return 100;
     return Math.round((remaining / total) * 100);
  }, [profile, leadsData]);

  return (
    <div className="flex flex-col gap-8 h-full blueprint-grid">
      <header>
        <h1 className="text-4xl font-display font-medium mb-2 text-white skew-x-[-5deg]">Visão Geral</h1>
        <p className="text-zinc-500 tracking-wide uppercase text-xs">Monitore os indicadores de performance Orus.</p>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orus-gold animate-spin" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-8 flex-1"
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard title="Leads Gerados" value={stats.totalLeads} trend="+100%" icon={Orbit} />
            <KpiCard title="Taxa de Conversão" value={stats.conversionRate} trend="+0%" icon={Crosshair} />
            <CreditsKpiCard credits={profile?.credits_remaining || 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
            {/* Main Chart */}
            <div className="lg:col-span-2 glass-card p-8 rounded-sm flex flex-col">
              <h3 className="text-xl font-display font-medium mb-6 text-white skew-x-[-5deg]">Crescimento de Leads</h3>
              <div className="flex-1 w-full h-full min-h-[250px]">
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '0px' }}
                        itemStyle={{ color: '#D4AF37' }}
                      />
                      <Area type="monotone" dataKey="leads" stroke="#D4AF37" strokeWidth={3} fillOpacity={0.4} fill="url(#colorLeads)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center border border-dashed border-white/5 rounded-sm">
                    <span className="text-sm text-gray-500 uppercase tracking-widest">Sem dados ainda</span>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Charts / Info */}
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 rounded-sm flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-display font-medium skew-x-[-5deg]">Créditos</h3>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">{profile?.credits_remaining} restantes</span>
                </div>
                <div className="flex-1 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" cy="50%" 
                      innerRadius="70%" outerRadius="100%" 
                      barSize={10} data={radialData} 
                      startAngle={90} endAngle={-270}
                    >
                      <RadialBar background={{ fill: '#050505' }} cornerRadius={0} dataKey="value" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-display font-bold text-gradient-gold">{creditPercentage}%</span>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6 rounded-sm flex-1 flex flex-col">
                <h3 className="text-lg font-display font-medium mb-4 skew-x-[-5deg]">Segmentos</h3>
                <div className="flex-1">
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#666" tick={{fill: '#999', fontSize: 12}} axisLine={false} tickLine={false} width={80} />
                        <Tooltip cursor={{fill: 'rgba(212, 175, 55, 0.05)'}} contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '0px' }} />
                        <Bar dataKey="valor" fill="#D4AF37" radius={[0, 0, 0, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center border border-dashed border-white/5 rounded-sm">
                      <span className="text-sm text-gray-500 uppercase tracking-widest text-center">Inicie buscas para gerar dados</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function KpiCard({ title, value, trend, trendUp = true, icon: Icon }: any) {
  return (
    <div className="glass-card p-6 rounded-sm relative overflow-hidden group hover:border-orus-gold/50 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-orus-gold/5 rounded-sm text-orus-gold">
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
          {trend}
        </div>
      </div>
      
      <div>
        <h4 className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">{title}</h4>
        <span className="text-3xl font-bold font-sans text-white">{value}</span>
      </div>
    </div>
  );
}

function CreditsKpiCard({ credits }: { credits: number }) {
  let statusColor = 'bg-orus-gold/20 text-orus-gold';
  let barColor = 'bg-orus-gold';
  let textColor = 'text-white';
  
  if (credits === 0) {
    statusColor = 'bg-red-500/20 text-red-500';
    barColor = 'bg-red-500';
    textColor = 'text-red-500';
  } else if (credits < 5) {
    statusColor = 'bg-amber-500/20 text-amber-500';
    barColor = 'bg-amber-500';
    textColor = 'text-amber-500';
  }

  return (
    <div className="glass-card p-6 rounded-sm relative overflow-hidden group hover:border-white/10 transition-all duration-300 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-sm ${statusColor}`}>
          <Zap size={20} strokeWidth={1.5} />
        </div>
        <div className={`text-xs font-medium uppercase tracking-widest ${textColor}`}>
          {credits === 0 ? 'Esgotado' : credits < 5 ? 'Acabando' : 'Suficiente'}
        </div>
      </div>
      
      <div>
        <h4 className="text-zinc-500 text-xs font-medium mb-2 uppercase tracking-wider">Créditos Restantes</h4>
        <div className="flex items-end gap-3 mb-3">
          <span className={`text-3xl font-bold font-sans ${textColor}`}>{credits}</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${barColor} transition-all duration-1000`} 
            style={{ width: `${Math.min((credits / 50) * 100, 100)}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
