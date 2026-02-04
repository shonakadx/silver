import { useState } from 'react';
import { useMarketStore } from '../../store/useMarketStore';
import { PriceChange } from '../common/PriceChange';
import { technicalIndicators, sectorPerformance } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalysisViewProps {
  onNavigate: (page: string) => void;
}

type ScreenerSortField = 'changePercent' | 'volume' | 'marketCap' | 'price';

export function AnalysisView({ onNavigate }: AnalysisViewProps) {
  const { stocks, setSelectedSymbol } = useMarketStore();
  const [sortField, setSortField] = useState<ScreenerSortField>('changePercent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'screener' | 'indicators' | 'heatmap'>('screener');

  const sectors = ['all', ...Array.from(new Set(stocks.map(s => s.sector)))];

  const filtered = stocks
    .filter(s => sectorFilter === 'all' || s.sector === sectorFilter)
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });

  const sectorChartData = sectorPerformance.map(s => ({
    name: s.name,
    change: s.change,
    fill: s.change >= 0 ? '#10b981' : '#ef4444',
  }));

  const buyCount = technicalIndicators.filter(i => i.signal === 'buy').length;
  const sellCount = technicalIndicators.filter(i => i.signal === 'sell').length;
  const neutralCount = technicalIndicators.filter(i => i.signal === 'neutral').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">分析ツール</h1>
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
            セクター分析
          </button>
        </div>

        {activeTab === 'screener' && (
          <div>
            <div style={{ padding: 16 }}>
              <div className="screener-controls">
                <select
                  className="screener-select"
                  value={sectorFilter}
                  onChange={e => setSectorFilter(e.target.value)}
                >
                  {sectors.map(s => (
                    <option key={s} value={s}>{s === 'all' ? '全セクター' : s}</option>
                  ))}
                </select>
                <select
                  className="screener-select"
                  value={sortField}
                  onChange={e => setSortField(e.target.value as ScreenerSortField)}
                >
                  <option value="changePercent">騰落率</option>
                  <option value="volume">出来高</option>
                  <option value="marketCap">時価総額</option>
                  <option value="price">株価</option>
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
                  <th>コード</th>
                  <th>銘柄名</th>
                  <th>セクター</th>
                  <th className="right">株価</th>
                  <th className="right">前日比</th>
                  <th className="right">騰落率</th>
                  <th className="right">出来高</th>
                  <th className="right">時価総額</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.symbol} onClick={() => { setSelectedSymbol(s.symbol); onNavigate('chart'); }}>
                    <td><span className="symbol">{s.symbol}</span></td>
                    <td className="name">{s.nameJa}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 12 }}>{s.sector}</td>
                    <td className="right">{s.price.toLocaleString()}</td>
                    <td className="right"><PriceChange value={s.change} size="sm" /></td>
                    <td className="right">
                      <span className={`change-badge ${s.changePercent >= 0 ? 'up' : 'down'}`}>
                        {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="right volume">{(s.volume / 10000).toFixed(0)}万</td>
                    <td className="right" style={{ color: 'var(--text-secondary)' }}>
                      {(s.marketCap / 1000000000000).toFixed(1)}兆
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
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{neutralCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>中立</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{sellCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>売りシグナル</div>
              </div>
            </div>

            <div className="indicator-grid">
              {technicalIndicators.map(ind => (
                <div key={ind.name} className="indicator-item">
                  <div>
                    <div className="ind-name">{ind.name}</div>
                    <div className="ind-value">{ind.value.toLocaleString()}</div>
                  </div>
                  <span className={`signal-badge ${ind.signal}`}>
                    {ind.signal === 'buy' ? '買い' : ind.signal === 'sell' ? '売り' : '中立'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="card-body">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              セクター別騰落率
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorChartData} layout="vertical">
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
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
                  contentStyle={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${(value as number).toFixed(2)}%`, '騰落率']}
                />
                <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                  {sectorChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Heatmap grid */}
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '24px 0 16px', color: 'var(--text-primary)' }}>
              銘柄ヒートマップ
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {stocks.map(s => {
                const intensity = Math.min(Math.abs(s.changePercent) / 3, 1);
                const bgColor = s.changePercent >= 0
                  ? `rgba(16, 185, 129, ${intensity * 0.6 + 0.1})`
                  : `rgba(239, 68, 68, ${intensity * 0.6 + 0.1})`;
                return (
                  <div
                    key={s.symbol}
                    style={{
                      background: bgColor,
                      borderRadius: 6,
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                    onClick={() => { setSelectedSymbol(s.symbol); onNavigate('chart'); }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{s.symbol}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{s.nameJa}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                      {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
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
