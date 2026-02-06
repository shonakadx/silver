import { useState, useEffect } from 'react';
import { NewsItem } from '../../types/market';
import { fetchNews } from '../../services/newsService';

type NewsCategory = 'all' | 'market' | 'economy' | 'company' | 'crypto' | 'forex';

interface NewsFeedProps {
  onNavigate: (page: string) => void;
}

const categoryLabels: Record<string, string> = {
  all: 'すべて',
  market: 'マーケット',
  economy: '経済',
  company: '企業',
  crypto: '暗号資産',
  forex: '為替',
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000 / 60);

  if (diff < 0) return '今';
  if (diff < 60) return `${diff}分前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}時間前`;
  return `${Math.floor(diff / 1440)}日前`;
}

export function NewsFeed({ onNavigate }: NewsFeedProps) {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  void onNavigate;

  useEffect(() => {
    async function loadNews() {
      setIsLoading(true);
      setError(null);

      try {
        const news = await fetchNews();
        setNewsItems(news);
        console.log('[NewsFeed] Loaded', news.length, 'news items');
      } catch (err) {
        console.error('[NewsFeed] Error:', err);
        setError(err instanceof Error ? err.message : 'ニュースの取得に失敗しました');
        setNewsItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadNews();

    // 5分ごとに更新
    const interval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const categories: NewsCategory[] = ['all', 'market', 'economy', 'company', 'crypto', 'forex'];

  const filtered = activeCategory === 'all'
    ? newsItems
    : newsItems.filter(n => n.category === activeCategory);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">マーケットニュース</h1>
        {newsItems.length > 0 && (
          <span
            style={{
              marginLeft: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
            }}
          >
            ● LIVE ({newsItems.length}件)
          </span>
        )}
      </div>

      <div className="card">
        <div className="tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            ニュースを読み込み中...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
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
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            このカテゴリのニュースはありません
          </div>
        ) : (
          <div>
            {filtered.map((news: NewsItem) => (
              <div
                key={news.id}
                className="news-item"
                style={{ cursor: news.url ? 'pointer' : 'default' }}
                onClick={() => news.url && window.open(news.url, '_blank')}
              >
                <div className="news-meta">
                  <span className={`sentiment-dot ${news.sentiment}`} />
                  <span className="news-source">{news.source}</span>
                  <span className={`news-category ${news.category}`}>
                    {categoryLabels[news.category] || news.category}
                  </span>
                  <span className="news-time">{formatTimeAgo(news.timestamp)}</span>
                </div>
                <div className="news-title">{news.title}</div>
                {news.summary && <div className="news-summary">{news.summary}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
