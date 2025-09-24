import fs from "fs";
import path from "path";

// NewsAPI configuration
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const CACHE_FILE = path.join(process.cwd(), 'news-cache.json');

// Background generation state
let backgroundInterval = null;
let isGenerating = false;

// Check if cache exists (we'll always serve from cache if it exists)
function cacheExists() {
  try {
    return fs.existsSync(CACHE_FILE);
  } catch (error) {
    console.error('❌ Error checking cache:', error);
    return false;
  }
}

// Check if cache needs refresh (for background generation)
function cacheNeedsRefresh() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return true;
    }
    
    const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    const now = Date.now();
    const cacheAge = now - cacheData.timestamp;
    
    return cacheAge >= CACHE_DURATION;
  } catch (error) {
    console.error('❌ Error reading cache for refresh check:', error);
    return true;
  }
}

// Load cached news with self-recovery
function loadCachedNews() {
  try {
    const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    
    // Validate cache structure
    if (!cacheData.articles || !Array.isArray(cacheData.articles) || cacheData.articles.length === 0) {
      throw new Error('Invalid cache structure or empty articles');
    }
    
    console.log(`✅ Loaded ${cacheData.articles.length} cached articles`);
    return cacheData.articles;
  } catch (error) {
    console.error('❌ Error loading cached news:', error);
    
    // Self-recovery: delete corrupt cache file
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
        console.log('🗑️ Deleted corrupt cache file for self-recovery');
      }
    } catch (deleteError) {
      console.error('❌ Failed to delete corrupt cache:', deleteError);
    }
    
    return null;
  }
}

// Save news to cache
function saveToCache(articles) {
  try {
    const cacheData = {
      articles: articles,
      timestamp: Date.now(),
      generatedAt: new Date().toISOString()
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log(`💾 Saved ${articles.length} articles to cache`);
  } catch (error) {
    console.error('❌ Error saving to cache:', error);
  }
}

// Background news generation
async function generateNewsInBackground() {
  if (isGenerating) {
    console.log('🔄 News generation already in progress, skipping...');
    return;
  }

  if (!cacheNeedsRefresh()) {
    console.log('📁 Cache still fresh, skipping background generation');
    return;
  }

  isGenerating = true;
  console.log('🔄 Background: Generating fresh news...');
  
  try {
    const articles = await fetchRealNews();
    saveToCache(articles);
    console.log('✅ Background: News updated successfully');
  } catch (error) {
    console.error('❌ Background generation failed:', error);
  } finally {
    isGenerating = false;
  }
}

// Start background news generation
function startBackgroundGeneration() {
  if (backgroundInterval) {
    return; // Already running
  }
  
  console.log('🚀 Starting background news generation (every 15 minutes)');
  
  // Generate immediately if cache needs refresh
  if (cacheNeedsRefresh()) {
    generateNewsInBackground();
  }
  
  // Set interval for ongoing generation
  backgroundInterval = setInterval(generateNewsInBackground, CACHE_DURATION);
}

// Fetch real news using NewsAPI
async function fetchRealNews() {
  try {
    console.log('🚀 Fetching real factual news from verified sources...');
    
    if (!NEWSAPI_KEY) {
      throw new Error('NewsAPI key not found');
    }

    // Focus on Ukraine-Russia conflict and political news from reliable sources
    // Enhanced query targeting for more interesting and relevant content
    const queries = [
      'Ukraine Russia conflict latest developments',
      'Trump foreign policy Ukraine Russia',
      'peace negotiations Ukraine ceasefire',
      'humanitarian crisis Ukraine refugees',
      'diplomatic efforts Russia sanctions',
      'NATO Ukraine military aid',
      'Zelensky Putin negotiations'
    ];

    // Verified fact-based sources with high credibility ratings
    const sources = 'reuters,associated-press,bbc-news,al-jazeera-english,cnn,abc-news,npr,bloomberg';
    const allArticles = [];

    // Fetch news for each query to get comprehensive coverage
    // Enhanced error handling and rate limiting consideration
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const url = `${NEWSAPI_BASE_URL}/everything?q=${encodeURIComponent(query)}&sources=${sources}&language=en&sortBy=publishedAt&pageSize=15&apiKey=${NEWSAPI_KEY}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`NewsAPI query ${i + 1} failed with status ${response.status}`);
          continue; // Continue with other queries if one fails
        }
        
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          // Filter out articles without meaningful content
          const validArticles = data.articles.filter(article => 
            article.title && 
            article.description && 
            article.title !== '[Removed]' && 
            article.description !== '[Removed]'
          );
          allArticles.push(...validArticles);
        }
        
        // Small delay to respect rate limits
        if (i < queries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (fetchError) {
        console.warn(`NewsAPI query ${i + 1} failed:`, fetchError.message);
        continue;
      }
    }

    if (allArticles.length === 0) {
      throw new Error('No articles found from NewsAPI');
    }

    // Remove duplicates and sort by publication date
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    ).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Transform to our format and take top 30
    const processedArticles = uniqueArticles.slice(0, 30).map((article, index) => {
      const category = categorizeRealNews(article);
      const importance = getImportanceLevel(article, index);
      
      return {
        id: Date.now() + index,
        rank: index + 1,
        title: article.title,
        summary: article.description || 'No description available',
        fullContent: article.content || article.description || 'Full content not available',
        importance: importance,
        source: article.source.name,
        category: category,
        publishedAt: article.publishedAt,
        url: article.url,
        urlToImage: article.urlToImage
      };
    });

    console.log(`✅ Processed ${processedArticles.length} real news articles from verified sources`);
    return processedArticles;

  } catch (error) {
    console.error('❌ Error fetching real news:', error);
    return getFallbackNews();
  }
}

// Categorize real news articles
function categorizeRealNews(article) {
  const title = article.title.toLowerCase();
  const description = (article.description || '').toLowerCase();
  const content = `${title} ${description}`;

  // Ukraine-Russia conflict keywords
  if (content.includes('ukraine') || content.includes('russia') || content.includes('putin') || 
      content.includes('kyiv') || content.includes('moscow') || content.includes('war') || 
      content.includes('conflict') || content.includes('sanctions') || content.includes('zelensky')) {
    return "Украина-Россия";
  }
  
  // Trump politics keywords
  if (content.includes('trump') || content.includes('donald') || content.includes('election') || 
      content.includes('campaign') || content.includes('republican') || content.includes('foreign policy')) {
    return "Политика Трампа";
  }
  
  // Peace and humanitarian keywords
  if (content.includes('peace') || content.includes('ceasefire') || content.includes('humanitarian') || 
      content.includes('refugee') || content.includes('civilian') || content.includes('aid') ||
      content.includes('diplomatic') || content.includes('negotiations')) {
    return "Мирные усилия";
  }
  
  // Anti-war movement keywords
  if (content.includes('protest') || content.includes('anti-war') || content.includes('activism') || 
      content.includes('movement') || content.includes('demonstration') || content.includes('peace march')) {
    return "Антивоенное движение";
  }
  
  // Humanitarian focus
  if (content.includes('humanitarian') || content.includes('victims') || content.includes('casualties') ||
      content.includes('displaced') || content.includes('crisis') || content.includes('suffering')) {
    return "Гуманитарные";
  }
  
  return "Главные";
}

// Determine importance level based on source credibility and recency
function getImportanceLevel(article, index) {
  const reliableSources = [
    'reuters', 'associated press', 'bbc', 'guardian', 'al jazeera',
    'npr', 'cnn', 'abc news', 'bloomberg', 'financial times'
  ];
  const sourceName = article.source.name.toLowerCase();
  const isReliableSource = reliableSources.some(source => sourceName.includes(source));
  const isRecent = new Date() - new Date(article.publishedAt) < 6 * 60 * 60 * 1000; // 6 hours
  
  // Enhanced fact-checking: prefer highly credible sources
  const highlyCredible = ['reuters', 'associated press', 'bbc'];
  const isHighlyCredible = highlyCredible.some(source => sourceName.includes(source));
  
  if (index < 3 && isHighlyCredible && isRecent) return 'Breaking';
  if (index < 5 && isReliableSource && isRecent) return 'Critical';
  if (index < 10 && isReliableSource) return 'Urgent';
  return 'Developing';
}

// Fallback news data in case of API failure
function getFallbackNews() {
  return [
    {
      id: Date.now(),
      rank: 1,
      title: "СРОЧНО: Проблемы с подключением к новостным источникам",
      summary: "В настоящее время возникли технические трудности с получением свежих новостей из надежных источников.",
      fullContent: "Мы работаем над восстановлением подключения к проверенным новостным агентствам, чтобы предоставить вам самые актуальные и достоверные новости. Пожалуйста, обновите страницу через несколько минут.",
      importance: "Breaking",
      source: "News System",
      category: "Главные",
      publishedAt: new Date().toISOString()
    }
  ];
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { page = 1, limit = 30 } = req.query;
    let allArticles;
    let cacheStatus;
    
    // Start background generation on first request
    startBackgroundGeneration();
    
    // Always try to serve from cache first
    if (cacheExists()) {
      allArticles = loadCachedNews();
      
      if (allArticles && allArticles.length > 0) {
        cacheStatus = 'instant';
        console.log('⚡ Serving cached news instantly');
      } else {
        // Cache exists but is corrupted/invalid - generate fresh
        console.log('🔄 Cache corrupted, fetching fresh real news...');
        allArticles = await fetchRealNews();
        saveToCache(allArticles);
        cacheStatus = 'recovered';
      }
    } else {
      // Only generate synchronously if no cache exists at all (first time)
      console.log('🔄 No cache found, fetching initial real news...');
      allArticles = await fetchRealNews();
      saveToCache(allArticles);
      cacheStatus = 'initial';
    }
    
    // Handle pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;
    
    const paginatedArticles = allArticles.slice(startIndex, endIndex);
    
    res.status(200).json({
      articles: paginatedArticles,
      total: allArticles.length,
      page: pageNumber,
      hasMore: endIndex < allArticles.length,
      type: 'real_news_with_cache',
      cacheStatus: cacheStatus,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to load news',
      message: error.message 
    });
  }
}