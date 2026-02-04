import { useState } from 'react';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import { PriceChange } from '../common/PriceChange';

interface WatchlistViewProps {
  onNavigate: (page: string) => void;
}

export function WatchlistView({ onNavigate }: WatchlistViewProps) {
  const { watchlist, removeFromWatchlist, addToWatchlist } = usePortfolioStore();
  const { stocks, setSelectedSymbol } = useMarketStore();
  const [showAdd, setShowAdd] = useState(false);
  const [addQuery, setAddQuery] = useState('');

  const availableStocks = stocks.filter(
    s => !watchlist.find(w => w.symbol === s.symbol) &&
      (addQuery === '' ||
        s.symbol.includes(addQuery) ||
        s.nameJa.includes(addQuery) ||
        s.name.toLowerCase().includes(addQuery.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ウォッチリスト</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '閉じる' : '+ 銘柄追加'}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">銘柄を追加</span>
          </div>
          <div className="card-body">
            <input
              type="text"
              placeholder="銘柄コードまたは名前で検索..."
              value={addQuery}
              onChange={e => setAddQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                outline: 'none',
                marginBottom: 12,
              }}
            />
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {availableStocks.slice(0, 10).map(s => (
                <div
                  key={s.symbol}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    addToWatchlist({
                      symbol: s.symbol,
                      name: s.nameJa,
                      price: s.price,
                      change: s.change,
                      changePercent: s.changePercent,
                      volume: s.volume,
                    });
                    setAddQuery('');
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue)', fontWeight: 600 }}>{s.symbol}</span>
                    <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>{s.nameJa}</span>
                  </div>
                  <button className="btn btn-ghost" style={{ padding: '2px 10px', fontSize: 11 }}>追加</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">登録銘柄</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {watchlist.length} 銘柄
          </span>
        </div>
        <table className="stock-table">
          <thead>
            <tr>
              <th>銘柄コード</th>
              <th>銘柄名</th>
              <th className="right">株価</th>
              <th className="right">前日比</th>
              <th className="right">騰落率</th>
              <th className="right">出来高</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map(item => (
              <tr key={item.symbol}>
                <td>
                  <span
                    className="symbol"
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedSymbol(item.symbol); onNavigate('chart'); }}
                  >
                    {item.symbol}
                  </span>
                </td>
                <td className="name">{item.name}</td>
                <td className="right">{item.price.toLocaleString()}</td>
                <td className="right"><PriceChange value={item.change} size="sm" /></td>
                <td className="right">
                  <span className={`change-badge ${item.changePercent >= 0 ? 'up' : 'down'}`}>
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </span>
                </td>
                <td className="right volume">{(item.volume / 1000).toFixed(0)}K</td>
                <td style={{ width: 40 }}>
                  <button
                    className="watchlist-remove"
                    style={{ opacity: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(item.symbol);
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
