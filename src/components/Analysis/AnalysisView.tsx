import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { fetchCryptoPrices, CryptoPrice } from '../../services/cryptoService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalysisViewProps {
  onNavigate: (page: string) => void;
}

type ScreenerSortField = 'price_change_percentage_24h' | 'total_volume' | 'market_cap' | 'current_price';

// テクニカル指標の簡易計算（スパークラインから）
function calculateIndicators(crypto: CryptoPrice) {
  const sparkline = crypto.sparkline_in_7d?.price || [];
  if (sparkline.length < 14) {
    return { rsi: 50, signal: 'neutral' as const };
  }

  // 簡易RSI計算
  const changes = [];
  for (let i = 1; i < sparkline.length; i++) {
    changes.push(sparkline[i] - sparkline[i - 1]);
  }

  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c));

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
  const rsi = 100 - (100 / (1 + rs));

  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  if (rsi < 30) signal = 'buy';
  else if (rsi > 70) signal = 'sell';

  return { rsi, signal };
}

export function AnalysisView({ onNavigate }: AnalysisViewProps) {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<ScreenerSortField>('price_change_percentage_24h');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'screener' | 'indicators' | 'heatmap'>('screener');
  void onNavigate;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCryptoPrices();
        setCryptos(data);
        console.log('[Analysis] Loaded', data.length, 'cryptos');
      } catch (err) {
        console.error('[Analysis] Error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = [...cryptos].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
  });

  // テクニカル指標を計算
  const cryptoIndicators = cryptos.map(crypto => ({
    ...crypto,
    ...calculateIndicators(crypto),
  }));

  const buyCount = cryptoIndicators.filter(i => i.signal === 'buy').length;
  const sellCount = cryptoIndicators.filter(i => i.signal === 'sell').length;
  const neutralCount = cryptoIndicators.filter(i => i.signal === 'neutral').length;

  // 時価総額別チャート
  const marketCapData = cryptos.slice(0, 5).map(c => ({
    name: c.symbol.toUpperCase(),
    value: c.market_cap / 1e12,
    change: c.price_change_percentage_24h,
    fill: c.price_change_percentage_24h >= 0 ? '#10b981' : '#ef4444',
  }));

  if (isLoading && cryptos.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">分析ツール</h1>
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
          <h1 className="page-title">分析ツール</h1>
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
        <h1 className="page-title">分析ツール</h1>
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
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'screener' ? 'active' : ''}`} onClick={() => setActiveTab('screener')}>
            スクリーナー
          </button>
          <button className={`tab ${activeTab === 'indicators' ? 'active' : ''}`} onClick={() => setActiveTab('indicators')}>
            テクニカル分析
          </button>
          <button className={`tab ${activeTab === 'heatmap' ? 'active' : ''}`} onClick={() => setActiveTab('heatmap')}>
            時価総額分析
          </button>
        </div>

        {activeTab === 'screener' && (
          <div>
            <div style={{ padding: 16 }}>
              <div className="screener-controls">
                <select
                  className="screener-select"
                  value={sortField}
                  onChange={e => setSortField(e.target.value as ScreenerSortField)}
                >
                  <option value="price_change_percentage_24h">騰落率</option>
                  <option value="total_volume">出来高</option>
                  <option value="market_cap">時価総額</option>
                  <option value="current_price">価格</option>
                </select>
                <select
                  className="screener-select"
                  value={sortDir}
                  onChange={e => setSortDir(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">降順</option>
                  <option value="asc">昇順</option>
                </select>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                  {filtered.length} 件
                </span>
              </div>
            </div>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>シンボル</th>
                  <th>銘柄名</th>
                  <th className="right">価格 (JPY)</th>
                  <th className="right">24h変動</th>
                  <th className="right">騰落率</th>
                  <th className="right">出来高(24h)</th>
                  <th className="right">時価総額</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(crypto => (
                  <tr key={crypto.id}>
                    <td><span className="symbol">{crypto.symbol.toUpperCase()}</span></td>
                    <td className="name">{crypto.name}</td>
                    <td className="right">¥{crypto.current_price.toLocaleString()}</td>
                    <td className="right"><PriceChange value={crypto.price_change_24h} size="sm" /></td>
                    <td className="right">
                      <span className={`change-badge ${crypto.price_change_percentage_24h >= 0 ? 'up' : 'down'}`}>
                        {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="right volume">¥{(crypto.total_volume / 1e9).toFixed(1)}B</td>
                    <td className="right" style={{ color: 'var(--text-secondary)' }}>
                      ¥{(crypto.market_cap / 1e12).toFixed(2)}T
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'indicators' && (
          <div className="card-body">
            {/* Summary gauge */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24, padding: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{buyCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>買いシグナル</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(RSI &lt; 30)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{neutralCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>中立</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(30 &lt; RSI &lt; 70)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{sellCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>売りシグナル</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(RSI &gt; 70)</div>
              </div>
            </div>

            <div className="indicator-grid">
              {cryptoIndicators.map(crypto => (
                <div key={crypto.id} className="indicator-item">
                  <div>
                    <div className="ind-name">{crypto.symbol.toUpperCase()}</div>
                    <div className="ind-value">RSI: {crypto.rsi.toFixed(1)}</div>
                  </div>
                  <span className={`signal-badge ${crypto.signal}`}>
                    {crypto.signal === 'buy' ? '買い' : crypto.signal === 'sell' ? '売り' : '中立'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="card-body">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              時価総額上位5銘柄
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marketCapData} layout="vertical">
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `¥${v.toFixed(1)}T`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={60}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`¥${(value as number).toFixed(2)}T`, '時価総額']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {marketCapData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Heatmap grid */}
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '24px 0 16px', color: 'var(--text-primary)' }}>
              暗号資産ヒートマップ
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {cryptos.map(crypto => {
                const intensity = Math.min(Math.abs(crypto.price_change_percentage_24h) / 5, 1);
                const bgColor = crypto.price_change_percentage_24h >= 0
                  ? `rgba(16, 185, 129, ${intensity * 0.6 + 0.1})`
                  : `rgba(239, 68, 68, ${intensity * 0.6 + 0.1})`;
                return (
                  <div
                    key={crypto.id}
                    style={{
                      background: bgColor,
                      borderRadius: 6,
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{crypto.symbol.toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{crypto.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
