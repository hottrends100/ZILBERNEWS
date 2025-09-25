// pages/api/rss-proxy.js
export default async function handler(req, res) {
  try {
    console.log('📡 Fetching Meduza RSS feed...');
    
    const response = await fetch('https://meduza.io/rss/news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }
    
    const xmlData = await response.text();
    console.log('✅ Successfully fetched Meduza RSS');
    
    // Set appropriate headers for XML content
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(xmlData);
    
  } catch (error) {
    console.error('❌ RSS proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feed' });
  }
}