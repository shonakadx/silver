// FMP (Financial Modeling Prep) API サービス
// イノベーション投資に特化した財務データを提供

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || '';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// イノベーション関連の主要銘柄
export const INNOVATION_STOCKS = {
  // AI・半導体
  semiconductor: ['NVDA', 'AMD', 'INTC', 'AVGO', 'QCOM', 'TSM', 'ASML', 'MRVL', 'MU'],
  // ビッグテック
  bigtech: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'],
  // EV・クリーンエネルギー
  cleanenergy: ['TSLA', 'RIVN', 'LCID', 'NIO', 'ENPH', 'SEDG', 'PLUG', 'FSLR'],
  // バイオテック
  biotech: ['MRNA', 'BNTX', 'REGN', 'VRTX', 'ILMN', 'CRSP', 'EDIT', 'NTLA'],
  // 宇宙
  space: ['RKLB', 'SPCE', 'ASTS', 'RDW'],
  // ロボティクス・自動化
  robotics: ['ISRG', 'ROK', 'TER', 'FANUY'],
};

// すべてのイノベーション銘柄を取得
export const ALL_INNOVATION_STOCKS = Object.values(INNOVATION_STOCKS).flat();

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  pe: number;
}

export interface SectorPerformance {
  sector: string;
  changesPercentage: string;
}

export interface GainerLoser {
  symbol: string;
  name: string;
  change: number;
  price: number;
  changesPercentage: number;
}

export interface EarningsSurprise {
  symbol: string;
  date: string;
  actualEarningResult: number;
  estimatedEarning: number;
  surprisePercentage: number;
}

// セクターパフォーマンスを取得
export async function fetchSectorPerformance(): Promise<SectorPerformance[]> {
  if (!FMP_API_KEY) {
    console.log('[FMP] Sector performance: Skipped (no API key)');
    return [];
  }

  try {
    const url = `${FMP_BASE_URL}/sector-performance?apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log('[FMP] Sector performance loaded');
    return data;
  } catch (error) {
    console.warn('[FMP] Sector performance failed:', error);
    return [];
  }
}

// 主要イノベーション銘柄の株価を取得
export async function fetchInnovationStockQuotes(symbols?: string[]): Promise<StockQuote[]> {
  if (!FMP_API_KEY) {
    console.log('[FMP] Stock quotes: Skipped (no API key)');
    return [];
  }

  const targetSymbols = symbols || ALL_INNOVATION_STOCKS.slice(0, 20);

  try {
    const url = `${FMP_BASE_URL}/quote/${targetSymbols.join(',')}?apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log(`[FMP] Stock quotes loaded: ${data.length} stocks`);
    return data;
  } catch (error) {
    console.warn('[FMP] Stock quotes failed:', error);
    return [];
  }
}

// 本日の上昇銘柄を取得
export async function fetchTopGainers(): Promise<GainerLoser[]> {
  if (!FMP_API_KEY) {
    console.log('[FMP] Top gainers: Skipped (no API key)');
    return [];
  }

  try {
    const url = `${FMP_BASE_URL}/stock_market/gainers?apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // イノベーション関連銘柄をフィルタリング
    const innovationGainers = data.filter((stock: GainerLoser) =>
      ALL_INNOVATION_STOCKS.includes(stock.symbol)
    );

    console.log(`[FMP] Top gainers loaded: ${innovationGainers.length} innovation stocks`);
    return innovationGainers.slice(0, 10);
  } catch (error) {
    console.warn('[FMP] Top gainers failed:', error);
    return [];
  }
}

// 本日の下落銘柄を取得
export async function fetchTopLosers(): Promise<GainerLoser[]> {
  if (!FMP_API_KEY) {
    console.log('[FMP] Top losers: Skipped (no API key)');
    return [];
  }

  try {
    const url = `${FMP_BASE_URL}/stock_market/losers?apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // イノベーション関連銘柄をフィルタリング
    const innovationLosers = data.filter((stock: GainerLoser) =>
      ALL_INNOVATION_STOCKS.includes(stock.symbol)
    );

    console.log(`[FMP] Top losers loaded: ${innovationLosers.length} innovation stocks`);
    return innovationLosers.slice(0, 10);
  } catch (error) {
    console.warn('[FMP] Top losers failed:', error);
    return [];
  }
}

// 決算サプライズを取得
export async function fetchEarningsSurprises(): Promise<EarningsSurprise[]> {
  if (!FMP_API_KEY) {
    console.log('[FMP] Earnings surprises: Skipped (no API key)');
    return [];
  }

  try {
    // 各イノベーション銘柄の決算サプライズを取得
    const symbols = ALL_INNOVATION_STOCKS.slice(0, 15);
    const promises = symbols.map(async (symbol) => {
      try {
        const url = `${FMP_BASE_URL}/earnings-surprises/${symbol}?apikey=${FMP_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.length > 0) {
          return { ...data[0], symbol };
        }
        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(promises);
    const surprises = results.filter((r): r is EarningsSurprise => r !== null);

    // サプライズが大きい順にソート
    surprises.sort((a, b) => Math.abs(b.surprisePercentage) - Math.abs(a.surprisePercentage));

    console.log(`[FMP] Earnings surprises loaded: ${surprises.length}`);
    return surprises.slice(0, 10);
  } catch (error) {
    console.warn('[FMP] Earnings surprises failed:', error);
    return [];
  }
}

// テーマ別銘柄のパフォーマンスを取得
export async function fetchThemePerformance(theme: keyof typeof INNOVATION_STOCKS): Promise<StockQuote[]> {
  const symbols = INNOVATION_STOCKS[theme];
  return fetchInnovationStockQuotes(symbols);
}

// APIキーが設定されているかチェック
export function isFMPAvailable(): boolean {
  return !!FMP_API_KEY;
}
