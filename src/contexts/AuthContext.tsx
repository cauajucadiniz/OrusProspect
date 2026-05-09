import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  role: string;
  credits_remaining: number;
  last_reset_date: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateCredits: (amount: number) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  updateCredits: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error && error.code === 'PGRST116') {
        const resetDate = new Date().toISOString().split('T')[0];
        const newProfile = {
          id: userId,
          role: 'external_user',
          credits_remaining: 20,
          last_reset_date: resetDate
        };
        const { data: inserted } = await supabase.from('profiles').insert([newProfile]).select().single();
        setProfile(inserted as Profile);
        return;
      }

      if (data) {
        // Check for reset logic
        const today = new Date().toISOString().split('T')[0];
        if (data.last_reset_date !== today) {
          const newCredits = data.role === 'internal_team' ? 35 : 20;
          const { data: updated } = await supabase
            .from('profiles')
            .update({ credits_remaining: newCredits, last_reset_date: today })
            .eq('id', userId)
            .select()
            .single();
          setProfile(updated as Profile);
        } else {
          setProfile(data as Profile);
        }
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  useEffect(() => {
    if (!hasSupabaseConfig) {
      console.warn('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).then(() => setLoading(false));
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateCredits = async (amount: number): Promise<boolean> => {
    if (!profile || !user) return false;
    const newCredits = profile.credits_remaining + amount;
    if (newCredits < 0) return false;
    
    const { error } = await supabase
      .from('profiles')
      .update({ credits_remaining: newCredits })
      .eq('id', user.id);
      
    if (!error) {
      setProfile({ ...profile, credits_remaining: newCredits });
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, updateCredits }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
