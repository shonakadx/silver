import { useEffect, useRef, useState } from 'react';
import { PriceChange } from '../common/PriceChange';
import { fetchCryptoPrices, fetchCryptoChart, CryptoPrice } from '../../services/cryptoService';
import { fetchAllStockQuotes, fetchStockChart, StockQuote, INDICES } from '../../services/stockService';

type ChartType = 'candlestick' | 'line';
type Period = '1D' | '7D' | '30D' | '90D' | '1Y';
type AssetType = 'crypto' | 'stock';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  sma20: boolean;
  sma50: boolean;
  bollingerBands: boolean;
}

const periodToDays: Record<Period, number> = {
  '1D': 1,
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '1Y': 365,
};

// テクニカル指標の計算
function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): { upper: (number | null)[], middle: (number | null)[], lower: (number | null)[] } {
  const sma = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i]!;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { upper, middle: sma, lower };
}

function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
    } else {
      const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  return result;
}

interface StockChartProps {
  initialSymbol?: string | null;
}

export function StockChart({ initialSymbol }: StockChartProps) {
  // 初期シンボルから資産タイプを判定
  const initialAssetType: AssetType = initialSymbol && ['bitcoin', 'ethereum', 'ripple'].includes(initialSymbol) ? 'crypto' : 'stock';

  const [assetType, setAssetType] = useState<AssetType>(initialAssetType);
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>(initialSymbol || 'SOXX');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartPeriod, setChartPeriod] = useState<Period>('1Y');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const rsiCanvasRef = useRef<HTMLCanvasElement>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [hoveredData, setHoveredData] = useState<{ idx: number; x: number; y: number } | null>(null);
  const [userSwitchedAssetType, setUserSwitchedAssetType] = useState(false);
  const [indicators, setIndicators] = useState<TechnicalIndicators>({
    sma20: true,
    sma50: false,
    bollingerBands: false,
  });
  const [showRSI, setShowRSI] = useState(false);

  const crypto = cryptos.find(c => c.id === selectedAsset);
  const stock = stocks.find(s => s.symbol === selectedAsset);
  const currentAsset = assetType === 'crypto' ? crypto : stock;

  // initialSymbol変更時に更新
  useEffect(() => {
    if (initialSymbol) {
      const isCrypto = ['bitcoin', 'ethereum', 'ripple'].includes(initialSymbol);
      setUserSwitchedAssetType(false); // ダッシュボードからの遷移なのでフラグをリセット
      setAssetType(isCrypto ? 'crypto' : 'stock');
      setSelectedAsset(initialSymbol);
    }
  }, [initialSymbol]);

  // 資産リストを取得
  useEffect(() => {
    async function loadAssets() {
      try {
        const [cryptoData, stockData] = await Promise.all([
          fetchCryptoPrices(),
          fetchAllStockQuotes(),
        ]);
        setCryptos(cryptoData);
        setStocks(stockData);
      } catch (err) {
        console.error('[Chart] Failed to load assets:', err);
      }
    }
    loadAssets();
  }, []);

  // 資産タイプ変更時（ユーザーがタブを切り替えた時のみ）
  // initialSymbolがある場合は上書きしない
  useEffect(() => {
    if (!userSwitchedAssetType) return;

    if (assetType === 'crypto' && cryptos.length > 0) {
      setSelectedAsset(cryptos[0].id);
    } else if (assetType === 'stock') {
      setSelectedAsset('SOXX');
    }
  }, [assetType, cryptos, userSwitchedAssetType]);

  // チャートデータを取得
  useEffect(() => {
    async function loadChart() {
      if (!selectedAsset) return;

      setIsLoading(true);
      setError(null);

      try {
        if (assetType === 'crypto') {
          const days = periodToDays[chartPeriod];
          const data = await fetchCryptoChart(selectedAsset, days);

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
        } else {
          // 株式チャート（選択された期間で取得）
          const days = periodToDays[chartPeriod];
          const data = await fetchStockChart(selectedAsset, days);

          if (data.dates.length > 0) {
            // 日次の価格変動からOHLCを計算
            const chartPoints: ChartData[] = data.dates.map((date, i) => {
              const price = data.prices[i];
              const prevPrice = i > 0 ? data.prices[i - 1] : price;
              // 実際の価格変動に基づいてOHLCを推定
              const change = Math.abs(price - prevPrice);
              const volatility = Math.max(change, price * 0.005); // 最低0.5%のボラティリティ
              return {
                time: new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
                open: prevPrice,
                high: Math.max(price, prevPrice) + volatility * 0.5,
                low: Math.min(price, prevPrice) - volatility * 0.5,
                close: price,
                volume: data.volumes[i],
              };
            });
            setChartData(chartPoints);
          } else {
            // データがない場合は空
            setChartData([]);
            setError('チャートデータを取得できませんでした');
          }
        }
      } catch (err) {
        console.error('[Chart] Failed to load chart:', err);
        setError(err instanceof Error ? err.message : 'チャートの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadChart();
  }, [selectedAsset, chartPeriod, assetType, stock]);

  useEffect(() => {
    if (chartData.length > 0) {
      drawChart();
      drawVolume();
      if (showRSI) {
        drawRSI();
      }
    }
  }, [chartData, chartType, hoveredData, indicators, showRSI]);

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
      const priceLabel = assetType === 'crypto'
        ? '¥' + price.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : '$' + price.toFixed(2);
      ctx.fillText(priceLabel, w - 4, y + 3);
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
      ctx.strokeStyle = assetType === 'stock' ? '#8b5cf6' : '#3b82f6';
      ctx.lineWidth = 1.5;
      chartData.forEach((d, i) => {
        const x = toX(i);
        const y = toY(d.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const color = assetType === 'stock' ? '139, 92, 246' : '59, 130, 246';
      const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      gradient.addColorStop(0, `rgba(${color}, 0.15)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.lineTo(toX(chartData.length - 1), h - padding.bottom);
      ctx.lineTo(toX(0), h - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // テクニカル指標を描画
    const closePrices = chartData.map(d => d.close);

    // SMA 20
    if (indicators.sma20) {
      const sma20 = calculateSMA(closePrices, 20);
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b'; // オレンジ
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      sma20.forEach((val, i) => {
        if (val !== null) {
          const x = toX(i);
          const y = toY(val);
          if (i === 0 || sma20[i - 1] === null) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // SMA 50
    if (indicators.sma50) {
      const sma50 = calculateSMA(closePrices, 50);
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4'; // シアン
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      sma50.forEach((val, i) => {
        if (val !== null) {
          const x = toX(i);
          const y = toY(val);
          if (i === 0 || sma50[i - 1] === null) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // ボリンジャーバンド
    if (indicators.bollingerBands) {
      const bb = calculateBollingerBands(closePrices, 20, 2);

      // 上バンド
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)'; // 紫
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      bb.upper.forEach((val, i) => {
        if (val !== null) {
          const x = toX(i);
          const y = toY(val);
          if (i === 0 || bb.upper[i - 1] === null) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // 下バンド
      ctx.beginPath();
      bb.lower.forEach((val, i) => {
        if (val !== null) {
          const x = toX(i);
          const y = toY(val);
          if (i === 0 || bb.lower[i - 1] === null) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // バンド間を塗りつぶし
      ctx.beginPath();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
      let started = false;
      bb.upper.forEach((val, i) => {
        if (val !== null) {
          const x = toX(i);
          const y = toY(val);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
      });
      for (let i = bb.lower.length - 1; i >= 0; i--) {
        if (bb.lower[i] !== null) {
          ctx.lineTo(toX(i), toY(bb.lower[i]!));
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.setLineDash([]);
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

  function drawRSI() {
    const canvas = rsiCanvasRef.current;
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
    const padding = { top: 10, right: 80, bottom: 10, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    // RSI計算
    const closePrices = chartData.map(d => d.close);
    const rsiData = calculateRSI(closePrices, 14);

    const toX = (i: number) => padding.left + (i / (chartData.length - 1)) * chartW;
    const toY = (val: number) => padding.top + (1 - val / 100) * chartH;

    // 背景グリッド
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;

    // 30と70のライン（過売り/過買いゾーン）
    [30, 50, 70].forEach(level => {
      const y = toY(level);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(level.toString(), w - 4, y + 3);
    });

    // 過買い/過売りゾーンの色分け
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)'; // 過買い（赤）
    ctx.fillRect(padding.left, padding.top, chartW, toY(70) - padding.top);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.05)'; // 過売り（緑）
    ctx.fillRect(padding.left, toY(30), chartW, h - padding.bottom - toY(30));

    // RSIライン描画
    ctx.beginPath();
    ctx.strokeStyle = '#eab308'; // 黄色
    ctx.lineWidth = 1.5;

    rsiData.forEach((val, i) => {
      if (val !== null) {
        const x = toX(i);
        const y = toY(val);
        if (i === 0 || rsiData[i - 1] === null) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 最新RSI値を表示
    const latestRSI = rsiData.filter(v => v !== null).pop();
    if (latestRSI !== undefined && latestRSI !== null) {
      const lastIdx = rsiData.length - 1;
      const x = toX(lastIdx);
      const y = toY(latestRSI);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = latestRSI > 70 ? '#ef4444' : latestRSI < 30 ? '#10b981' : '#eab308';
      ctx.fill();

      // 値ラベル
      ctx.fillStyle = latestRSI > 70 ? '#ef4444' : latestRSI < 30 ? '#10b981' : '#eab308';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(`RSI: ${latestRSI.toFixed(1)}`, x + 8, y + 4);
    }

    // ラベル
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RSI (14)', padding.left + 4, padding.top + 12);
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

  const currencySymbol = assetType === 'crypto' ? '¥' : '$';

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 className="page-title">
            {currentAsset ? (
              <>
                <span style={{ color: assetType === 'stock' ? 'var(--purple)' : 'var(--blue)', fontFamily: 'var(--font-mono)' }}>
                  {assetType === 'crypto' ? (currentAsset as CryptoPrice).symbol.toUpperCase() : (currentAsset as StockQuote).symbol}
                </span>
                {' '}
                {assetType === 'crypto' ? (currentAsset as CryptoPrice).name : (currentAsset as StockQuote).name}
              </>
            ) : 'チャート'}
          </h1>
          {currentAsset && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700 }}>
                {currencySymbol}{assetType === 'crypto'
                  ? (currentAsset as CryptoPrice).current_price.toLocaleString()
                  : (currentAsset as StockQuote).price.toFixed(2)}
              </span>
              <PriceChange
                value={assetType === 'crypto' ? (currentAsset as CryptoPrice).price_change_24h : (currentAsset as StockQuote).change}
                percent={assetType === 'crypto' ? (currentAsset as CryptoPrice).price_change_percentage_24h : (currentAsset as StockQuote).changePercent}
                showBadge
              />
            </div>
          )}
        </div>
        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          ● LIVE
        </span>
      </div>

      {/* Asset Type Tabs */}
      <div className="tabs" style={{ marginBottom: 12 }}>
        <button
          className={`tab ${assetType === 'stock' ? 'active' : ''}`}
          onClick={() => {
            setUserSwitchedAssetType(true);
            setAssetType('stock');
          }}
        >
          📈 テーマ別ETF
        </button>
        <button
          className={`tab ${assetType === 'crypto' ? 'active' : ''}`}
          onClick={() => {
            setUserSwitchedAssetType(true);
            setAssetType('crypto');
          }}
        >
          💰 暗号資産
        </button>
      </div>

      {/* Asset Selector */}
      <div style={{ marginBottom: 12 }}>
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            padding: '8px 12px',
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          {assetType === 'crypto' ? (
            cryptos.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
            ))
          ) : (
            INDICES.map(idx => (
              <option key={idx.symbol} value={idx.symbol}>{idx.symbol} - {idx.name} ({idx.description})</option>
            ))
          )}
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

      {/* Technical Indicators */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 8, alignSelf: 'center' }}>指標:</span>
        <button
          className={`chart-btn ${indicators.sma20 ? 'active' : ''}`}
          onClick={() => setIndicators(prev => ({ ...prev, sma20: !prev.sma20 }))}
          style={{ fontSize: 11, padding: '4px 8px' }}
        >
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginRight: 4 }} />
          SMA 20
        </button>
        <button
          className={`chart-btn ${indicators.sma50 ? 'active' : ''}`}
          onClick={() => setIndicators(prev => ({ ...prev, sma50: !prev.sma50 }))}
          style={{ fontSize: 11, padding: '4px 8px' }}
        >
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', marginRight: 4 }} />
          SMA 50
        </button>
        <button
          className={`chart-btn ${indicators.bollingerBands ? 'active' : ''}`}
          onClick={() => setIndicators(prev => ({ ...prev, bollingerBands: !prev.bollingerBands }))}
          style={{ fontSize: 11, padding: '4px 8px' }}
        >
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#a855f7', marginRight: 4 }} />
          BB
        </button>
        <button
          className={`chart-btn ${showRSI ? 'active' : ''}`}
          onClick={() => setShowRSI(!showRSI)}
          style={{ fontSize: 11, padding: '4px 8px' }}
        >
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#eab308', marginRight: 4 }} />
          RSI
        </button>
      </div>

      {/* OHLCV display */}
      {hovered && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <span style={{ color: 'var(--text-tertiary)' }}>日付: <span style={{ color: 'var(--text-secondary)' }}>{hovered.time}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>始値: <span style={{ color: 'var(--text-primary)' }}>{currencySymbol}{hovered.open.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>高値: <span style={{ color: 'var(--green)' }}>{currencySymbol}{hovered.high.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>安値: <span style={{ color: 'var(--red)' }}>{currencySymbol}{hovered.low.toLocaleString()}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }}>終値: <span style={{ color: 'var(--text-primary)' }}>{currencySymbol}{hovered.close.toLocaleString()}</span></span>
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
      <div className="card" style={{ marginBottom: showRSI ? 4 : 16 }}>
        <canvas ref={volumeCanvasRef} style={{ width: '100%', height: 80, display: 'block' }} />
      </div>

      {/* RSI Chart */}
      {showRSI && (
        <div className="card" style={{ marginBottom: 16 }}>
          <canvas ref={rsiCanvasRef} style={{ width: '100%', height: 100, display: 'block' }} />
        </div>
      )}

      {/* Asset Info */}
      {currentAsset && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">銘柄情報</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {assetType === 'crypto' && crypto ? (
                [
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
                ))
              ) : stock ? (
                [
                  { label: '現在値', value: '$' + stock.price.toFixed(2) },
                  { label: '高値', value: '$' + stock.high.toFixed(2) },
                  { label: '安値', value: '$' + stock.low.toFixed(2) },
                  { label: '出来高', value: (stock.volume / 1e6).toFixed(1) + 'M' },
                  { label: '変動', value: (stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%' },
                  { label: '説明', value: INDICES.find(i => i.symbol === stock.symbol)?.description || '' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
