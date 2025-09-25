import fs from "fs";
import path from "path";
import OpenAI from "openai";

// API configurations
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (1 hour) in milliseconds
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
  
  console.log('🚀 Starting background news generation (every hour)');
  
  // Generate immediately if cache needs refresh
  if (cacheNeedsRefresh()) {
    generateNewsInBackground();
  }
  
  // Set interval for ongoing generation
  backgroundInterval = setInterval(generateNewsInBackground, CACHE_DURATION);
}

// Fetch real news using GNews API
async function fetchGNewsArticles() {
  try {
    console.log('🚀 Fetching news from GNews API...');
    
    if (!GNEWS_API_KEY) {
      throw new Error('GNews API key not found');
    }

    // Search queries focused on Ukraine-Russia conflict and political news
    const queries = [
      'Ukraine Russia conflict',
      'Trump foreign policy',
      'peace negotiations Ukraine',
      'humanitarian crisis Ukraine',
      'NATO Ukraine military aid',
      'Zelensky Putin'
    ];

    const allArticles = [];

    // Fetch news for each query
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const url = `${GNEWS_BASE_URL}/search?q=${encodeURIComponent(query)}&lang=en&country=us&max=10&sortby=publishedAt&apikey=${GNEWS_API_KEY}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`GNews query ${i + 1} failed with status ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          // Filter valid articles
          const validArticles = data.articles.filter(article => 
            article.title && 
            article.description &&
            article.title !== '[Removed]' && 
            article.description !== '[Removed]'
          );
          allArticles.push(...validArticles);
        }
        
        // Rate limiting delay
        if (i < queries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (fetchError) {
        console.warn(`GNews query ${i + 1} failed:`, fetchError.message);
        continue;
      }
    }

    console.log(`📰 GNews: Found ${allArticles.length} total articles`);
    return allArticles;
  } catch (error) {
    console.error('❌ GNews fetch error:', error);
    return [];
  }
}

// Fetch real news using NewsAPI (fallback)
async function fetchNewsAPIArticles() {
  try {
    console.log('🚀 Fetching news from NewsAPI...');
    
    if (!NEWSAPI_KEY) {
      console.warn('⚠️ NewsAPI key not found, skipping NewsAPI');
      return [];
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

    console.log(`📰 NewsAPI: Found ${allArticles.length} total articles`);
    return allArticles;
  } catch (error) {
    console.error('❌ NewsAPI fetch error:', error);
    return [];
  }
}

// Combined news fetching function
async function fetchRealNews() {
  try {
    console.log('🚀 Fetching real factual news from multiple sources...');
    
    // Fetch from both APIs in parallel for better performance
    const [gNewsArticles, newsAPIArticles] = await Promise.all([
      fetchGNewsArticles(),
      fetchNewsAPIArticles()
    ]);

    // Combine articles from both sources
    const allArticles = [...gNewsArticles, ...newsAPIArticles];
    
    if (allArticles.length === 0) {
      throw new Error('No articles found from any news sources');
    }

    // Normalize article format for consistent processing
    const normalizedArticles = allArticles.map(article => {
      // Handle different API response formats
      if (article.source && typeof article.source === 'object') {
        // NewsAPI format
        return {
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          urlToImage: article.urlToImage || article.image,
          publishedAt: article.publishedAt,
          source: { name: article.source.name }
        };
      } else {
        // GNews format
        return {
          title: article.title,
          description: article.description,
          content: article.content || article.description,
          url: article.url,
          urlToImage: article.image,
          publishedAt: article.publishedAt,
          source: { name: article.source?.name || article.source?.url || 'Unknown' }
        };
      }
    });

    // Remove duplicates and sort by publication date
    const uniqueArticles = normalizedArticles.filter((article, index, self) => 
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

    console.log(`📊 Combined ${gNewsArticles.length} GNews + ${newsAPIArticles.length} NewsAPI = ${processedArticles.length} final articles`);

    // Translate all articles to Russian
    console.log('🔄 Translating articles to Russian...');
    const translatedArticles = await translateArticlesToRussian(processedArticles);
    
    console.log(`✅ Processed and translated ${translatedArticles.length} real news articles from verified sources`);
    return translatedArticles;

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

// Translate articles to Russian using OpenAI
async function translateArticlesToRussian(articles) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found, returning articles without translation');
      return articles;
    }

    // Process articles in batches to avoid API limits
    const batchSize = 3;
    const translatedArticles = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const batchPrompts = batch.map(article => ({
        title: article.title,
        summary: article.summary,
        content: article.fullContent
      }));
      
      const prompt = `Переведите следующие новостные статьи на русский язык, сохраняя журналистский стиль и фактуальность. Особое внимание уделяйте гуманитарным аспектам и антивоенной направленности.

Статьи для перевода:
${JSON.stringify(batchPrompts, null, 2)}

Верните перевод в том же JSON формате с полями title, summary, content. Сохраняйте профессиональный журналистский стиль.`;
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3
        });
        
        const translatedBatch = JSON.parse(response.choices[0].message.content);
        
        // Merge translated content back with original article data
        batch.forEach((article, index) => {
          // Handle different response formats from OpenAI
          let translatedArray = [];
          if (Array.isArray(translatedBatch)) {
            translatedArray = translatedBatch;
          } else if (translatedBatch.articles) {
            translatedArray = translatedBatch.articles;
          } else {
            translatedArray = Object.values(translatedBatch);
          }
          const translated = translatedArray[index];
          if (translated && translated.title) {
            translatedArticles.push({
              ...article,
              title: translated.title,
              summary: translated.summary,
              fullContent: translated.content
            });
          } else {
            translatedArticles.push(article); // Fallback to original if translation failed
          }
        });
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < articles.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (batchError) {
        console.error(`❌ Translation batch ${Math.floor(i/batchSize) + 1} failed:`, batchError.message);
        // Add original articles if translation fails
        translatedArticles.push(...batch);
      }
    }
    
    console.log(`✅ Successfully translated ${translatedArticles.length} articles to Russian`);
    return translatedArticles;
    
  } catch (error) {
    console.error('❌ Translation error:', error);
    return articles; // Return original articles if translation completely fails
  }
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