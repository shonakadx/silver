// ニュースサービス - ダミーデータなし
import { NewsItem } from '../types/market';

// RSS to JSON変換サービス
const RSS2JSON_URL = 'https://api.rss2json.com/v1/api.json';

// ニュースソースのRSSフィード
const NEWS_FEEDS = [
  { url: 'https://news.yahoo.co.jp/rss/topics/business.xml', source: 'Yahoo!ニュース' },
  { url: 'https://www.nikkei.com/rss/all.xml', source: '日本経済新聞' },
];

// カテゴリ判定
function detectCategory(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();

  if (text.includes('bitcoin') || text.includes('crypto') || text.includes('仮想通貨') || text.includes('暗号') || text.includes('ビットコイン')) {
    return 'crypto';
  }
  if (text.includes('為替') || text.includes('ドル') || text.includes('円安') || text.includes('円高') || text.includes('forex')) {
    return 'forex';
  }
  if (text.includes('決算') || text.includes('業績') || text.includes('株式会社') || text.includes('上場')) {
    return 'company';
  }
  if (text.includes('gdp') || text.includes('金利') || text.includes('インフレ') || text.includes('日銀') || text.includes('fed')) {
    return 'economy';
  }
  return 'market';
}

// センチメント判定
function detectSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const text = title.toLowerCase();

  const positiveWords = ['上昇', '高値', '好調', '増益', '増収', '最高', '急騰', 'surge', 'rise', 'gain', 'rally'];
  const negativeWords = ['下落', '安値', '低迷', '減益', '減収', '急落', '暴落', 'drop', 'fall', 'decline', 'crash'];

  if (positiveWords.some(w => text.includes(w))) return 'positive';
  if (negativeWords.some(w => text.includes(w))) return 'negative';
  return 'neutral';
}

// RSSフィードからニュースを取得
async function fetchFromRSS(feedUrl: string, sourceName: string): Promise<NewsItem[]> {
  const url = `${RSS2JSON_URL}?rss_url=${encodeURIComponent(feedUrl)}`;

  console.log(`[News] Fetching from ${sourceName}...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'ok' || !data.items || data.items.length === 0) {
    throw new Error('No items in feed');
  }

  console.log(`[News] ${sourceName}: ${data.items.length} items`);

  return data.items.map((item: any, index: number) => ({
    id: `${sourceName}-${Date.now()}-${index}`,
    title: item.title,
    summary: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
    source: sourceName,
    timestamp: item.pubDate,
    category: detectCategory(item.title, item.description || ''),
    sentiment: detectSentiment(item.title),
    url: item.link,
  }));
}

// メイン関数：ニュースを取得（ダミーデータなし）
export async function fetchNews(): Promise<NewsItem[]> {
  console.log('[News] Fetching news...');

  const results = await Promise.allSettled(
    NEWS_FEEDS.map(feed => fetchFromRSS(feed.url, feed.source))
  );

  const allNews: NewsItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
    } else {
      console.warn('[News] Feed failed:', result.reason);
    }
  }

  if (allNews.length === 0) {
    throw new Error('ニュースの取得に失敗しました');
  }

  // 重複を除去して時間順にソート
  const uniqueNews = Array.from(
    new Map(allNews.map(n => [n.title, n])).values()
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log('[News] Total unique news:', uniqueNews.length);
  return uniqueNews.slice(0, 30);
}
