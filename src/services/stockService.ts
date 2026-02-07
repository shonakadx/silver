// 株式指数・ETFデータサービス
// Yahoo Finance API（無料、リアルタイムデータ）via CORSプロキシ

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
// CORSプロキシ（ブラウザから直接Yahoo Finance APIにアクセスするため）
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

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

// フォールバックデータ（API失敗時のみ使用）
const FALLBACK_QUOTES: Record<string, StockQuote> = {
  SOXX: { symbol: 'SOXX', name: 'iShares半導体ETF', price: 220.50, change: 3.25, changePercent: 1.5, high: 222.00, low: 218.00, volume: 5000000, previousClose: 217.25, timestamp: new Date().toISOString() },
  ARKK: { symbol: 'ARKK', name: 'ARK Innovation ETF', price: 48.30, change: 0.85, changePercent: 1.79, high: 49.00, low: 47.50, volume: 12000000, previousClose: 47.45, timestamp: new Date().toISOString() },
  SMH: { symbol: 'SMH', name: 'VanEck半導体ETF', price: 245.80, change: 4.20, changePercent: 1.74, high: 247.00, low: 243.00, volume: 8000000, previousClose: 241.60, timestamp: new Date().toISOString() },
  QQQ: { symbol: 'QQQ', name: 'Invesco QQQ', price: 485.20, change: 6.50, changePercent: 1.36, high: 488.00, low: 482.00, volume: 35000000, previousClose: 478.70, timestamp: new Date().toISOString() },
};

// リトライ付きfetch
async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      if (response.status === 429) {
        console.warn(`[Stock] Rate limited, waiting ${delay * 2}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * 2));
        continue;
      }
      if (i < retries - 1) {
        console.warn(`[Stock] Request failed (${response.status}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return response;
      }
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`[Stock] Network error, retrying in ${delay}ms...`, err);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
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
  const url = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;

  console.log('[Stock] Fetching quote for', symbol);

  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

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
  const url = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;

  console.log('[Stock] Fetching chart for', symbol, 'range:', range);

  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

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
