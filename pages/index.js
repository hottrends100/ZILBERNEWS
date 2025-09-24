// pages/index.js
import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import NewsCard from "../components/NewsCard";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Top");

  const categories = ["Главные", "Украина-Россия", "Политика Трампа", "Мирные усилия", "Гуманитарные", "Антивоенное движение"];

  // Category classification for focused Ukraine-Russia and Trump coverage
  const categorizeArticle = (article) => {
    // Use the category from the API if already set
    if (article.category && categories.includes(article.category)) {
      return article.category;
    }

    const title = article.title.toLowerCase();
    const summary = article.summary.toLowerCase();
    const content = `${title} ${summary}`;

    // Ukraine-Russia conflict keywords (Russian and English)
    if (content.includes('украин') || content.includes('росси') || content.includes('путин') || 
        content.includes('киев') || content.includes('москв') || content.includes('война') || 
        content.includes('конфликт') || content.includes('санкции') ||
        content.includes('ukraine') || content.includes('russia') || content.includes('putin') || 
        content.includes('kiev') || content.includes('moscow') || content.includes('war')) return "Украина-Россия";
    
    // Trump politics keywords (Russian and English)
    if (content.includes('трамп') || content.includes('дональд') || content.includes('выборы') || 
        content.includes('кампания') || content.includes('республиканск') || content.includes('внешн') ||
        content.includes('trump') || content.includes('donald') || content.includes('election') || 
        content.includes('campaign') || content.includes('republican')) return "Политика Трампа";
    
    // Peace and humanitarian keywords (Russian and English)
    if (content.includes('мир') || content.includes('перемирие') || content.includes('гуманитарн') || 
        content.includes('беженц') || content.includes('помощь') || content.includes('гражданск') || 
        content.includes('дипломат') || content.includes('переговор') ||
        content.includes('peace') || content.includes('ceasefire') || content.includes('humanitarian') || 
        content.includes('refugee') || content.includes('civilian')) return "Мирные усилия";
    
    // Anti-war movement keywords (Russian and English)
    if (content.includes('протест') || content.includes('антивоенн') || content.includes('активизм') || 
        content.includes('движение') || content.includes('демонстрац') || content.includes('марш мира') ||
        content.includes('protest') || content.includes('anti-war') || content.includes('activism') || 
        content.includes('movement') || content.includes('demonstration')) return "Антивоенное движение";
    
    return "Главные";
  };

  const fetchNews = async () => {
    try {
      console.log('🔄 Загрузка свежих новостей...');
      const res = await fetch(`/api/english-news`);
      const data = await res.json();
      
      if (data.articles && data.articles.length > 0) {
        console.log(`✅ Получено ${data.articles.length} новостных статей`);
        const categorizedArticles = data.articles.map(article => ({
          ...article,
          category: categorizeArticle(article)
        }));
        setArticles(categorizedArticles);
        setHasMore(false); // Fresh news doesn't need pagination
      } else if (data.error) {
        console.error('News API error:', data.error);
      }
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
    }
  };

  // Filter articles based on selected category
  useEffect(() => {
    if (activeCategory === "Top") {
      setFilteredArticles(articles);
    } else {
      setFilteredArticles(articles.filter(article => article.category === activeCategory));
    }
  }, [articles, activeCategory]);

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="p-4 pb-2">
        <h1 className="text-3xl font-bold mb-4 text-center">📰 Новостной центр</h1>
      </div>

      {/* Category Tabs - Sticky on mobile */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 px-4 pb-4 mb-2">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-3 min-w-max pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm ${
                  activeCategory === category
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4">

        <InfiniteScroll
          dataLength={filteredArticles.length}
          next={fetchNews}
          hasMore={hasMore}
          loader={<h4 className="text-center">Loading...</h4>}
          endMessage={
            <p style={{ textAlign: "center", marginTop: 20 }}>
              <b>All news loaded ✅</b>
            </p>
          }
        >
          {filteredArticles.map(a => <NewsCard key={a.id} article={a} />)}
        </InfiniteScroll>
      </div>
    </div>
  );
}
