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

// 主要な暗号資産のリスト
const CRYPTO_IDS = [
  'bitcoin',
  'ethereum',
  'ripple',
  'cardano',
  'solana',
  'polkadot',
  'dogecoin',
  'avalanche-2',
  'chainlink',
  'polygon',
];

// キャッシュ（レート制限対策）
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: {
  prices?: CacheEntry<CryptoPrice[]>;
  charts: Map<string, CacheEntry<CryptoChartData>>;
} = {
  charts: new Map(),
};

// キャッシュの有効期限（30秒）
const CACHE_TTL = 30 * 1000;

// 価格一覧を取得（キャッシュ付き）
export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  // キャッシュが有効ならそれを返す
  if (cache.prices && Date.now() - cache.prices.timestamp < CACHE_TTL) {
    console.log('[CoinGecko] Using cached prices');
    return cache.prices.data;
  }

  const url = `${COINGECKO_API}/coins/markets?vs_currency=jpy&ids=${CRYPTO_IDS.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

  console.log('[CoinGecko] Fetching prices...');

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // レート制限の場合、キャッシュがあればそれを返す
      if (response.status === 429 && cache.prices) {
        console.warn('[CoinGecko] Rate limited, using stale cache');
        return cache.prices.data;
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CryptoPrice[] = await response.json();
    console.log('[CoinGecko] Fetched', data.length, 'prices');

    // キャッシュを更新
    cache.prices = { data, timestamp: Date.now() };

    return data;
  } catch (err) {
    // ネットワークエラーでもキャッシュがあれば返す
    if (cache.prices) {
      console.warn('[CoinGecko] Error, using stale cache:', err);
      return cache.prices.data;
    }
    throw err;
  }
}

// チャートデータを取得（キャッシュ付き）
export async function fetchCryptoChart(
  coinId: string,
  days: number = 30
): Promise<CryptoChartData> {
  const cacheKey = `${coinId}-${days}`;
  const cached = cache.charts.get(cacheKey);

  // キャッシュが有効ならそれを返す
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[CoinGecko] Using cached chart for', coinId);
    return cached.data;
  }

  const url = `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=jpy&days=${days}`;

  console.log('[CoinGecko] Fetching chart for', coinId);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // レート制限の場合、キャッシュがあればそれを返す
      if (response.status === 429 && cached) {
        console.warn('[CoinGecko] Rate limited, using stale chart cache');
        return cached.data;
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CryptoChartData = await response.json();
    console.log('[CoinGecko] Chart data points:', data.prices.length);

    // キャッシュを更新
    cache.charts.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  } catch (err) {
    // エラーでもキャッシュがあれば返す
    if (cached) {
      console.warn('[CoinGecko] Error, using stale chart cache:', err);
      return cached.data;
    }
    throw err;
  }
}

// 単一の暗号資産の詳細を取得
export async function fetchCryptoDetail(coinId: string): Promise<any> {
  const url = `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  return response.json();
}

// 為替レートを取得（CoinGeckoの為替機能を使用）
export async function fetchExchangeRates(): Promise<Record<string, { value: number; name: string }>> {
  const url = `${COINGECKO_API}/exchange_rates`;

  console.log('[CoinGecko] Fetching exchange rates...');
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[CoinGecko] Exchange rates fetched');
  return data.rates;
}
