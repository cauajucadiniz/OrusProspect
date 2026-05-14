import { Handler } from '@netlify/functions';
import { ApifyClient } from 'apify-client';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { searchTerm, location, userId, limit } = body;
    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      return { statusCode: 500, body: JSON.stringify({ error: 'A chave da API do Apify não está configurada (APIFY_API_TOKEN).' }) };
    }

    if (!searchTerm || !userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Termo de busca e usuário são obrigatórios.' }) };
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

    return {
      statusCode: 200,
      body: JSON.stringify({ runId: run.id })
    };
  } catch (error: any) {
    console.error('Apify API error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
  }
};
