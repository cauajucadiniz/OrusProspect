import express from 'express';
import { createServer as createViteServer } from 'vite';
import { ApifyClient } from 'apify-client';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes (Simulating Netlify function for local AI Studio preview)
  app.post('/.netlify/functions/fetch-leads', async (req, res) => {
    try {
      const { searchTerm, location, userId, limit } = req.body;
      const apifyToken = process.env.APIFY_API_TOKEN;

      if (!apifyToken) {
        return res.status(500).json({ error: 'A chave da API do Apify não está configurada (APIFY_API_TOKEN).' });
      }

      if (!searchTerm || !userId) {
        return res.status(400).json({ error: 'Termo de busca e usuário são obrigatórios.' });
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
