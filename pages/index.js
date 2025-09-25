// pages/index.js
import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import NewsCard from "../components/NewsCard";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);


  const fetchNews = async () => {
    try {
      console.log('🔄 Загрузка свежих новостей...');
      const res = await fetch(`/api/english-news`);
      const data = await res.json();
      
      if (data.articles && data.articles.length > 0) {
        console.log(`✅ Получено ${data.articles.length} новостных статей`);
        setArticles(data.articles);
        setHasMore(false); // Fresh news doesn't need pagination
      } else if (data.error) {
        console.error('News API error:', data.error);
      }
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
    }
  };


  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="p-4 pb-2">
        <h1 className="text-3xl font-bold mb-4 text-center">📰 Новостной центр</h1>
      </div>


      <div className="px-4">

        <InfiniteScroll
          dataLength={articles.length}
          next={fetchNews}
          hasMore={hasMore}
          loader={<h4 className="text-center">Loading...</h4>}
          endMessage={
            <p style={{ textAlign: "center", marginTop: 20 }}>
              <b>All news loaded ✅</b>
            </p>
          }
        >
          {articles.map(a => <NewsCard key={a.id} article={a} />)}
        </InfiniteScroll>
      </div>
    </div>
  );
}
