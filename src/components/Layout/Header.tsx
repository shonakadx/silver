import { useEffect, useState } from 'react';
import { useMarketStore } from '../../store/useMarketStore';

export function Header() {
  const { searchQuery, setSearchQuery, useRealData, isLoading, lastUpdated } = useMarketStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  };

  return (
    <header className="header">
      <div className="header-logo">
        <div className="logo-icon">S</div>
        SILVER
      </div>

      <div className="header-search">
        <span className="search-icon">&#x1F50D;</span>
        <input
          type="text"
          placeholder="銘柄検索 (コード / 名前)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-time">
        <span
          className="market-status"
          style={{
            background: isLoading
              ? 'rgba(245, 158, 11, 0.1)'
              : useRealData
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            color: isLoading ? '#f59e0b' : useRealData ? '#10b981' : '#ef4444',
          }}
        >
          <span
            className="dot"
            style={{
              background: isLoading ? '#f59e0b' : useRealData ? '#10b981' : '#ef4444',
            }}
          />
          {isLoading ? 'LOADING...' : useRealData ? 'LIVE DATA' : 'DEMO DATA'}
        </span>
        <span>{formatDate(time)}</span>
        <span style={{ fontWeight: 600 }}>{formatTime(time)}</span>
        <span style={{ color: 'var(--text-muted)' }}>JST</span>
      </div>
    </header>
  );
}
