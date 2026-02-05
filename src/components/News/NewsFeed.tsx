import { useState, useEffect } from 'react';
import { newsItems as mockNewsItems } from '../../data/mockData';
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
  const [newsItems, setNewsItems] = useState<NewsItem[]>(mockNewsItems);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);
  void onNavigate;

  useEffect(() => {
    async function loadNews() {
      setIsLoading(true);
      try {
        const realNews = await fetchNews();
        if (realNews.length > 0) {
          setNewsItems(realNews);
          setIsRealData(true);
          console.log('[NewsFeed] Loaded real news:', realNews.length);
        } else {
          console.log('[NewsFeed] Using mock data');
          setIsRealData(false);
        }
      } catch (error) {
        console.error('[NewsFeed] Error loading news:', error);
        setIsRealData(false);
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
        <span
          style={{
            marginLeft: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            background: isLoading
              ? 'rgba(245, 158, 11, 0.1)'
              : isRealData
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            color: isLoading ? '#f59e0b' : isRealData ? '#10b981' : '#ef4444',
          }}
        >
          {isLoading ? '読込中...' : isRealData ? 'リアルタイム' : 'サンプル'}
        </span>
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
        ) : (
          <div>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                このカテゴリのニュースはありません
              </div>
            ) : (
              filtered.map((news: NewsItem) => (
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
                  <div className="news-summary">{news.summary}</div>
                  {news.symbols && news.symbols.length > 0 && (
                    <div className="news-symbols">
                      {news.symbols.map(s => (
                        <span key={s} className="news-symbol-tag">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
