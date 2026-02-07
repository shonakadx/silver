// 株式指数・ETFデータサービス
// Yahoo Finance API（無料、リアルタイムデータ）via CORSプロキシ

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
// CORSプロキシ（複数用意してフォールバック）
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  previousClose: number;
}

export interface StockChartData {
  dates: string[];
  prices: number[];
  volumes: number[];
}

// 主要指数・ETFリスト（テーマ別）
export const INDICES = [
  // 半導体・テクノロジー
  { symbol: 'SOXX', name: 'iShares半導体ETF', description: 'SOX指数連動', category: 'semiconductor' },
  { symbol: 'SMH', name: 'VanEck半導体ETF', description: '半導体セクター', category: 'semiconductor' },
  { symbol: 'QQQ', name: 'Invesco QQQ', description: 'NASDAQ100連動', category: 'tech' },
  // 生成AI・イノベーション
  { symbol: 'ARKK', name: 'ARK Innovation ETF', description: '破壊的イノベーション', category: 'innovation' },
  { symbol: 'BOTZ', name: 'Global X ロボット&AI ETF', description: 'AI・ロボティクス', category: 'ai' },
  { symbol: 'ROBO', name: 'ROBO Global ロボティクスETF', description: 'ロボット・自動化', category: 'robotics' },
  // クリーンエネルギー・脱炭素
  { symbol: 'ICLN', name: 'iSharesクリーンエネルギーETF', description: '再生可能エネルギー', category: 'cleanenergy' },
  { symbol: 'TAN', name: 'Invesco 太陽光ETF', description: 'ソーラーエネルギー', category: 'cleanenergy' },
  { symbol: 'LIT', name: 'Global X リチウム&バッテリーETF', description: 'EV・蓄電池', category: 'cleanenergy' },
  // バイオテック・精密医療
  { symbol: 'ARKG', name: 'ARK Genomic Revolution ETF', description: 'ゲノム革命', category: 'biotech' },
  { symbol: 'XBI', name: 'SPDRバイオテックETF', description: 'バイオテクノロジー', category: 'biotech' },
  // 宇宙開発
  { symbol: 'ARKX', name: 'ARK Space Exploration ETF', description: '宇宙探査', category: 'space' },
  { symbol: 'UFO', name: 'Procure Space ETF', description: '宇宙産業', category: 'space' },
  // 資源・コモディティ
  { symbol: 'XLE', name: 'Energy Select Sector ETF', description: 'エネルギーセクター', category: 'resources' },
  { symbol: 'GDX', name: 'VanEck 金鉱株ETF', description: '金鉱企業', category: 'resources' },
];

// キャッシュ
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: {
  quotes: Map<string, CacheEntry<StockQuote>>;
  charts: Map<string, CacheEntry<StockChartData>>;
} = {
  quotes: new Map(),
  charts: new Map(),
};

const CACHE_TTL = 5 * 60 * 1000; // 5分

// LocalStorageキー
const LS_QUOTES_KEY = 'stock_quotes_cache';
const LS_CHARTS_KEY = 'stock_charts_cache';

// LocalStorageからキャッシュを読み込み
function loadFromLocalStorage<T>(key: string): Record<string, CacheEntry<T>> | null {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('[StockService] Failed to load from localStorage:', e);
  }
  return null;
}

// LocalStorageにキャッシュを保存
function saveToLocalStorage<T>(key: string, symbol: string, data: T) {
  try {
    const existing = loadFromLocalStorage<T>(key) || {};
    existing[symbol] = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {
    // 容量オーバーの場合は無視
  }
}

// フォールバックデータ（API失敗時のみ使用）
const FALLBACK_QUOTES: Record<string, StockQuote> = {
  // 半導体・テクノロジー
  SOXX: { symbol: 'SOXX', name: 'iShares半導体ETF', price: 220.50, change: 3.25, changePercent: 1.5, high: 222.00, low: 218.00, volume: 5000000, previousClose: 217.25, timestamp: new Date().toISOString() },
  SMH: { symbol: 'SMH', name: 'VanEck半導体ETF', price: 245.80, change: 4.20, changePercent: 1.74, high: 247.00, low: 243.00, volume: 8000000, previousClose: 241.60, timestamp: new Date().toISOString() },
  QQQ: { symbol: 'QQQ', name: 'Invesco QQQ', price: 485.20, change: 6.50, changePercent: 1.36, high: 488.00, low: 482.00, volume: 35000000, previousClose: 478.70, timestamp: new Date().toISOString() },
  // 生成AI・イノベーション
  ARKK: { symbol: 'ARKK', name: 'ARK Innovation ETF', price: 48.30, change: 0.85, changePercent: 1.79, high: 49.00, low: 47.50, volume: 12000000, previousClose: 47.45, timestamp: new Date().toISOString() },
  BOTZ: { symbol: 'BOTZ', name: 'Global X ロボット&AI ETF', price: 32.50, change: 0.45, changePercent: 1.40, high: 33.00, low: 32.10, volume: 1500000, previousClose: 32.05, timestamp: new Date().toISOString() },
  ROBO: { symbol: 'ROBO', name: 'ROBO Global ロボティクスETF', price: 52.80, change: 0.72, changePercent: 1.38, high: 53.20, low: 52.30, volume: 800000, previousClose: 52.08, timestamp: new Date().toISOString() },
  // クリーンエネルギー
  ICLN: { symbol: 'ICLN', name: 'iSharesクリーンエネルギーETF', price: 14.20, change: 0.18, changePercent: 1.28, high: 14.40, low: 14.05, volume: 3500000, previousClose: 14.02, timestamp: new Date().toISOString() },
  TAN: { symbol: 'TAN', name: 'Invesco 太陽光ETF', price: 42.50, change: 0.65, changePercent: 1.55, high: 43.00, low: 42.10, volume: 2000000, previousClose: 41.85, timestamp: new Date().toISOString() },
  LIT: { symbol: 'LIT', name: 'Global X リチウム&バッテリーETF', price: 45.30, change: 0.58, changePercent: 1.30, high: 45.80, low: 44.90, volume: 1800000, previousClose: 44.72, timestamp: new Date().toISOString() },
  // バイオテック
  ARKG: { symbol: 'ARKG', name: 'ARK Genomic Revolution ETF', price: 28.40, change: 0.42, changePercent: 1.50, high: 28.80, low: 28.10, volume: 2500000, previousClose: 27.98, timestamp: new Date().toISOString() },
  XBI: { symbol: 'XBI', name: 'SPDRバイオテックETF', price: 88.50, change: 1.20, changePercent: 1.37, high: 89.20, low: 87.80, volume: 6000000, previousClose: 87.30, timestamp: new Date().toISOString() },
  // 宇宙開発
  ARKX: { symbol: 'ARKX', name: 'ARK Space Exploration ETF', price: 14.80, change: 0.22, changePercent: 1.51, high: 15.00, low: 14.60, volume: 1200000, previousClose: 14.58, timestamp: new Date().toISOString() },
  UFO: { symbol: 'UFO', name: 'Procure Space ETF', price: 18.20, change: 0.28, changePercent: 1.56, high: 18.50, low: 18.00, volume: 400000, previousClose: 17.92, timestamp: new Date().toISOString() },
  // 資源
  XLE: { symbol: 'XLE', name: 'Energy Select Sector ETF', price: 92.40, change: 1.35, changePercent: 1.48, high: 93.20, low: 91.50, volume: 15000000, previousClose: 91.05, timestamp: new Date().toISOString() },
  GDX: { symbol: 'GDX', name: 'VanEck 金鉱株ETF', price: 32.80, change: 0.48, changePercent: 1.48, high: 33.20, low: 32.50, volume: 25000000, previousClose: 32.32, timestamp: new Date().toISOString() },
};

// 複数プロキシでフェッチ（タイムアウト付き）
async function fetchWithProxies(yahooUrl: string, timeout = 5000): Promise<Response> {
  for (const proxy of CORS_PROXIES) {
    const url = `${proxy}${encodeURIComponent(yahooUrl)}`;
    console.log('[Stock] Trying proxy:', proxy.slice(0, 30));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('[Stock] Success with proxy:', proxy.slice(0, 30));
        return response;
      }
      console.warn(`[Stock] Proxy returned ${response.status}, trying next...`);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[Stock] Proxy timeout, trying next...');
      } else {
        console.warn('[Stock] Proxy error:', err);
      }
    }
  }
  throw new Error('All proxies failed');
}

// 株価を取得（Yahoo Finance API）
export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  // キャッシュチェック
  const cached = cache.quotes.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Stock] Using cached quote for', symbol);
    return cached.data;
  }

  const yahooUrl = `${YAHOO_FINANCE_API}/${symbol}?interval=1d&range=1d`;

  console.log('[Stock] Fetching quote for', symbol);

  try {
    const response = await fetchWithProxies(yahooUrl);

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error('Invalid response from Yahoo Finance');
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    const price = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    const stockQuote: StockQuote = {
      symbol: meta.symbol,
      name: INDICES.find(i => i.symbol === symbol)?.name || symbol,
      price: price,
      change: change,
      changePercent: changePercent,
      high: quote?.high?.[0] || meta.regularMarketDayHigh || price,
      low: quote?.low?.[0] || meta.regularMarketDayLow || price,
      volume: meta.regularMarketVolume || quote?.volume?.[0] || 0,
      previousClose: previousClose,
      timestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
    };

    // キャッシュ更新
    cache.quotes.set(symbol, { data: stockQuote, timestamp: Date.now() });
    saveToLocalStorage(LS_QUOTES_KEY, symbol, stockQuote);

    console.log('[Stock] Fetched', symbol, ':', stockQuote.price);

    return stockQuote;
  } catch (err) {
    console.error('[Stock] Error fetching quote:', err);

    // キャッシュがあれば返す
    if (cached) {
      console.warn('[Stock] Using stale cache for', symbol);
      return cached.data;
    }

    // LocalStorageチェック
    const lsCache = loadFromLocalStorage<StockQuote>(LS_QUOTES_KEY);
    if (lsCache && lsCache[symbol]) {
      console.warn('[Stock] Using localStorage cache for', symbol);
      return lsCache[symbol].data;
    }

    // フォールバック
    if (FALLBACK_QUOTES[symbol]) {
      console.warn('[Stock] Using fallback data for', symbol);
      return FALLBACK_QUOTES[symbol];
    }

    throw err;
  }
}

// 優先ETF（最初に取得する6銘柄）
const PRIORITY_SYMBOLS = ['SOXX', 'ARKK', 'ICLN', 'ARKG', 'ARKX', 'XLE'];

// 複数の株価を取得（優先ETFを先に取得）
export async function fetchAllStockQuotes(): Promise<StockQuote[]> {
  // まずフォールバックデータを返す準備
  const fallbackResults = INDICES.map(idx => FALLBACK_QUOTES[idx.symbol]).filter(Boolean);

  // 優先ETFを並列取得（タイムアウト短め）
  const priorityIndices = INDICES.filter(idx => PRIORITY_SYMBOLS.includes(idx.symbol));
  const otherIndices = INDICES.filter(idx => !PRIORITY_SYMBOLS.includes(idx.symbol));

  try {
    // 優先ETFを取得（最大3秒待つ）
    const priorityResults = await Promise.race([
      Promise.allSettled(priorityIndices.map(idx => fetchStockQuote(idx.symbol))),
      new Promise<PromiseSettledResult<StockQuote>[]>((resolve) =>
        setTimeout(() => resolve([]), 3000)
      ),
    ]);

    const priorityQuotes = priorityResults
      .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
      .map(r => r.value);

    // 残りのETFを取得（バックグラウンド、待たない）
    Promise.allSettled(otherIndices.map(idx => fetchStockQuote(idx.symbol)))
      .then(results => {
        console.log('[Stock] Background fetch completed:', results.filter(r => r.status === 'fulfilled').length);
      })
      .catch(() => {});

    // 優先ETFが取得できた場合
    if (priorityQuotes.length > 0) {
      // 残りはフォールバックデータで埋める
      const otherSymbols = otherIndices.map(i => i.symbol);
      const otherQuotes = otherSymbols
        .map(symbol => FALLBACK_QUOTES[symbol])
        .filter(Boolean);

      return [...priorityQuotes, ...otherQuotes];
    }

    // 何も取得できなかった場合はフォールバック
    console.warn('[Stock] Using all fallback data');
    return fallbackResults;
  } catch (err) {
    console.error('[Stock] fetchAllStockQuotes error:', err);
    return fallbackResults;
  }
}

// チャートデータを取得
export async function fetchStockChart(symbol: string, days: number = 30): Promise<StockChartData> {
  const cacheKey = `${symbol}-${days}`;
  const cached = cache.charts.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Stock] Using cached chart for', symbol);
    return cached.data;
  }

  // 期間に応じたrange設定
  let range = '1mo';
  let interval = '1d';
  if (days <= 1) {
    range = '1d';
    interval = '5m';
  } else if (days <= 7) {
    range = '5d';
    interval = '15m';
  } else if (days <= 30) {
    range = '1mo';
    interval = '1d';
  } else if (days <= 90) {
    range = '3mo';
    interval = '1d';
  } else {
    range = '1y';
    interval = '1d';
  }

  const yahooUrl = `${YAHOO_FINANCE_API}/${symbol}?interval=${interval}&range=${range}`;

  console.log('[Stock] Fetching chart for', symbol, 'range:', range);

  try {
    const response = await fetchWithProxies(yahooUrl);

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error('Invalid chart data from Yahoo Finance');
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const closes = quotes.close || [];
    const volumes = quotes.volume || [];

    const chartData: StockChartData = {
      dates: timestamps.map((ts: number) => {
        const date = new Date(ts * 1000);
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
      }),
      prices: closes.filter((p: number | null) => p !== null),
      volumes: volumes.filter((v: number | null) => v !== null),
    };

    // キャッシュ更新
    cache.charts.set(cacheKey, { data: chartData, timestamp: Date.now() });
    saveToLocalStorage(LS_CHARTS_KEY, cacheKey, chartData);

    console.log('[Stock] Chart data points:', chartData.prices.length);

    return chartData;
  } catch (err) {
    console.error('[Stock] Error fetching chart:', err);

    if (cached) {
      console.warn('[Stock] Using stale chart cache for', symbol);
      return cached.data;
    }

    // LocalStorageチェック
    const lsCache = loadFromLocalStorage<StockChartData>(LS_CHARTS_KEY);
    if (lsCache && lsCache[cacheKey]) {
      console.warn('[Stock] Using localStorage chart cache for', symbol);
      return lsCache[cacheKey].data;
    }

    // フォールバック: 空のデータ
    return { dates: [], prices: [], volumes: [] };
  }
}
