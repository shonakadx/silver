import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MarketOverview } from './components/Dashboard/MarketOverview';
import { StockChart } from './components/Chart/StockChart';
import { PortfolioView } from './components/Portfolio/PortfolioView';
import { WatchlistView } from './components/Watchlist/WatchlistView';
import { NewsFeed } from './components/News/NewsFeed';
import { AnalysisView } from './components/Analysis/AnalysisView';
import { RealEstateView } from './components/RealEstate/RealEstateView';

type Page = 'dashboard' | 'chart' | 'portfolio' | 'watchlist' | 'news' | 'analysis' | 'realestate';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <MarketOverview onNavigate={(p) => setActivePage(p as Page)} />;
      case 'chart':
        return <StockChart />;
      case 'portfolio':
        return <PortfolioView onNavigate={(p) => setActivePage(p as Page)} />;
      case 'watchlist':
        return <WatchlistView onNavigate={(p) => setActivePage(p as Page)} />;
      case 'news':
        return <NewsFeed onNavigate={(p) => setActivePage(p as Page)} />;
      case 'analysis':
        return <AnalysisView onNavigate={(p) => setActivePage(p as Page)} />;
      case 'realestate':
        return <RealEstateView onNavigate={(p) => setActivePage(p as Page)} />;
      default:
        return <MarketOverview onNavigate={(p) => setActivePage(p as Page)} />;
    }
  };

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar activePage={activePage} onNavigate={(p) => setActivePage(p as Page)} />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
