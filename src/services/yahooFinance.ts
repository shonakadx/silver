// 複数のCORSプロキシを試行
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/',
];
const YAHOO_BASE = 'https://query1.finance.yahoo.com';
let currentProxyIndex = 0;

export interface YahooQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap?: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  regularMarketPreviousClose: number;
}

export interface YahooChartData {
  timestamp: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

// 日本株のシンボルマッピング（Yahoo Finance形式）
export const JP_SYMBOLS: Record<string, string> = {
  '7203': '7203.T',   // トヨタ
  '6758': '6758.T',   // ソニー
  '9984': '9984.T',   // ソフトバンクG
  '6861': '6861.T',   // キーエンス
  '8306': '8306.T',   // 三菱UFJ
  '9432': '9432.T',   // NTT
  '6501': '6501.T',   // 日立
  '7267': '7267.T',   // ホンダ
  '4063': '4063.T',   // 信越化学
  '6902': '6902.T',   // デンソー
  '8035': '8035.T',   // 東京エレクトロン
  '9433': '9433.T',   // KDDI
  '4519': '4519.T',   // 中外製薬
  '6367': '6367.T',   // ダイキン
  '7741': '7741.T',   // HOYA
};

// 指数シンボル
export const INDEX_SYMBOLS: Record<string, string> = {
  'N225': '^N225',      // 日経平均
  'TOPIX': '^TOPX',     // TOPIX (might not work)
  'SPX': '^GSPC',       // S&P 500
  'DJI': '^DJI',        // NYダウ
  'IXIC': '^IXIC',      // NASDAQ
  'HSI': '^HSI',        // ハンセン
  'FTSE': '^FTSE',      // FTSE100
  'USDJPY': 'USDJPY=X', // ドル円
  'EURJPY': 'EURJPY=X', // ユーロ円
  'BTCUSD': 'BTC-USD',  // ビットコイン
};

async function fetchWithProxy(url: string): Promise<Response> {
  // 複数のプロキシを順番に試す
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyIndex = (currentProxyIndex + i) % CORS_PROXIES.length;
    const proxy = CORS_PROXIES[proxyIndex];
    const proxyUrl = proxy + encodeURIComponent(url);

    try {
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        currentProxyIndex = proxyIndex; // 成功したプロキシを記憶
        return response;
      }
    } catch (e) {
      console.warn(`Proxy ${proxy} failed, trying next...`);
    }
  }
  throw new Error('All proxies failed');
}

export async function fetchQuotes(symbols: string[]): Promise<YahooQuote[]> {
  try {
    const yahooSymbols = symbols.map(s => JP_SYMBOLS[s] || INDEX_SYMBOLS[s] || s);
    const url = `${YAHOO_BASE}/v7/finance/quote?symbols=${yahooSymbols.join(',')}`;

    const response = await fetchWithProxy(url);
    const data = await response.json();

    if (!data.quoteResponse?.result) {
      console.warn('No quote data received');
      return [];
    }

    return data.quoteResponse.result.map((q: any) => ({
      symbol: q.symbol,
      shortName: q.shortName || q.symbol,
      longName: q.longName,
      regularMarketPrice: q.regularMarketPrice || 0,
      regularMarketChange: q.regularMarketChange || 0,
      regularMarketChangePercent: q.regularMarketChangePercent || 0,
      regularMarketVolume: q.regularMarketVolume || 0,
      marketCap: q.marketCap,
      regularMarketDayHigh: q.regularMarketDayHigh || 0,
      regularMarketDayLow: q.regularMarketDayLow || 0,
      regularMarketOpen: q.regularMarketOpen || 0,
      regularMarketPreviousClose: q.regularMarketPreviousClose || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    return [];
  }
}

export async function fetchChart(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '3mo',
  interval: '1d' | '1h' | '5m' = '1d'
): Promise<YahooChartData | null> {
  try {
    const yahooSymbol = JP_SYMBOLS[symbol] || INDEX_SYMBOLS[symbol] || symbol;
    const url = `${YAHOO_BASE}/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`;

    const response = await fetchWithProxy(url);
    const data = await response.json();

    const result = data.chart?.result?.[0];
    if (!result) {
      console.warn('No chart data received');
      return null;
    }

    const quote = result.indicators?.quote?.[0];
    if (!quote) {
      return null;
    }

    return {
      timestamp: result.timestamp || [],
      open: quote.open || [],
      high: quote.high || [],
      low: quote.low || [],
      close: quote.close || [],
      volume: quote.volume || [],
    };
  } catch (error) {
    console.error('Failed to fetch chart:', error);
    return null;
  }
}

export async function fetchMultipleQuotes(): Promise<{
  stocks: YahooQuote[];
  indices: YahooQuote[];
}> {
  const stockSymbols = Object.values(JP_SYMBOLS);
  const indexSymbols = Object.values(INDEX_SYMBOLS);

  const [stocks, indices] = await Promise.all([
    fetchQuotes(stockSymbols),
    fetchQuotes(indexSymbols),
  ]);

  return { stocks, indices };
}

// Yahoo Financeのシンボルから元のシンボルに変換
export function yahooToLocalSymbol(yahooSymbol: string): string {
  // 日本株: 7203.T -> 7203
  if (yahooSymbol.endsWith('.T')) {
    return yahooSymbol.replace('.T', '');
  }
  // 指数: ^N225 -> N225
  for (const [local, yahoo] of Object.entries(INDEX_SYMBOLS)) {
    if (yahoo === yahooSymbol) return local;
  }
  return yahooSymbol;
}
