import express from 'express';
import { createServer as createViteServer } from 'vite';
import { ApifyClient } from 'apify-client';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/search', async (req, res) => {
    try {
      const { searchTerm, location, userId, limit } = req.body;
      const apifyToken = process.env.APIFY_API_TOKEN;

      if (!apifyToken) {
        return res.status(500).json({ error: 'A chave da API do Apify não está configurada (APIFY_API_TOKEN).' });
      }

      if (!searchTerm || !userId) {
        return res.status(400).json({ error: 'Termo de busca e usuário são obrigatórios.' });
      }

      // Supabase server-side client
      const rawUrl = process.env.VITE_SUPABASE_URL || 'https://rrzolxpgxshuxzaloakd.supabase.co';
      const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyem9seHBneHNodXh6YWxvYWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTUwMDEsImV4cCI6MjA5MzMzMTAwMX0.cA6FNWVkzCQGUTxMmI--9tgvky-O_utr5kpEaVx7E_M';
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Check user credits
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('credits_remaining')
        .eq('id', userId)
        .single();
        
      if (profileErr || !profile) {
        return res.status(404).json({ error: 'Perfil não encontrado.' });
      }
      
      if (profile.credits_remaining <= 0) {
        return res.status(403).json({ error: 'Créditos insuficientes para realizar a busca.' });
      }

      const client = new ApifyClient({
        token: apifyToken,
      });

      // Call Apify Actor
      const input = {
         searchStringsArray: [`${searchTerm} in ${location}`],
         queries: [searchTerm],
         locationQuery: location,
         maxCrawledPlacesPerSearch: parseInt(limit) || 10,
         maxPlacesPerQuery: parseInt(limit) || 10,
      };

      console.log('Iniciando robô do Apify com input:', input);
      const run = await client.actor("compass/crawler-google-places").call(input);
      console.log('Robô finalizado. ID do Dataset:', run.defaultDatasetId);

      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      const leads = items.map((item: any) => ({
        user_id: userId,
        name: item.title || item.name || 'Local Sem Nome',
        industry: searchTerm,
        phone: item.phone || item.phoneUnformatted || '',
        website: item.website || '',
        address: item.address || item.neighborhood || item.city || location,
        status: 'Nova Oportunidade',
      }));

      // Insert into Supabase
      if (leads.length > 0) {
         const { error: insertError } = await supabase.from('leads').insert(leads);
         if (insertError) {
             console.error('Erro ao inserir leads no Supabase:', insertError);
             // we won't deduct credit if we failed to save them (optional, but good practice safely)
         } else {
             // Deduct 1 credit
             await supabase.from('profiles').update({ 
               credits_remaining: profile.credits_remaining - 1 
             }).eq('id', userId);
         }
      } else {
        // Did not find any results, still deduct? We usually do or don't. Let's not if it's 0.
      }

      res.json({ leads, resultsCount: leads.length });
    } catch (error: any) {
      console.error('Apify API error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
