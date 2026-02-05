// Yahoo Finance Chart APIを使用（より確実に動作）
// CORSプロキシを使用してブラウザからアクセス可能にする
const CORS_PROXY = 'https://thingproxy.freeboard.io/fetch/';
const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

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
  'SPX': '^GSPC',       // S&P 500
  'DJI': '^DJI',        // NYダウ
  'IXIC': '^IXIC',      // NASDAQ
  'HSI': '^HSI',        // ハンセン
  'FTSE': '^FTSE',      // FTSE100
  'USDJPY': 'USDJPY=X', // ドル円
  'EURJPY': 'EURJPY=X', // ユーロ円
  'BTCUSD': 'BTC-USD',  // ビットコイン
};

// Chart APIからquoteデータを取得
async function fetchQuoteFromChart(yahooSymbol: string): Promise<YahooQuote | null> {
  try {
    const yahooUrl = `${YAHOO_CHART_BASE}/${yahooSymbol}?range=1d&interval=1d`;
    const url = CORS_PROXY + yahooUrl;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
    const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol: yahooSymbol,
      shortName: meta.shortName || meta.symbol || yahooSymbol,
      longName: meta.longName,
      regularMarketPrice: currentPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketVolume: meta.regularMarketVolume || (quote?.volume?.[0] || 0),
      marketCap: undefined,
      regularMarketDayHigh: meta.regularMarketDayHigh || (quote?.high?.[0] || currentPrice),
      regularMarketDayLow: meta.regularMarketDayLow || (quote?.low?.[0] || currentPrice),
      regularMarketOpen: meta.regularMarketOpen || (quote?.open?.[0] || currentPrice),
      regularMarketPreviousClose: previousClose,
    };
  } catch (error) {
    console.warn(`Failed to fetch ${yahooSymbol}:`, error);
    return null;
  }
}

export async function fetchQuotes(symbols: string[]): Promise<YahooQuote[]> {
  const results = await Promise.allSettled(
    symbols.map(s => fetchQuoteFromChart(s))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<YahooQuote | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((q): q is YahooQuote => q !== null);
}

export async function fetchChart(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '3mo',
  interval: '1d' | '1h' | '5m' = '1d'
): Promise<YahooChartData | null> {
  try {
    const yahooSymbol = JP_SYMBOLS[symbol] || INDEX_SYMBOLS[symbol] || symbol;
    const yahooUrl = `${YAHOO_CHART_BASE}/${yahooSymbol}?range=${range}&interval=${interval}`;
    const url = CORS_PROXY + yahooUrl;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

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
