import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const articles = await generateEnglishNews();
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

// Simple function to generate fresh news
async function generateEnglishNews() {
  try {
    console.log('🚀 Generating fresh English news...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Вы профессиональный русскоязычный новостной редактор, специализирующийся на освещении конфликта Украина-Россия, политике Трампа и антивоенной журналистике. Создавайте убедительные новостные сюжеты на эти темы с антивоенной позицией, делая акцент на гуманитарных вопросах и усилиях по достижению мира."
        },
        {
          role: "user", 
          content: `Создайте 30 драматичных и захватывающих русскоязычных новостных сюжетов на сегодня, сосредоточенных на:
1. Развитие конфликта Украина-Россия
2. Политические новости о Трампе, связанные с внешней политикой
3. Антивоенные перспективы и мирные инициативы
4. Гуманитарные последствия конфликтов
5. Международные дипломатические усилия

Подходите к сюжетам с антивоенной редакционной позицией, создавая ДРАМАТИЧНЫЕ и ЭМОЦИОНАЛЬНЫЕ заголовки, подчеркивая:
- Человеческие потери от войны
- Усилия по мирным переговорам
- Воздействие на гражданских лиц и гуманитарные потребности
- Антивоенный активизм и движения
- Дипломатические решения вместо военных

ИСПОЛЬЗУЙТЕ ДРАМАТИЧНЫЕ ЗАГОЛОВКИ: эмоциональные, захватывающие, с сильными словами. Примеры стиля: "СРОЧНО:", "ШОКИРУЮЩИЕ данные:", "КРИТИЧЕСКАЯ ситуация:", "ТРЕВОЖНЫЕ сигналы:"

Верните ТОЛЬКО этот JSON формат:
{
  "articles": [
    {
      "id": 1,
      "title": "Срочно: Заголовок крупного события",
      "summary": "Краткое резюме с акцентом на гуманитарное воздействие или усилия по достижению мира.",
      "fullContent": "Подробное содержание с акцентом на человеческие истории, мирные инициативы или антивоенные перспективы. Несколько предложений, обеспечивающих всестороннее освещение.",
      "importance": "Breaking",
      "source": "Reuters",
      "category": "Ukraine-Russia"
    }
  ]
}

Используйте категории: "Украина-Россия", "Политика Трампа", "Мирные усилия", "Гуманитарные", "Дипломатия", "Антивоенное движение". Используйте источники типа Reuters, AP News, BBC News, CNN, Bloomberg, NPR. Возвращайте только чистый JSON.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const newsData = JSON.parse(response.choices[0].message.content);
    
    // Ensure proper structure
    if (!newsData.articles || !Array.isArray(newsData.articles)) {
      throw new Error('Invalid news data structure');
    }

    // Add timestamps and ensure IDs
    const articles = newsData.articles.map((article, index) => ({
      id: Date.now() + index,
      rank: index + 1,
      title: article.title,
      summary: article.summary,
      fullContent: article.fullContent || article.summary + " This is a developing story.",
      importance: article.importance || "Moderate",
      source: article.source || "Reuters",
      category: article.category || "World",
      publishedAt: new Date().toISOString()
    }));

    console.log(`✅ Generated ${articles.length} English news articles`);
    return articles;

  } catch (error) {
    console.error('❌ Error generating English news:', error);
    
    // Return fallback English news
    return [
      {
        id: Date.now(),
        rank: 1,
        title: "Breaking: News System Active",
        summary: "The automated English news generation system is now operational and providing fresh content.",
        fullContent: "Our new English news system has been successfully deployed and is generating fresh, professional news content in real-time. The system uses advanced AI to create breaking news stories covering global events, politics, economics, technology, and culture. This ensures users always have access to current, engaging news content in English.",
        importance: "Breaking",
        source: "News System",
        category: "Technology",
        publishedAt: new Date().toISOString()
      }
    ];
  }
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
        console.log('🔄 Cache corrupted, generating fresh news...');
        allArticles = await generateEnglishNews();
        saveToCache(allArticles);
        cacheStatus = 'recovered';
      }
    } else {
      // Only generate synchronously if no cache exists at all (first time)
      console.log('🔄 No cache found, generating initial news...');
      allArticles = await generateEnglishNews();
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
      type: 'english_with_cache',
      cacheStatus: cacheStatus,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to load English news',
      message: error.message 
    });
  }
}