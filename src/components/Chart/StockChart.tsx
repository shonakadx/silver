import { useEffect, useRef, useState } from 'react';
import { useMarketStore } from '../../store/useMarketStore';
import { PriceChange } from '../common/PriceChange';
import { technicalIndicators } from '../../data/mockData';

type ChartType = 'candlestick' | 'line';

export function StockChart() {
  const { selectedSymbol, stocks, chartData, chartPeriod, setChartPeriod } = useMarketStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [hoveredData, setHoveredData] = useState<{ idx: number; x: number; y: number } | null>(null);

  const stock = stocks.find(s => s.symbol === selectedSymbol);
  const periods: Array<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y'> = ['1D', '1W', '1M', '3M', '6M', '1Y'];

  useEffect(() => {
    drawChart();
    drawVolume();
  }, [chartData, chartType, hoveredData]);

  function drawChart() {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 60, bottom: 20, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const prices = chartData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const toX = (i: number) => padding.left + (i / (chartData.length - 1)) * chartW;
    const toY = (price: number) => padding.top + (1 - (price - minPrice) / priceRange) * chartH;

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (i / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      const price = maxPrice - (i / gridLines) * priceRange;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(price.toLocaleString(undefined, { maximumFractionDigits: 1 }), w - 4, y + 3);
    }

    if (chartType === 'candlestick') {
      const candleWidth = Math.max(2, (chartW / chartData.length) * 0.6);

      chartData.forEach((d, i) => {
        const x = toX(i);
        const openY = toY(d.open);
        const closeY = toY(d.close);
        const highY = toY(d.high);
        const lowY = toY(d.low);
        const isUp = d.close >= d.open;

        // Wick
        ctx.strokeStyle = isUp ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        ctx.fillStyle = isUp ? '#10b981' : '#ef4444';
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(Math.abs(closeY - openY), 1);
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyH);
      });
    } else {
      // Line chart
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      chartData.forEach((d, i) => {
        const x = toX(i);
        const y = toY(d.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Area fill
      const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.lineTo(toX(chartData.length - 1), h - padding.bottom);
      ctx.lineTo(toX(0), h - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Crosshair
    if (hoveredData && hoveredData.idx >= 0 && hoveredData.idx < chartData.length) {
      const d = chartData[hoveredData.idx];
      const x = toX(hoveredData.idx);
      const y = toY(d.close);

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.5;

      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Price label
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(w - padding.right, y - 8, padding.right, 16);
      ctx.fillStyle = '#fff';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(d.close.toLocaleString(), w - 4, y + 3);

      // Date label
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - 35, h - padding.bottom, 70, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(d.time, x, h - padding.bottom + 11);
    }
  }

  function drawVolume() {
    const canvas = volumeCanvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { left: 10, right: 60 };
    const chartW = w - padding.left - padding.right;

    ctx.clearRect(0, 0, w, h);

    const maxVol = Math.max(...chartData.map(d => d.volume));
    const barW = Math.max(2, (chartW / chartData.length) * 0.6);

    chartData.forEach((d, i) => {
      const x = padding.left + (i / (chartData.length - 1)) * chartW;
      const barH = (d.volume / maxVol) * (h - 4);
      const isUp = d.close >= d.open;

      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      ctx.fillRect(x - barW / 2, h - barH, barW, barH);
    });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 10, right: 60 };
    const chartW = rect.width - padding.left - padding.right;
    const idx = Math.round(((x - padding.left) / chartW) * (chartData.length - 1));

    if (idx >= 0 && idx < chartData.length) {
      setHoveredData({ idx, x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  const hovered = hoveredData && hoveredData.idx >= 0 && hoveredData.idx < chartData.length
    ? chartData[hoveredData.idx]
    : null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 className="page-title">
            {stock ? (
              <>
                <span style={{ color: 'var(--blue)', fontFamily: 'var(--font-mono)' }}>{stock.symbol}</span>
                {' '}
                {stock.nameJa}
              </>
            ) : 'チャート'}
          </h1>
          {stock && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700 }}>
                {stock.price.toLocaleString()}
              </span>
              <PriceChange value={stock.change} percent={stock.changePercent} showBadge />
            </div>
          )}
        </div>
      </div>

      {/* Chart Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="chart-controls">
          {periods.map(p => (
            <button
              key={p}
              className={`chart-btn ${chartPeriod === p ? 'active' : ''}`}
              onClick={() => setChartPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="chart-controls">
          <button
            className={`chart-btn ${chartType === 'candlestick' ? 'active' : ''}`}
            onClick={() => setChartType('candlestick')}
          >
            ローソク足
          </button>
          <button
            className={`chart-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            ライン
          </button>
        </div>
      </div>

      {/* OHLCV display */}
      {hovered && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <span style={{ color: 'var(--text-tertiary)' }}>日付: <span style={{ color: 'var(--text-secondary)' }}>{hovered.time}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>始値: <span style={{ color: 'var(--text-primary)' }}>{hovered.open.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>高値: <span style={{ color: 'var(--green)' }}>{hovered.high.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>安値: <span style={{ color: 'var(--red)' }}>{hovered.low.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>終値: <span style={{ color: 'var(--text-primary)' }}>{hovered.close.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>出来高: <span style={{ color: 'var(--text-secondary)' }}>{(hovered.volume / 1000).toFixed(0)}K</span></span>
        </div>
      )}

      {/* Main Chart */}
      <div className="card" style={{ marginBottom: 4 }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 400, display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredData(null)}
        />
      </div>

      {/* Volume Chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <canvas
          ref={volumeCanvasRef}
          style={{ width: '100%', height: 80, display: 'block' }}
        />
      </div>

      {/* Stock Info & Indicators */}
      <div className="grid-2">
        {stock && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">銘柄情報</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: '始値', value: stock.open.toLocaleString() },
                  { label: '高値', value: stock.high.toLocaleString() },
                  { label: '安値', value: stock.low.toLocaleString() },
                  { label: '前日終値', value: stock.previousClose.toLocaleString() },
                  { label: '出来高', value: (stock.volume / 10000).toFixed(0) + '万株' },
                  { label: '時価総額', value: (stock.marketCap / 1000000000000).toFixed(1) + '兆円' },
                  { label: 'セクター', value: stock.sector },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-primary)' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">テクニカル指標</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              買い: {technicalIndicators.filter(i => i.signal === 'buy').length} /
              売り: {technicalIndicators.filter(i => i.signal === 'sell').length} /
              中立: {technicalIndicators.filter(i => i.signal === 'neutral').length}
            </span>
          </div>
          <div className="card-body">
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
        </div>
      </div>
    </div>
  );
}
