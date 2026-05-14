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
         language: "pt-BR",
         maxCrawledPlacesPerSearch: parseInt(limit) || 10,
         maxImages: 0,
         maxReviews: 0,
         scrapeReviewers: false,
         scrapeImages: false,
      };

      console.log('Iniciando robô do Apify com input:', input);
      const run = await client.actor("compass/crawler-google-places").start(input);
      console.log('Robô iniciado. ID da execução:', run.id);

      res.json({ runId: run.id });
    } catch (error: any) {
      console.error('Apify API error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/.netlify/functions/check-status', async (req, res) => {
    try {
      const { runId, userId, searchTerm, location } = req.body;
      const apifyToken = process.env.APIFY_API_TOKEN;

      if (!apifyToken) {
        return res.status(500).json({ error: 'A chave da API do Apify não está configurada.' });
      }

      if (!runId) {
        return res.status(400).json({ error: 'runId é obrigatório.' });
      }

      const client = new ApifyClient({
        token: apifyToken,
      });

      const run = await client.run(runId).get();
      
      if (!run) {
        return res.status(404).json({ error: 'Run não encontrada' });
      }

      if (run.status === 'SUCCEEDED') {
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

        return res.json({ status: run.status, leads, resultsCount: leads.length });
      } else if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
        return res.status(500).json({ status: run.status, error: `Falha na execução: ${run.status}` });
      }

      // Still running
      return res.json({ status: run.status });
    } catch (error: any) {
      console.error('Apify check-status error:', error);
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
