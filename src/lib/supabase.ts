/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

let rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rrzolxpgxshuxzaloakd.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyem9seHBneHNodXh6YWxvYWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTUwMDEsImV4cCI6MjA5MzMzMTAwMX0.cA6FNWVkzCQGUTxMmI--9tgvky-O_utr5kpEaVx7E_M';

export const hasSupabaseConfig = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
