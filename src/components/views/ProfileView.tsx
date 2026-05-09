import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion } from 'motion/react';
import { LogOut, User, Mail, Shield, Save } from 'lucide-react';

export function ProfileView() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name }
      });
      if (error) throw error;
      setProfileMessage('Perfil atualizado com sucesso.');
    } catch (err: any) {
      setProfileError(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);

    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
      setPasswordMessage('Senha atualizada com sucesso.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!user || !profile) return null;

  return (
    <div className="flex flex-col h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-medium text-gray-200 mb-2">Meu Perfil</h1>
        <p className="text-gray-400">Gerencie sua conta, senha e preferências.</p>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-8 pb-10">
        
        {/* Left Column: Profile Info & Update */}
        <div className="flex-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl bg-surface/40 border border-white/5 relative overflow-hidden">
            <h3 className="font-display font-medium text-gray-200 mb-6 flex items-center gap-2">
              <User size={18} className="text-orus-gold" />
              Informações Pessoais
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileMessage && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-sm text-sm">
                  {profileMessage}
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-sm text-sm">
                  {profileError}
                </div>
              )}
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Email Cadastrado (Apenas Leitura)</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={user.email}
                    disabled
                    className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-10 text-sm text-gray-400 opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Nome no Sistema</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-10 text-sm text-gray-200 focus:border-orus-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-orus-gold hover:bg-orus-gold-dark text-black px-4 py-2 rounded font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  {isUpdatingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl bg-surface/40 border border-white/5 relative overflow-hidden">
            <h3 className="font-display font-medium text-gray-200 mb-6 flex items-center gap-2">
              <Shield size={18} className="text-orus-gold" />
              Segurança
            </h3>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {passwordMessage && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-sm text-sm">
                  {passwordMessage}
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-sm text-sm">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-3 text-sm text-gray-200 focus:border-orus-gold focus:outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-3 text-sm text-gray-200 focus:border-orus-gold focus:outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-white/10 border border-white/20 hover:bg-white/20 px-4 py-2 rounded text-sm transition-all"
                >
                  {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Account Stats & Actions */}
        <div className="w-full md:w-[320px] shrink-0 space-y-6">
          <div className="glass-panel p-6 rounded-bg-surface/40 border border-white/5">
            <h3 className="font-display font-medium text-gray-200 mb-4 text-sm uppercase tracking-wider">Seu Plano</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">Créditos Atuais</span>
              <span className="font-display font-bold text-xl text-orus-gold">{profile.credits_remaining}</span>
            </div>
            
            <div className="mb-6">
              <span className="text-gray-400 text-xs">Tipo de Conta:</span>
              <p className="font-medium text-white">{profile.role === 'internal_team' ? 'Equipe Interna' : 'Plano Básico'}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full py-3 border border-red-500/20 text-red-500/80 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 rounded flex items-center justify-center gap-2 transition-all font-medium text-sm"
          >
            <LogOut size={16} />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
