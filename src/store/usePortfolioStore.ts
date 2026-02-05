import { create } from 'zustand';
import { PortfolioHolding, PortfolioSummary, WatchlistItem } from '../types/market';
import { portfolioHoldings, defaultWatchlist } from '../data/mockData';

interface PortfolioState {
  holdings: PortfolioHolding[];
  watchlist: WatchlistItem[];
  summary: PortfolioSummary;

  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
}

function calcSummary(holdings: PortfolioHolding[]): PortfolioSummary {
  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const dayChange = totalValue * 0.008;
  const dayChangePercent = 0.8;
  const cashBalance = 1250000;

  return {
    totalValue,
    totalCost,
    totalPnl: Math.round(totalPnl),
    totalPnlPercent: Math.round(totalPnlPercent * 100) / 100,
    dayChange: Math.round(dayChange),
    dayChangePercent,
    cashBalance,
  };
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  holdings: portfolioHoldings,
  watchlist: defaultWatchlist,
  summary: calcSummary(portfolioHoldings),

  addToWatchlist: (item: WatchlistItem) => {
    const { watchlist } = get();
    if (!watchlist.find(w => w.symbol === item.symbol)) {
      set({ watchlist: [...watchlist, item] });
    }
  },

  removeFromWatchlist: (symbol: string) => {
    set(state => ({
      watchlist: state.watchlist.filter(w => w.symbol !== symbol),
    }));
  },
}));
