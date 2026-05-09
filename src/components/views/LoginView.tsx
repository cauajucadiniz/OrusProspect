import React, { useState } from 'react';
import { supabase, hasSupabaseConfig } from '../../lib/supabase';
import { motion } from 'motion/react';
import { Triangle } from 'lucide-react';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!hasSupabaseConfig) {
        throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
      }

      if (isRegistering) {
        if (email !== confirmEmail) {
          throw new Error('Os emails não coincidem.');
        }
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        setSuccessMessage('Conta criada com sucesso! Por favor, verifique sua caixa de entrada e confirme o seu email antes de fazer o login.');
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
        setConfirmEmail('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Erro de autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 rounded-sm w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center text-orus-gold mb-4">
            <Triangle size={64} strokeWidth={1} />
          </div>
          <h2 className="text-3xl font-display font-bold skew-x-[-5deg] tracking-wider">ORUS PROSPECT</h2>
          <p className="text-zinc-400 mt-2 text-sm uppercase tracking-widest">
            {isRegistering ? 'Crie sua conta' : 'Acesse o sistema'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-sm text-sm">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-sm text-sm">
              {successMessage}
            </div>
          )}
          
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-2 focus:border-orus-gold focus:ring-1 focus:ring-orus-gold outline-none transition-all"
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Confirmar Email</label>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-2 focus:border-orus-gold focus:ring-1 focus:ring-orus-gold outline-none transition-all"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-2 focus:border-orus-gold focus:ring-1 focus:ring-orus-gold outline-none transition-all"
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-2 focus:border-orus-gold focus:ring-1 focus:ring-orus-gold outline-none transition-all"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orus-gold hover:bg-orus-gold-dark text-black font-semibold uppercase tracking-widest text-sm rounded-sm transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] disabled:opacity-50"
          >
            {loading ? 'Processando...' : (isRegistering ? 'Registrar' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-zinc-500 hover:text-orus-gold transition-colors"
          >
            {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Registrar-se'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
