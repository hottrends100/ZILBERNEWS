import { useState, useEffect, useRef } from 'react';

// Global cache to persist across component re-mounts
let globalCache = null;
let globalLastFetchTime = 0;
let globalInterval = null;

const RssTicker = () => {
  const [rssItems, setRssItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  const fetchRssData = async (isBackgroundUpdate = false) => {
    const now = Date.now();
    
    // Check if we have fresh global cache
    if (globalCache && (now - globalLastFetchTime) < CACHE_DURATION) {
      if (!isBackgroundUpdate && isMountedRef.current) {
        setRssItems(globalCache);
        setLoading(false);
        console.log('📦 Using cached RSS data');
      }
      return;
    }
    
    try {
      console.log(isBackgroundUpdate ? '🔄 Background refresh of RSS cache...' : '📡 Fetching RSS feed...');
      
      const response = await fetch('/api/rss-proxy');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const items = xmlDoc.querySelectorAll('item');
      const newsItems = Array.from(items).slice(0, 10).map(item => {
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
      
      // Sort by publication date (newest first)
      newsItems.sort((a, b) => b.pubDate - a.pubDate);
      
      // Update global cache
      globalCache = newsItems;
      globalLastFetchTime = now;
      
      console.log(isBackgroundUpdate ? '✅ Background cache updated' : '✅ RSS feed loaded and cached');
      
      // Update component state if mounted
      if (isMountedRef.current) {
        setRssItems(newsItems);
        if (!isBackgroundUpdate) {
          setLoading(false);
        }
      }
      
    } catch (error) {
      console.error('Error fetching RSS:', error.message);
      
      if (!isBackgroundUpdate && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Check if we already have cached data - instant load
    if (globalCache && (Date.now() - globalLastFetchTime) < CACHE_DURATION) {
      setRssItems(globalCache);
      setLoading(false);
      console.log('📦 Using cached RSS data');
    } else {
      // Fetch immediately if no cache
      fetchRssData();
    }
    
    // Set up global background refresh interval (only once)
    if (!globalInterval) {
      globalInterval = setInterval(() => {
        fetchRssData(true); // background update
      }, CACHE_DURATION);
    }
    
    return () => {
      isMountedRef.current = false;
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