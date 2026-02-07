// ニュースサービス - 複数ソースからニュースを集約
import { NewsItem } from '../types/market';

// API設定
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';
const HACKER_NEWS_API = 'https://hacker-news.firebaseio.com/v0';
const ARXIV_API = 'https://export.arxiv.org/api/query';

// APIキー（オプション - 環境変数から取得）
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || '';

// 専門カテゴリ（このカテゴリのフィードはカテゴリを変更しない）
const SPECIALIZED_CATEGORIES = ['genai', 'cleanenergy', 'biotech', 'robotics', 'space', 'resources', 'semiconductor', 'arxiv', 'hackernews', 'jetro', 'research'];

// 除外すべきニュース（投資分析と関係ない）
const EXCLUDED_KEYWORDS = [
  // スポーツ
  'スポーツ', 'サッカー', '野球', 'プロ野球', 'mlb', 'nba', 'nfl', 'tennis', 'テニス',
  'ゴルフ', 'オリンピック', 'ワールドカップ', 'w杯', 'リーグ戦', '試合結果', '優勝',
  'チャンピオン', 'バスケ', 'ラグビー', '陸上', '水泳', 'マラソン', '駅伝', '相撲',
  'boxing', 'ボクシング', 'mma', '格闘技', 'ufc', 'f1', 'フォーミュラ',
  // エンタメ・芸能
  'エンタメ', '芸能', 'アイドル', 'ジャニーズ', 'akb', '乃木坂', '欅坂', 'k-pop', 'kpop',
  'bts', 'アニメ', '漫画', 'マンガ', 'ゲーム攻略', 'ドラマ', '映画レビュー', 'バラエティ',
  'お笑い', 'タレント', '俳優', '女優', '歌手', 'ミュージシャン', 'コンサート', 'ライブ',
  '紅白', 'グラミー', 'アカデミー賞', 'ゴールデングローブ',
  // 料理・グルメ（投資と関係ない一般記事）
  'レシピ', '料理', 'グルメ', 'ランチ', 'ディナー', 'スイーツ', 'カフェ巡り', 'ラーメン',
  // ファッション・美容
  'ファッション', 'コーデ', 'メイク', 'コスメ', 'ネイル', 'ヘアスタイル', 'ダイエット',
  // 占い・心理
  '占い', '星座', '運勢', '心理テスト',
  // ゴシップ
  '結婚', '離婚', '熱愛', '不倫', 'スキャンダル', 'ゴシップ',
];

// ニュースが投資分析に関係ないかチェック
function isIrrelevantNews(title: string): boolean {
  const text = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

// ニュースフィード（イノベーション・テクノロジー特化）
const NEWS_FEEDS = [
  // === グローバルテック・イノベーション ===
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'innovation' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', name: 'Ars Technica', category: 'innovation' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'innovation' },
  { url: 'https://venturebeat.com/feed/', name: 'VentureBeat', category: 'innovation' },
  { url: 'https://spectrum.ieee.org/feeds/feed.rss', name: 'IEEE Spectrum', category: 'innovation' },
  { url: 'https://news.mit.edu/rss/topic/artificial-intelligence2', name: 'MIT News AI', category: 'genai' },
  { url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml', name: 'ScienceDaily AI', category: 'genai' },
  // 日本語テック
  { url: 'https://jp.techcrunch.com/feed/', name: 'TechCrunch Japan', category: 'innovation' },
  { url: 'https://wired.jp/feed/', name: 'WIRED Japan', category: 'innovation' },
  { url: 'https://www.technologyreview.jp/feed/', name: 'MIT Tech Review JP', category: 'innovation' },
  { url: 'https://thebridge.jp/feed', name: 'THE BRIDGE', category: 'innovation' },
  { url: 'https://gigazine.net/news/rss_2.0/', name: 'GIGAZINE', category: 'innovation' },
  // 経済・マーケット（イノベーション投資視点）
  { url: 'https://feeds.bloomberg.com/technology/news.rss', name: 'Bloomberg Tech', category: 'market' },
  { url: 'https://www.reutersagency.com/feed/?best-topics=tech&post_type=best', name: 'Reuters Tech', category: 'market' },
  // 企業ニュース
  { url: 'https://www.businessinsider.jp/feed/index.xml', name: 'Business Insider JP', category: 'company' },
  { url: 'https://toyokeizai.net/list/feed/rss', name: '東洋経済', category: 'company' },
  // 半導体・SOX関連（専門メディア）
  { url: 'https://www.digitimes.com/rss/daily.xml', name: 'DIGITIMES', category: 'semiconductor' },
  { url: 'https://eetimes.jp/ee/rss/index.rdf', name: 'EE Times Japan', category: 'semiconductor' },
  { url: 'https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf', name: 'PC Watch', category: 'semiconductor' },
  { url: 'https://news.mynavi.jp/rss/techplus', name: 'マイナビTech+', category: 'semiconductor' },
  { url: 'https://www.eenewseurope.com/en/feed/', name: 'eeNews Europe', category: 'semiconductor' },
  { url: 'https://semiengineering.com/feed/', name: 'Semiconductor Engineering', category: 'semiconductor' },
  // 調査レポート・省庁・シンクタンク
  { url: 'https://www.itmedia.co.jp/rss/2.0/enterprise.xml', name: 'ITmedia Enterprise', category: 'research' },
  { url: 'https://japan.zdnet.com/feed/index.rdf', name: 'ZDNet Japan', category: 'research' },
  // 経済産業省
  { url: 'https://www.meti.go.jp/rss/index.rdf', name: '経済産業省', category: 'research' },
  // 総務省
  { url: 'https://www.soumu.go.jp/rss/menu_news.xml', name: '総務省', category: 'research' },
  // 内閣府
  { url: 'https://www.cao.go.jp/rss/index.xml', name: '内閣府', category: 'research' },
  // 日本銀行
  { url: 'https://www.boj.or.jp/rss/whatsnew.xml', name: '日本銀行', category: 'research' },
  // 財務省
  { url: 'https://www.mof.go.jp/rss/index.xml', name: '財務省', category: 'research' },
  // 特許庁
  { url: 'https://www.jpo.go.jp/rss/index.rdf', name: '特許庁', category: 'research' },
  // 科学技術振興機構（JST）
  { url: 'https://www.jst.go.jp/rss/whatsnew.xml', name: 'JST科学技術振興機構', category: 'research' },
  // NEDO（新エネルギー・産業技術総合開発機構）
  { url: 'https://www.nedo.go.jp/rss/news.xml', name: 'NEDO', category: 'research' },
  // 日本総研
  { url: 'https://www.jri.co.jp/rss/report.xml', name: '日本総研', category: 'research' },
  // 野村総研
  { url: 'https://www.nri.com/jp/rss/news.xml', name: '野村総研', category: 'research' },
  // みずほリサーチ
  { url: 'https://www.mizuho-rt.co.jp/rss/index.xml', name: 'みずほリサーチ', category: 'research' },
  // ジェトロ（日本貿易振興機構）ビジネス短信
  { url: 'https://www.jetro.go.jp/biznews/rss/biznewstop.xml', name: 'ジェトロ ビジネス短信', category: 'jetro' },
  { url: 'https://www.jetro.go.jp/biznews/rss/biznews_asia.xml', name: 'ジェトロ アジア', category: 'jetro' },
  { url: 'https://www.jetro.go.jp/biznews/rss/biznews_n_america.xml', name: 'ジェトロ 北米', category: 'jetro' },
  { url: 'https://www.jetro.go.jp/biznews/rss/biznews_europe.xml', name: 'ジェトロ 欧州', category: 'jetro' },
  { url: 'https://www.jetro.go.jp/biznews/rss/biznews_middle_east.xml', name: 'ジェトロ 中東', category: 'jetro' },
  // 生成AI・LLM（専門）
  { url: 'https://www.itmedia.co.jp/rss/2.0/aiplus.xml', name: 'ITmedia AI+', category: 'genai' },
  { url: 'https://ledge.ai/feed/', name: 'Ledge.ai', category: 'genai' },
  { url: 'https://ainow.ai/feed/', name: 'AINOW', category: 'genai' },
  { url: 'https://the-decoder.com/feed/', name: 'The Decoder', category: 'genai' },
  // 脱炭素・クリーンエネルギー（専門）
  { url: 'https://www.renewable-ei.org/activities/feed/', name: '自然エネルギー財団', category: 'cleanenergy' },
  { url: 'https://www.kankyo-business.jp/news/rss.php', name: '環境ビジネスオンライン', category: 'cleanenergy' },
  { url: 'https://solarjournal.jp/feed/', name: 'SOLAR JOURNAL', category: 'cleanenergy' },
  { url: 'https://www.enecho.meti.go.jp/rss/rss.xml', name: '資源エネルギー庁', category: 'cleanenergy' },
  { url: 'https://electrek.co/feed/', name: 'Electrek', category: 'cleanenergy' },
  // 資源・コモディティ（専門）
  { url: 'https://oilgas-info.jogmec.go.jp/rss.xml', name: 'JOGMEC石油・天然ガス', category: 'resources' },
  { url: 'https://mric.jogmec.go.jp/rss.xml', name: 'JOGMEC金属資源', category: 'resources' },
  // 精密医療・バイオテック（専門）
  { url: 'https://bio.nikkeibp.co.jp/rss/index.rdf', name: '日経バイオテク', category: 'biotech' },
  { url: 'https://www.qlifepro.com/feed/', name: 'QLifePro', category: 'biotech' },
  { url: 'https://medical.nikkeibp.co.jp/all/rss/index.rdf', name: '日経メディカル', category: 'biotech' },
  { url: 'https://www.fiercebiotech.com/rss.xml', name: 'FierceBiotech', category: 'biotech' },
  // ロボティクス・自動化（専門）
  { url: 'https://robot.watch.impress.co.jp/data/rss/1.0/robot/feed.rdf', name: 'Robot Watch', category: 'robotics' },
  { url: 'https://monoist.itmedia.co.jp/mn/rss/2.0/mn.xml', name: 'MONOist', category: 'robotics' },
  { url: 'https://www.automation-news.jp/feed/', name: 'オートメーション新聞', category: 'robotics' },
  { url: 'https://www.therobotreport.com/feed/', name: 'The Robot Report', category: 'robotics' },
  // 宇宙開発（専門）
  { url: 'https://sorae.info/feed/', name: 'sorae宇宙へのポータルサイト', category: 'space' },
  { url: 'https://news.mynavi.jp/rss/space', name: 'マイナビ宇宙', category: 'space' },
  { url: 'https://spacenews.com/feed/', name: 'SpaceNews', category: 'space' },
  { url: 'https://www.nasaspaceflight.com/feed/', name: 'NASASpaceFlight', category: 'space' },
  // 量子コンピューティング
  { url: 'https://thequantuminsider.com/feed/', name: 'The Quantum Insider', category: 'innovation' },
];

// センチメント判定
function detectSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const text = title.toLowerCase();

  const positiveWords = ['surge', 'rise', 'gain', 'rally', 'bull', 'up', 'high', 'record', 'soar', 'jump', 'launch', 'approve', 'breakthrough', 'success', '上昇', '高値', '好調', '増益', '最高', '成功'];
  const negativeWords = ['drop', 'fall', 'decline', 'crash', 'bear', 'down', 'low', 'plunge', 'dump', 'sell', 'hack', 'scam', 'fail', 'layoff', 'cut', '下落', '安値', '減益', '暴落', '失敗'];

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

  return null;
}

// RSSフィードからニュースを取得
async function fetchFromFeed(feedUrl: string, sourceName: string, defaultCategory: string): Promise<NewsItem[]> {
  const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(feedUrl)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'ok' || !data.items) {
    throw new Error(`Feed error: ${data.message || 'Unknown error'}`);
  }

  const isSpecializedFeed = SPECIALIZED_CATEGORIES.includes(defaultCategory);
  const now = new Date();

  // 不要なニュースをフィルタリング
  const filteredItems = data.items.filter((item: any) => {
    const title = item.title || '';
    if (isIrrelevantNews(title)) return false;

    // 調査レポート・ジェトロは1ヶ月以内ならOK
    if (defaultCategory === 'research' || defaultCategory === 'jetro') {
      const pubDate = new Date(item.pubDate);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return pubDate >= oneMonthAgo;
    }

    return true;
  });

  return filteredItems.slice(0, 10).map((item: any, index: number) => {
    let category = defaultCategory;

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

// ========== Hacker News API ==========
async function fetchHackerNews(): Promise<NewsItem[]> {
  console.log('[News] Fetching from Hacker News...');

  try {
    // トップストーリーのIDを取得
    const topStoriesRes = await fetch(`${HACKER_NEWS_API}/topstories.json`);
    if (!topStoriesRes.ok) throw new Error('Failed to fetch top stories');

    const storyIds: number[] = await topStoriesRes.json();
    const top20Ids = storyIds.slice(0, 20);

    // 各ストーリーの詳細を取得
    const stories = await Promise.all(
      top20Ids.map(async (id) => {
        const res = await fetch(`${HACKER_NEWS_API}/item/${id}.json`);
        return res.json();
      })
    );

    // テック/投資関連のキーワードでフィルタリング
    const techKeywords = ['ai', 'ml', 'gpu', 'nvidia', 'tesla', 'apple', 'google', 'microsoft', 'amazon', 'meta',
                          'startup', 'vc', 'funding', 'ipo', 'crypto', 'bitcoin', 'ethereum', 'semiconductor',
                          'robot', 'space', 'energy', 'biotech', 'quantum', 'llm', 'gpt', 'openai', 'anthropic'];

    const filteredStories = stories.filter(story => {
      if (!story || !story.title) return false;
      const title = story.title.toLowerCase();
      return techKeywords.some(kw => title.includes(kw)) || story.score > 100;
    });

    console.log(`[News] Hacker News: ${filteredStories.length} relevant items`);

    return filteredStories.slice(0, 10).map((story: any, index: number) => ({
      id: `hackernews-${story.id}`,
      title: story.title,
      summary: `Score: ${story.score} | Comments: ${story.descendants || 0}`,
      source: 'Hacker News',
      timestamp: new Date(story.time * 1000).toISOString(),
      category: 'hackernews',
      sentiment: detectSentiment(story.title),
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
    }));
  } catch (error) {
    console.warn('[News] Hacker News failed:', error);
    return [];
  }
}

// ========== ArXiv API (AI/ML論文) ==========
async function fetchArxivPapers(): Promise<NewsItem[]> {
  console.log('[News] Fetching from ArXiv...');

  try {
    // AI/ML関連の最新論文を検索
    const queries = [
      'cat:cs.AI', // Artificial Intelligence
      'cat:cs.LG', // Machine Learning
      'cat:cs.CL', // Computation and Language (NLP)
      'cat:cs.CV', // Computer Vision
    ];

    const searchQuery = queries.join('+OR+');
    const url = `${ARXIV_API}?search_query=${searchQuery}&start=0&max_results=15&sortBy=submittedDate&sortOrder=descending`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xmlText = await response.text();

    // XMLをパース
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const entries = xmlDoc.getElementsByTagName('entry');

    const papers: NewsItem[] = [];

    for (let i = 0; i < Math.min(entries.length, 10); i++) {
      const entry = entries[i];
      const title = entry.getElementsByTagName('title')[0]?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const summary = entry.getElementsByTagName('summary')[0]?.textContent?.replace(/\s+/g, ' ').trim().substring(0, 200) || '';
      const published = entry.getElementsByTagName('published')[0]?.textContent || '';
      const id = entry.getElementsByTagName('id')[0]?.textContent || '';

      // 著者を取得
      const authors = entry.getElementsByTagName('author');
      const authorNames: string[] = [];
      for (let j = 0; j < Math.min(authors.length, 3); j++) {
        const name = authors[j].getElementsByTagName('name')[0]?.textContent;
        if (name) authorNames.push(name);
      }
      const authorStr = authorNames.join(', ') + (authors.length > 3 ? ' et al.' : '');

      papers.push({
        id: `arxiv-${Date.now()}-${i}`,
        title: title,
        summary: `${authorStr} - ${summary}...`,
        source: 'ArXiv',
        timestamp: published,
        category: 'arxiv',
        sentiment: 'neutral',
        url: id,
      });
    }

    console.log(`[News] ArXiv: ${papers.length} papers`);
    return papers;
  } catch (error) {
    console.warn('[News] ArXiv failed:', error);
    // ArXivが失敗した場合はPapers With Codeにフォールバック
    return fetchPapersWithCode();
  }
}

// ========== Papers With Code API (AI/ML論文) ==========
async function fetchPapersWithCode(): Promise<NewsItem[]> {
  console.log('[News] Fetching from Papers With Code...');

  try {
    // Papers With Code APIからトレンディングペーパーを取得
    const url = 'https://paperswithcode.com/api/v1/papers/?ordering=-published&items_per_page=15';

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid Papers With Code response');
    }

    const papers: NewsItem[] = data.results.slice(0, 10).map((paper: any, index: number) => ({
      id: `pwc-${Date.now()}-${index}`,
      title: paper.title || 'No title',
      summary: paper.abstract?.substring(0, 200) + '...' || '',
      source: 'Papers With Code',
      timestamp: paper.published || new Date().toISOString(),
      category: 'arxiv',
      sentiment: 'neutral' as const,
      url: paper.url_pdf || paper.url_abs || `https://paperswithcode.com/paper/${paper.id}`,
    }));

    console.log(`[News] Papers With Code: ${papers.length} papers`);
    return papers;
  } catch (error) {
    console.warn('[News] Papers With Code failed:', error);
    return [];
  }
}

// ========== NewsAPI (オプション - APIキーが必要) ==========
async function fetchNewsAPI(): Promise<NewsItem[]> {
  if (!NEWS_API_KEY) {
    console.log('[News] NewsAPI: Skipped (no API key)');
    return [];
  }

  console.log('[News] Fetching from NewsAPI...');

  try {
    // ビジネス・テクノロジーニュースを取得
    const url = `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=15&apiKey=${NEWS_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.status !== 'ok' || !data.articles) {
      throw new Error(data.message || 'NewsAPI error');
    }

    console.log(`[News] NewsAPI: ${data.articles.length} articles`);

    return data.articles.slice(0, 10).map((article: any, index: number) => ({
      id: `newsapi-${Date.now()}-${index}`,
      title: article.title || 'No title',
      summary: article.description || '',
      source: article.source?.name || 'NewsAPI',
      timestamp: article.publishedAt || new Date().toISOString(),
      category: detectCategoryFromKeywords(article.title || '') || 'market',
      sentiment: detectSentiment(article.title || ''),
      url: article.url,
    }));
  } catch (error) {
    console.warn('[News] NewsAPI failed:', error);
    return [];
  }
}

// ========== Financial Modeling Prep (オプション - APIキーが必要) ==========
async function fetchFMPNews(): Promise<NewsItem[]> {
  if (!FMP_API_KEY) {
    console.log('[News] FMP: Skipped (no API key)');
    return [];
  }

  console.log('[News] Fetching from Financial Modeling Prep...');

  try {
    // 株式ニュースを取得
    const url = `https://financialmodelingprep.com/api/v3/stock_news?limit=20&apikey=${FMP_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const articles = await response.json();

    if (!Array.isArray(articles)) {
      throw new Error('Invalid FMP response');
    }

    console.log(`[News] FMP: ${articles.length} articles`);

    // 関連するシンボルでフィルタリング
    const relevantSymbols = ['NVDA', 'TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'AMD', 'INTC', 'SOXX', 'SMH', 'ARKK', 'ARKG'];

    return articles
      .filter((article: any) => {
        const symbol = article.symbol?.toUpperCase();
        return relevantSymbols.includes(symbol) || !article.symbol;
      })
      .slice(0, 10)
      .map((article: any, index: number) => ({
        id: `fmp-${Date.now()}-${index}`,
        title: article.title || 'No title',
        summary: article.text?.substring(0, 150) || '',
        source: article.site || 'FMP',
        timestamp: article.publishedDate || new Date().toISOString(),
        category: detectCategoryFromKeywords(article.title || '') || 'market',
        sentiment: detectSentiment(article.title || ''),
        url: article.url,
      }));
  } catch (error) {
    console.warn('[News] FMP failed:', error);
    return [];
  }
}

// ========== SEC EDGAR (企業の提出書類) ==========
async function fetchSECFilings(): Promise<NewsItem[]> {
  console.log('[News] Fetching from SEC EDGAR...');

  try {
    // SEC RSSフィードから最新の提出書類を取得
    const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent('https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&count=20&output=atom')}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.status !== 'ok' || !data.items) {
      throw new Error('SEC feed error');
    }

    // 主要企業のフィリングのみをフィルタリング
    const majorCompanies = ['NVIDIA', 'TESLA', 'APPLE', 'ALPHABET', 'MICROSOFT', 'AMAZON', 'META', 'AMD', 'INTEL', 'QUALCOMM'];

    const relevantFilings = data.items.filter((item: any) => {
      const title = (item.title || '').toUpperCase();
      return majorCompanies.some(company => title.includes(company));
    });

    console.log(`[News] SEC EDGAR: ${relevantFilings.length} relevant filings`);

    return relevantFilings.slice(0, 5).map((item: any, index: number) => ({
      id: `sec-${Date.now()}-${index}`,
      title: item.title || 'SEC Filing',
      summary: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 150),
      source: 'SEC EDGAR',
      timestamp: item.pubDate || new Date().toISOString(),
      category: 'market',
      sentiment: 'neutral',
      url: item.link,
    }));
  } catch (error) {
    console.warn('[News] SEC EDGAR failed:', error);
    return [];
  }
}

// メイン関数
export async function fetchNews(): Promise<NewsItem[]> {
  console.log('[News] Fetching news from multiple sources...');

  // 全ソースから並列取得
  const [rssResults, hackerNews, arxivPapers, newsApiArticles, fmpNews, secFilings] = await Promise.all([
    // 既存のRSSフィード
    Promise.allSettled(
      NEWS_FEEDS.map(feed => fetchFromFeed(feed.url, feed.name, feed.category))
    ),
    // 新規API
    fetchHackerNews(),
    fetchArxivPapers(),
    fetchNewsAPI(),
    fetchFMPNews(),
    fetchSECFilings(),
  ]);

  const allNews: NewsItem[] = [];
  let successCount = 0;

  // RSSフィードの結果を処理
  for (const result of rssResults) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
      successCount++;
    }
  }

  // 新規APIの結果を追加
  allNews.push(...hackerNews);
  allNews.push(...arxivPapers);
  allNews.push(...newsApiArticles);
  allNews.push(...fmpNews);
  allNews.push(...secFilings);

  const additionalSources = [hackerNews, arxivPapers, newsApiArticles, fmpNews, secFilings]
    .filter(arr => arr.length > 0).length;

  console.log(`[News] ${successCount}/${NEWS_FEEDS.length} RSS feeds + ${additionalSources} API sources, ${allNews.length} total items`);

  if (allNews.length === 0) {
    throw new Error('ニュースの取得に失敗しました。しばらくしてから再試行してください。');
  }

  // 重複を除去して時間順にソート
  const uniqueNews = Array.from(
    new Map(allNews.map(n => [n.title, n])).values()
  ).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return uniqueNews.slice(0, 80);
}

// 個別のAPIからニュースを取得する関数をエクスポート
export { fetchHackerNews, fetchArxivPapers, fetchNewsAPI, fetchFMPNews, fetchSECFilings };
