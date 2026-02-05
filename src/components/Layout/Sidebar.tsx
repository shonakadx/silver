import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import { PriceChange } from '../common/PriceChange';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', icon: '📊', label: 'ダッシュボード' },
  { id: 'chart', icon: '📈', label: 'チャート' },
  { id: 'portfolio', icon: '💼', label: 'ポートフォリオ' },
  { id: 'watchlist', icon: '⭐', label: 'ウォッチリスト' },
  { id: 'news', icon: '📰', label: 'ニュース' },
  { id: 'analysis', icon: '🔬', label: '分析ツール' },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { watchlist } = usePortfolioStore();
  const { setSelectedSymbol } = useMarketStore();

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
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-title">クイックウォッチ</div>
        {watchlist.slice(0, 8).map(item => (
          <div
            key={item.symbol}
            className="watchlist-item"
            style={{ padding: '6px 16px' }}
            onClick={() => {
              setSelectedSymbol(item.symbol);
              onNavigate('chart');
            }}
          >
            <div className="wl-left">
              <span className="wl-symbol" style={{ fontSize: '11px' }}>{item.symbol}</span>
              <span className="wl-name" style={{ fontSize: '10px' }}>{item.name}</span>
            </div>
            <div className="wl-right">
              <div className="wl-price" style={{ fontSize: '11px' }}>
                {item.price.toLocaleString()}
              </div>
              <PriceChange value={item.change} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
