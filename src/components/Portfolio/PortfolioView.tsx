import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import { PriceChange } from '../common/PriceChange';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PortfolioViewProps {
  onNavigate: (page: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export function PortfolioView({ onNavigate }: PortfolioViewProps) {
  const { holdings, summary } = usePortfolioStore();
  const { setSelectedSymbol } = useMarketStore();

  const pieData = holdings.map(h => ({
    name: h.name,
    value: h.totalValue,
    symbol: h.symbol,
  }));

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `¥${(val / 10000).toFixed(0)}万`;
    return `¥${val.toLocaleString()}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ポートフォリオ</h1>
      </div>

      {/* Summary Cards */}
      <div className="portfolio-summary">
        <div className="summary-item">
          <div className="label">評価額合計</div>
          <div className="value">¥{(summary.totalValue / 10000).toFixed(0)}万</div>
          <div className="sub-value price-up">
            <PriceChange value={summary.dayChange} percent={summary.dayChangePercent} size="sm" />
            <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>本日</span>
          </div>
        </div>
        <div className="summary-item">
          <div className="label">損益合計</div>
          <div className="value" style={{ color: summary.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {summary.totalPnl >= 0 ? '+' : ''}¥{(summary.totalPnl / 10000).toFixed(0)}万
          </div>
          <div className="sub-value" style={{ color: summary.totalPnlPercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {summary.totalPnlPercent >= 0 ? '+' : ''}{summary.totalPnlPercent.toFixed(2)}%
          </div>
        </div>
        <div className="summary-item">
          <div className="label">投資元本</div>
          <div className="value">¥{(summary.totalCost / 10000).toFixed(0)}万</div>
        </div>
        <div className="summary-item">
          <div className="label">現金残高</div>
          <div className="value">¥{(summary.cashBalance / 10000).toFixed(0)}万</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Holdings Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">保有銘柄</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
              {holdings.length} 銘柄
            </span>
          </div>
          <table className="stock-table">
            <thead>
              <tr>
                <th>銘柄</th>
                <th className="right">保有数</th>
                <th className="right">平均取得</th>
                <th className="right">現在値</th>
                <th className="right">評価額</th>
                <th className="right">損益</th>
                <th className="right">損益率</th>
                <th className="right">比率</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => (
                <tr key={h.id} onClick={() => { setSelectedSymbol(h.symbol); onNavigate('chart'); }}>
                  <td>
                    <span className="symbol">{h.symbol}</span>
                    <span className="name" style={{ marginLeft: 8 }}>{h.name}</span>
                  </td>
                  <td className="right">{h.shares.toLocaleString()}</td>
                  <td className="right">{h.avgCost.toLocaleString()}</td>
                  <td className="right">{h.currentPrice.toLocaleString()}</td>
                  <td className="right">{formatCurrency(h.totalValue)}</td>
                  <td className="right">
                    <PriceChange value={h.pnl} size="sm" />
                  </td>
                  <td className="right">
                    <span className={`change-badge ${h.pnlPercent >= 0 ? 'up' : 'down'}`}>
                      {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="right">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <div className="allocation-bar" style={{ width: 60 }}>
                        <div className="allocation-fill" style={{ width: `${h.allocation}%` }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', minWidth: 35, textAlign: 'right' }}>
                        {h.allocation.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">資産配分</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  strokeWidth={2}
                  stroke="var(--bg-card)"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(value) => formatCurrency(value as number)}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 12 }}>
              {pieData.map((item, idx) => (
                <div
                  key={item.symbol}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{item.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {((item.value / summary.totalValue) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
