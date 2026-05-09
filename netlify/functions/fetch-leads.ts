import { Handler } from '@netlify/functions';
import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';

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

    // Supabase client
    const rawUrl = process.env.VITE_SUPABASE_URL || 'https://rrzolxpgxshuxzaloakd.supabase.co';
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyem9seHBneHNodXh6YWxvYWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTUwMDEsImV4cCI6MjA5MzMzMTAwMX0.cA6FNWVkzCQGUTxMmI--9tgvky-O_utr5kpEaVx7E_M';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check user credits
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', userId)
      .single();
      
    if (profileErr || !profile) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Perfil não encontrado.' }) };
    }
    
    if (profile.credits_remaining <= 0) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Créditos insuficientes para realizar a busca.' }) };
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

    let savedLeads = leads;

    // Insert into Supabase
    if (leads.length > 0) {
        const { data: insertedData, error: insertError } = await supabase.from('leads').insert(leads).select();
        if (insertError) {
            console.error('Erro ao inserir leads no Supabase:', insertError);
        } else {
            savedLeads = insertedData || leads;
            // Deduct 1 credit
            await supabase.from('profiles').update({ 
              credits_remaining: profile.credits_remaining - 1 
            }).eq('id', userId);
        }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ leads: savedLeads, resultsCount: savedLeads.length })
    };
  } catch (error: any) {
    console.error('Apify API error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
  }
};
