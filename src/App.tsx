import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MarketOverview } from './components/Dashboard/MarketOverview';
import { StockChart } from './components/Chart/StockChart';
import { NewsFeed } from './components/News/NewsFeed';
import { AnalysisView } from './components/Analysis/AnalysisView';

type Page = 'dashboard' | 'chart' | 'news' | 'analysis';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const handleNavigate = (page: string, symbol?: string) => {
    setActivePage(page as Page);
    if (symbol) {
      setSelectedSymbol(symbol);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <MarketOverview onNavigate={handleNavigate} />;
      case 'chart':
        return <StockChart initialSymbol={selectedSymbol} />;
      case 'news':
        return <NewsFeed onNavigate={handleNavigate} />;
      case 'analysis':
        return <AnalysisView onNavigate={handleNavigate} />;
      default:
        return <MarketOverview onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
