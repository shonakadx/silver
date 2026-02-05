import { useMarketStore } from '../../store/useMarketStore';
import { PriceChange } from '../common/PriceChange';
import { MiniChart } from '../common/MiniChart';
import { sectorPerformance } from '../../data/mockData';

interface MarketOverviewProps {
  onNavigate: (page: string) => void;
}

export function MarketOverview({ onNavigate }: MarketOverviewProps) {
  const { indices, stocks, setSelectedSymbol } = useMarketStore();

  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">マーケット概況</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            最終更新: {new Date().toLocaleTimeString('ja-JP')}
          </span>
        </div>
      </div>

      {/* Market Indices */}
      <div className="grid-5" style={{ marginBottom: 16 }}>
        {indices.map(idx => (
          <div key={idx.symbol} className="index-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="index-name">{idx.name}</div>
                <div className="index-symbol">{idx.symbol}</div>
              </div>
              <MiniChart data={idx.sparkline} width={60} height={24} />
            </div>
            <div className="index-value">{idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="index-change">
              <PriceChange value={idx.change} percent={idx.changePercent} size="sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Top Gainers */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--green)' }}>▲ 値上がり上位</span>
          </div>
          <table className="stock-table">
            <thead>
              <tr>
                <th>銘柄</th>
                <th className="right">株価</th>
                <th className="right">前日比</th>
                <th className="right">騰落率</th>
              </tr>
            </thead>
            <tbody>
              {topGainers.map(s => (
                <tr key={s.symbol} onClick={() => { setSelectedSymbol(s.symbol); onNavigate('chart'); }}>
                  <td>
                    <span className="symbol">{s.symbol}</span>
                    <span className="name" style={{ marginLeft: 8 }}>{s.nameJa}</span>
                  </td>
                  <td className="right">{s.price.toLocaleString()}</td>
                  <td className="right"><PriceChange value={s.change} size="sm" /></td>
                  <td className="right"><span className="change-badge up">+{s.changePercent.toFixed(2)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Losers */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--red)' }}>▼ 値下がり上位</span>
          </div>
          <table className="stock-table">
            <thead>
              <tr>
                <th>銘柄</th>
                <th className="right">株価</th>
                <th className="right">前日比</th>
                <th className="right">騰落率</th>
              </tr>
            </thead>
            <tbody>
              {topLosers.map(s => (
                <tr key={s.symbol} onClick={() => { setSelectedSymbol(s.symbol); onNavigate('chart'); }}>
                  <td>
                    <span className="symbol">{s.symbol}</span>
                    <span className="name" style={{ marginLeft: 8 }}>{s.nameJa}</span>
                  </td>
                  <td className="right">{s.price.toLocaleString()}</td>
                  <td className="right"><PriceChange value={s.change} size="sm" /></td>
                  <td className="right"><span className="change-badge down">{s.changePercent.toFixed(2)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        {/* Sector Performance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">セクター別パフォーマンス</span>
          </div>
          <div className="card-body">
            {sectorPerformance.map(sector => {
              const barWidth = Math.min(Math.abs(sector.change) * 20, 50);
              return (
                <div key={sector.name} className="sector-bar-container">
                  <span className="sector-name">{sector.name}</span>
                  <div className="sector-bar-wrapper">
                    <div className="center-line" />
                    <div
                      className={`sector-bar ${sector.change >= 0 ? 'positive' : 'negative'}`}
                      style={{
                        width: `${barWidth}%`,
                        ...(sector.change < 0
                          ? { right: '50%', left: 'auto' }
                          : { left: '50%', right: 'auto' }),
                      }}
                    />
                  </div>
                  <span className={`sector-change ${sector.change >= 0 ? 'price-up' : 'price-down'}`}>
                    {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Stocks Quick View */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">全銘柄一覧</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
              {stocks.length} 銘柄
            </span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>コード</th>
                  <th>銘柄名</th>
                  <th className="right">株価</th>
                  <th className="right">前日比</th>
                  <th className="right">出来高</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.symbol} onClick={() => { setSelectedSymbol(s.symbol); onNavigate('chart'); }}>
                    <td><span className="symbol">{s.symbol}</span></td>
                    <td className="name">{s.nameJa}</td>
                    <td className="right">{s.price.toLocaleString()}</td>
                    <td className="right"><PriceChange value={s.change} percent={s.changePercent} size="sm" /></td>
                    <td className="right volume">{(s.volume / 1000).toFixed(0)}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
