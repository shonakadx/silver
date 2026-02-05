import { create } from 'zustand';
import { MarketIndex, StockQuote, CandlestickData } from '../types/market';
import { marketIndices, stockQuotes, generateCandlestickData } from '../data/mockData';
import {
  fetchMultipleQuotes,
  fetchChart,
  yahooToLocalSymbol,
  JP_SYMBOLS,
  INDEX_SYMBOLS,
  YahooQuote,
} from '../services/yahooFinance';

interface MarketState {
  indices: MarketIndex[];
  stocks: StockQuote[];
  selectedSymbol: string | null;
  chartData: CandlestickData[];
  chartPeriod: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
  searchQuery: string;
  isLoading: boolean;
  lastUpdated: Date | null;
  useRealData: boolean;

  setSelectedSymbol: (symbol: string) => void;
  setChartPeriod: (period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y') => void;
  setSearchQuery: (query: string) => void;
  getFilteredStocks: () => StockQuote[];
  fetchRealData: () => Promise<void>;
  fetchChartData: (symbol: string, period: string) => Promise<void>;
  simulateUpdate: () => void;
}

const periodToRange: Record<string, '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y'> = {
  '1D': '1d', '1W': '5d', '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y',
};

const periodToDays: Record<string, number> = {
  '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365,
};

// 日本株の名前マッピング
const stockNames: Record<string, { name: string; nameJa: string; sector: string }> = {
  '7203': { name: 'Toyota Motor', nameJa: 'トヨタ自動車', sector: '自動車' },
  '6758': { name: 'Sony Group', nameJa: 'ソニーグループ', sector: '電機' },
  '9984': { name: 'SoftBank Group', nameJa: 'ソフトバンクG', sector: '通信' },
  '6861': { name: 'Keyence', nameJa: 'キーエンス', sector: '電機' },
  '8306': { name: 'MUFG', nameJa: '三菱UFJ FG', sector: '銀行' },
  '9432': { name: 'NTT', nameJa: '日本電信電話', sector: '通信' },
  '6501': { name: 'Hitachi', nameJa: '日立製作所', sector: '電機' },
  '7267': { name: 'Honda Motor', nameJa: 'ホンダ', sector: '自動車' },
  '4063': { name: 'Shin-Etsu Chemical', nameJa: '信越化学工業', sector: '化学' },
  '6902': { name: 'Denso', nameJa: 'デンソー', sector: '自動車' },
  '8035': { name: 'Tokyo Electron', nameJa: '東京エレクトロン', sector: '電機' },
  '9433': { name: 'KDDI', nameJa: 'KDDI', sector: '通信' },
  '4519': { name: 'Chugai Pharma', nameJa: '中外製薬', sector: '医薬品' },
  '6367': { name: 'Daikin Industries', nameJa: 'ダイキン工業', sector: '機械' },
  '7741': { name: 'HOYA', nameJa: 'HOYA', sector: '精密機器' },
};

const indexNames: Record<string, string> = {
  'N225': '日経平均',
  'TOPIX': 'TOPIX',
  'SPX': 'S&P 500',
  'DJI': 'NYダウ',
  'IXIC': 'NASDAQ',
  'HSI': 'ハンセン',
  'FTSE': 'FTSE100',
  'USDJPY': 'USD/JPY',
  'EURJPY': 'EUR/JPY',
  'BTCUSD': 'BTC/USD',
};

function convertYahooToStock(quote: YahooQuote): StockQuote | null {
  const localSymbol = yahooToLocalSymbol(quote.symbol);
  const info = stockNames[localSymbol];
  if (!info) return null;

  return {
    symbol: localSymbol,
    name: info.name,
    nameJa: info.nameJa,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
    marketCap: quote.marketCap || 0,
    high: quote.regularMarketDayHigh,
    low: quote.regularMarketDayLow,
    open: quote.regularMarketOpen,
    previousClose: quote.regularMarketPreviousClose,
    sector: info.sector,
  };
}

function convertYahooToIndex(quote: YahooQuote): MarketIndex | null {
  const localSymbol = yahooToLocalSymbol(quote.symbol);
  const name = indexNames[localSymbol];
  if (!name) return null;

  // スパークラインを生成（実データがないためプレースホルダー）
  const sparkline: number[] = [];
  const basePrice = quote.regularMarketPrice;
  for (let i = 0; i < 20; i++) {
    sparkline.push(basePrice * (1 + (Math.random() - 0.5) * 0.02));
  }
  sparkline.push(basePrice);

  return {
    symbol: localSymbol,
    name,
    value: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    sparkline,
  };
}

export const useMarketStore = create<MarketState>((set, get) => ({
  indices: marketIndices,
  stocks: stockQuotes,
  selectedSymbol: '7203',
  chartData: generateCandlestickData('7203', 90),
  chartPeriod: '3M',
  searchQuery: '',
  isLoading: false,
  lastUpdated: null,
  useRealData: true,

  setSelectedSymbol: (symbol: string) => {
    set({ selectedSymbol: symbol });
    get().fetchChartData(symbol, get().chartPeriod);
  },

  setChartPeriod: (period) => {
    set({ chartPeriod: period });
    const symbol = get().selectedSymbol;
    if (symbol) {
      get().fetchChartData(symbol, period);
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  getFilteredStocks: () => {
    const { stocks, searchQuery } = get();
    if (!searchQuery) return stocks;
    const q = searchQuery.toLowerCase();
    return stocks.filter(
      s => s.symbol.toLowerCase().includes(q) ||
           s.name.toLowerCase().includes(q) ||
           s.nameJa.includes(q)
    );
  },

  fetchRealData: async () => {
    set({ isLoading: true });
    try {
      const { stocks: yahooStocks, indices: yahooIndices } = await fetchMultipleQuotes();

      if (yahooStocks.length > 0) {
        const stocks = yahooStocks
          .map(convertYahooToStock)
          .filter((s): s is StockQuote => s !== null);

        if (stocks.length > 0) {
          set({ stocks });
        }
      }

      if (yahooIndices.length > 0) {
        const indices = yahooIndices
          .map(convertYahooToIndex)
          .filter((i): i is MarketIndex => i !== null);

        if (indices.length > 0) {
          set({ indices });
        }
      }

      set({ lastUpdated: new Date(), useRealData: true });
    } catch (error) {
      console.error('Failed to fetch real data, using mock data:', error);
      set({ useRealData: false });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChartData: async (symbol: string, period: string) => {
    const range = periodToRange[period] || '3mo';
    const interval = period === '1D' ? '5m' : '1d';

    try {
      const data = await fetchChart(symbol, range, interval as any);
      if (data && data.timestamp.length > 0) {
        const chartData: CandlestickData[] = data.timestamp
          .map((ts, i) => {
            if (data.open[i] == null || data.close[i] == null) return null;
            const date = new Date(ts * 1000);
            return {
              time: date.toISOString().split('T')[0],
              open: data.open[i],
              high: data.high[i],
              low: data.low[i],
              close: data.close[i],
              volume: data.volume[i] || 0,
            };
          })
          .filter((d): d is CandlestickData => d !== null);

        set({ chartData });
        return;
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }

    // フォールバック: モックデータ
    const days = periodToDays[period] || 90;
    set({ chartData: generateCandlestickData(symbol, days) });
  },

  simulateUpdate: () => {
    // リアルデータモードでは更新をスキップ（APIから定期的に取得する代わり）
    if (get().useRealData) {
      get().fetchRealData();
      return;
    }

    set(state => ({
      indices: state.indices.map(idx => {
        const delta = (Math.random() - 0.5) * idx.value * 0.001;
        const newValue = idx.value + delta;
        return {
          ...idx,
          value: Math.round(newValue * 100) / 100,
          change: Math.round((idx.change + delta) * 100) / 100,
          changePercent: Math.round(((idx.change + delta) / (idx.value - idx.change)) * 10000) / 100,
          sparkline: [...idx.sparkline.slice(1), newValue],
        };
      }),
      stocks: state.stocks.map(stock => {
        const delta = (Math.random() - 0.5) * stock.price * 0.002;
        const newPrice = stock.price + delta;
        return {
          ...stock,
          price: Math.round(newPrice * 10) / 10,
          change: Math.round((newPrice - stock.previousClose) * 10) / 10,
          changePercent: Math.round(((newPrice - stock.previousClose) / stock.previousClose) * 10000) / 100,
          high: Math.max(stock.high, newPrice),
          low: Math.min(stock.low, newPrice),
        };
      }),
    }));
  },
}));
