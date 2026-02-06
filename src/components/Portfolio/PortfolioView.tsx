import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { fetchCryptoPrices, CryptoPrice } from '../../services/cryptoService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PortfolioViewProps {
  onNavigate: (page: string) => void;
}

interface Holding {
  id: string;
  shares: number;
  avgCost: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
const PORTFOLIO_KEY = 'crypto_portfolio';

// ローカルストレージからポートフォリオを読み込み
function loadPortfolio(): Holding[] {
  try {
    const saved = localStorage.getItem(PORTFOLIO_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    // 初期ポートフォリオ（デモ用）
    return [
      { id: 'bitcoin', shares: 0.5, avgCost: 6000000 },
      { id: 'ethereum', shares: 5, avgCost: 280000 },
      { id: 'solana', shares: 50, avgCost: 15000 },
      { id: 'ripple', shares: 10000, avgCost: 80 },
    ];
  } catch {
    return [];
  }
}

function savePortfolio(holdings: Holding[]) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings));
}

export function PortfolioView({ onNavigate }: PortfolioViewProps) {
  const [holdings, setHoldings] = useState<Holding[]>(loadPortfolio);
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addCrypto, setAddCrypto] = useState('');
  const [addShares, setAddShares] = useState('');
  const [addCost, setAddCost] = useState('');
  void onNavigate;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCryptoPrices();
        setCryptos(data);
        console.log('[Portfolio] Loaded', data.length, 'cryptos');
      } catch (err) {
        console.error('[Portfolio] Error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // 保有銘柄の詳細を計算
  const holdingsWithDetails = holdings.map(h => {
    const crypto = cryptos.find(c => c.id === h.id);
    if (!crypto) return null;

    const totalValue = h.shares * crypto.current_price;
    const totalCost = h.shares * h.avgCost;
    const pnl = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    return {
      ...h,
      name: crypto.name,
      symbol: crypto.symbol,
      currentPrice: crypto.current_price,
      totalValue,
      totalCost,
      pnl,
      pnlPercent,
      dayChange: crypto.price_change_24h * h.shares,
      dayChangePercent: crypto.price_change_percentage_24h,
    };
  }).filter(Boolean) as Array<Holding & {
    name: string;
    symbol: string;
    currentPrice: number;
    totalValue: number;
    totalCost: number;
    pnl: number;
    pnlPercent: number;
    dayChange: number;
    dayChangePercent: number;
  }>;

  // サマリー計算
  const totalValue = holdingsWithDetails.reduce((sum, h) => sum + h.totalValue, 0);
  const totalCost = holdingsWithDetails.reduce((sum, h) => sum + h.totalCost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const dayChange = holdingsWithDetails.reduce((sum, h) => sum + h.dayChange, 0);
  const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

  // 各保有銘柄の配分を計算
  const holdingsWithAllocation = holdingsWithDetails.map(h => ({
    ...h,
    allocation: totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0,
  }));

  const pieData = holdingsWithAllocation.map(h => ({
    name: h.name,
    value: h.totalValue,
    symbol: h.symbol,
  }));

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `¥${(val / 10000).toFixed(0)}万`;
    return `¥${val.toLocaleString()}`;
  };

  const handleAddHolding = () => {
    if (!addCrypto || !addShares || !addCost) return;

    const newHolding: Holding = {
      id: addCrypto,
      shares: parseFloat(addShares),
      avgCost: parseFloat(addCost),
    };

    const newHoldings = [...holdings, newHolding];
    setHoldings(newHoldings);
    savePortfolio(newHoldings);
    setShowAdd(false);
    setAddCrypto('');
    setAddShares('');
    setAddCost('');
  };

  const removeHolding = (id: string) => {
    const newHoldings = holdings.filter(h => h.id !== id);
    setHoldings(newHoldings);
    savePortfolio(newHoldings);
  };

  const availableCryptos = cryptos.filter(c => !holdings.find(h => h.id === c.id));

  if (isLoading && cryptos.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">ポートフォリオ</h1>
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
          <h1 className="page-title">ポートフォリオ</h1>
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
        <h1 className="page-title">ポートフォリオ</h1>
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
            <span className="card-title">保有銘柄を追加</span>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              value={addCrypto}
              onChange={e => setAddCrypto(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 12,
              }}
            >
              <option value="">銘柄を選択</option>
              {availableCryptos.map(c => (
                <option key={c.id} value={c.id}>{c.symbol.toUpperCase()} - {c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="数量"
              value={addShares}
              onChange={e => setAddShares(e.target.value)}
              style={{
                width: 100,
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 12,
              }}
            />
            <input
              type="number"
              placeholder="平均取得単価 (JPY)"
              value={addCost}
              onChange={e => setAddCost(e.target.value)}
              style={{
                width: 180,
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 12,
              }}
            />
            <button className="btn btn-primary" onClick={handleAddHolding}>追加</button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="portfolio-summary">
        <div className="summary-item">
          <div className="label">評価額合計</div>
          <div className="value">{formatCurrency(totalValue)}</div>
          <div className="sub-value">
            <PriceChange value={dayChange} percent={dayChangePercent} size="sm" />
            <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>24h</span>
          </div>
        </div>
        <div className="summary-item">
          <div className="label">損益合計</div>
          <div className="value" style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
          </div>
          <div className="sub-value" style={{ color: totalPnlPercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
          </div>
        </div>
        <div className="summary-item">
          <div className="label">投資元本</div>
          <div className="value">{formatCurrency(totalCost)}</div>
        </div>
      </div>

      {holdingsWithAllocation.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          保有銘柄がありません。「+ 銘柄追加」ボタンから追加してください。
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Holdings Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">保有銘柄</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                {holdingsWithAllocation.length} 銘柄
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {holdingsWithAllocation.map(h => (
                  <tr key={h.id}>
                    <td>
                      <span className="symbol">{h.symbol.toUpperCase()}</span>
                      <span className="name" style={{ marginLeft: 8 }}>{h.name}</span>
                    </td>
                    <td className="right">{h.shares.toLocaleString()}</td>
                    <td className="right">¥{h.avgCost.toLocaleString()}</td>
                    <td className="right">¥{h.currentPrice.toLocaleString()}</td>
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
                    <td style={{ width: 40 }}>
                      <button
                        className="watchlist-remove"
                        style={{ opacity: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHolding(h.id);
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
                      {((item.value / totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
