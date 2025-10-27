// api/tmdb.js
const axios = require('axios');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { path, id, type } = req.query;
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    
    let url = `${TMDB_BASE_URL}/`;
    
    // Roteamento baseado no path
    if (path === 'trending') {
      url += 'trending/all/week';
    } else if (path === 'movies/popular') {
      url += 'movie/popular';
    } else if (path === 'tv/popular') {
      url += 'tv/popular';
    } else if (path === 'anime') {
      url += 'discover/tv?with_genres=16';
    } else if (path === 'player') {
      // Aqui você implementaria sua lógica de player
      // Esta é apenas uma simulação
      return res.json({
        url: `https://example.com/player/${type}/${id}`
      });
    } else {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }
    
    // Adicionar API key
    url += url.includes('?') ? `&api_key=${TMDB_API_KEY}` : `?api_key=${TMDB_API_KEY}`;
    
    const response = await axios.get(url);
    res.json(response.data);
    
  } catch (error) {
    console.error('Erro na API:', error.message);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
};
