import { useState, useEffect, useRef } from 'react';

const RssTicker = () => {
  const [rssItems, setRssItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(null);
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  const fetchRssData = async (retryCount = 0, isBackgroundUpdate = false) => {
    const now = Date.now();
    
    // Check if we have cached data that's still fresh
    if (cacheRef.current && (now - lastFetchTime) < CACHE_DURATION) {
      if (!isBackgroundUpdate) {
        setRssItems(cacheRef.current);
        setLoading(false);
        console.log('📦 Using cached RSS data');
      }
      return;
    }
    
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Only show loading on initial fetch, not background updates
      if (!isBackgroundUpdate) {
        setLoading(true);
      }
      
      console.log(isBackgroundUpdate ? '🔄 Background refresh of RSS cache...' : '📡 Fetching RSS feed...');
      
      const response = await fetch('/api/rss-proxy', {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const items = xmlDoc.querySelectorAll('item');
      const newsItems = Array.from(items).map(item => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        
        return {
          title: title.trim(),
          link: link.trim(),
          pubDate: new Date(pubDate),
          time: new Date(pubDate).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Europe/Moscow'
          })
        };
      });
      
      // Sort by publication date (newest first) and take top 10
      newsItems.sort((a, b) => b.pubDate - a.pubDate);
      const topNews = newsItems.slice(0, 10);
      
      // Update cache
      cacheRef.current = topNews;
      setLastFetchTime(now);
      
      // Hot-swap the data seamlessly
      setRssItems(topNews);
      
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      
      console.log(isBackgroundUpdate ? '✅ Background cache updated' : '✅ RSS feed loaded and cached');
    } catch (error) {
      // Ignore aborted requests (common in React strict mode)
      if (error.name === 'AbortError') {
        console.log('Request aborted (likely due to component re-mount)');
        return;
      }
      
      console.error('Error fetching RSS:', error.message);
      
      // Retry logic for failed fetches (up to 2 retries)
      if (error.name === 'TypeError' && error.message === 'Failed to fetch' && retryCount < 2) {
        console.log(`Retrying RSS fetch (attempt ${retryCount + 1}/2)...`);
        setTimeout(() => fetchRssData(retryCount + 1, isBackgroundUpdate), 1000 * (retryCount + 1));
        return;
      }
      
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let timeoutId;
    let intervalId;
    let mounted = true;
    
    // Add a small delay before first fetch to ensure server is ready
    timeoutId = setTimeout(() => {
      if (mounted) {
        fetchRssData();
      }
    }, 1500);
    
    // Set up interval to refresh cache every 10 minutes (background updates)
    intervalId = setInterval(() => {
      if (mounted) {
        fetchRssData(0, true); // true = background update
      }
    }, CACHE_DURATION);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (loading && rssItems.length === 0) {
    return (
      <div className="w-full bg-black text-white h-10 flex items-center overflow-hidden">
        <div className="flex items-center px-4">
          <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold rounded mr-4">
            LIVE
          </span>
          <span className="text-white text-sm">Загрузка новостей Медузы...</span>
        </div>
      </div>
    );
  }

  // Fallback when no RSS items and not loading
  if (!loading && rssItems.length === 0) {
    return (
      <div className="w-full bg-black text-white h-10 flex items-center overflow-hidden">
        <div className="flex items-center px-4">
          <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold rounded mr-4">
            LIVE
          </span>
          <span className="text-white text-sm">Лента новостей Медузы загружается...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black text-white h-10 flex items-center overflow-hidden">
      <div className="flex items-center px-4 flex-shrink-0">
        <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold rounded mr-4">
          LIVE
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="animate-marquee">
          {/* Duplicate the items for seamless continuous loop */}
          {[...rssItems, ...rssItems].map((item, index) => (
            <span key={`${index}-${item.time}`} className="whitespace-nowrap mr-12 flex items-center">
              <span className="text-red-500 font-bold text-xs mr-3">{item.time}</span>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300 transition-colors cursor-pointer text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {item.title}
              </a>
              <span className="text-gray-600 mx-4 text-lg">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RssTicker;