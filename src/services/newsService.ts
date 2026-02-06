// ニュースサービス - 複数ジャンルのRSSソースを使用
import { NewsItem } from '../types/market';

// rss2json.com API
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

// ニュースフィード（暗号資産・経済・企業・イノベーション・半導体）
const NEWS_FEEDS = [
  // 暗号資産（主要3銘柄のみ）
  { url: 'https://cointelegraph.com/rss', name: 'Cointelegraph', category: 'crypto' },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk', category: 'crypto' },
  // 経済・マーケット
  { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg', category: 'market' },
  { url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', name: 'Reuters', category: 'economy' },
  { url: 'https://assets.wor.jp/rss/rdf/nikkei/news.rdf', name: '日経新聞', category: 'economy' },
  // 企業ニュース
  { url: 'https://www.businessinsider.jp/feed/index.xml', name: 'Business Insider JP', category: 'company' },
  { url: 'https://jp.techcrunch.com/feed/', name: 'TechCrunch Japan', category: 'company' },
  { url: 'https://toyokeizai.net/list/feed/rss', name: '東洋経済', category: 'company' },
  { url: 'https://diamond.jp/list/feed/rss', name: 'ダイヤモンド', category: 'company' },
  // イノベーション・テクノロジー
  { url: 'https://wired.jp/feed/', name: 'WIRED Japan', category: 'innovation' },
  { url: 'https://www.technologyreview.jp/feed/', name: 'MIT Tech Review JP', category: 'innovation' },
  { url: 'https://thebridge.jp/feed', name: 'THE BRIDGE', category: 'innovation' },
  { url: 'https://gigazine.net/news/rss_2.0/', name: 'GIGAZINE', category: 'innovation' },
  // 半導体・SOX関連
  { url: 'https://eetimes.jp/ee/rss/index.rdf', name: 'EE Times Japan', category: 'semiconductor' },
  { url: 'https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf', name: 'PC Watch', category: 'semiconductor' },
  { url: 'https://news.mynavi.jp/rss/techplus', name: 'マイナビTech+', category: 'semiconductor' },
  // Gartner・調査レポート関連
  { url: 'https://www.itmedia.co.jp/rss/2.0/enterprise.xml', name: 'ITmedia Enterprise', category: 'research' },
  { url: 'https://japan.zdnet.com/feed/index.rdf', name: 'ZDNet Japan', category: 'research' },
];

// センチメント判定
function detectSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const text = title.toLowerCase();

  const positiveWords = ['surge', 'rise', 'gain', 'rally', 'bull', 'up', 'high', 'record', 'soar', 'jump', 'launch', 'approve', '上昇', '高値', '好調', '増益', '最高'];
  const negativeWords = ['drop', 'fall', 'decline', 'crash', 'bear', 'down', 'low', 'plunge', 'dump', 'sell', 'hack', 'scam', 'fail', '下落', '安値', '減益', '暴落'];

  if (positiveWords.some(w => text.includes(w))) return 'positive';
  if (negativeWords.some(w => text.includes(w))) return 'negative';
  return 'neutral';
}

// カテゴリを詳細に判定
function detectDetailedCategory(title: string, defaultCategory: string): string {
  const text = title.toLowerCase();

  if (text.includes('bitcoin') || text.includes('crypto') || text.includes('ethereum') || text.includes('btc') || text.includes('仮想通貨')) {
    return 'crypto';
  }
  if (text.includes('forex') || text.includes('ドル') || text.includes('円') || text.includes('currency') || text.includes('為替')) {
    return 'forex';
  }
  if (text.includes('earnings') || text.includes('ipo') || text.includes('決算') || text.includes('上場') || text.includes('株式会社')) {
    return 'company';
  }
  if (text.includes('fed') || text.includes('gdp') || text.includes('inflation') || text.includes('日銀') || text.includes('金利') || text.includes('経済')) {
    return 'economy';
  }
  if (text.includes('ai') || text.includes('人工知能') || text.includes('機械学習') || text.includes('startup') || text.includes('スタートアップ') ||
      text.includes('innovation') || text.includes('イノベーション') || text.includes('量子') || text.includes('quantum') ||
      text.includes('ev') || text.includes('電気自動車') || text.includes('自動運転') || text.includes('ロボット') ||
      text.includes('宇宙') || text.includes('space') || text.includes('5g') || text.includes('6g') || text.includes('メタバース') ||
      text.includes('vr') || text.includes('ar') || text.includes('xr') || text.includes('web3') || text.includes('nft')) {
    return 'innovation';
  }
  // 半導体・SOX関連
  if (text.includes('半導体') || text.includes('semiconductor') || text.includes('チップ') || text.includes('chip') ||
      text.includes('nvidia') || text.includes('amd') || text.includes('intel') || text.includes('tsmc') ||
      text.includes('sox') || text.includes('asml') || text.includes('gpu') || text.includes('cpu') ||
      text.includes('メモリ') || text.includes('dram') || text.includes('nand') || text.includes('ファウンドリ') ||
      text.includes('エヌビディア') || text.includes('インテル')) {
    return 'semiconductor';
  }
  // Gartner・調査レポート関連
  if (text.includes('gartner') || text.includes('ガートナー') || text.includes('idc') || text.includes('forrester') ||
      text.includes('調査') || text.includes('予測') || text.includes('トレンド') || text.includes('ハイプサイクル') ||
      text.includes('マジッククアドラント') || text.includes('magic quadrant')) {
    return 'research';
  }

  return defaultCategory;
}

// RSSフィードからニュースを取得
async function fetchFromFeed(feedUrl: string, sourceName: string, defaultCategory: string): Promise<NewsItem[]> {
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

  return data.items.slice(0, 10).map((item: any, index: number) => ({
    id: `${sourceName}-${Date.now()}-${index}`,
    title: item.title || 'No title',
    summary: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 150),
    source: sourceName,
    timestamp: item.pubDate || new Date().toISOString(),
    category: detectDetailedCategory(item.title || '', defaultCategory),
    sentiment: detectSentiment(item.title || ''),
    url: item.link,
  }));
}

// メイン関数
export async function fetchNews(): Promise<NewsItem[]> {
  console.log('[News] Fetching news from multiple sources...');

  const results = await Promise.allSettled(
    NEWS_FEEDS.map(feed => fetchFromFeed(feed.url, feed.name, feed.category))
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

  // 重複を除去して時間順にソート
  const uniqueNews = Array.from(
    new Map(allNews.map(n => [n.title, n])).values()
  ).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return uniqueNews.slice(0, 50);
}
