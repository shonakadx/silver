// GNews APIを使用してリアルタイムニュースを取得
// 無料プランで日本の金融ニュースを取得

import { NewsItem } from '../types/market';

const GNEWS_API_URL = 'https://gnews.io/api/v4/search';
const GNEWS_API_KEY = 'demo'; // 無料デモキー（制限あり）

// RSS to JSON変換サービス（バックアップ）
const RSS2JSON_URL = 'https://api.rss2json.com/v1/api.json';

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

// カテゴリ判定
function detectCategory(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();

  if (text.includes('bitcoin') || text.includes('crypto') || text.includes('仮想通貨') || text.includes('暗号')) {
    return 'crypto';
  }
  if (text.includes('為替') || text.includes('ドル') || text.includes('円') || text.includes('forex') || text.includes('currency')) {
    return 'forex';
  }
  if (text.includes('決算') || text.includes('業績') || text.includes('企業') || text.includes('株式会社')) {
    return 'company';
  }
  if (text.includes('gdp') || text.includes('金利') || text.includes('インフレ') || text.includes('経済') || text.includes('日銀')) {
    return 'economy';
  }
  return 'market';
}

// センチメント判定（簡易版）
function detectSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const text = title.toLowerCase();

  const positiveWords = ['上昇', '高値', '好調', '増益', '増収', 'surge', 'rise', 'gain', 'jump', 'rally'];
  const negativeWords = ['下落', '安値', '低迷', '減益', '減収', 'drop', 'fall', 'decline', 'crash', 'plunge'];

  if (positiveWords.some(w => text.includes(w))) return 'positive';
  if (negativeWords.some(w => text.includes(w))) return 'negative';
  return 'neutral';
}

// GNews APIからニュースを取得
async function fetchFromGNews(query: string): Promise<NewsItem[]> {
  try {
    const url = `${GNEWS_API_URL}?q=${encodeURIComponent(query)}&lang=ja&country=jp&max=10&apikey=${GNEWS_API_KEY}`;
    console.log('[News] Fetching from GNews:', query);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: GNewsResponse = await response.json();
    console.log('[News] GNews returned:', data.totalArticles, 'articles');

    return data.articles.map((article, index) => ({
      id: `gnews-${Date.now()}-${index}`,
      title: article.title,
      summary: article.description || article.content?.substring(0, 200) || '',
      source: article.source.name,
      timestamp: article.publishedAt,
      category: detectCategory(article.title, article.description || ''),
      sentiment: detectSentiment(article.title),
      url: article.url,
    }));
  } catch (error) {
    console.warn('[News] GNews fetch failed:', error);
    return [];
  }
}

// Yahoo Japan RSS経由でニュースを取得（バックアップ）
async function fetchFromRSS(): Promise<NewsItem[]> {
  try {
    // Yahoo Finance Japan のRSSフィード
    const rssUrl = 'https://news.yahoo.co.jp/rss/topics/business.xml';
    const url = `${RSS2JSON_URL}?rss_url=${encodeURIComponent(rssUrl)}`;

    console.log('[News] Fetching from RSS...');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[News] RSS returned:', data.items?.length || 0, 'items');

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map((item: any, index: number) => ({
      id: `rss-${Date.now()}-${index}`,
      title: item.title,
      summary: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      source: 'Yahoo!ニュース',
      timestamp: item.pubDate,
      category: detectCategory(item.title, item.description || ''),
      sentiment: detectSentiment(item.title),
      url: item.link,
    }));
  } catch (error) {
    console.warn('[News] RSS fetch failed:', error);
    return [];
  }
}

// メイン関数：複数のソースからニュースを取得
export async function fetchNews(): Promise<NewsItem[]> {
  console.log('[News] Fetching news from multiple sources...');

  // 複数の検索クエリで取得
  const queries = ['日本 株式', '日経平均', '経済'];

  try {
    // まずGNewsを試す
    const results = await Promise.all(
      queries.map(q => fetchFromGNews(q))
    );

    const allNews = results.flat();

    if (allNews.length > 0) {
      // 重複を除去してソート
      const uniqueNews = Array.from(
        new Map(allNews.map(n => [n.title, n])).values()
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log('[News] Total unique news:', uniqueNews.length);
      return uniqueNews.slice(0, 20);
    }

    // GNewsが失敗したらRSSを試す
    console.log('[News] GNews failed, trying RSS...');
    const rssNews = await fetchFromRSS();
    if (rssNews.length > 0) {
      return rssNews;
    }

    console.log('[News] All sources failed, returning empty');
    return [];
  } catch (error) {
    console.error('[News] Failed to fetch news:', error);
    return [];
  }
}
