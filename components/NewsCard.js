// components/NewsCard.js
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function NewsCard({ article }) {
  const [open, setOpen] = useState(false);
  const [shareClicked, setShareClicked] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // класс бейджа по важности
  const badgeClass =
    ({
      "Очень важно": "bg-red-500",
      "Важно": "bg-orange-500",
      "Средне": "bg-yellow-500",
      "Менее важно": "bg-gray-400",
    }[article.importance]) || "bg-gray-400";

  // Social share functions
  const generateShareText = () => {
    return `${article.title} - ${article.summary}`;
  };

  const handleShare = (platform, e) => {
    e.stopPropagation(); // Prevent card click when clicking share buttons
    const text = generateShareText();
    const url = window.location.href;
    
    setShareClicked(platform);
    setTimeout(() => setShareClicked(null), 200);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  const handleCardClick = () => {
    setOpen(v => !v);
  };

  // Social media icons as SVG components
  const WhatsAppIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
  );

  const FacebookIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  const TelegramIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );

  const TwitterIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow mb-4 border border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-750 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* News Image */}
      {article.urlToImage && !imageError && (
        <div className="relative w-full h-48 sm:h-56 bg-gray-200 dark:bg-gray-700">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
          <Image
            src={article.urlToImage}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            priority={article.rank === 1} // Priority loading for first article
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>
      )}
      
      <div className="p-4 flex-1">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
          {article.title}
        </h2>

        <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {article.summary}
        </p>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <p className="text-base text-gray-600 dark:text-gray-300 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 leading-relaxed">
                {article.fullContent}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs text-white px-2 py-1 rounded ${badgeClass}`}>
              {article.importance}
            </span>
            <span className="text-xs text-gray-500">[{article.source}]</span>
          </div>

          {/* Publication Time */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {new Date(article.publishedAt).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Moscow'
              })}
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Поделиться:</span>
            
            <button
              onClick={(e) => handleShare('whatsapp', e)}
              className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${
                shareClicked === 'whatsapp' 
                  ? 'bg-green-500 text-white scale-95' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
              }`}
              title="Поделиться в WhatsApp"
            >
              <WhatsAppIcon />
            </button>

            <button
              onClick={(e) => handleShare('facebook', e)}
              className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${
                shareClicked === 'facebook' 
                  ? 'bg-blue-600 text-white scale-95' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40'
              }`}
              title="Поделиться в Facebook"
            >
              <FacebookIcon />
            </button>

            <button
              onClick={(e) => handleShare('telegram', e)}
              className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${
                shareClicked === 'telegram' 
                  ? 'bg-blue-500 text-white scale-95' 
                  : 'bg-blue-100 text-blue-500 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40'
              }`}
              title="Поделиться в Telegram"
            >
              <TelegramIcon />
            </button>

            <button
              onClick={(e) => handleShare('twitter', e)}
              className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${
                shareClicked === 'twitter' 
                  ? 'bg-black text-white scale-95' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Поделиться в X (Twitter)"
            >
              <TwitterIcon />
            </button>
          </div>
        </div>
    </div>
  );
}
