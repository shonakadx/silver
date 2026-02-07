import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { fetchAllStockQuotes, StockQuote, INDICES } from '../../services/stockService';
import {
  LayoutDashboard,
  TrendingUp,
  Newspaper,
  FlaskConical,
  BarChart3,
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string, symbol?: string) => void;
}

const navItems: { id: string; icon: LucideIcon; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
  { id: 'chart', icon: TrendingUp, label: 'チャート' },
  { id: 'analysis', icon: FlaskConical, label: '分析ツール' },
  { id: 'news', icon: Newspaper, label: 'ニュース' },
];

// クイックウォッチに表示する主要ETF
const QUICK_WATCH_SYMBOLS = ['SOXX', 'QQQ', 'ARKK', 'ICLN', 'XBI', 'ARKX'];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [stocks, setStocks] = useState<StockQuote[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAllStockQuotes();
        setStocks(data);
      } catch (err) {
        console.error('[Sidebar] Failed to load stocks:', err);
      }
    }
    load();

    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  // クイックウォッチ用のETFをフィルタ
  const quickWatchStocks = QUICK_WATCH_SYMBOLS
    .map(symbol => stocks.find(s => s.symbol === symbol))
    .filter((s): s is StockQuote => s !== undefined && s.price > 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-title">ナビゲーション</div>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={18} strokeWidth={1.5} className="nav-icon" />
            {item.label}
          </div>
        ))}
      </div>

      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={14} />
          主要ETF指標
        </div>
        {quickWatchStocks.length > 0 ? (
          quickWatchStocks.map(stock => {
            const indexInfo = INDICES.find(i => i.symbol === stock.symbol);
            return (
              <div
                key={stock.symbol}
                className="watchlist-item"
                style={{ padding: '8px 16px', cursor: 'pointer' }}
                onClick={() => onNavigate('chart', stock.symbol)}
              >
                <div className="wl-left">
                  <span className="wl-symbol" style={{ fontSize: '12px', fontWeight: 600 }}>{stock.symbol}</span>
                  <span className="wl-name" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {indexInfo?.description || stock.name}
                  </span>
                </div>
                <div className="wl-right">
                  <div className="wl-price" style={{ fontSize: '12px', fontWeight: 500 }}>
                    ${stock.price.toFixed(2)}
                  </div>
                  <PriceChange value={stock.change} percent={stock.changePercent} size="sm" />
                </div>
              </div>
            );
          })
        ) : (
          // スケルトン表示
          QUICK_WATCH_SYMBOLS.slice(0, 4).map(symbol => {
            const indexInfo = INDICES.find(i => i.symbol === symbol);
            return (
              <div
                key={symbol}
                className="watchlist-item"
                style={{ padding: '8px 16px', opacity: 0.6 }}
              >
                <div className="wl-left">
                  <span className="wl-symbol" style={{ fontSize: '12px', fontWeight: 600 }}>{symbol}</span>
                  <span className="wl-name" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {indexInfo?.description || '読み込み中...'}
                  </span>
                </div>
                <div className="wl-right">
                  <div style={{
                    width: 50,
                    height: 14,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 4,
                    animation: 'pulse 1.5s infinite'
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* マーケット状態インジケーター */}
      <div className="sidebar-section" style={{ borderTop: '1px solid var(--border-primary)', padding: '12px 16px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
          マーケット状態
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isMarketOpen() ? 'var(--green)' : 'var(--text-muted)',
            boxShadow: isMarketOpen() ? '0 0 6px var(--green)' : 'none'
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {isMarketOpen() ? 'US市場 開場中' : 'US市場 閉場'}
          </span>
        </div>
      </div>
    </aside>
  );
}

// 米国市場の開場判定（EST 9:30-16:00）
function isMarketOpen(): boolean {
  const now = new Date();
  const estOffset = -5; // EST
  const utcHours = now.getUTCHours();
  const estHours = (utcHours + estOffset + 24) % 24;
  const day = now.getUTCDay();

  // 土日は閉場
  if (day === 0 || day === 6) return false;

  // 9:30-16:00 EST
  if (estHours >= 10 && estHours < 16) return true;
  if (estHours === 9 && now.getUTCMinutes() >= 30) return true;

  return false;
}
