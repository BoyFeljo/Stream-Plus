const express = require('express');
const fetch = require('node-fetch');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Middlewares de segurança e performance
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurações protegidas
const CONFIG = {
  TMDB_API_KEY: 'b73f5479e8443355e40462afe494fc52',
  PLAYER_URL_MOVIE: 'https://playerflixapi.com/filme/',
  PLAYER_URL_TV: 'https://playerflixapi.com/serie/',
  SUGGESTIONS_EMAIL: 'simitochicuava@gmail.com',
  APP_DOWNLOAD_LINK: 'https://baixarflixmoz.netlify.app/'
};

// Cache para melhor performance
let cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para buscar dados com cache
async function fetchWithCache(url, key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    throw new Error('Falha ao obter dados');
  }
}

// Rotas da API protegidas
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
        url = `${baseUrl}search/multi?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}&query=${encodeURIComponent(query)}&page=${page}`;
        break;
      case 'details':
        url = `${baseUrl}${media_type}/${id}?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}`;
        break;
      case 'credits':
        url = `${baseUrl}${media_type}/${id}/credits?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}`;
        break;
      case 'recommendations':
        url = `${baseUrl}${media_type}/${id}/recommendations?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}&page=1`;
        break;
      case 'person':
        url = `${baseUrl}person/${id}?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}`;
        break;
      case 'person_credits':
        url = `${baseUrl}person/${id}/combined_credits?api_key=${CONFIG.TMDB_API_KEY}&language=${lang}`;
        break;
      default:
        return res.status(400).json({ error: 'Tipo de API inválido' });
    }

    const cacheKey = `${type}-${JSON.stringify(req.query)}`;
    const data = await fetchWithCache(url, cacheKey);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota do player protegida
app.get('/api/player', async (req, res) => {
  try {
    const { id, type } = req.query;
    
    if (!id || !type || !['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    const url = type === 'movie' 
      ? `${CONFIG.PLAYER_URL_MOVIE}${id}`
      : `${CONFIG.PLAYER_URL_TV}${id}`;

    // Log de acesso para monitoramento
    console.log(`Player accessed: ID=${id}, Type=${type}, IP=${req.ip}`);
    
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota principal
app.get('*', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Stream+ - A Melhor Plataforma de Streaming</title>
  <meta name="description" content="Stream+ é a plataforma de streaming definitiva com filmes, séries e animes. Assista onde e quando quiser!">
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://stream-plus.vercel.app/" />
  <meta name="theme-color" content="#E50914">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="/icons/icon-192.png">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <link rel="icon" type="image/png" href="/icons/icon-512.png" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-red: #e50914;
      --primary-dark: #141414;
      --darker: #0a0a0a;
      --light: #f5f5f1;
      --gray: #808080;
      --card-bg: #181818;
      --header-height: 68px;
      --bottom-nav-height: 60px;
      --banner-height: 50px;
      --card-radius: 8px;
      --transition: all 0.3s ease;
      --shadow: 0 8px 16px rgba(0,0,0,0.5);
      --hover-scale: 1.05;
      --hover-translate: -5px;
      --gradient: linear-gradient(135deg, #e50914 0%, #b81d24 100%);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Roboto', 'Arial', sans-serif;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background-color: var(--primary-dark);
      color: var(--light);
      overflow-x: hidden;
      min-height: 100vh;
      padding-bottom: calc(var(--bottom-nav-height) + var(--banner-height));
      font-size: 16px;
    }

    /* Header Moderno */
    header {
      padding: 0 4%;
      background: linear-gradient(to bottom, rgba(0,0,0,0.9) 10%, transparent 90%);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: var(--header-height);
      transition: var(--transition);
      backdrop-filter: blur(10px);
    }

    .logo {
      color: var(--primary-red);
      font-size: 2.2rem;
      font-weight: 900;
      text-decoration: none;
      letter-spacing: -1px;
      text-shadow: var(--shadow);
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .search-btn, .menu-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
      backdrop-filter: blur(10px);
    }

    .search-btn:hover, .menu-btn:hover {
      background: var(--primary-red);
      transform: scale(1.1);
    }

    /* Hero Section Aprimorada */
    .hero {
      height: 85vh;
      background-size: cover;
      background-position: center;
      position: relative;
      margin-top: var(--header-height);
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to right, rgba(20,20,20,0.9) 0%, transparent 50%, rgba(20,20,20,0.3) 100%);
    }

    .hero-content {
      padding: 4%;
      z-index: 1;
      width: 100%;
      max-width: 700px;
    }

    .hero-title {
      font-size: 4rem;
      margin-bottom: 20px;
      font-weight: 900;
      text-shadow: var(--shadow);
      line-height: 1.1;
      background: linear-gradient(45deg, #fff, #e50914);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-desc {
      font-size: 1.3rem;
      margin-bottom: 25px;
      max-width: 600px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      line-height: 1.5;
      color: #e6e6e6;
    }

    .hero-actions {
      display: flex;
      gap: 15px;
      margin-top: 25px;
    }

    .hero-btn {
      padding: 15px 35px;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.1rem;
      transition: var(--transition);
      box-shadow: var(--shadow);
    }

    .btn-play {
      background: var(--gradient);
      color: white;
    }

    .btn-play:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 20px rgba(229, 9, 20, 0.3);
    }

    .btn-info {
      background: rgba(255,255,255,0.2);
      color: white;
      backdrop-filter: blur(10px);
    }

    .btn-info:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.05);
    }

    /* Categorias Modernas */
    .categories {
      padding: 40px 0;
      position: relative;
      z-index: 10;
    }

    .section-title {
      font-size: 1.8rem;
      margin: 0 4% 25px;
      font-weight: 700;
      color: white;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title::after {
      content: '';
      flex: 1;
      height: 2px;
      background: var(--gradient);
      margin-left: 10px;
    }

    .carousel {
      display: flex;
      overflow-x: auto;
      gap: 20px;
      padding: 0 4% 20px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
    }

    .carousel::-webkit-scrollbar {
      display: none;
    }

    .item {
      min-width: 280px;
      width: 280px;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      border-radius: var(--card-radius);
      overflow: hidden;
      transition: var(--transition);
      background: var(--card-bg);
      box-shadow: var(--shadow);
      transform-origin: center left;
    }

    .item:hover {
      transform: scale(var(--hover-scale)) translateY(var(--hover-translate));
      z-index: 2;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }

    .item-poster {
      width: 100%;
      height: 400px;
      object-fit: cover;
      display: block;
      transition: var(--transition);
    }

    .item:hover .item-poster {
      transform: scale(1.08);
    }

    .item-title {
      padding: 20px 15px;
      font-weight: 600;
      text-align: center;
      background: var(--card-bg);
      transition: var(--transition);
      font-size: 1rem;
    }

    /* Grid View Moderno */
    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 25px;
      padding: 0 4%;
    }

    .grid-item {
      background: var(--card-bg);
      border-radius: var(--card-radius);
      overflow: hidden;
      transition: var(--transition);
      box-shadow: var(--shadow);
      cursor: pointer;
      position: relative;
      transform-origin: center center;
    }

    .grid-item:hover {
      transform: scale(var(--hover-scale)) translateY(var(--hover-translate));
      z-index: 2;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
    }

    .grid-poster {
      width: 100%;
      height: 300px;
      object-fit: cover;
      display: block;
      transition: var(--transition);
    }

    .grid-item:hover .grid-poster {
      transform: scale(1.08);
    }

    .grid-title {
      padding: 20px 15px;
      font-size: 1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
      background: var(--card-bg);
      transition: var(--transition);
      font-weight: 600;
    }

    /* Player Modal Moderno */
    .player-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.98);
      z-index: 3000;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .player-modal-content {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    .player-modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 2rem;
      color: white;
      cursor: pointer;
      z-index: 2;
      background: rgba(229, 9, 20, 0.8);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
      backdrop-filter: blur(10px);
    }

    .player-modal-close:hover {
      background: var(--primary-red);
      transform: rotate(90deg);
    }

    .player-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .video-player {
      width: 100%;
      height: 100%;
      border: none;
      background-color: #000;
    }

    /* Bottom Navigation Moderna */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--bottom-nav-height);
      background: var(--darker);
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 999;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--gray);
      text-decoration: none;
      font-size: 0.8rem;
      transition: var(--transition);
      padding: 8px 0;
      width: 20%;
    }

    .nav-item i {
      font-size: 1.4rem;
      margin-bottom: 5px;
      transition: var(--transition);
    }

    .nav-item.active, .nav-item:hover {
      color: white;
    }

    .nav-item.active i {
      color: var(--primary-red);
    }

    /* Loading Spinner Moderno */
    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: var(--primary-red);
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }
      .hero-desc {
        font-size: 1.1rem;
      }
      .item {
        min-width: 200px;
        width: 200px;
      }
      .item-poster {
        height: 300px;
      }
      .grid-view {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
      }
      .grid-poster {
        height: 225px;
      }
    }

    @media (max-width: 480px) {
      .hero-title {
        font-size: 2rem;
      }
      .hero-btn {
        padding: 12px 25px;
        font-size: 1rem;
      }
      .item {
        min-width: 160px;
        width: 160px;
      }
      .item-poster {
        height: 240px;
      }
      .grid-view {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 12px;
      }
      .grid-poster {
        height: 195px;
      }
    }
  </style>
</head>
<body>
  <!-- Header Moderno -->
  <header id="main-header">
    <a href="/" class="logo">STREAM+</a>
    <div class="header-right">
      <button class="search-btn" id="search-btn">
        <i class="fas fa-search"></i>
      </button>
      <button class="menu-btn" id="menu-btn">
        <i class="fas fa-user"></i>
      </button>
    </div>
  </header>

  <!-- Conteúdo Dinâmico -->
  <div id="app">
    <div class="loading">
      <div class="spinner"></div>
    </div>
  </div>

  <!-- Player Modal -->
  <div class="player-modal" id="player-modal">
    <div class="player-modal-content">
      <div class="player-modal-close" id="player-modal-close">
        <i class="fas fa-times"></i>
      </div>
      <div class="player-container">
        <div class="player-loading" id="player-loading">
          <div class="spinner"></div>
          <p>Carregando conteúdo premium...</p>
        </div>
        <iframe class="video-player" id="video-player" allowfullscreen></iframe>
      </div>
    </div>
  </div>

  <!-- Bottom Navigation -->
  <div class="bottom-nav">
    <a href="/" class="nav-item active">
      <i class="fas fa-home"></i>
      <span>Início</span>
    </a>
    <a href="/movies" class="nav-item">
      <i class="fas fa-film"></i>
      <span>Filmes</span>
    </a>
    <a href="/tv" class="nav-item">
      <i class="fas fa-tv"></i>
      <span>Séries</span>
    </a>
    <a href="/anime" class="nav-item">
      <i class="fas fa-dragon"></i>
      <span>Animes</span>
    </a>
    <a href="/favorites" class="nav-item">
      <i class="fas fa-heart"></i>
      <span>Favoritos</span>
    </a>
  </div>

  <script>
    class StreamPlus {
      constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
      }

      getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/movies') return 'movies';
        if (path === '/tv') return 'tv';
        if (path === '/anime') return 'anime';
        if (path === '/favorites') return 'favorites';
        if (path === '/search') return 'search';
        return 'home';
      }

      async init() {
        await this.loadPage();
        this.setupEventListeners();
      }

      async loadPage() {
        const app = document.getElementById('app');
        
        switch(this.currentPage) {
          case 'home':
            app.innerHTML = this.getHomeHTML();
            await this.loadHomeContent();
            break;
          case 'movies':
            app.innerHTML = this.getMoviesHTML();
            await this.loadMovies();
            break;
          case 'tv':
            app.innerHTML = this.getTVHTML();
            await this.loadTV();
            break;
          case 'anime':
            app.innerHTML = this.getAnimeHTML();
            await this.loadAnime();
            break;
          case 'favorites':
            app.innerHTML = this.getFavoritesHTML();
            await this.loadFavorites();
            break;
          case 'search':
            app.innerHTML = this.getSearchHTML();
            this.setupSearch();
            break;
        }
      }

      getHomeHTML() {
        return \`
          <section class="hero" id="hero">
            <div class="hero-content">
              <h1 class="hero-title" id="hero-title">Carregando...</h1>
              <p class="hero-desc" id="hero-desc"></p>
              <div class="hero-actions">
                <button class="hero-btn btn-play" id="hero-play">
                  <i class="fas fa-play"></i> Reproduzir
                </button>
                <button class="hero-btn btn-info" id="hero-info">
                  <i class="fas fa-info-circle"></i> Mais Informações
                </button>
              </div>
            </div>
          </section>
          <section class="categories">
            <div id="categories-container"></div>
          </section>
        \`;
      }

      getMoviesHTML() {
        return \`
          <div class="search-page">
            <div class="search-header">
              <h1><i class="fas fa-film"></i> Filmes Populares</h1>
            </div>
            <div class="grid-view" id="movies-container"></div>
            <div class="loading" id="movies-loading">
              <div class="spinner"></div>
            </div>
          </div>
        \`;
      }

      getTVHTML() {
        return \`
          <div class="search-page">
            <div class="search-header">
              <h1><i class="fas fa-tv"></i> Séries Populares</h1>
            </div>
            <div class="grid-view" id="tv-container"></div>
            <div class="loading" id="tv-loading">
              <div class="spinner"></div>
            </div>
          </div>
        \`;
      }

      getAnimeHTML() {
        return \`
          <div class="search-page">
            <div class="search-header">
              <h1><i class="fas fa-dragon"></i> Animes</h1>
            </div>
            <div class="grid-view" id="anime-container"></div>
            <div class="loading" id="anime-loading">
              <div class="spinner"></div>
            </div>
          </div>
        \`;
      }

      getFavoritesHTML() {
        return \`
          <div class="search-page">
            <div class="search-header">
              <h1><i class="fas fa-heart"></i> Minha Lista</h1>
            </div>
            <div class="grid-view" id="favorites-container"></div>
          </div>
        \`;
      }

      getSearchHTML() {
        return \`
          <div class="search-page">
            <div class="search-header">
              <h1><i class="fas fa-search"></i> Pesquisar</h1>
              <input type="text" class="search-input" placeholder="Pesquisar filmes, séries..." id="search-input">
            </div>
            <div class="grid-view" id="search-results"></div>
            <div class="loading" id="search-loading">
              <div class="spinner"></div>
            </div>
          </div>
        \`;
      }

      async loadHomeContent() {
        try {
          // Carregar banner hero
          const heroData = await this.fetchAPI('hero');
          const randomMedia = heroData.results[Math.floor(Math.random() * heroData.results.length)];
          
          document.getElementById('hero-title').textContent = randomMedia.title || randomMedia.name;
          document.getElementById('hero-desc').textContent = this.truncateText(randomMedia.overview, 150);
          document.getElementById('hero').style.backgroundImage = \`url(https://image.tmdb.org/t/p/original\${randomMedia.backdrop_path})\`;

          // Configurar botões do hero
          document.getElementById('hero-play').onclick = () => this.openPlayer(randomMedia.id, randomMedia.media_type || 'movie');
          document.getElementById('hero-info').onclick = () => this.openDetails(randomMedia.id, randomMedia.media_type || 'movie');

          // Carregar categorias
          await this.loadCategories();
        } catch (error) {
          console.error('Erro ao carregar conteúdo inicial:', error);
        }
      }

      async loadCategories() {
        const categories = [
          { title: 'Em Alta', type: 'hero' },
          { title: 'Filmes Populares', type: 'movies' },
          { title: 'Séries Populares', type: 'tv' },
          { title: 'Animes', type: 'anime' }
        ];

        const container = document.getElementById('categories-container');
        
        for (const category of categories) {
          try {
            const data = await this.fetchAPI(category.type);
            const html = \`
              <div class="category">
                <h2 class="section-title">\${category.title}</h2>
                <div class="carousel">
                  \${data.results.slice(0, 10).map(item => this.createMediaItem(item)).join('')}
                </div>
              </div>
            \`;
            container.innerHTML += html;
          } catch (error) {
            console.error(\`Erro ao carregar categoria \${category.title}:\`, error);
          }
        }

        // Adicionar event listeners
        this.setupMediaItemListeners();
      }

      createMediaItem(item) {
        const title = item.title || item.name;
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const posterUrl = item.poster_path 
          ? \`https://image.tmdb.org/t/p/w500\${item.poster_path}\`
          : 'https://via.placeholder.com/500x750?text=Stream+';

        return \`
          <div class="item" data-id="\${item.id}" data-type="\${mediaType}">
            <img src="\${posterUrl}" alt="\${title}" class="item-poster" loading="lazy">
            <div class="item-title">\${title}</div>
          </div>
        \`;
      }

      createGridItem(item) {
        const title = item.title || item.name;
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const posterUrl = item.poster_path 
          ? \`https://image.tmdb.org/t/p/w500\${item.poster_path}\`
          : 'https://via.placeholder.com/500x750?text=Stream+';

        return \`
          <div class="grid-item" data-id="\${item.id}" data-type="\${mediaType}">
            <img src="\${posterUrl}" alt="\${title}" class="grid-poster" loading="lazy">
            <div class="grid-title">\${title}</div>
          </div>
        \`;
      }

      setupMediaItemListeners() {
        document.querySelectorAll('.item, .grid-item').forEach(item => {
          item.addEventListener('click', () => {
            const id = item.dataset.id;
            const type = item.dataset.type;
            this.openDetails(id, type);
          });
        });
      }

      async openDetails(id, type) {
        // Implementar página de detalhes
        alert(\`Detalhes: ID \${id}, Tipo: \${type}\`);
      }

      async openPlayer(id, type) {
        try {
          const playerModal = document.getElementById('player-modal');
          const playerLoading = document.getElementById('player-loading');
          const videoPlayer = document.getElementById('video-player');

          playerModal.style.display = 'flex';
          playerLoading.style.display = 'flex';
          videoPlayer.style.display = 'none';

          const response = await fetch(\`/api/player?id=\${id}&type=\${type}\`);
          const data = await response.json();

          if (data.url) {
            videoPlayer.src = data.url;
            videoPlayer.style.display = 'block';
            playerLoading.style.display = 'none';
          } else {
            throw new Error('URL do player não encontrada');
          }
        } catch (error) {
          console.error('Erro ao abrir player:', error);
          alert('Erro ao carregar o player. Tente novamente.');
          this.closePlayer();
        }
      }

      closePlayer() {
        const playerModal = document.getElementById('player-modal');
        const videoPlayer = document.getElementById('video-player');
        
        playerModal.style.display = 'none';
        videoPlayer.src = '';
      }

      setupEventListeners() {
        // Fechar player
        document.getElementById('player-modal-close').addEventListener('click', () => this.closePlayer());

        // Busca
        document.getElementById('search-btn').addEventListener('click', () => {
          window.location.href = '/search';
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
          item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = item.getAttribute('href');
            window.location.href = href;
          });
        });
      }

      async fetchAPI(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = \`/api/\${endpoint}\${queryString ? '?' + queryString : ''}\`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha na requisição API');
        return await response.json();
      }

      truncateText(text, length) {
        return text && text.length > length ? text.substring(0, length) + '...' : text;
      }

      // Métodos para carregar conteúdo específico das páginas
      async loadMovies() {
        try {
          const data = await this.fetchAPI('movies');
          const container = document.getElementById('movies-container');
          container.innerHTML = data.results.map(item => this.createGridItem(item)).join('');
          this.setupMediaItemListeners();
        } catch (error) {
          console.error('Erro ao carregar filmes:', error);
        }
      }

      async loadTV() {
        try {
          const data = await this.fetchAPI('tv');
          const container = document.getElementById('tv-container');
          container.innerHTML = data.results.map(item => this.createGridItem(item)).join('');
          this.setupMediaItemListeners();
        } catch (error) {
          console.error('Erro ao carregar séries:', error);
        }
      }

      async loadAnime() {
        try {
          const data = await this.fetchAPI('anime');
          const container = document.getElementById('anime-container');
          container.innerHTML = data.results.map(item => this.createGridItem(item)).join('');
          this.setupMediaItemListeners();
        } catch (error) {
          console.error('Erro ao carregar animes:', error);
        }
      }

      async loadFavorites() {
        // Implementar carregamento de favoritos do localStorage
        const container = document.getElementById('favorites-container');
        container.innerHTML = '<p style="text-align: center; padding: 40px;">Sua lista de favoritos aparecerá aqui</p>';
      }

      setupSearch() {
        const searchInput = document.getElementById('search-input');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          const query = e.target.value.trim();
          
          if (query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
          }

          searchTimeout = setTimeout(async () => {
            try {
              document.getElementById('search-loading').style.display = 'flex';
              const data = await this.fetchAPI('search', { query });
              const container = document.getElementById('search-results');
              container.innerHTML = data.results
                .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                .map(item => this.createGridItem(item)).join('');
              this.setupMediaItemListeners();
            } catch (error) {
              console.error('Erro na busca:', error);
            } finally {
              document.getElementById('search-loading').style.display = 'none';
            }
          }, 500);
        });
      }
    }

    // Inicializar aplicação
    document.addEventListener('DOMContentLoaded', () => {
      new StreamPlus();
    });
  </script>
</body>
</html>
  `;
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Stream+ rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
});

module.exports = app;
