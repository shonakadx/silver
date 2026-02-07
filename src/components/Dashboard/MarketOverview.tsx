import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { MiniChart } from '../common/MiniChart';
import { fetchCryptoPrices, CryptoPrice } from '../../services/cryptoService';
import { fetchAllStockQuotes, fetchStockChart, getAllCachedCharts, StockQuote, StockChartData, INDICES } from '../../services/stockService';
import { fetchNews } from '../../services/newsService';
import { fetchEarningsData, EarningsData, getEarningsByCategory, getUpcomingEarnings } from '../../services/earningsService';
import { NewsItem } from '../../types/market';
import { Calendar, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

interface MarketOverviewProps {
  onNavigate: (page: string, symbol?: string) => void;
}

// ETFカテゴリの定義
const ETF_CATEGORIES = [
  { id: 'semiconductor', name: '半導体・テクノロジー', icon: '💎', color: 'var(--purple)' },
  { id: 'innovation', name: 'AI・イノベーション', icon: '🤖', color: 'var(--blue)' },
  { id: 'cleanenergy', name: 'クリーンエネルギー', icon: '🌱', color: 'var(--green)' },
  { id: 'biotech', name: 'バイオテック', icon: '🧬', color: 'var(--pink)' },
  { id: 'space', name: '宇宙開発', icon: '🚀', color: 'var(--cyan)' },
  { id: 'resources', name: '資源・コモディティ', icon: '⛏️', color: 'var(--orange)' },
];

// ニュースカテゴリの定義
const NEWS_CATEGORIES = [
  { id: 'genai', name: '生成AI・LLM', icon: '🧠', color: 'var(--blue)' },
  { id: 'semiconductor', name: '半導体・SOX', icon: '💎', color: 'var(--purple)' },
  { id: 'hackernews', name: 'Hacker News', icon: '🔥', color: 'var(--orange)' },
  { id: 'arxiv', name: 'ArXiv論文', icon: '📄', color: 'var(--cyan)' },
  { id: 'cleanenergy', name: '脱炭素・エネルギー', icon: '🌱', color: 'var(--green)' },
  { id: 'biotech', name: '精密医療・バイオ', icon: '🧬', color: 'var(--pink)' },
  { id: 'robotics', name: 'ロボティクス', icon: '🤖', color: 'var(--text-secondary)' },
  { id: 'space', name: '宇宙開発', icon: '🚀', color: 'var(--yellow)' },
  { id: 'resources', name: '資源・コモディティ', icon: '⛏️', color: 'var(--text-tertiary)' },
  { id: 'research', name: 'Gartner・調査', icon: '📊', color: 'var(--text-secondary)' },
];

// ニュースセクションコンポーネント
function NewsSection({
  title,
  icon,
  color,
  categoryId,
  news,
  onNavigate
}: {
  title: string;
  icon: string;
  color: string;
  categoryId: string;
  news: NewsItem[];
  onNavigate: (page: string, category?: string) => void;
}) {
  if (news.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title" style={{ color }}>{icon} {title}</span>
        <button className="btn btn-ghost" onClick={() => onNavigate('news', categoryId)}>すべて見る</button>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        {news.map((item, idx) => (
          <div
            key={item.id || idx}
            style={{
              padding: '10px 0',
              borderBottom: idx < news.length - 1 ? '1px solid var(--border-primary)' : 'none',
            }}
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                display: 'block',
                marginBottom: 4,
                lineHeight: 1.4,
              }}
            >
              {item.title}
            </a>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>
              <span>{item.source}</span>
              <span>{new Date(item.timestamp).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ETFセクションコンポーネント
function ETFSection({
  category,
  stocks,
  charts,
  onNavigate
}: {
  category: typeof ETF_CATEGORIES[0];
  stocks: StockQuote[];
  charts: Map<string, StockChartData>;
  onNavigate: (page: string, symbol?: string) => void;
}) {
  const categoryStocks = stocks.filter(s => {
    const idx = INDICES.find(i => i.symbol === s.symbol);
    return idx?.category === category.id ||
           (category.id === 'innovation' && (idx?.category === 'ai' || idx?.category === 'robotics' || idx?.category === 'innovation'));
  });

  if (categoryStocks.length === 0) {
    // フォールバック: INDICESから該当カテゴリのETFを表示（スケルトン）
    const fallbackIndices = INDICES.filter(i =>
      i.category === category.id ||
      (category.id === 'innovation' && (i.category === 'ai' || i.category === 'robotics' || i.category === 'innovation'))
    );
    if (fallbackIndices.length === 0) return null;

    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ color: category.color }}>{category.icon} {category.name}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>読み込み中...</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, padding: 16 }}>
          {fallbackIndices.map(idx => (
            <div
              key={idx.symbol}
              className="index-card"
              style={{ cursor: 'pointer', opacity: 0.7 }}
              onClick={() => onNavigate('chart', idx.symbol)}
            >
              <div className="index-symbol" style={{ color: category.color, fontWeight: 600 }}>{idx.symbol}</div>
              <div className="index-name" style={{ fontSize: 11, marginTop: 2 }}>{idx.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{idx.description}</div>
              <div style={{ marginTop: 8, height: 40, background: 'var(--bg-tertiary)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title" style={{ color: category.color }}>{category.icon} {category.name}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>3ヶ月</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, padding: 16 }}>
        {categoryStocks.map(stock => {
          const indexInfo = INDICES.find(i => i.symbol === stock.symbol);
          const chartData = charts.get(stock.symbol);
          const isPositive = stock.changePercent >= 0;
          return (
            <div
              key={stock.symbol}
              className="index-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onNavigate('chart', stock.symbol)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="index-symbol" style={{ color: category.color, fontWeight: 600 }}>{stock.symbol}</div>
                  <div className="index-name" style={{ fontSize: 10, marginTop: 2, color: 'var(--text-muted)' }}>{stock.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    ${stock.price > 0 ? stock.price.toFixed(2) : '--'}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    {stock.price > 0 ? (
                      <PriceChange value={stock.change} percent={stock.changePercent} size="sm" />
                    ) : null}
                  </div>
                </div>
              </div>
              {/* 3ヶ月チャート */}
              <div style={{ marginTop: 8, height: 40 }}>
                {chartData && chartData.prices.length > 0 ? (
                  <MiniChart
                    data={chartData.prices}
                    width={160}
                    height={40}
                    color={isPositive ? 'var(--green)' : 'var(--red)'}
                  />
                ) : (
                  <div style={{
                    height: 40,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'var(--text-muted)'
                  }}>
                    チャート読み込み中...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 決算セクションコンポーネント
function EarningsSection({
  title,
  icon,
  color,
  earnings,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  earnings: EarningsData[];
}) {
  if (earnings.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const formatRevenue = (revenue: number | null) => {
    if (revenue === null) return '--';
    if (revenue >= 100) return `$${(revenue / 10).toFixed(0)}B`;
    return `$${revenue.toFixed(1)}B`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title" style={{ color, display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          {title}
        </span>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        {earnings.map((item, idx) => (
          <div
            key={item.symbol}
            style={{
              padding: '12px 0',
              borderBottom: idx < earnings.length - 1 ? '1px solid var(--border-primary)' : 'none',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                  {item.symbol}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {item.companyName}
                </span>
                {item.status === 'upcoming' ? (
                  <Clock size={14} style={{ color: 'var(--yellow)' }} />
                ) : (
                  <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
                )}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-tertiary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} />
                  {formatDate(item.reportDate)}
                </span>
                <span>{item.fiscalQuarter}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>EPS: </span>
                {item.status === 'reported' && item.actualEPS !== null ? (
                  <span style={{
                    color: item.surprise !== null && item.surprise > 0 ? 'var(--green)' :
                           item.surprise !== null && item.surprise < 0 ? 'var(--red)' : 'var(--text-primary)',
                    fontWeight: 500
                  }}>
                    ${item.actualEPS.toFixed(2)}
                    {item.surprise !== null && (
                      <span style={{ fontSize: 10, marginLeft: 4 }}>
                        {item.surprise > 0 ? '+' : ''}{item.surprise.toFixed(1)}%
                      </span>
                    )}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    予想 ${item.estimatedEPS?.toFixed(2) || '--'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                売上: {item.status === 'reported' && item.actualRevenue
                  ? formatRevenue(item.actualRevenue)
                  : `予想 ${formatRevenue(item.estimatedRevenue)}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 今後の決算カレンダーコンポーネント
function UpcomingEarningsCalendar({ earnings }: { earnings: EarningsData[] }) {
  const upcoming = getUpcomingEarnings(earnings).slice(0, 8);

  if (upcoming.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      semiconductor: 'var(--purple)',
      innovation: 'var(--blue)',
      cleanenergy: 'var(--green)',
      biotech: 'var(--pink)',
      space: 'var(--cyan)',
      resources: 'var(--orange)',
    };
    return colors[category] || 'var(--text-secondary)';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
          決算発表カレンダー
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: 16 }}>
        {upcoming.map((item) => (
          <div
            key={item.symbol}
            style={{
              padding: 12,
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
              borderLeft: `3px solid ${getCategoryColor(item.category)}`,
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
              {formatDate(item.reportDate)}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              {item.symbol}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {item.companyName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
              予想EPS: ${item.estimatedEPS?.toFixed(2) || '--'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketOverview({ onNavigate }: MarketOverviewProps) {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [charts, setCharts] = useState<Map<string, StockChartData>>(new Map());
  const [news, setNews] = useState<NewsItem[]>([]);
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // 即座にキャッシュからチャートを読み込み（API呼び出しなし）
    const cachedCharts = getAllCachedCharts(90);
    if (cachedCharts.size > 0) {
      setCharts(cachedCharts);
      console.log('[MarketOverview] Loaded', cachedCharts.size, 'charts from cache');
    }

    // 決算データは即座に読み込み（ローカルデータ）
    fetchEarningsData().then(setEarnings).catch(() => {});

    async function loadData() {
      setIsLoading(true);
      setError(null);

      // 段階的読み込み - 各データが取得でき次第表示
      fetchCryptoPrices()
        .then(data => {
          setCryptos(data);
          setLastUpdated(new Date());
        })
        .catch(err => console.error('[MarketOverview] Crypto error:', err));

      fetchAllStockQuotes()
        .then(data => {
          setStocks(data);
          setLastUpdated(new Date());
          // 株価取得後、バックグラウンドでチャートデータを更新
          loadChartData(data.map(s => s.symbol));
        })
        .catch(err => console.error('[MarketOverview] Stock error:', err));

      fetchNews()
        .then(data => {
          setNews(data);
        })
        .catch(err => console.error('[MarketOverview] News error:', err));

      // 初期ローディングは500msで解除（キャッシュがあるので早く）
      setTimeout(() => setIsLoading(false), 500);
    }

    // 3ヶ月チャートデータをバックグラウンドで取得・更新
    async function loadChartData(symbols: string[]) {
      const chartMap = new Map(charts); // 既存のキャッシュを保持
      // 並列で取得（8銘柄ずつに増やして高速化）
      for (let i = 0; i < symbols.length; i += 8) {
        const batch = symbols.slice(i, i + 8);
        const results = await Promise.allSettled(
          batch.map(symbol => fetchStockChart(symbol, 90))
        );
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value.prices.length > 0) {
            chartMap.set(batch[idx], result.value);
          }
        });
        // 段階的に更新
        setCharts(new Map(chartMap));
      }
    }

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // カテゴリ別ニュース
  const getNewsByCategory = (categoryId: string) => {
    return news.filter(n => n.category === categoryId).slice(0, 3);
  };


  if (error && cryptos.length === 0 && stocks.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">ダッシュボード</h1>
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
        <h1 className="page-title">投資分析ダッシュボード</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isLoading ? (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                background: 'rgba(251, 191, 36, 0.1)',
                color: '#fbbf24',
              }}
            >
              ● 読み込み中...
            </span>
          ) : (
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
          )}
          {lastUpdated && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
              最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
            </span>
          )}
        </div>
      </div>

      {/* テーマ別ETFセクション（3ヶ月チャート付き） */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        {ETF_CATEGORIES.map(category => (
          <ETFSection key={category.id} category={category} stocks={stocks} charts={charts} onNavigate={onNavigate} />
        ))}
      </div>

      {/* 企業決算セクション */}
      {earnings.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} strokeWidth={1.5} />
            企業決算情報
          </h2>

          {/* 決算カレンダー */}
          <div style={{ marginBottom: 16 }}>
            <UpcomingEarningsCalendar earnings={earnings} />
          </div>

          {/* 業種別決算 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
            <EarningsSection
              title="半導体・テクノロジー"
              icon={<TrendingUp size={16} strokeWidth={1.5} />}
              color="var(--purple)"
              earnings={getEarningsByCategory(earnings, 'semiconductor')}
            />
            <EarningsSection
              title="AI・イノベーション"
              icon={<TrendingUp size={16} strokeWidth={1.5} />}
              color="var(--blue)"
              earnings={getEarningsByCategory(earnings, 'innovation')}
            />
            <EarningsSection
              title="クリーンエネルギー"
              icon={<TrendingUp size={16} strokeWidth={1.5} />}
              color="var(--green)"
              earnings={getEarningsByCategory(earnings, 'cleanenergy')}
            />
            <EarningsSection
              title="バイオテック"
              icon={<TrendingUp size={16} strokeWidth={1.5} />}
              color="var(--pink)"
              earnings={getEarningsByCategory(earnings, 'biotech')}
            />
            <EarningsSection
              title="宇宙開発"
              icon={<TrendingUp size={16} strokeWidth={1.5} />}
              color="var(--cyan)"
              earnings={getEarningsByCategory(earnings, 'space')}
            />
            <EarningsSection
              title="資源・コモディティ"
              icon={<TrendingUp size={16} strokeWidth={1.5} />}
              color="var(--orange)"
              earnings={getEarningsByCategory(earnings, 'resources')}
            />
          </div>
        </>
      )}

      {/* 暗号資産カード（BTC, ETH, XRP） */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">💰 暗号資産</span>
        </div>
        <div className="grid-3" style={{ padding: 16 }}>
          {cryptos.map(crypto => (
            <div key={crypto.id} className="index-card" onClick={() => onNavigate('chart', crypto.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="index-name">{crypto.name}</div>
                  <div className="index-symbol">{crypto.symbol.toUpperCase()}</div>
                </div>
                {crypto.sparkline_in_7d && (
                  <MiniChart data={crypto.sparkline_in_7d.price.slice(-24)} width={60} height={24} />
                )}
              </div>
              <div className="index-value">
                ¥{crypto.current_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="index-change">
                <PriceChange value={crypto.price_change_24h} percent={crypto.price_change_percentage_24h} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* テーマ別ニュースセクション */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
        📰 テーマ別ニュース
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        {NEWS_CATEGORIES.slice(0, 4).map(category => (
          <NewsSection
            key={category.id}
            title={category.name}
            icon={category.icon}
            color={category.color}
            categoryId={category.id}
            news={getNewsByCategory(category.id)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {NEWS_CATEGORIES.slice(4).map(category => (
          <NewsSection
            key={category.id}
            title={category.name}
            icon={category.icon}
            color={category.color}
            categoryId={category.id}
            news={getNewsByCategory(category.id)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
