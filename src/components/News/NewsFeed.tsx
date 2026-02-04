import { useState } from 'react';
import { newsItems } from '../../data/mockData';
import { NewsItem } from '../../types/market';

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

  if (diff < 60) return `${diff}分前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}時間前`;
  return `${Math.floor(diff / 1440)}日前`;
}

export function NewsFeed({ onNavigate }: NewsFeedProps) {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
  void onNavigate;

  const categories: NewsCategory[] = ['all', 'market', 'economy', 'company', 'crypto', 'forex'];

  const filtered = activeCategory === 'all'
    ? newsItems
    : newsItems.filter(n => n.category === activeCategory);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">マーケットニュース</h1>
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

        <div>
          {filtered.map((news: NewsItem) => (
            <div key={news.id} className="news-item">
              <div className="news-meta">
                <span className={`sentiment-dot ${news.sentiment}`} />
                <span className="news-source">{news.source}</span>
                <span className={`news-category ${news.category}`}>{categoryLabels[news.category]}</span>
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
          ))}
        </div>
      </div>
    </div>
  );
}
