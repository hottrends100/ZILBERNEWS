# Super News - Russian News Aggregator

## Project Overview
This is a Next.js application that displays a Russian news interface with infinite scroll functionality and AI-powered content generation. The application is built with React, Next.js, and Tailwind CSS, featuring a clean and responsive design.

## Features
- **Focused anti-war news coverage** using OpenAI's API
- **Ukraine-Russia conflict reporting** with humanitarian emphasis
- **Trump political coverage** related to foreign policy and peace efforts
- **Smart caching system** - news updates every 15 minutes
- **Specialized categories**: Ukraine-Russia, Trump Politics, Peace Efforts, Humanitarian, Anti-War Movement
- **Editorial stance** promoting peace, diplomacy, and civilian protection
- **Expandable news cards** with full article content
- **Responsive design** for mobile and desktop
- **Performance optimized** - cached responses load instantly

## Technical Stack
- **Frontend**: Next.js 14.2.5, React 18.3.1
- **Styling**: Tailwind CSS 3.4.12
- **Build Tools**: PostCSS, Autoprefixer
- **Special Libraries**: react-infinite-scroll-component

## Architecture
- **Frontend**: Serves on port 5000 (configured for Replit proxy)
- **API**: Internal Next.js API routes at `/api/news`
- **Data**: Static news data with pagination (50 news items total)

## Development
- Run `npm run dev` to start development server
- Server configured to bind to 0.0.0.0:5000 for Replit environment
- Hot reloading enabled with Next.js

## Deployment
- Configured for autoscale deployment
- Build: `npm run build`
- Start: `npm start`
- Production server also configured for port 5000

## Recent Changes (Sep 24, 2025)
### ✅ NewsAPI Integration with Real Images (Latest)
- **Real news images** - High-quality images from NewsAPI sources (Al Jazeera, CNN, Reuters, BBC, etc.)
- **Next.js Image optimization** with responsive design, loading states, and error handling
- **Professional visual layout** - 16:9 aspect ratio with gradient overlays for text readability
- **Performance optimized** - Priority loading for top articles, lazy loading for others
- **Seamless integration** with existing translation and caching system
- **Mobile responsive** design with proper aspect ratios across devices

### ✅ Hourly News Updates  
- **Updated refresh interval** from 15 minutes to once per hour
- **Cost optimization** while maintaining fresh, current news content
- **Background processing** continues with improved efficiency

### ✅ Russian News System with GPT-4o Mini
- **Russian language conversion** - Complete interface and content generation in Russian 
- **Real news translation** from verified sources (Reuters, BBC, Al Jazeera, CNN) instead of generated content
- **GPT-4o mini model** for efficient and cost-effective translation
- **Specialized news focus** on Ukraine-Russia conflict, Trump politics, and anti-war perspectives
- **Anti-war editorial stance** emphasizing humanitarian concerns and peace efforts
- **Smart caching system** for cost efficiency and performance (hourly updates)
- **Russian categories**: Главные, Украина-Россия, Политика Трампа, Мирные усилия, Гуманитарные, Антивоенное движение
- **Professional journalism** with focus on civilian protection, peace negotiations, and human impact
- **Performance optimization**: Cached responses serve in 4ms vs 30-60 seconds for fresh generation

### Previous Changes (Sep 23, 2025)
- Imported GitHub project and configured for Replit environment
- Added next.config.js for proper proxy handling
- Modified package.json to bind to 0.0.0.0:5000
- Set up development workflow
- Configured deployment settings

## Notes
- Application displays AI-generated Russian news content
- News updates automatically every 15 minutes with fresh content
- News are categorized by importance with color-coded badges
- Infinite scroll loads 10 articles per page