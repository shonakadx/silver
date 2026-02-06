// ニュースサービス - 複数のRSSソースを使用
import { NewsItem } from '../types/market';

// rss2json.com API
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

// 暗号資産関連のRSSフィード
const NEWS_FEEDS = [
  { url: 'https://cointelegraph.com/rss', name: 'Cointelegraph' },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk' },
];

// センチメント判定
function detectSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const text = title.toLowerCase();

  const positiveWords = ['surge', 'rise', 'gain', 'rally', 'bull', 'up', 'high', 'record', 'soar', 'jump', 'launch', 'approve'];
  const negativeWords = ['drop', 'fall', 'decline', 'crash', 'bear', 'down', 'low', 'plunge', 'dump', 'sell', 'hack', 'scam', 'fail'];

  if (positiveWords.some(w => text.includes(w))) return 'positive';
  if (negativeWords.some(w => text.includes(w))) return 'negative';
  return 'neutral';
}

// RSSフィードからニュースを取得
async function fetchFromFeed(feedUrl: string, sourceName: string): Promise<NewsItem[]> {
  const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(feedUrl)}`;

  console.log(`[News] Fetching from ${sourceName}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'ok' || !data.items) {
    throw new Error(`Feed error: ${data.message || 'Unknown error'}`);
  }

  console.log(`[News] ${sourceName}: ${data.items.length} items`);

  return data.items.slice(0, 15).map((item: any, index: number) => ({
    id: `${sourceName}-${Date.now()}-${index}`,
    title: item.title || 'No title',
    summary: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 150),
    source: sourceName,
    timestamp: item.pubDate || new Date().toISOString(),
    category: 'crypto',
    sentiment: detectSentiment(item.title || ''),
    url: item.link,
  }));
}

// メイン関数
export async function fetchNews(): Promise<NewsItem[]> {
  console.log('[News] Fetching news from multiple sources...');

  const results = await Promise.allSettled(
    NEWS_FEEDS.map(feed => fetchFromFeed(feed.url, feed.name))
  );

  const allNews: NewsItem[] = [];
  let successCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
      successCount++;
    } else {
      console.warn('[News] Feed failed:', result.reason);
    }
  }

  console.log(`[News] ${successCount}/${NEWS_FEEDS.length} feeds succeeded, ${allNews.length} total items`);

  if (allNews.length === 0) {
    throw new Error('ニュースの取得に失敗しました。しばらくしてから再試行してください。');
  }

  // 時間順にソート
  return allNews.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 30);
}
