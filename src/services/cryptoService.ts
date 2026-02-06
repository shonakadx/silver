// CoinGecko API - 無料、APIキー不要、CORS対応
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  sparkline_in_7d?: { price: number[] };
}

export interface CryptoChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// 主要な暗号資産のリスト（BTC, ETH, XRPのみ）
const CRYPTO_IDS = [
  'bitcoin',
  'ethereum',
  'ripple',
];

// フォールバックデータ（API失敗時に使用）
const FALLBACK_DATA: CryptoPrice[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 15500000, price_change_24h: 150000, price_change_percentage_24h: 0.98, market_cap: 305000000000000, total_volume: 4500000000000, high_24h: 15600000, low_24h: 15300000 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 420000, price_change_24h: 5000, price_change_percentage_24h: 1.2, market_cap: 50000000000000, total_volume: 2000000000000, high_24h: 425000, low_24h: 410000 },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 350, price_change_24h: 10, price_change_percentage_24h: 2.9, market_cap: 19000000000000, total_volume: 800000000000, high_24h: 360, low_24h: 340 },
];

// メモリキャッシュ
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache: {
  prices?: CacheEntry<CryptoPrice[]>;
  charts: Map<string, CacheEntry<CryptoChartData>>;
} = {
  charts: new Map(),
};

// キャッシュの有効期限（60秒）
const CACHE_TTL = 60 * 1000;

// LocalStorageキャッシュキー
const LS_PRICES_KEY = 'crypto_prices_cache';
const LS_CHARTS_KEY = 'crypto_charts_cache';

// LocalStorageからキャッシュを読み込み
function loadFromLocalStorage<T>(key: string): CacheEntry<T> | null {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('[Cache] Failed to load from localStorage:', e);
  }
  return null;
}

// LocalStorageにキャッシュを保存
function saveToLocalStorage<T>(key: string, data: T) {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('[Cache] Failed to save to localStorage:', e);
  }
}

// リトライ付きfetch
async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      // 429 (Rate Limit) の場合は少し長く待つ
      if (response.status === 429) {
        console.warn(`[CoinGecko] Rate limited, waiting ${delay * 2}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * 2));
        continue;
      }
      // その他のエラーはリトライ
      if (i < retries - 1) {
        console.warn(`[CoinGecko] Request failed (${response.status}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return response; // 最後のリトライでも失敗したらそのまま返す
      }
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`[CoinGecko] Network error, retrying in ${delay}ms...`, err);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// 価格一覧を取得（キャッシュ付き）
export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  // メモリキャッシュが有効ならそれを返す
  if (memoryCache.prices && Date.now() - memoryCache.prices.timestamp < CACHE_TTL) {
    console.log('[CoinGecko] Using memory cached prices');
    return memoryCache.prices.data;
  }

  const url = `${COINGECKO_API}/coins/markets?vs_currency=jpy&ids=${CRYPTO_IDS.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

  console.log('[CoinGecko] Fetching prices...');

  try {
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CryptoPrice[] = await response.json();
    console.log('[CoinGecko] Fetched', data.length, 'prices');

    // キャッシュを更新
    memoryCache.prices = { data, timestamp: Date.now() };
    saveToLocalStorage(LS_PRICES_KEY, data);

    return data;
  } catch (err) {
    console.error('[CoinGecko] Error fetching prices:', err);

    // メモリキャッシュがあれば返す
    if (memoryCache.prices) {
      console.warn('[CoinGecko] Using stale memory cache');
      return memoryCache.prices.data;
    }

    // LocalStorageキャッシュがあれば返す
    const lsCache = loadFromLocalStorage<CryptoPrice[]>(LS_PRICES_KEY);
    if (lsCache) {
      console.warn('[CoinGecko] Using localStorage cache');
      memoryCache.prices = lsCache;
      return lsCache.data;
    }

    // 最終手段: フォールバックデータを返す
    console.warn('[CoinGecko] Using fallback data');
    return FALLBACK_DATA;
  }
}

// チャートデータを取得（キャッシュ付き）
export async function fetchCryptoChart(
  coinId: string,
  days: number = 30
): Promise<CryptoChartData> {
  const cacheKey = `${coinId}-${days}`;
  const cached = memoryCache.charts.get(cacheKey);

  // メモリキャッシュが有効ならそれを返す
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[CoinGecko] Using memory cached chart for', coinId);
    return cached.data;
  }

  const url = `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=jpy&days=${days}`;

  console.log('[CoinGecko] Fetching chart for', coinId);

  try {
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CryptoChartData = await response.json();
    console.log('[CoinGecko] Chart data points:', data.prices.length);

    // キャッシュを更新
    memoryCache.charts.set(cacheKey, { data, timestamp: Date.now() });

    // LocalStorageにも保存
    try {
      const chartsCache = loadFromLocalStorage<Record<string, CacheEntry<CryptoChartData>>>(LS_CHARTS_KEY) || { data: {}, timestamp: 0 };
      chartsCache.data[cacheKey] = { data, timestamp: Date.now() };
      localStorage.setItem(LS_CHARTS_KEY, JSON.stringify(chartsCache));
    } catch (e) {
      // LocalStorage容量オーバーの場合は無視
    }

    return data;
  } catch (err) {
    console.error('[CoinGecko] Error fetching chart:', err);

    // メモリキャッシュがあれば返す
    if (cached) {
      console.warn('[CoinGecko] Using stale memory chart cache');
      return cached.data;
    }

    // LocalStorageキャッシュを確認
    try {
      const chartsCache = loadFromLocalStorage<Record<string, CacheEntry<CryptoChartData>>>(LS_CHARTS_KEY);
      if (chartsCache && chartsCache.data[cacheKey]) {
        console.warn('[CoinGecko] Using localStorage chart cache');
        return chartsCache.data[cacheKey].data;
      }
    } catch (e) {
      // 無視
    }

    throw err;
  }
}

// 単一の暗号資産の詳細を取得
export async function fetchCryptoDetail(coinId: string): Promise<any> {
  const url = `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  return response.json();
}

// 為替レートを取得
export async function fetchExchangeRates(): Promise<Record<string, { value: number; name: string }>> {
  const url = `${COINGECKO_API}/exchange_rates`;

  console.log('[CoinGecko] Fetching exchange rates...');
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[CoinGecko] Exchange rates fetched');
  return data.rates;
}
