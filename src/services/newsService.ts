// ニュースサービス - 複数ジャンルのRSSソースを使用
import { NewsItem } from '../types/market';

// rss2json.com API
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

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
  // イノベーション・テクノロジー
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
  // 生成AI・LLM
  { url: 'https://www.itmedia.co.jp/rss/2.0/aiplus.xml', name: 'ITmedia AI+', category: 'genai' },
  { url: 'https://ledge.ai/feed/', name: 'Ledge.ai', category: 'genai' },
  { url: 'https://ainow.ai/feed/', name: 'AINOW', category: 'genai' },
  // 脱炭素・クリーンエネルギー
  { url: 'https://www.renewable-ei.org/activities/feed/', name: '自然エネルギー財団', category: 'cleanenergy' },
  { url: 'https://www.kankyo-business.jp/news/rss.php', name: '環境ビジネスオンライン', category: 'cleanenergy' },
  { url: 'https://solarjournal.jp/feed/', name: 'SOLAR JOURNAL', category: 'cleanenergy' },
  { url: 'https://www.enecho.meti.go.jp/rss/rss.xml', name: '資源エネルギー庁', category: 'cleanenergy' },
  // 資源・コモディティ
  { url: 'https://oilgas-info.jogmec.go.jp/rss.xml', name: 'JOGMEC石油・天然ガス', category: 'resources' },
  { url: 'https://mric.jogmec.go.jp/rss.xml', name: 'JOGMEC金属資源', category: 'resources' },
  // 精密医療・バイオテック
  { url: 'https://bio.nikkeibp.co.jp/rss/index.rdf', name: '日経バイオテク', category: 'biotech' },
  { url: 'https://www.qlifepro.com/feed/', name: 'QLifePro', category: 'biotech' },
  { url: 'https://medical.nikkeibp.co.jp/all/rss/index.rdf', name: '日経メディカル', category: 'biotech' },
  // ロボティクス・自動化
  { url: 'https://robot.watch.impress.co.jp/data/rss/1.0/robot/feed.rdf', name: 'Robot Watch', category: 'robotics' },
  { url: 'https://monoist.itmedia.co.jp/mn/rss/2.0/mn.xml', name: 'MONOist', category: 'robotics' },
  { url: 'https://www.automation-news.jp/feed/', name: 'オートメーション新聞', category: 'robotics' },
  // 宇宙開発
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

// カテゴリを詳細に判定
function detectDetailedCategory(title: string, defaultCategory: string): string {
  const text = title.toLowerCase();

  // 生成AI・LLM（最優先で判定）
  if (text.includes('生成ai') || text.includes('generative ai') || text.includes('chatgpt') || text.includes('gpt-4') || text.includes('gpt-5') ||
      text.includes('claude') || text.includes('gemini') || text.includes('llm') || text.includes('大規模言語') ||
      text.includes('openai') || text.includes('anthropic') || text.includes('copilot') || text.includes('diffusion') ||
      text.includes('stable diffusion') || text.includes('midjourney') || text.includes('dall-e') || text.includes('sora')) {
    return 'genai';
  }
  // 宇宙開発
  if (text.includes('宇宙') || text.includes('space') || text.includes('spacex') || text.includes('rocket') || text.includes('ロケット') ||
      text.includes('衛星') || text.includes('satellite') || text.includes('nasa') || text.includes('jaxa') ||
      text.includes('starlink') || text.includes('月面') || text.includes('火星') || text.includes('軌道') ||
      text.includes('打ち上げ') || text.includes('launch') || text.includes('blue origin') || text.includes('starship')) {
    return 'space';
  }
  // ロボティクス・自動化
  if (text.includes('ロボット') || text.includes('robot') || text.includes('自動化') || text.includes('automation') ||
      text.includes('協働ロボ') || text.includes('cobot') || text.includes('産業用ロボ') || text.includes('ドローン') ||
      text.includes('drone') || text.includes('rpa') || text.includes('ファナック') || text.includes('fanuc') ||
      text.includes('boston dynamics') || text.includes('ヒューマノイド') || text.includes('humanoid')) {
    return 'robotics';
  }
  // 脱炭素・クリーンエネルギー
  if (text.includes('脱炭素') || text.includes('カーボンニュートラル') || text.includes('carbon neutral') || text.includes('再生可能') ||
      text.includes('renewable') || text.includes('太陽光') || text.includes('solar') || text.includes('風力') || text.includes('wind') ||
      text.includes('水素') || text.includes('hydrogen') || text.includes('ev') || text.includes('電気自動車') ||
      text.includes('蓄電') || text.includes('battery') || text.includes('グリーン') || text.includes('green energy') ||
      text.includes('co2') || text.includes('排出') || text.includes('climate') || text.includes('気候変動') ||
      text.includes('テスラ') || text.includes('tesla') || text.includes('byd')) {
    return 'cleanenergy';
  }
  // 精密医療・バイオテック
  if (text.includes('バイオ') || text.includes('biotech') || text.includes('ゲノム') || text.includes('genome') ||
      text.includes('遺伝子') || text.includes('gene') || text.includes('mrna') || text.includes('crispr') ||
      text.includes('創薬') || text.includes('drug discovery') || text.includes('精密医療') || text.includes('precision medicine') ||
      text.includes('がん治療') || text.includes('cancer') || text.includes('再生医療') || text.includes('細胞') ||
      text.includes('ワクチン') || text.includes('vaccine') || text.includes('抗体') || text.includes('antibody') ||
      text.includes('モデルナ') || text.includes('moderna') || text.includes('ファイザー') || text.includes('pfizer')) {
    return 'biotech';
  }
  // 資源・コモディティ
  if (text.includes('原油') || text.includes('oil') || text.includes('天然ガス') || text.includes('natural gas') ||
      text.includes('lng') || text.includes('石炭') || text.includes('coal') || text.includes('鉱物') || text.includes('mineral') ||
      text.includes('レアアース') || text.includes('rare earth') || text.includes('リチウム') || text.includes('lithium') ||
      text.includes('銅') || text.includes('copper') || text.includes('金') || text.includes('gold') ||
      text.includes('opec') || text.includes('資源') || text.includes('commodity') || text.includes('コモディティ')) {
    return 'resources';
  }
  // 暗号資産
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
  // 一般イノベーション
  if (text.includes('ai') || text.includes('人工知能') || text.includes('機械学習') || text.includes('startup') || text.includes('スタートアップ') ||
      text.includes('innovation') || text.includes('イノベーション') || text.includes('量子') || text.includes('quantum') ||
      text.includes('自動運転') || text.includes('5g') || text.includes('6g') || text.includes('メタバース') ||
      text.includes('vr') || text.includes('ar') || text.includes('xr') || text.includes('web3') || text.includes('nft')) {
    return 'innovation';
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
