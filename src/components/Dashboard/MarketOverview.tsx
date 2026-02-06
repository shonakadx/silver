import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { MiniChart } from '../common/MiniChart';
import { fetchCryptoPrices, CryptoPrice } from '../../services/cryptoService';

interface MarketOverviewProps {
  onNavigate: (page: string) => void;
}

export function MarketOverview({ onNavigate }: MarketOverviewProps) {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchCryptoPrices();
        setCryptos(data);
        setLastUpdated(new Date());
        console.log('[MarketOverview] Loaded', data.length, 'cryptos');
      } catch (err) {
        console.error('[MarketOverview] Error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // 60秒ごとに更新
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const topGainers = [...cryptos]
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, 5);

  const topLosers = [...cryptos]
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, 5);

  if (isLoading && cryptos.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">マーケット概況</h1>
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
          <h1 className="page-title">マーケット概況</h1>
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
        <h1 className="page-title">暗号資産マーケット</h1>
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
            ● LIVE (CoinGecko API)
          </span>
          {lastUpdated && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
              最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
            </span>
          )}
        </div>
      </div>

      {/* Crypto Cards */}
      <div className="grid-5" style={{ marginBottom: 16 }}>
        {cryptos.slice(0, 5).map(crypto => (
          <div key={crypto.id} className="index-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="index-name">{crypto.name}</div>
                <div className="index-symbol">{crypto.symbol.toUpperCase()}</div>
              </div>
              {crypto.sparkline_in_7d && (
                <MiniChart data={crypto.sparkline_in_7d.price.slice(-24)} width={60} height={24} />
              )}
            </div>
            <div className="index-value">
              ¥{crypto.current_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="index-change">
              <PriceChange value={crypto.price_change_24h} percent={crypto.price_change_percentage_24h} size="sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Top Gainers */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--green)' }}>▲ 24h 上昇率上位</span>
          </div>
          <table className="stock-table">
            <thead>
              <tr>
                <th>銘柄</th>
                <th className="right">価格 (JPY)</th>
                <th className="right">24h変動</th>
                <th className="right">騰落率</th>
              </tr>
            </thead>
            <tbody>
              {topGainers.map(crypto => (
                <tr key={crypto.id} onClick={() => onNavigate('chart')}>
                  <td>
                    <span className="symbol">{crypto.symbol.toUpperCase()}</span>
                    <span className="name" style={{ marginLeft: 8 }}>{crypto.name}</span>
                  </td>
                  <td className="right">¥{crypto.current_price.toLocaleString()}</td>
                  <td className="right"><PriceChange value={crypto.price_change_24h} size="sm" /></td>
                  <td className="right">
                    <span className={`change-badge ${crypto.price_change_percentage_24h >= 0 ? 'up' : 'down'}`}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Losers */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--red)' }}>▼ 24h 下落率上位</span>
          </div>
          <table className="stock-table">
            <thead>
              <tr>
                <th>銘柄</th>
                <th className="right">価格 (JPY)</th>
                <th className="right">24h変動</th>
                <th className="right">騰落率</th>
              </tr>
            </thead>
            <tbody>
              {topLosers.map(crypto => (
                <tr key={crypto.id} onClick={() => onNavigate('chart')}>
                  <td>
                    <span className="symbol">{crypto.symbol.toUpperCase()}</span>
                    <span className="name" style={{ marginLeft: 8 }}>{crypto.name}</span>
                  </td>
                  <td className="right">¥{crypto.current_price.toLocaleString()}</td>
                  <td className="right"><PriceChange value={crypto.price_change_24h} size="sm" /></td>
                  <td className="right">
                    <span className={`change-badge ${crypto.price_change_percentage_24h >= 0 ? 'up' : 'down'}`}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Cryptos */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">暗号資産一覧</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {cryptos.length} 銘柄
          </span>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          <table className="stock-table">
            <thead>
              <tr>
                <th>シンボル</th>
                <th>銘柄名</th>
                <th className="right">価格 (JPY)</th>
                <th className="right">24h変動</th>
                <th className="right">時価総額</th>
                <th className="right">出来高(24h)</th>
              </tr>
            </thead>
            <tbody>
              {cryptos.map(crypto => (
                <tr key={crypto.id} onClick={() => onNavigate('chart')}>
                  <td><span className="symbol">{crypto.symbol.toUpperCase()}</span></td>
                  <td className="name">{crypto.name}</td>
                  <td className="right">¥{crypto.current_price.toLocaleString()}</td>
                  <td className="right">
                    <PriceChange value={crypto.price_change_24h} percent={crypto.price_change_percentage_24h} size="sm" />
                  </td>
                  <td className="right volume">¥{(crypto.market_cap / 1e12).toFixed(2)}T</td>
                  <td className="right volume">¥{(crypto.total_volume / 1e9).toFixed(1)}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
