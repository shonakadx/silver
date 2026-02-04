import { create } from 'zustand';
import { MarketIndex, StockQuote, CandlestickData } from '../types/market';
import { marketIndices, stockQuotes, generateCandlestickData } from '../data/mockData';

interface MarketState {
  indices: MarketIndex[];
  stocks: StockQuote[];
  selectedSymbol: string | null;
  chartData: CandlestickData[];
  chartPeriod: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
  searchQuery: string;

  setSelectedSymbol: (symbol: string) => void;
  setChartPeriod: (period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y') => void;
  setSearchQuery: (query: string) => void;
  getFilteredStocks: () => StockQuote[];
  simulateUpdate: () => void;
}

const periodToDays: Record<string, number> = {
  '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365,
};

export const useMarketStore = create<MarketState>((set, get) => ({
  indices: marketIndices,
  stocks: stockQuotes,
  selectedSymbol: '7203',
  chartData: generateCandlestickData('7203', 90),
  chartPeriod: '3M',
  searchQuery: '',

  setSelectedSymbol: (symbol: string) => {
    const days = periodToDays[get().chartPeriod] || 90;
    set({
      selectedSymbol: symbol,
      chartData: generateCandlestickData(symbol, days),
    });
  },

  setChartPeriod: (period) => {
    const symbol = get().selectedSymbol;
    const days = periodToDays[period] || 90;
    set({
      chartPeriod: period,
      chartData: symbol ? generateCandlestickData(symbol, days) : [],
    });
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

  simulateUpdate: () => {
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
