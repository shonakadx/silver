import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { MiniChart } from '../common/MiniChart';
import { fetchCryptoPrices, CryptoPrice } from '../../services/cryptoService';
import { fetchAllStockQuotes, StockQuote, INDICES } from '../../services/stockService';
import { fetchNews } from '../../services/newsService';
import { NewsItem } from '../../types/market';

interface MarketOverviewProps {
  onNavigate: (page: string) => void;
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
  { id: 'cleanenergy', name: '脱炭素・エネルギー', icon: '🌱', color: 'var(--green)' },
  { id: 'biotech', name: '精密医療・バイオ', icon: '🧬', color: 'var(--pink)' },
  { id: 'robotics', name: 'ロボティクス', icon: '🤖', color: 'var(--cyan)' },
  { id: 'space', name: '宇宙開発', icon: '🚀', color: 'var(--yellow)' },
  { id: 'resources', name: '資源・コモディティ', icon: '⛏️', color: 'var(--orange)' },
  { id: 'research', name: 'Gartner・調査', icon: '📊', color: 'var(--text-secondary)' },
];

// ニュースセクションコンポーネント
function NewsSection({
  title,
  icon,
  color,
  news,
  onNavigate
}: {
  title: string;
  icon: string;
  color: string;
  news: NewsItem[];
  onNavigate: (page: string) => void;
}) {
  if (news.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title" style={{ color }}>{icon} {title}</span>
        <button className="btn btn-ghost" onClick={() => onNavigate('news')}>すべて見る</button>
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
  onNavigate
}: {
  category: typeof ETF_CATEGORIES[0];
  stocks: StockQuote[];
  onNavigate: (page: string) => void;
}) {
  const categoryStocks = stocks.filter(s => {
    const idx = INDICES.find(i => i.symbol === s.symbol);
    return idx?.category === category.id ||
           (category.id === 'innovation' && (idx?.category === 'ai' || idx?.category === 'robotics' || idx?.category === 'innovation'));
  });

  if (categoryStocks.length === 0) {
    // フォールバック: INDICESから該当カテゴリのETFを表示
    const fallbackIndices = INDICES.filter(i =>
      i.category === category.id ||
      (category.id === 'innovation' && (i.category === 'ai' || i.category === 'robotics' || i.category === 'innovation'))
    );
    if (fallbackIndices.length === 0) return null;

    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ color: category.color }}>{category.icon} {category.name}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, padding: 16 }}>
          {fallbackIndices.map(idx => (
            <div
              key={idx.symbol}
              className="index-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onNavigate('chart')}
            >
              <div className="index-symbol" style={{ color: category.color, fontWeight: 600 }}>{idx.symbol}</div>
              <div className="index-name" style={{ fontSize: 11, marginTop: 2 }}>{idx.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{idx.description}</div>
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
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, padding: 16 }}>
        {categoryStocks.map(stock => {
          const indexInfo = INDICES.find(i => i.symbol === stock.symbol);
          return (
            <div
              key={stock.symbol}
              className="index-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onNavigate('chart')}
            >
              <div className="index-symbol" style={{ color: category.color, fontWeight: 600 }}>{stock.symbol}</div>
              <div className="index-name" style={{ fontSize: 11, marginTop: 2 }}>{stock.name}</div>
              <div className="index-value" style={{ marginTop: 8 }}>
                ${stock.price > 0 ? stock.price.toFixed(2) : '--'}
              </div>
              <div className="index-change" style={{ marginTop: 4 }}>
                {stock.price > 0 ? (
                  <PriceChange value={stock.change} percent={stock.changePercent} size="sm" />
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{indexInfo?.description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketOverview({ onNavigate }: MarketOverviewProps) {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [cryptoData, stockData, newsData] = await Promise.all([
          fetchCryptoPrices(),
          fetchAllStockQuotes().catch(() => []),
          fetchNews().catch(() => []),
        ]);
        setCryptos(cryptoData);
        setStocks(stockData);
        setNews(newsData);
        setLastUpdated(new Date());
        console.log('[MarketOverview] Loaded', cryptoData.length, 'cryptos,', stockData.length, 'stocks,', newsData.length, 'news');
      } catch (err) {
        console.error('[MarketOverview] Error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
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

  if (isLoading && cryptos.length === 0 && stocks.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">ダッシュボード</h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>データを読み込み中...</div>
        </div>
      </div>
    );
  }

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
          {lastUpdated && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
              最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
            </span>
          )}
        </div>
      </div>

      {/* テーマ別ETFセクション */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        {ETF_CATEGORIES.map(category => (
          <ETFSection key={category.id} category={category} stocks={stocks} onNavigate={onNavigate} />
        ))}
      </div>

      {/* 暗号資産カード（BTC, ETH, XRP） */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">💰 暗号資産</span>
        </div>
        <div className="grid-3" style={{ padding: 16 }}>
          {cryptos.map(crypto => (
            <div key={crypto.id} className="index-card" onClick={() => onNavigate('chart')} style={{ cursor: 'pointer' }}>
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
            news={getNewsByCategory(category.id)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
