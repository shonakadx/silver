import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { fetchCryptoPrices, CryptoPrice } from '../../services/cryptoService';

interface WatchlistViewProps {
  onNavigate: (page: string) => void;
}

// ローカルストレージキー
const WATCHLIST_KEY = 'crypto_watchlist';

// ローカルストレージからウォッチリストを読み込み
function loadWatchlist(): string[] {
  try {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    return saved ? JSON.parse(saved) : ['bitcoin', 'ethereum', 'solana'];
  } catch {
    return ['bitcoin', 'ethereum', 'solana'];
  }
}

// ローカルストレージにウォッチリストを保存
function saveWatchlist(ids: string[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
}

export function WatchlistView({ onNavigate }: WatchlistViewProps) {
  const [watchlistIds, setWatchlistIds] = useState<string[]>(loadWatchlist);
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  void onNavigate;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCryptoPrices();
        setCryptos(data);
        console.log('[Watchlist] Loaded', data.length, 'cryptos');
      } catch (err) {
        console.error('[Watchlist] Error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // ウォッチリストに含まれる暗号資産
  const watchlistCryptos = cryptos.filter(c => watchlistIds.includes(c.id));

  // 追加可能な暗号資産（ウォッチリストに含まれていないもの）
  const availableCryptos = cryptos.filter(
    c => !watchlistIds.includes(c.id) &&
      (addQuery === '' ||
        c.symbol.toLowerCase().includes(addQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(addQuery.toLowerCase()))
  );

  const addToWatchlist = (id: string) => {
    const newList = [...watchlistIds, id];
    setWatchlistIds(newList);
    saveWatchlist(newList);
    setAddQuery('');
  };

  const removeFromWatchlist = (id: string) => {
    const newList = watchlistIds.filter(wid => wid !== id);
    setWatchlistIds(newList);
    saveWatchlist(newList);
  };

  if (isLoading && cryptos.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">ウォッチリスト</h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error && cryptos.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">ウォッチリスト</h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--red)', marginBottom: 16 }}>⚠ {error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ウォッチリスト</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 11,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
            }}
          >
            ● LIVE
          </span>
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? '閉じる' : '+ 銘柄追加'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">銘柄を追加</span>
          </div>
          <div className="card-body">
            <input
              type="text"
              placeholder="シンボルまたは名前で検索..."
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
              {availableCryptos.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => addToWatchlist(c.id)}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue)', fontWeight: 600 }}>
                      {c.symbol.toUpperCase()}
                    </span>
                    <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>{c.name}</span>
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
            {watchlistCryptos.length} 銘柄
          </span>
        </div>
        {watchlistCryptos.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            ウォッチリストに銘柄がありません。「+ 銘柄追加」ボタンから追加してください。
          </div>
        ) : (
          <table className="stock-table">
            <thead>
              <tr>
                <th>シンボル</th>
                <th>銘柄名</th>
                <th className="right">価格 (JPY)</th>
                <th className="right">24h変動</th>
                <th className="right">騰落率</th>
                <th className="right">時価総額</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {watchlistCryptos.map(crypto => (
                <tr key={crypto.id}>
                  <td>
                    <span className="symbol">{crypto.symbol.toUpperCase()}</span>
                  </td>
                  <td className="name">{crypto.name}</td>
                  <td className="right">¥{crypto.current_price.toLocaleString()}</td>
                  <td className="right"><PriceChange value={crypto.price_change_24h} size="sm" /></td>
                  <td className="right">
                    <span className={`change-badge ${crypto.price_change_percentage_24h >= 0 ? 'up' : 'down'}`}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="right volume">¥{(crypto.market_cap / 1e12).toFixed(2)}T</td>
                  <td style={{ width: 40 }}>
                    <button
                      className="watchlist-remove"
                      style={{ opacity: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(crypto.id);
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
