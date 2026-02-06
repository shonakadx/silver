// 株式指数・ETFデータサービス
// Alpha Vantage API（無料、CORS対応）

const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
// 無料APIキー（デモ用、本番では環境変数推奨）
const API_KEY = 'demo';

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
}

export interface StockChartData {
  dates: string[];
  prices: number[];
  volumes: number[];
}

// 主要指数・ETFリスト
export const INDICES = [
  { symbol: 'SOXX', name: 'iShares半導体ETF', description: 'SOX指数連動' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', description: '破壊的イノベーション' },
  { symbol: 'SMH', name: 'VanEck半導体ETF', description: '半導体セクター' },
  { symbol: 'QQQ', name: 'Invesco QQQ', description: 'NASDAQ100連動' },
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

// フォールバックデータ
const FALLBACK_QUOTES: Record<string, StockQuote> = {
  SOXX: { symbol: 'SOXX', name: 'iShares半導体ETF', price: 220.50, change: 3.25, changePercent: 1.5, high: 222.00, low: 218.00, volume: 5000000, timestamp: new Date().toISOString() },
  ARKK: { symbol: 'ARKK', name: 'ARK Innovation ETF', price: 48.30, change: 0.85, changePercent: 1.79, high: 49.00, low: 47.50, volume: 12000000, timestamp: new Date().toISOString() },
  SMH: { symbol: 'SMH', name: 'VanEck半導体ETF', price: 245.80, change: 4.20, changePercent: 1.74, high: 247.00, low: 243.00, volume: 8000000, timestamp: new Date().toISOString() },
  QQQ: { symbol: 'QQQ', name: 'Invesco QQQ', price: 485.20, change: 6.50, changePercent: 1.36, high: 488.00, low: 482.00, volume: 35000000, timestamp: new Date().toISOString() },
};

// 株価を取得
export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  // キャッシュチェック
  const cached = cache.quotes.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Stock] Using cached quote for', symbol);
    return cached.data;
  }

  const url = `${ALPHA_VANTAGE_API}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

  console.log('[Stock] Fetching quote for', symbol);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // API制限チェック
    if (data.Note || data['Error Message']) {
      throw new Error(data.Note || data['Error Message']);
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      throw new Error('Invalid response');
    }

    const result: StockQuote = {
      symbol: quote['01. symbol'],
      name: INDICES.find(i => i.symbol === symbol)?.name || symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      volume: parseInt(quote['06. volume']),
      timestamp: quote['07. latest trading day'],
    };

    // キャッシュ更新
    cache.quotes.set(symbol, { data: result, timestamp: Date.now() });
    saveToLocalStorage(LS_QUOTES_KEY, symbol, result);

    return result;
  } catch (err) {
    console.error('[Stock] Error fetching quote:', err);

    // キャッシュがあれば返す
    if (cached) {
      return cached.data;
    }

    // LocalStorageチェック
    const lsCache = loadFromLocalStorage<StockQuote>(LS_QUOTES_KEY);
    if (lsCache && lsCache[symbol]) {
      return lsCache[symbol].data;
    }

    // フォールバック
    if (FALLBACK_QUOTES[symbol]) {
      return FALLBACK_QUOTES[symbol];
    }

    throw err;
  }
}

// 複数の株価を取得
export async function fetchAllStockQuotes(): Promise<StockQuote[]> {
  const results = await Promise.allSettled(
    INDICES.map(idx => fetchStockQuote(idx.symbol))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
    .map(r => r.value);
}

// チャートデータを取得
export async function fetchStockChart(symbol: string, interval: string = 'daily'): Promise<StockChartData> {
  const cacheKey = `${symbol}-${interval}`;
  const cached = cache.charts.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Stock] Using cached chart for', symbol);
    return cached.data;
  }

  const func = interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
  const url = `${ALPHA_VANTAGE_API}?function=${func}&symbol=${symbol}&apikey=${API_KEY}`;

  console.log('[Stock] Fetching chart for', symbol);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.Note || data['Error Message']) {
      throw new Error(data.Note || data['Error Message']);
    }

    const timeSeries = data['Time Series (Daily)'] || data['Time Series (5min)'];
    if (!timeSeries) {
      throw new Error('Invalid chart data');
    }

    const entries = Object.entries(timeSeries).slice(0, 30).reverse();
    const result: StockChartData = {
      dates: entries.map(([date]) => date),
      prices: entries.map(([, values]: [string, any]) => parseFloat(values['4. close'])),
      volumes: entries.map(([, values]: [string, any]) => parseInt(values['5. volume'])),
    };

    cache.charts.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (err) {
    console.error('[Stock] Error fetching chart:', err);

    if (cached) {
      return cached.data;
    }

    // フォールバック: 空のデータ
    return { dates: [], prices: [], volumes: [] };
  }
}
