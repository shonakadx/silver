import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { fetchAllStockQuotes, fetchStockChart, StockQuote, INDICES, StockChartData } from '../../services/stockService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

interface AnalysisViewProps {
  onNavigate: (page: string, symbol?: string) => void;
}

type ScreenerSortField = 'changePercent' | 'volume' | 'price';
type ActiveTab = 'screener' | 'technical' | 'sector' | 'correlation';

// テクニカル指標の計算
function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < period; i++) {
    const idx = changes.length - period + i;
    if (changes[idx] > 0) {
      gains.push(changes[idx]);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(changes[idx]));
    }
  }

  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateMomentum(prices: number[], period: number = 10): number | null {
  if (prices.length < period + 1) return null;
  const current = prices[prices.length - 1];
  const past = prices[prices.length - 1 - period];
  return ((current - past) / past) * 100;
}

// セクター情報
const SECTOR_INFO: Record<string, { name: string; color: string }> = {
  semiconductor: { name: '半導体', color: '#8b5cf6' },
  tech: { name: 'テクノロジー', color: '#3b82f6' },
  innovation: { name: 'イノベーション', color: '#10b981' },
  ai: { name: 'AI', color: '#06b6d4' },
  robotics: { name: 'ロボティクス', color: '#f59e0b' },
  cleanenergy: { name: 'クリーンエネ', color: '#22c55e' },
  biotech: { name: 'バイオテック', color: '#ec4899' },
  space: { name: '宇宙', color: '#6366f1' },
  resources: { name: '資源', color: '#f97316' },
};

interface ETFWithIndicators extends StockQuote {
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
  momentum: number | null;
  trend: 'up' | 'down' | 'neutral';
  signal: 'buy' | 'sell' | 'neutral';
  category: string;
}

export function AnalysisView({ onNavigate }: AnalysisViewProps) {
  const [etfs, setEtfs] = useState<StockQuote[]>([]);
  const [etfIndicators, setEtfIndicators] = useState<ETFWithIndicators[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<ScreenerSortField>('changePercent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<ActiveTab>('screener');
  const [chartDataMap, setChartDataMap] = useState<Map<string, StockChartData>>(new Map());

  // ETFデータを取得
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAllStockQuotes();
        setEtfs(data);
        console.log('[Analysis] Loaded', data.length, 'ETFs');
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

  // テクニカル指標を計算（チャートデータが必要）
  useEffect(() => {
    async function loadIndicators() {
      if (etfs.length === 0) return;

      const newChartMap = new Map<string, StockChartData>();
      const indicators: ETFWithIndicators[] = [];

      // 各ETFの90日チャートを取得してテクニカル指標を計算
      for (const etf of etfs) {
        try {
          const chartData = await fetchStockChart(etf.symbol, 90);
          newChartMap.set(etf.symbol, chartData);

          const prices = chartData.prices;
          const indexInfo = INDICES.find(i => i.symbol === etf.symbol);
          const category = indexInfo?.category || 'other';

          const rsi = calculateRSI(prices, 14);
          const sma20 = calculateSMA(prices, 20);
          const sma50 = calculateSMA(prices, 50);
          const momentum = calculateMomentum(prices, 10);
          const currentPrice = prices[prices.length - 1];

          // トレンド判定
          let trend: 'up' | 'down' | 'neutral' = 'neutral';
          if (sma20 && sma50) {
            if (currentPrice > sma20 && sma20 > sma50) trend = 'up';
            else if (currentPrice < sma20 && sma20 < sma50) trend = 'down';
          }

          // シグナル判定
          let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
          if (rsi !== null) {
            if (rsi < 30 && trend !== 'down') signal = 'buy';
            else if (rsi > 70 && trend !== 'up') signal = 'sell';
          }

          indicators.push({
            ...etf,
            rsi,
            sma20,
            sma50,
            momentum,
            trend,
            signal,
            category,
          });
        } catch (err) {
          console.warn('[Analysis] Failed to load chart for', etf.symbol);
          indicators.push({
            ...etf,
            rsi: null,
            sma20: null,
            sma50: null,
            momentum: null,
            trend: 'neutral',
            signal: 'neutral',
            category: INDICES.find(i => i.symbol === etf.symbol)?.category || 'other',
          });
        }
      }

      setChartDataMap(newChartMap);
      setEtfIndicators(indicators);
    }

    loadIndicators();
  }, [etfs]);

  const sorted = [...etfs].sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sortField) {
      case 'changePercent':
        aVal = a.changePercent;
        bVal = b.changePercent;
        break;
      case 'volume':
        aVal = a.volume;
        bVal = b.volume;
        break;
      case 'price':
        aVal = a.price;
        bVal = b.price;
        break;
      default:
        aVal = a.changePercent;
        bVal = b.changePercent;
    }
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // セクター別パフォーマンス
  const sectorPerformance = Object.entries(SECTOR_INFO).map(([key, info]) => {
    const sectorETFs = etfIndicators.filter(e => e.category === key);
    const avgChange = sectorETFs.length > 0
      ? sectorETFs.reduce((sum, e) => sum + e.changePercent, 0) / sectorETFs.length
      : 0;
    return {
      sector: key,
      name: info.name,
      avgChange,
      etfCount: sectorETFs.length,
      color: info.color,
    };
  }).filter(s => s.etfCount > 0).sort((a, b) => b.avgChange - a.avgChange);

  // シグナル集計
  const buyCount = etfIndicators.filter(e => e.signal === 'buy').length;
  const sellCount = etfIndicators.filter(e => e.signal === 'sell').length;
  const neutralCount = etfIndicators.filter(e => e.signal === 'neutral').length;

  if (isLoading && etfs.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">分析ツール</h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>ETFデータを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error && etfs.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">分析ツール</h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--red)', marginBottom: 16 }}>⚠ {error}</div>
          <button onClick={() => window.location.reload()} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ETF分析ツール</h1>
        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
          {etfs.length} ETFs
        </span>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'screener' ? 'active' : ''}`} onClick={() => setActiveTab('screener')}>
            スクリーナー
          </button>
          <button className={`tab ${activeTab === 'technical' ? 'active' : ''}`} onClick={() => setActiveTab('technical')}>
            テクニカル分析
          </button>
          <button className={`tab ${activeTab === 'sector' ? 'active' : ''}`} onClick={() => setActiveTab('sector')}>
            セクター分析
          </button>
          <button className={`tab ${activeTab === 'correlation' ? 'active' : ''}`} onClick={() => setActiveTab('correlation')}>
            モメンタム
          </button>
        </div>

        {activeTab === 'screener' && (
          <div>
            <div style={{ padding: 16 }}>
              <div className="screener-controls">
                <select className="screener-select" value={sortField} onChange={e => setSortField(e.target.value as ScreenerSortField)}>
                  <option value="changePercent">騰落率</option>
                  <option value="volume">出来高</option>
                  <option value="price">価格</option>
                </select>
                <select className="screener-select" value={sortDir} onChange={e => setSortDir(e.target.value as 'asc' | 'desc')}>
                  <option value="desc">降順</option>
                  <option value="asc">昇順</option>
                </select>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                  {sorted.length} 件
                </span>
              </div>
            </div>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>シンボル</th>
                  <th>銘柄名</th>
                  <th>カテゴリ</th>
                  <th className="right">価格 (USD)</th>
                  <th className="right">変動</th>
                  <th className="right">騰落率</th>
                  <th className="right">出来高</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(etf => {
                  const indexInfo = INDICES.find(i => i.symbol === etf.symbol);
                  const sectorInfo = indexInfo ? SECTOR_INFO[indexInfo.category] : null;
                  return (
                    <tr key={etf.symbol} onClick={() => onNavigate('chart', etf.symbol)} style={{ cursor: 'pointer' }}>
                      <td><span className="symbol">{etf.symbol}</span></td>
                      <td className="name">{etf.name}</td>
                      <td>
                        {sectorInfo && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${sectorInfo.color}20`, color: sectorInfo.color }}>
                            {sectorInfo.name}
                          </span>
                        )}
                      </td>
                      <td className="right">${etf.price.toFixed(2)}</td>
                      <td className="right"><PriceChange value={etf.change} size="sm" /></td>
                      <td className="right">
                        <span className={`change-badge ${etf.changePercent >= 0 ? 'up' : 'down'}`}>
                          {etf.changePercent >= 0 ? '+' : ''}{etf.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="right volume">{(etf.volume / 1e6).toFixed(1)}M</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="card-body">
            {/* Signal Summary */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24, padding: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{buyCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>買いシグナル</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(RSI &lt; 30 + 上昇トレンド)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{neutralCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>中立</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(30 &lt; RSI &lt; 70)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{sellCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>売りシグナル</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(RSI &gt; 70 + 下降トレンド)</div>
              </div>
            </div>

            {/* Indicator Grid */}
            <div className="indicator-grid">
              {etfIndicators.map(etf => (
                <div key={etf.symbol} className="indicator-item" onClick={() => onNavigate('chart', etf.symbol)} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="ind-name">{etf.symbol}</div>
                    <div className="ind-value">
                      RSI: {etf.rsi !== null ? etf.rsi.toFixed(1) : 'N/A'}
                      <span style={{ marginLeft: 8, fontSize: 10, color: etf.trend === 'up' ? 'var(--green)' : etf.trend === 'down' ? 'var(--red)' : 'var(--text-tertiary)' }}>
                        {etf.trend === 'up' ? '↑' : etf.trend === 'down' ? '↓' : '→'}
                      </span>
                    </div>
                    {etf.momentum !== null && (
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                        Momentum: {etf.momentum >= 0 ? '+' : ''}{etf.momentum.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <span className={`signal-badge ${etf.signal}`}>
                    {etf.signal === 'buy' ? '買い' : etf.signal === 'sell' ? '売り' : '中立'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sector' && (
          <div className="card-body">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              セクター別パフォーマンス（本日）
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorPerformance} layout="vertical">
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 6, fontSize: 12 }}
                  formatter={(value) => [`${(value as number) >= 0 ? '+' : ''}${(value as number).toFixed(2)}%`, '平均騰落率']}
                />
                <Bar dataKey="avgChange" radius={[0, 4, 4, 0]}>
                  {sectorPerformance.map((entry, idx) => (
                    <Cell key={idx} fill={entry.avgChange >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Sector ETF Grid */}
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '24px 0 16px', color: 'var(--text-primary)' }}>
              セクター別ヒートマップ
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
              {etfIndicators.map(etf => {
                const intensity = Math.min(Math.abs(etf.changePercent) / 3, 1);
                const bgColor = etf.changePercent >= 0
                  ? `rgba(16, 185, 129, ${intensity * 0.6 + 0.1})`
                  : `rgba(239, 68, 68, ${intensity * 0.6 + 0.1})`;
                const sectorInfo = SECTOR_INFO[etf.category];
                return (
                  <div
                    key={etf.symbol}
                    onClick={() => onNavigate('chart', etf.symbol)}
                    style={{ background: bgColor, borderRadius: 6, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s' }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{etf.symbol}</div>
                    <div style={{ fontSize: 9, color: sectorInfo?.color || 'var(--text-tertiary)', marginTop: 2 }}>
                      {sectorInfo?.name || 'その他'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                      {etf.changePercent >= 0 ? '+' : ''}{etf.changePercent.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'correlation' && (
          <div className="card-body">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              10日モメンタムランキング
            </h3>
            <div style={{ marginBottom: 24 }}>
              {etfIndicators
                .filter(e => e.momentum !== null)
                .sort((a, b) => (b.momentum || 0) - (a.momentum || 0))
                .map((etf, idx) => {
                  const barWidth = Math.min(Math.abs(etf.momentum || 0) * 5, 100);
                  const isPositive = (etf.momentum || 0) >= 0;
                  return (
                    <div
                      key={etf.symbol}
                      onClick={() => onNavigate('chart', etf.symbol)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-primary)', cursor: 'pointer' }}
                    >
                      <span style={{ width: 24, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'right' }}>{idx + 1}</span>
                      <span style={{ width: 60, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{etf.symbol}</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: `${barWidth}%`,
                          height: 8,
                          background: isPositive ? 'var(--green)' : 'var(--red)',
                          borderRadius: 4,
                          marginLeft: isPositive ? 0 : 'auto',
                        }} />
                      </div>
                      <span style={{
                        width: 60,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        fontWeight: 500,
                        textAlign: 'right',
                        color: isPositive ? 'var(--green)' : 'var(--red)',
                      }}>
                        {isPositive ? '+' : ''}{(etf.momentum || 0).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Trend Summary */}
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              トレンドサマリー
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                  {etfIndicators.filter(e => e.trend === 'up').length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>上昇トレンド</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>価格 &gt; SMA20 &gt; SMA50</div>
              </div>
              <div style={{ background: 'rgba(100, 116, 139, 0.1)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {etfIndicators.filter(e => e.trend === 'neutral').length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>レンジ相場</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>トレンドなし</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                  {etfIndicators.filter(e => e.trend === 'down').length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>下降トレンド</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>価格 &lt; SMA20 &lt; SMA50</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
