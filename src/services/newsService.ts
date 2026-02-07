// ニュースサービス - 複数ジャンルのRSSソースを使用
import { NewsItem } from '../types/market';

// rss2json.com API
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

// 専門カテゴリ（このカテゴリのフィードはカテゴリを変更しない）
const SPECIALIZED_CATEGORIES = ['genai', 'cleanenergy', 'biotech', 'robotics', 'space', 'resources', 'semiconductor'];

// ニュースフィード（暗号資産・経済・企業・イノベーション・半導体・テーマ投資）
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
  // イノベーション・テクノロジー（汎用）
  { url: 'https://wired.jp/feed/', name: 'WIRED Japan', category: 'innovation' },
  { url: 'https://www.technologyreview.jp/feed/', name: 'MIT Tech Review JP', category: 'innovation' },
  { url: 'https://thebridge.jp/feed', name: 'THE BRIDGE', category: 'innovation' },
  { url: 'https://gigazine.net/news/rss_2.0/', name: 'GIGAZINE', category: 'innovation' },
  // 半導体・SOX関連（専門メディア）
  { url: 'https://www.digitimes.com/rss/daily.xml', name: 'DIGITIMES', category: 'semiconductor' },
  { url: 'https://eetimes.jp/ee/rss/index.rdf', name: 'EE Times Japan', category: 'semiconductor' },
  { url: 'https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf', name: 'PC Watch', category: 'semiconductor' },
  { url: 'https://news.mynavi.jp/rss/techplus', name: 'マイナビTech+', category: 'semiconductor' },
  { url: 'https://www.eenewseurope.com/en/feed/', name: 'eeNews Europe', category: 'semiconductor' },
  // Gartner・調査レポート関連
  { url: 'https://www.itmedia.co.jp/rss/2.0/enterprise.xml', name: 'ITmedia Enterprise', category: 'research' },
  { url: 'https://japan.zdnet.com/feed/index.rdf', name: 'ZDNet Japan', category: 'research' },
  // 生成AI・LLM（専門）
  { url: 'https://www.itmedia.co.jp/rss/2.0/aiplus.xml', name: 'ITmedia AI+', category: 'genai' },
  { url: 'https://ledge.ai/feed/', name: 'Ledge.ai', category: 'genai' },
  { url: 'https://ainow.ai/feed/', name: 'AINOW', category: 'genai' },
  // 脱炭素・クリーンエネルギー（専門）
  { url: 'https://www.renewable-ei.org/activities/feed/', name: '自然エネルギー財団', category: 'cleanenergy' },
  { url: 'https://www.kankyo-business.jp/news/rss.php', name: '環境ビジネスオンライン', category: 'cleanenergy' },
  { url: 'https://solarjournal.jp/feed/', name: 'SOLAR JOURNAL', category: 'cleanenergy' },
  { url: 'https://www.enecho.meti.go.jp/rss/rss.xml', name: '資源エネルギー庁', category: 'cleanenergy' },
  // 資源・コモディティ（専門）
  { url: 'https://oilgas-info.jogmec.go.jp/rss.xml', name: 'JOGMEC石油・天然ガス', category: 'resources' },
  { url: 'https://mric.jogmec.go.jp/rss.xml', name: 'JOGMEC金属資源', category: 'resources' },
  // 精密医療・バイオテック（専門）
  { url: 'https://bio.nikkeibp.co.jp/rss/index.rdf', name: '日経バイオテク', category: 'biotech' },
  { url: 'https://www.qlifepro.com/feed/', name: 'QLifePro', category: 'biotech' },
  { url: 'https://medical.nikkeibp.co.jp/all/rss/index.rdf', name: '日経メディカル', category: 'biotech' },
  // ロボティクス・自動化（専門）
  { url: 'https://robot.watch.impress.co.jp/data/rss/1.0/robot/feed.rdf', name: 'Robot Watch', category: 'robotics' },
  { url: 'https://monoist.itmedia.co.jp/mn/rss/2.0/mn.xml', name: 'MONOist', category: 'robotics' },
  { url: 'https://www.automation-news.jp/feed/', name: 'オートメーション新聞', category: 'robotics' },
  // 宇宙開発（専門）
  { url: 'https://sorae.info/feed/', name: 'sorae宇宙へのポータルサイト', category: 'space' },
  { url: 'https://news.mynavi.jp/rss/space', name: 'マイナビ宇宙', category: 'space' },
  { url: 'https://spacenews.com/feed/', name: 'SpaceNews', category: 'space' },
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

// 汎用フィードからのニュースをカテゴリ分類（専門フィードには適用しない）
function detectCategoryFromKeywords(title: string): string | null {
  const text = title.toLowerCase();

  // 生成AI・LLM（厳密なキーワード）
  if (text.includes('生成ai') || text.includes('generative ai') || text.includes('chatgpt') ||
      text.includes('gpt-4') || text.includes('gpt-5') || text.includes('claude') ||
      text.includes('gemini') || text.includes('llm') || text.includes('大規模言語モデル') ||
      text.includes('openai') || text.includes('anthropic') || text.includes('stable diffusion') ||
      text.includes('midjourney') || text.includes('dall-e') || text.includes('sora')) {
    return 'genai';
  }

  // 半導体（厳密なキーワード）
  if (text.includes('半導体') || text.includes('semiconductor') ||
      text.includes('nvidia') || text.includes('エヌビディア') ||
      text.includes('tsmc') || text.includes('asml') ||
      text.includes('インテル') && text.includes('チップ') ||
      text.includes('gpu') || text.includes('dram') || text.includes('nand') ||
      text.includes('ファウンドリ') || text.includes('sox指数')) {
    return 'semiconductor';
  }

  // 宇宙開発（厳密なキーワード）
  if (text.includes('宇宙') || text.includes('spacex') || text.includes('ロケット') ||
      text.includes('人工衛星') || text.includes('nasa') || text.includes('jaxa') ||
      text.includes('starlink') || text.includes('月面') || text.includes('火星探査') ||
      text.includes('blue origin') || text.includes('starship')) {
    return 'space';
  }

  // ロボティクス（厳密なキーワード）
  if (text.includes('ロボット') || text.includes('産業用ロボ') ||
      text.includes('協働ロボ') || text.includes('ファナック') ||
      text.includes('boston dynamics') || text.includes('ヒューマノイド')) {
    return 'robotics';
  }

  // 脱炭素・クリーンエネルギー（厳密なキーワード）
  if (text.includes('脱炭素') || text.includes('カーボンニュートラル') ||
      text.includes('再生可能エネルギー') || text.includes('太陽光発電') ||
      text.includes('風力発電') || text.includes('水素エネルギー') ||
      text.includes('電気自動車') || text.includes('ev充電') ||
      text.includes('蓄電池') || text.includes('グリーン水素') ||
      text.includes('テスラ') || text.includes('byd')) {
    return 'cleanenergy';
  }

  // 精密医療・バイオテック（厳密なキーワード）
  if (text.includes('バイオテック') || text.includes('ゲノム編集') ||
      text.includes('遺伝子治療') || text.includes('mrna') || text.includes('crispr') ||
      text.includes('創薬') || text.includes('精密医療') ||
      text.includes('がん免疫療法') || text.includes('再生医療') ||
      text.includes('モデルナ') || text.includes('ファイザー')) {
    return 'biotech';
  }

  // 資源・コモディティ（厳密なキーワード）
  if (text.includes('原油価格') || text.includes('天然ガス') ||
      text.includes('lng') || text.includes('opec') ||
      text.includes('レアアース') || text.includes('リチウム') ||
      text.includes('鉱山') || text.includes('資源開発')) {
    return 'resources';
  }

  // Gartner・調査レポート（厳密なキーワード）
  if (text.includes('gartner') || text.includes('ガートナー') ||
      text.includes('ハイプサイクル') || text.includes('マジッククアドラント') ||
      text.includes('idc') || text.includes('forrester')) {
    return 'research';
  }

  return null; // キーワードにマッチしない場合はnull
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

  // 専門カテゴリのフィードはカテゴリを維持
  const isSpecializedFeed = SPECIALIZED_CATEGORIES.includes(defaultCategory);

  return data.items.slice(0, 10).map((item: any, index: number) => {
    let category = defaultCategory;

    // 汎用フィード（innovation, company, economy, market）の場合のみキーワード判定
    if (!isSpecializedFeed) {
      const detectedCategory = detectCategoryFromKeywords(item.title || '');
      if (detectedCategory) {
        category = detectedCategory;
      }
    }

    return {
      id: `${sourceName}-${Date.now()}-${index}`,
      title: item.title || 'No title',
      summary: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 150),
      source: sourceName,
      timestamp: item.pubDate || new Date().toISOString(),
      category,
      sentiment: detectSentiment(item.title || ''),
      url: item.link,
    };
  });
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
