import { CheckCircle2, Zap, Rocket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function PlansView() {
  const { user } = useAuth();
  
  // Substitua pelos seus links reais de checkout do Stripe ou Mercado Pago
  const checkoutUrlPlus = "https://buy.stripe.com/test_plus_link_aqui";
  const checkoutUrlPremium = "https://buy.stripe.com/test_premium_link_aqui";

  return (
    <div className="flex flex-col items-center justify-center py-12 max-w-6xl mx-auto w-full">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-medium mb-4 text-gradient-gold">Escolha seu Poder de Escala</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Faça um upgrade e libere todo o potencial do Orus Prospect.
          Sem fidelidade, cancele quando quiser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Free Tier */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col relative overflow-hidden border border-white/5 opacity-80 mt-4 mb-4">
          <div className="mb-6">
            <h3 className="text-xl font-display font-semibold mb-2">Starter</h3>
            <p className="text-gray-400 text-sm">Para testar as águas.</p>
          </div>
          
          <div className="mb-8 flex items-baseline gap-1">
            <span className="text-4xl font-bold">R$ 0</span>
            <span className="text-gray-500 text-sm">/mês</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <FeatureItem text="Busca Limitada (20 leads)" />
            <FeatureItem text="CRM Básico" />
            <FeatureItem text="Exportação Indisponível" />
          </ul>
          
          <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors">
            Plano Atual
          </button>
        </div>

        {/* Mid Tier */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col relative overflow-hidden border border-orus-gold/30 bg-surface/80 mt-2 mb-2">
          <div className="mb-6">
             <h3 className="text-xl font-display font-semibold mb-2 flex items-center gap-2 text-gray-100">
               Plus <Rocket size={18} className="text-gray-400" />
             </h3>
             <p className="text-gray-400 text-sm">Para operações em crescimento.</p>
          </div>
          
          <div className="mb-8 flex items-baseline gap-1">
            <span className="text-4xl font-bold">R$ 87</span>
            <span className="text-gray-500 text-sm">/mês</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <FeatureItem text="Busca Intermediária (100 leads)" active />
            <FeatureItem text="CRM Avançado" active />
            <FeatureItem text="Exportação Básica (CSV)" active />
            <FeatureItem text="Integração WhatsApp Web" active />
          </ul>
          
          <a 
            href={`${checkoutUrlPlus}?client_reference_id=${user?.id}&prefilled_email=${user?.email}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-center block w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-colors"
          >
            Fazer Upgrade
          </a>
        </div>

        {/* Pro Tier */}
        <div className="glass-panel p-8 rounded-3xl flex flex-col relative overflow-hidden border-gradient-gold border-2 bg-gradient-to-b from-orus-gold/5 to-transparent">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-orus-gold to-orus-amber text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest uppercase">
            Popular
          </div>
          
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-orus-gold/20 blur-[60px] rounded-full pointer-events-none" />

          <div className="mb-6 relative z-10">
            <h3 className="text-xl font-display font-semibold text-orus-gold mb-2 flex items-center gap-2">
              Premium <Zap size={18} className="fill-orus-gold" />
            </h3>
            <p className="text-gray-300 text-sm">A máquina de vendas completa.</p>
          </div>
          
          <div className="mb-8 flex items-baseline gap-1 relative z-10">
            <span className="text-4xl font-bold">R$ 297</span>
            <span className="text-gray-500 text-sm">/mês</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
            <FeatureItem text="Buscas Ilimitadas" active />
            <FeatureItem text="Exportação Completa (CSV/Excel)" active />
            <FeatureItem text="CRM Avançado & Relatórios" active />
            <FeatureItem text="Integração WhatsApp Web" active />
            <FeatureItem text="Acesso à API & Automações" active />
          </ul>
          
          <a 
            href={`${checkoutUrlPremium}?client_reference_id=${user?.id}&prefilled_email=${user?.email}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-center block w-full py-3.5 rounded-xl bg-gradient-to-r from-orus-gold to-orus-amber hover:brightness-110 text-black font-semibold shadow-[0_0_20px_rgba(201,176,118,0.4)] transition-all relative z-10"
          >
            Fazer Upgrade Agora
          </a>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, active = false }: { text: string, active?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle2 size={18} className={active ? "text-orus-gold" : "text-gray-600"} />
      <span className={active ? "text-gray-200" : "text-gray-400"}>{text}</span>
    </li>
  );
}
