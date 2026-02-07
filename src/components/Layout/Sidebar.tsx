import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { fetchCryptoPrices, CryptoPrice } from '../../services/cryptoService';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Star,
  Newspaper,
  FlaskConical,
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems: { id: string; icon: LucideIcon; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
  { id: 'chart', icon: TrendingUp, label: 'チャート' },
  { id: 'portfolio', icon: Briefcase, label: 'ポートフォリオ' },
  { id: 'watchlist', icon: Star, label: 'ウォッチリスト' },
  { id: 'news', icon: Newspaper, label: 'ニュース' },
  { id: 'analysis', icon: FlaskConical, label: '分析ツール' },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCryptoPrices();
        setCryptos(data);
      } catch (err) {
        console.error('[Sidebar] Failed to load cryptos:', err);
      }
    }
    load();

    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="sidebar-section-title">クイックウォッチ</div>
        {cryptos.slice(0, 8).map(crypto => (
          <div
            key={crypto.id}
            className="watchlist-item"
            style={{ padding: '6px 16px', cursor: 'pointer' }}
            onClick={() => onNavigate('chart')}
          >
            <div className="wl-left">
              <span className="wl-symbol" style={{ fontSize: '11px' }}>{crypto.symbol.toUpperCase()}</span>
              <span className="wl-name" style={{ fontSize: '10px' }}>{crypto.name}</span>
            </div>
            <div className="wl-right">
              <div className="wl-price" style={{ fontSize: '11px' }}>
                ¥{crypto.current_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <PriceChange value={crypto.price_change_24h} percent={crypto.price_change_percentage_24h} size="sm" />
            </div>
          </div>
        ))}
        {cryptos.length === 0 && (
          <div style={{ padding: '16px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            読み込み中...
          </div>
        )}
      </div>
    </aside>
  );
}
