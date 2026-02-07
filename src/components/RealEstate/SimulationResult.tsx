import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import type { SimulationResult } from '../../types/realEstate';
import type { RealEstateProperty } from '../../types/realEstate';

interface SimulationResultProps {
  result: SimulationResult;
  property: RealEstateProperty;
}

type ChartView = 'breakeven' | 'cashflow' | 'loan';

function yen(v: number): string {
  if (Math.abs(v) >= 100000000) {
    return (v / 100000000).toFixed(2) + '億';
  }
  if (Math.abs(v) >= 10000) {
    return (v / 10000).toFixed(0) + '万';
  }
  return v.toLocaleString();
}

function yenFull(v: number): string {
  return v.toLocaleString() + ' 円';
}

const chartColors = {
  breakeven: '#f59e0b',
  purchasePrice: '#3b82f6',
  cashflow: '#10b981',
  cashflowNeg: '#ef4444',
  cumCashflow: '#8b5cf6',
  loan: '#ef4444',
  principal: '#3b82f6',
  interest: '#f59e0b',
  profit: '#10b981',
};

export function SimulationResultView({ result, property }: SimulationResultProps) {
  const [chartView, setChartView] = useState<ChartView>('breakeven');
  const [showYears, setShowYears] = useState(Math.min(result.annualData.length, 35));

  const displayData = result.annualData.slice(0, showYears);
  const purchasePrice = property.property.purchasePrice;

  // 損益分岐点が購入価格を下回る年を見つける
  const breakEvenYear = displayData.find((d) => d.breakEvenPrice <= purchasePrice)?.year;

  function renderSummaryCards() {
    const current = displayData[0];
    const year5 = displayData[4];
    const year10 = displayData[9];

    return (
      <div className="re-summary-grid">
        <div className="re-summary-card">
          <div className="re-summary-label">表面利回り</div>
          <div className="re-summary-value">{result.grossYield.toFixed(2)}%</div>
        </div>
        <div className="re-summary-card">
          <div className="re-summary-label">実質利回り</div>
          <div className="re-summary-value">{result.netYield.toFixed(2)}%</div>
        </div>
        <div className="re-summary-card">
          <div className="re-summary-label">月々返済額</div>
          <div className="re-summary-value">{yen(result.monthlyPayment)}円</div>
        </div>
        <div className="re-summary-card">
          <div className="re-summary-label">頭金</div>
          <div className="re-summary-value">{yen(result.downPayment)}円</div>
        </div>
        <div className="re-summary-card">
          <div className="re-summary-label">諸費用合計</div>
          <div className="re-summary-value">{yen(result.totalInitialCosts)}円</div>
        </div>
        <div className="re-summary-card">
          <div className="re-summary-label">初期投資額</div>
          <div className="re-summary-value">{yen(result.downPayment + result.totalInitialCosts)}円</div>
        </div>
        <div className="re-summary-card highlight">
          <div className="re-summary-label">現在の損益分岐点</div>
          <div className="re-summary-value">{yen(current?.breakEvenPrice ?? 0)}円</div>
          <div className="re-summary-sub">購入価格: {yen(purchasePrice)}円</div>
        </div>
        {breakEvenYear && (
          <div className="re-summary-card highlight-green">
            <div className="re-summary-label">黒字転換年</div>
            <div className="re-summary-value">{breakEvenYear}年目</div>
            <div className="re-summary-sub">損益分岐点が購入価格を下回る</div>
          </div>
        )}
        {year5 && (
          <div className="re-summary-card">
            <div className="re-summary-label">5年目 売却時手残り</div>
            <div className="re-summary-value">{yen(year5.netProceeds)}円</div>
            <div className={`re-summary-sub ${year5.estimatedProfit >= 0 ? 'price-up' : 'price-down'}`}>
              総合損益: {year5.estimatedProfit >= 0 ? '+' : ''}{yen(year5.estimatedProfit)}円
            </div>
          </div>
        )}
        {year10 && (
          <div className="re-summary-card">
            <div className="re-summary-label">10年目 売却時手残り</div>
            <div className="re-summary-value">{yen(year10.netProceeds)}円</div>
            <div className={`re-summary-sub ${year10.estimatedProfit >= 0 ? 'price-up' : 'price-down'}`}>
              総合損益: {year10.estimatedProfit >= 0 ? '+' : ''}{yen(year10.estimatedProfit)}円
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderChart() {
    switch (chartView) {
      case 'breakeven':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} tickFormatter={(v) => `${v}年`} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} tickFormatter={(v) => yen(v)} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => `${v}年目`}
                formatter={(v?: number, name?: string) => [yenFull(v ?? 0), name ?? '']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={purchasePrice} stroke={chartColors.purchasePrice} strokeDasharray="5 5" label={{ value: '購入価格', fill: chartColors.purchasePrice, fontSize: 11 }} />
              <Area type="monotone" dataKey="breakEvenPrice" name="損益分岐点価格" stroke={chartColors.breakeven} fill={chartColors.breakeven} fillOpacity={0.15} strokeWidth={2} />
              <Line type="monotone" dataKey="estimatedProfit" name="売却損益（購入価格ベース）" stroke={chartColors.profit} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'cashflow':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} tickFormatter={(v) => `${v}年`} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} tickFormatter={(v) => yen(v)} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => `${v}年目`}
                formatter={(v?: number, name?: string) => [yenFull(v ?? 0), name ?? '']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="var(--text-muted)" />
              <Bar dataKey="netCashFlow" name="年間キャッシュフロー" fill={chartColors.cashflow} />
              <Line type="monotone" dataKey="cumulativeCashFlow" name="累計キャッシュフロー" stroke={chartColors.cumCashflow} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'loan':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} tickFormatter={(v) => `${v}年`} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} tickFormatter={(v) => yen(v)} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => `${v}年目`}
                formatter={(v?: number, name?: string) => [yenFull(v ?? 0), name ?? '']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="remainingLoan" name="ローン残高" stroke={chartColors.loan} fill={chartColors.loan} fillOpacity={0.1} strokeWidth={2} />
              <Bar dataKey="principalPayment" name="元金返済" stackId="payment" fill={chartColors.principal} />
              <Bar dataKey="interestPayment" name="利息" stackId="payment" fill={chartColors.interest} />
            </ComposedChart>
          </ResponsiveContainer>
        );
    }
  }

  function renderTable() {
    return (
      <div className="re-table-wrapper">
        <table className="re-table">
          <thead>
            <tr>
              <th>年</th>
              <th className="right">家賃収入</th>
              <th className="right">ローン返済</th>
              <th className="right">（元金）</th>
              <th className="right">（利息）</th>
              <th className="right">年間経費</th>
              <th className="right">CF</th>
              <th className="right">累計CF</th>
              <th className="right">ローン残高</th>
              <th className="right">損益分岐点</th>
              <th className="right">売却費用</th>
              <th className="right">手残り</th>
              <th className="right">総合損益</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td className="right">{yen(row.rentalIncome)}</td>
                <td className="right">{yen(row.loanPayment)}</td>
                <td className="right dim">{yen(row.principalPayment)}</td>
                <td className="right dim">{yen(row.interestPayment)}</td>
                <td className="right">{yen(row.annualExpenses)}</td>
                <td className={`right ${row.netCashFlow >= 0 ? 'price-up' : 'price-down'}`}>
                  {yen(row.netCashFlow)}
                </td>
                <td className={`right ${row.cumulativeCashFlow >= 0 ? 'price-up' : 'price-down'}`}>
                  {yen(row.cumulativeCashFlow)}
                </td>
                <td className="right">{yen(row.remainingLoan)}</td>
                <td className="right mono">{yen(row.breakEvenPrice)}</td>
                <td className="right dim">{yen(row.sellingCostsAmount)}</td>
                <td className="right" style={{ fontWeight: 600 }}>{yen(row.netProceeds)}</td>
                <td className={`right ${row.estimatedProfit >= 0 ? 'price-up' : 'price-down'}`}>
                  {row.estimatedProfit >= 0 ? '+' : ''}
                  {yen(row.estimatedProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="re-simulation">
      {renderSummaryCards()}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">シミュレーションチャート</div>
          <div className="chart-controls">
            <button
              className={`chart-btn ${chartView === 'breakeven' ? 'active' : ''}`}
              onClick={() => setChartView('breakeven')}
            >
              損益分岐点
            </button>
            <button
              className={`chart-btn ${chartView === 'cashflow' ? 'active' : ''}`}
              onClick={() => setChartView('cashflow')}
            >
              キャッシュフロー
            </button>
            <button
              className={`chart-btn ${chartView === 'loan' ? 'active' : ''}`}
              onClick={() => setChartView('loan')}
            >
              ローン返済
            </button>
            <span style={{ width: 1, height: 20, background: 'var(--border-primary)', margin: '0 4px' }} />
            <select
              className="re-input"
              style={{ width: 100, padding: '4px 8px', fontSize: 11 }}
              value={showYears}
              onChange={(e) => setShowYears(Number(e.target.value))}
            >
              <option value={10}>10年</option>
              <option value={15}>15年</option>
              <option value={20}>20年</option>
              <option value={25}>25年</option>
              <option value={30}>30年</option>
              <option value={35}>35年</option>
            </select>
          </div>
        </div>
        <div className="card-body">{renderChart()}</div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">年次シミュレーション詳細</div>
        </div>
        {renderTable()}
      </div>
    </div>
  );
}
