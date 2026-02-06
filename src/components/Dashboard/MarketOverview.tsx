import { useState, useEffect } from 'react';
import { PriceChange } from '../common/PriceChange';
import { MiniChart } from '../common/MiniChart';
import { fetchCryptoPrices, CryptoPrice } from '../../services/cryptoService';
import { fetchNews } from '../../services/newsService';
import { NewsItem } from '../../types/market';

interface MarketOverviewProps {
  onNavigate: (page: string) => void;
}

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

export function MarketOverview({ onNavigate }: MarketOverviewProps) {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [cryptoData, newsData] = await Promise.all([
          fetchCryptoPrices(),
          fetchNews().catch(() => []),
        ]);
        setCryptos(cryptoData);
        setNews(newsData);
        setLastUpdated(new Date());
        console.log('[MarketOverview] Loaded', cryptoData.length, 'cryptos,', newsData.length, 'news');
      } catch (err) {
        console.error('[MarketOverview] Error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // 60秒ごとに更新
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // カテゴリ別ニュース
  const innovationNews = news.filter(n => n.category === 'innovation').slice(0, 4);
  const semiconductorNews = news.filter(n => n.category === 'semiconductor').slice(0, 4);
  const researchNews = news.filter(n => n.category === 'research').slice(0, 4);
  const companyNews = news.filter(n => n.category === 'company').slice(0, 4);

  if (isLoading && cryptos.length === 0) {
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

  if (error && cryptos.length === 0) {
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

      {/* 暗号資産カード（BTC, ETH, XRP） */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        {cryptos.map(crypto => (
          <div key={crypto.id} className="index-card">
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

      {/* 半導体・SOX / Gartner・調査 */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <NewsSection
          title="半導体・SOX指数"
          icon="💎"
          color="var(--purple)"
          news={semiconductorNews}
          onNavigate={onNavigate}
        />
        <NewsSection
          title="Gartner・調査レポート"
          icon="📊"
          color="var(--orange)"
          news={researchNews}
          onNavigate={onNavigate}
        />
      </div>

      {/* イノベーション / 企業ニュース */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <NewsSection
          title="イノベーション・テック"
          icon="🚀"
          color="var(--blue)"
          news={innovationNews}
          onNavigate={onNavigate}
        />
        <NewsSection
          title="企業・ビジネス"
          icon="🏢"
          color="var(--green)"
          news={companyNews}
          onNavigate={onNavigate}
        />
      </div>

      {/* 指標情報カード */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📈 主要指標・オルタナティブデータ</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>SOX指数</div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>フィラデルフィア半導体</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>NVIDIA, AMD, Intel, TSMC等</div>
            </div>
            <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>イノベーション指数</div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>ARK Innovation ETF</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>破壊的イノベーション企業</div>
            </div>
            <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Gartner</div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>ハイプサイクル</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>テクノロジー成熟度曲線</div>
            </div>
            <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>オルタナティブ</div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>センチメント分析</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>ソーシャル・検索トレンド</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
