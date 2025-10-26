const express = require('express');
const fetch = require('node-fetch');
const compression = require('compression');
const helmet = require('helmet');
const LRU = require('lru-cache');

const app = express();

// Cache LRU ultra rápido
const cache = new LRU({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutos
  updateAgeOnGet: true
});

// Middlewares de performance máxima
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression({ level: 9 })); // Compressão máxima
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Headers de performance
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Stream+');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Vary', 'Accept-Encoding');
  next();
});

// Configurações
const CONFIG = {
  TMDB_API_KEY: 'b73f5479e8443355e40462afe494fc52',
  PLAYER_URL_MOVIE: 'https://playerflixapi.com/filme/',
  PLAYER_URL_TV: 'https://playerflixapi.com/serie/'
};

// Função de fetch com cache e timeout
async function fetchWithCache(url, key, timeout = 5000) {
  const cached = cache.get(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error('API não respondeu');
    
    const data = await response.json();
    cache.set(key, data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(`Falha na requisição: ${error.message}`);
  }
}

// API Routes otimizadas
app.get('/api/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { id, media_type, query, page = 1 } = req.query;
    
    const baseUrl = 'https://api.themoviedb.org/3/';
    const lang = 'pt-BR';
    let url = '';

    switch (type) {
      case 'hero':
        url = `${baseUrl}trending/all/day?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}`;
        break;
      case 'movies':
        url = `${baseUrl}movie/popular?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}&page=${page}`;
        break;
      case 'tv':
        url = `${baseUrl}tv/popular?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}&page=${page}`;
        break;
      case 'anime':
        url = `${baseUrl}discover/tv?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}&with_genres=16&sort_by=popularity.desc&page=${page}`;
        break;
      case 'search':
        if (!query || query.length < 2) {
          return res.json({ results: [] });
        }
        url = `${baseUrl}search/multi?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}&query=${encodeURIComponent(query)}&page=${page}`;
        break;
      case 'details':
        url = `${baseUrl}${media_type}/${id}?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}`;
        break;
      case 'credits':
        url = `${baseUrl}${media_type}/${id}/credits?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}`;
        break;
      default:
        return res.status(400).json({ error: 'Tipo inválido' });
    }

    const cacheKey = `${type}-${JSON.stringify(req.query)}`;
    const data = await fetchWithCache(url, cacheKey, 3000);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota do player otimizada
app.get('/api/player', async (req, res) => {
  try {
    const { id, type } = req.query;
    
    if (!id || !type) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    const url = type === 'movie' 
      ? `${CONFIG.PLAYER_URL_MOVIE}${id}`
      : `${CONFIG.PLAYER_URL_TV}${id}`;

    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// HTML otimizado com pré-carregamento
const optimizedHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stream+ - Streaming Ultra Rápido</title>
  <meta name="description" content="Stream+ - A plataforma de streaming mais rápida do mercado">
  
  <!-- Pré-carregamento crítico -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdnjs.cloudflare.com">
  <link rel="preconnect" href="https://image.tmdb.org">
  
  <!-- CSS Inline Crítico -->
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#141414;color:#fff;font-family:system-ui,-apple-system,sans-serif;overflow-x:hidden}
    .loading{display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column}
    .spinner{width:40px;height:40px;border:3px solid rgba(229,9,20,0.3);border-radius:50%;border-top-color:#e50914;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .logo{color:#e50914;font-size:2rem;font-weight:900;text-decoration:none}
    .grid-view{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:15px;padding:20px}
    .grid-item{background:#181818;border-radius:8px;overflow:hidden;transition:transform 0.2s}
    .grid-item:hover{transform:scale(1.05)}
    .grid-poster{width:100%;height:225px;object-fit:cover}
    .grid-title{padding:10px;font-size:0.9rem;text-align:center}
    .hero{height:70vh;background-size:cover;background-position:center;position:relative;display:flex;align-items:center;padding:0 4%}
    .hero-content{max-width:600px;z-index:2}
    .hero-title{font-size:3rem;margin-bottom:1rem;font-weight:900}
    .hero-desc{font-size:1.1rem;margin-bottom:1.5rem;opacity:0.9}
    .hero-btn{padding:12px 30px;border:none;border-radius:4px;font-weight:700;cursor:pointer;margin-right:1rem;transition:all 0.2s}
    .btn-play{background:#e50914;color:white}
    .btn-play:hover{background:#f40612}
    .carousel{display:flex;overflow-x:auto;gap:15px;padding:20px;scrollbar-width:none}
    .carousel::-webkit-scrollbar{display:none}
    .item{min-width:200px;flex-shrink:0;background:#181818;border-radius:8px;overflow:hidden}
    .item-poster{width:100%;height:300px;object-fit:cover}
    @media (max-width:768px){
      .hero-title{font-size:2rem}
      .grid-view{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
      .grid-poster{height:180px}
    }
  </style>
</head>
<body>
  <header style="padding:1rem 4%;background:rgba(0,0,0,0.9);position:fixed;top:0;width:100%;z-index:1000;display:flex;justify-content:space-between;align-items:center">
    <a href="/" class="logo">STREAM+</a>
    <div>
      <button onclick="location.href='/search'" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;margin-left:1rem">
        <i class="fas fa-search"></i>
      </button>
    </div>
  </header>

  <main id="app" style="margin-top:80px">
    <div class="loading">
      <div class="spinner"></div>
      <p style="margin-top:1rem">Carregando Stream+...</p>
    </div>
  </main>

  <div class="player-modal" id="player-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:black;z-index:2000">
    <button onclick="closePlayer()" style="position:absolute;top:20px;right:20px;background:#e50914;color:white;border:none;width:40px;height:40px;border-radius:50%;cursor:pointer;z-index:2001">×</button>
    <iframe id="video-player" style="width:100%;height:100%;border:none" allowfullscreen></iframe>
  </div>

  <nav style="position:fixed;bottom:0;width:100%;background:#0a0a0a;display:flex;justify-content:space-around;padding:1rem 0;border-top:1px solid #333">
    <a href="/" style="color:#e50914;text-decoration:none;text-align:center">
      <i class="fas fa-home"></i><br><span style="font-size:0.8rem">Início</span>
    </a>
    <a href="/movies" style="color:white;text-decoration:none;text-align:center">
      <i class="fas fa-film"></i><br><span style="font-size:0.8rem">Filmes</span>
    </a>
    <a href="/tv" style="color:white;text-decoration:none;text-align:center">
      <i class="fas fa-tv"></i><br><span style="font-size:0.8rem">Séries</span>
    </a>
    <a href="/anime" style="color:white;text-decoration:none;text-align:center">
      <i class="fas fa-dragon"></i><br><span style="font-size:0.8rem">Animes</span>
    </a>
  </nav>

  <!-- Scripts não críticos carregados async -->
  <script>
    // App principal otimizado
    class StreamPlus {
      constructor() {
        this.cache = new Map();
        this.init();
      }

      async init() {
        await this.loadPage();
        this.loadNonCriticalCSS();
      }

      async loadPage() {
        const path = window.location.pathname;
        const app = document.getElementById('app');
        
        try {
          if (path === '/movies') {
            await this.loadSection('movies', 'Filmes Populares');
          } else if (path === '/tv') {
            await this.loadSection('tv', 'Séries Populares');
          } else if (path === '/anime') {
            await this.loadSection('anime', 'Animes');
          } else if (path === '/search') {
            this.loadSearch();
          } else {
            await this.loadHome();
          }
        } catch (error) {
          app.innerHTML = '<div style="padding:2rem;text-align:center"><p>Erro ao carregar. Tente recarregar a página.</p></div>';
        }
      }

      async loadHome() {
        const app = document.getElementById('app');
        
        try {
          // Carregar banner principal primeiro
          const [heroData, moviesData, tvData] = await Promise.all([
            this.fetchAPI('hero'),
            this.fetchAPI('movies', { page: 1 }),
            this.fetchAPI('tv', { page: 1 })
          ]);

          const heroMedia = heroData.results[0];
          app.innerHTML = \`
            <section class="hero" style="background-image:url(https://image.tmdb.org/t/p/original\${heroMedia.backdrop_path})">
              <div class="hero-content">
                <h1 class="hero-title">\${heroMedia.title || heroMedia.name}</h1>
                <p class="hero-desc">\${this.truncateText(heroMedia.overview, 150)}</p>
                <div>
                  <button class="hero-btn btn-play" onclick="app.openPlayer(\${heroMedia.id}, '\${heroMedia.media_type || 'movie'}')">
                    <i class="fas fa-play"></i> Assistir
                  </button>
                  <button class="hero-btn" style="background:rgba(255,255,255,0.2);color:white" onclick="app.openDetails(\${heroMedia.id}, '\${heroMedia.media_type || 'movie'}')">
                    <i class="fas fa-info-circle"></i> Detalhes
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 style="padding:0 4%;margin:2rem 0 1rem 0">Filmes Populares</h2>
              <div class="carousel" id="movies-carousel">
                \${moviesData.results.slice(0,10).map(item => this.createCarouselItem(item)).join('')}
              </div>
            </section>

            <section>
              <h2 style="padding:0 4%;margin:2rem 0 1rem 0">Séries Populares</h2>
              <div class="carousel" id="tv-carousel">
                \${tvData.results.slice(0,10).map(item => this.createCarouselItem(item)).join('')}
              </div>
            </section>
          \`;

          this.attachEventListeners();
        } catch (error) {
          console.error('Erro home:', error);
        }
      }

      async loadSection(type, title) {
        const app = document.getElementById('app');
        
        try {
          const data = await this.fetchAPI(type, { page: 1 });
          app.innerHTML = \`
            <h1 style="padding:2rem 4% 1rem">\${title}</h1>
            <div class="grid-view">
              \${data.results.map(item => this.createGridItem(item)).join('')}
            </div>
          \`;
          
          this.attachEventListeners();
        } catch (error) {
          console.error(\`Erro \${type}:\`, error);
        }
      }

      createCarouselItem(item) {
        const title = item.title || item.name;
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w500\${item.poster_path}\` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgdmlld0JveD0iMCAwIDUwMCA3NTAiIGZpbGw9IiMxODE4MTgiPjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNzUwIi8+PHRleHQgeD0iMjUwIiB5PSIzNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3RyZWFtKzwvdGV4dD48L3N2Zz4=';
        
        return \`
          <div class="item" onclick="app.openDetails(\${item.id}, '\${type}')">
            <img src="\${poster}" alt="\${title}" class="item-poster" loading="lazy">
          </div>
        \`;
      }

      createGridItem(item) {
        const title = item.title || item.name;
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w500\${item.poster_path}\` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgdmlld0JveD0iMCAwIDUwMCA3NTAiIGZpbGw9IiMxODE4MTgiPjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNzUwIi8+PHRleHQgeD0iMjUwIiB5PSIzNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3RyZWFtKzwvdGV4dD48L3N2Zz4=';
        
        return \`
          <div class="grid-item" onclick="app.openDetails(\${item.id}, '\${type}')">
            <img src="\${poster}" alt="\${title}" class="grid-poster" loading="lazy">
            <div class="grid-title">\${title}</div>
          </div>
        \`;
      }

      attachEventListeners() {
        // Event listeners são adicionados via onclick nos elementos
      }

      async fetchAPI(endpoint, params = {}) {
        const cacheKey = \`\${endpoint}-\${JSON.stringify(params)}\`;
        if (this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey);
        }

        const query = new URLSearchParams(params).toString();
        const url = \`/api/\${endpoint}\${query ? '?' + query : ''}\`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        this.cache.set(cacheKey, data);
        return data;
      }

      async openPlayer(id, type) {
        try {
          const modal = document.getElementById('player-modal');
          const iframe = document.getElementById('video-player');
          
          modal.style.display = 'block';
          document.body.style.overflow = 'hidden';
          
          const response = await fetch(\`/api/player?id=\${id}&type=\${type}\`);
          const data = await response.json();
          
          if (data.url) {
            iframe.src = data.url;
          } else {
            throw new Error('URL não encontrada');
          }
        } catch (error) {
          alert('Erro ao carregar player');
          this.closePlayer();
        }
      }

      closePlayer() {
        const modal = document.getElementById('player-modal');
        const iframe = document.getElementById('video-player');
        
        modal.style.display = 'none';
        iframe.src = '';
        document.body.style.overflow = 'auto';
      }

      openDetails(id, type) {
        // Implementação simplificada - pode ser expandida
        this.openPlayer(id, type);
      }

      loadSearch() {
        const app = document.getElementById('app');
        app.innerHTML = \`
          <div style="padding:2rem 4%">
            <h1>Pesquisar</h1>
            <input type="text" id="search-input" placeholder="Digite para pesquisar..." 
                   style="width:100%;padding:1rem;margin:1rem 0;background:#333;border:none;border-radius:4px;color:white;font-size:1rem">
            <div class="grid-view" id="search-results"></div>
          </div>
        \`;

        this.setupSearch();
      }

      setupSearch() {
        const input = document.getElementById('search-input');
        let timeout;
        
        input.addEventListener('input', (e) => {
          clearTimeout(timeout);
          const query = e.target.value.trim();
          
          if (query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
          }
          
          timeout = setTimeout(async () => {
            try {
              const data = await this.fetchAPI('search', { query });
              const results = document.getElementById('search-results');
              results.innerHTML = data.results
                .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                .map(item => this.createGridItem(item)).join('');
            } catch (error) {
              console.error('Search error:', error);
            }
          }, 300);
        });
      }

      truncateText(text, length) {
        return text && text.length > length ? text.substr(0, length) + '...' : text;
      }

      loadNonCriticalCSS() {
        // Carrega Font Awesome async
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fa);

        // Carrega Google Fonts async
        const font = document.createElement('link');
        font.rel = 'stylesheet';
        font.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap';
        document.head.appendChild(font);
      }
    }

    // Inicialização rápida
    const app = new StreamPlus();
    window.app = app;
    window.closePlayer = () => app.closePlayer();

    // Service Worker para cache (opcional)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  </script>
</body>
</html>
`;

// Rota principal otimizada
app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(optimizedHTML);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Stream+ ULTRA RÁPIDO rodando na porta ${PORT}`);
});

module.exports = app;
