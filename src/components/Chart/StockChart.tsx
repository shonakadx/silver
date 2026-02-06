import { useEffect, useRef, useState } from 'react';
import { PriceChange } from '../common/PriceChange';
import { fetchCryptoPrices, fetchCryptoChart, CryptoPrice } from '../../services/cryptoService';

type ChartType = 'candlestick' | 'line';
type Period = '1D' | '7D' | '30D' | '90D' | '1Y';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const periodToDays: Record<Period, number> = {
  '1D': 1,
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '1Y': 365,
};

export function StockChart() {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('bitcoin');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartPeriod, setChartPeriod] = useState<Period>('30D');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [hoveredData, setHoveredData] = useState<{ idx: number; x: number; y: number } | null>(null);

  const crypto = cryptos.find(c => c.id === selectedCrypto);

  // 暗号資産リストを取得
  useEffect(() => {
    async function loadCryptos() {
      try {
        const data = await fetchCryptoPrices();
        setCryptos(data);
        if (data.length > 0 && !selectedCrypto) {
          setSelectedCrypto(data[0].id);
        }
      } catch (err) {
        console.error('[Chart] Failed to load cryptos:', err);
      }
    }
    loadCryptos();
  }, []);

  // チャートデータを取得
  useEffect(() => {
    async function loadChart() {
      if (!selectedCrypto) return;

      setIsLoading(true);
      setError(null);

      try {
        const days = periodToDays[chartPeriod];
        const data = await fetchCryptoChart(selectedCrypto, days);

        // 価格データをOHLCV形式に変換
        const chartPoints: ChartData[] = [];
        const interval = Math.max(1, Math.floor(data.prices.length / 100));

        for (let i = 0; i < data.prices.length; i += interval) {
          const slice = data.prices.slice(i, Math.min(i + interval, data.prices.length));
          if (slice.length === 0) continue;

          const prices = slice.map(p => p[1]);
          const time = new Date(slice[0][0]).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

          chartPoints.push({
            time,
            open: prices[0],
            high: Math.max(...prices),
            low: Math.min(...prices),
            close: prices[prices.length - 1],
            volume: data.total_volumes[Math.min(i, data.total_volumes.length - 1)]?.[1] || 0,
          });
        }

        setChartData(chartPoints);
      } catch (err) {
        console.error('[Chart] Failed to load chart:', err);
        setError(err instanceof Error ? err.message : 'チャートの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadChart();
  }, [selectedCrypto, chartPeriod]);

  useEffect(() => {
    if (chartData.length > 0) {
      drawChart();
      drawVolume();
    }
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
    const padding = { top: 20, right: 80, bottom: 20, left: 10 };
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
      ctx.fillText('¥' + price.toLocaleString(undefined, { maximumFractionDigits: 0 }), w - 4, y + 3);
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

        ctx.strokeStyle = isUp ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        ctx.fillStyle = isUp ? '#10b981' : '#ef4444';
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(Math.abs(closeY - openY), 1);
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyH);
      });
    } else {
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

      const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.lineTo(toX(chartData.length - 1), h - padding.bottom);
      ctx.lineTo(toX(0), h - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

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
    const padding = { left: 10, right: 80 };
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
    const padding = { left: 10, right: 80 };
    const chartW = rect.width - padding.left - padding.right;
    const idx = Math.round(((x - padding.left) / chartW) * (chartData.length - 1));

    if (idx >= 0 && idx < chartData.length) {
      setHoveredData({ idx, x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  const hovered = hoveredData && hoveredData.idx >= 0 && hoveredData.idx < chartData.length
    ? chartData[hoveredData.idx]
    : null;

  const periods: Period[] = ['1D', '7D', '30D', '90D', '1Y'];

  if (isLoading && chartData.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">チャート</h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error && chartData.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">チャート</h1>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 className="page-title">
            {crypto ? (
              <>
                <span style={{ color: 'var(--blue)', fontFamily: 'var(--font-mono)' }}>{crypto.symbol.toUpperCase()}</span>
                {' '}
                {crypto.name}
              </>
            ) : 'チャート'}
          </h1>
          {crypto && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700 }}>
                ¥{crypto.current_price.toLocaleString()}
              </span>
              <PriceChange value={crypto.price_change_24h} percent={crypto.price_change_percentage_24h} showBadge />
            </div>
          )}
        </div>
        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          ● LIVE (CoinGecko API)
        </span>
      </div>

      {/* Crypto Selector */}
      <div style={{ marginBottom: 12 }}>
        <select
          value={selectedCrypto}
          onChange={(e) => setSelectedCrypto(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            padding: '8px 12px',
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          {cryptos.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
          ))}
        </select>
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
          <button className={`chart-btn ${chartType === 'candlestick' ? 'active' : ''}`} onClick={() => setChartType('candlestick')}>
            ローソク足
          </button>
          <button className={`chart-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>
            ライン
          </button>
        </div>
      </div>

      {/* OHLCV display */}
      {hovered && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <span style={{ color: 'var(--text-tertiary)' }}>日付: <span style={{ color: 'var(--text-secondary)' }}>{hovered.time}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>始値: <span style={{ color: 'var(--text-primary)' }}>¥{hovered.open.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>高値: <span style={{ color: 'var(--green)' }}>¥{hovered.high.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>安値: <span style={{ color: 'var(--red)' }}>¥{hovered.low.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>終値: <span style={{ color: 'var(--text-primary)' }}>¥{hovered.close.toLocaleString()}</span></span>
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
        <canvas ref={volumeCanvasRef} style={{ width: '100%', height: 80, display: 'block' }} />
      </div>

      {/* Crypto Info */}
      {crypto && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">銘柄情報</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: '24h高値', value: '¥' + crypto.high_24h.toLocaleString() },
                { label: '24h安値', value: '¥' + crypto.low_24h.toLocaleString() },
                { label: '24h出来高', value: '¥' + (crypto.total_volume / 1e9).toFixed(1) + 'B' },
                { label: '時価総額', value: '¥' + (crypto.market_cap / 1e12).toFixed(2) + 'T' },
                { label: '24h変動', value: (crypto.price_change_percentage_24h >= 0 ? '+' : '') + crypto.price_change_percentage_24h.toFixed(2) + '%' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{item.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
