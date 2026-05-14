import { Handler } from '@netlify/functions';
import { ApifyClient } from 'apify-client';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { runId, userId, searchTerm, location } = body;
    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      return { statusCode: 500, body: JSON.stringify({ error: 'A chave da API do Apify não está configurada.' }) };
    }

    if (!runId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'runId é obrigatório.' }) };
    }

    const client = new ApifyClient({
      token: apifyToken,
    });

    const run = await client.run(runId).get();
    
    if (!run) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Run não encontrada' }) };
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

      return {
        statusCode: 200,
        body: JSON.stringify({ status: run.status, leads, resultsCount: leads.length })
      };
    } else if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
      return {
        statusCode: 500,
        body: JSON.stringify({ status: run.status, error: `Falha na execução: ${run.status}` })
      };
    }

    // Still running
    return {
      statusCode: 200,
      body: JSON.stringify({ status: run.status })
    };
  } catch (error: any) {
    console.error('Apify API error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
  }
};
