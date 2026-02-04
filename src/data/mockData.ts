import { StockQuote, MarketIndex, CandlestickData, PortfolioHolding, NewsItem, WatchlistItem, TechnicalIndicator } from '../types/market';

function generateSparkline(base: number, volatility: number, points: number = 20): number[] {
  const data: number[] = [];
  let current = base;
  for (let i = 0; i < points; i++) {
    current += (Math.random() - 0.48) * volatility;
    data.push(current);
  }
  return data;
}

export const marketIndices: MarketIndex[] = [
  { symbol: 'N225', name: '日経平均', value: 39245.72, change: 285.34, changePercent: 0.73, sparkline: generateSparkline(39000, 100) },
  { symbol: 'TOPIX', name: 'TOPIX', value: 2714.56, change: 18.92, changePercent: 0.70, sparkline: generateSparkline(2700, 10) },
  { symbol: 'SPX', name: 'S&P 500', value: 5892.45, change: -12.38, changePercent: -0.21, sparkline: generateSparkline(5900, 20) },
  { symbol: 'DJI', name: 'NYダウ', value: 43782.12, change: 45.67, changePercent: 0.10, sparkline: generateSparkline(43700, 100) },
  { symbol: 'IXIC', name: 'NASDAQ', value: 19234.78, change: -89.23, changePercent: -0.46, sparkline: generateSparkline(19300, 50) },
  { symbol: 'HSI', name: 'ハンセン', value: 20312.45, change: -156.78, changePercent: -0.77, sparkline: generateSparkline(20400, 80) },
  { symbol: 'FTSE', name: 'FTSE100', value: 8245.67, change: 32.14, changePercent: 0.39, sparkline: generateSparkline(8200, 30) },
  { symbol: 'USDJPY', name: 'USD/JPY', value: 149.82, change: -0.34, changePercent: -0.23, sparkline: generateSparkline(150, 0.5) },
  { symbol: 'EURJPY', name: 'EUR/JPY', value: 162.45, change: 0.28, changePercent: 0.17, sparkline: generateSparkline(162, 0.4) },
  { symbol: 'BTCUSD', name: 'BTC/USD', value: 97842.50, change: 1234.80, changePercent: 1.28, sparkline: generateSparkline(97000, 500) },
];

export const stockQuotes: StockQuote[] = [
  { symbol: '7203', name: 'Toyota Motor', nameJa: 'トヨタ自動車', price: 2845.5, change: 32.0, changePercent: 1.14, volume: 12450000, marketCap: 46200000000000, high: 2862.0, low: 2810.0, open: 2815.0, previousClose: 2813.5, sector: '自動車' },
  { symbol: '6758', name: 'Sony Group', nameJa: 'ソニーグループ', price: 3215.0, change: -45.0, changePercent: -1.38, volume: 8920000, marketCap: 20100000000000, high: 3268.0, low: 3198.0, open: 3260.0, previousClose: 3260.0, sector: '電機' },
  { symbol: '9984', name: 'SoftBank Group', nameJa: 'ソフトバンクG', price: 8965.0, change: 125.0, changePercent: 1.41, volume: 15670000, marketCap: 13200000000000, high: 9010.0, low: 8820.0, open: 8840.0, previousClose: 8840.0, sector: '通信' },
  { symbol: '6861', name: 'Keyence', nameJa: 'キーエンス', price: 67890.0, change: 890.0, changePercent: 1.33, volume: 534000, marketCap: 16500000000000, high: 68200.0, low: 66950.0, open: 67000.0, previousClose: 67000.0, sector: '電機' },
  { symbol: '8306', name: 'MUFG', nameJa: '三菱UFJ FG', price: 1678.5, change: 23.5, changePercent: 1.42, volume: 32100000, marketCap: 20300000000000, high: 1685.0, low: 1652.0, open: 1655.0, previousClose: 1655.0, sector: '銀行' },
  { symbol: '9432', name: 'NTT', nameJa: '日本電信電話', price: 156.2, change: -1.8, changePercent: -1.14, volume: 45600000, marketCap: 14100000000000, high: 158.4, low: 155.8, open: 158.0, previousClose: 158.0, sector: '通信' },
  { symbol: '6501', name: 'Hitachi', nameJa: '日立製作所', price: 3856.0, change: 67.0, changePercent: 1.77, volume: 6780000, marketCap: 17800000000000, high: 3878.0, low: 3785.0, open: 3789.0, previousClose: 3789.0, sector: '電機' },
  { symbol: '7267', name: 'Honda Motor', nameJa: 'ホンダ', price: 1423.0, change: -18.5, changePercent: -1.28, volume: 9870000, marketCap: 7500000000000, high: 1445.0, low: 1418.0, open: 1441.5, previousClose: 1441.5, sector: '自動車' },
  { symbol: '4063', name: 'Shin-Etsu Chemical', nameJa: '信越化学工業', price: 5432.0, change: 78.0, changePercent: 1.46, volume: 3450000, marketCap: 10900000000000, high: 5456.0, low: 5348.0, open: 5354.0, previousClose: 5354.0, sector: '化学' },
  { symbol: '6902', name: 'Denso', nameJa: 'デンソー', price: 2187.5, change: -32.5, changePercent: -1.46, volume: 4560000, marketCap: 6800000000000, high: 2225.0, low: 2178.0, open: 2220.0, previousClose: 2220.0, sector: '自動車' },
  { symbol: '8035', name: 'Tokyo Electron', nameJa: '東京エレクトロン', price: 23450.0, change: 560.0, changePercent: 2.45, volume: 2340000, marketCap: 11100000000000, high: 23620.0, low: 22850.0, open: 22890.0, previousClose: 22890.0, sector: '電機' },
  { symbol: '9433', name: 'KDDI', nameJa: 'KDDI', price: 4567.0, change: 12.0, changePercent: 0.26, volume: 5670000, marketCap: 10500000000000, high: 4589.0, low: 4540.0, open: 4555.0, previousClose: 4555.0, sector: '通信' },
  { symbol: '4519', name: 'Chugai Pharma', nameJa: '中外製薬', price: 6234.0, change: -89.0, changePercent: -1.41, volume: 3210000, marketCap: 10500000000000, high: 6345.0, low: 6210.0, open: 6323.0, previousClose: 6323.0, sector: '医薬品' },
  { symbol: '6367', name: 'Daikin Industries', nameJa: 'ダイキン工業', price: 18765.0, change: 234.0, changePercent: 1.26, volume: 1230000, marketCap: 5500000000000, high: 18890.0, low: 18510.0, open: 18531.0, previousClose: 18531.0, sector: '機械' },
  { symbol: '7741', name: 'HOYA', nameJa: 'HOYA', price: 19870.0, change: -210.0, changePercent: -1.05, volume: 890000, marketCap: 7200000000000, high: 20120.0, low: 19780.0, open: 20080.0, previousClose: 20080.0, sector: '精密機器' },
];

export function generateCandlestickData(symbol: string, days: number = 90): CandlestickData[] {
  const data: CandlestickData[] = [];
  const stock = stockQuotes.find(s => s.symbol === symbol);
  let basePrice = stock ? stock.price * 0.9 : 1000;

  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = basePrice * 0.025;
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 5000000 + 1000000);

    data.push({
      time: date.toISOString().split('T')[0],
      open: Math.round(open * 10) / 10,
      high: Math.round(high * 10) / 10,
      low: Math.round(low * 10) / 10,
      close: Math.round(close * 10) / 10,
      volume,
    });
    basePrice = close;
  }
  return data;
}

export const portfolioHoldings: PortfolioHolding[] = [
  { id: '1', symbol: '7203', name: 'トヨタ自動車', shares: 400, avgCost: 2650.0, currentPrice: 2845.5, totalValue: 1138200, totalCost: 1060000, pnl: 78200, pnlPercent: 7.38, allocation: 22.1 },
  { id: '2', symbol: '6758', name: 'ソニーグループ', shares: 200, avgCost: 3100.0, currentPrice: 3215.0, totalValue: 643000, totalCost: 620000, pnl: 23000, pnlPercent: 3.71, allocation: 12.5 },
  { id: '3', symbol: '9984', name: 'ソフトバンクG', shares: 100, avgCost: 8200.0, currentPrice: 8965.0, totalValue: 896500, totalCost: 820000, pnl: 76500, pnlPercent: 9.33, allocation: 17.4 },
  { id: '4', symbol: '8306', name: '三菱UFJ FG', shares: 500, avgCost: 1520.0, currentPrice: 1678.5, totalValue: 839250, totalCost: 760000, pnl: 79250, pnlPercent: 10.43, allocation: 16.3 },
  { id: '5', symbol: '8035', name: '東京エレクトロン', shares: 30, avgCost: 21500.0, currentPrice: 23450.0, totalValue: 703500, totalCost: 645000, pnl: 58500, pnlPercent: 9.07, allocation: 13.7 },
  { id: '6', symbol: '4063', name: '信越化学工業', shares: 100, avgCost: 5100.0, currentPrice: 5432.0, totalValue: 543200, totalCost: 510000, pnl: 33200, pnlPercent: 6.51, allocation: 10.5 },
  { id: '7', symbol: '6501', name: '日立製作所', shares: 100, avgCost: 3500.0, currentPrice: 3856.0, totalValue: 385600, totalCost: 350000, pnl: 35600, pnlPercent: 10.17, allocation: 7.5 },
];

export const newsItems: NewsItem[] = [
  { id: '1', title: '日銀、追加利上げの可能性を示唆 - 植田総裁が国会答弁で', summary: '日本銀行の植田和男総裁は国会答弁において、経済・物価情勢に応じて追加の利上げを行う可能性があると述べた。マーケットは円高方向に反応。', source: '日経新聞', timestamp: '2025-02-03T09:30:00Z', category: 'economy', sentiment: 'neutral' },
  { id: '2', title: '東京エレクトロン、AI半導体需要で過去最高益を更新', summary: '東京エレクトロンは2025年3月期の業績予想を上方修正。AI向け半導体製造装置の需要が想定を大幅に上回り、営業利益は過去最高を更新する見通し。', source: 'Bloomberg', timestamp: '2025-02-03T08:15:00Z', category: 'company', symbols: ['8035'], sentiment: 'positive' },
  { id: '3', title: 'トヨタ、全固体電池搭載EVを2027年に発売へ', summary: 'トヨタ自動車は全固体電池を搭載した電気自動車を2027年に発売する計画を発表。航続距離は従来のリチウムイオン電池の約2倍となる見込み。', source: 'ロイター', timestamp: '2025-02-03T07:45:00Z', category: 'company', symbols: ['7203'], sentiment: 'positive' },
  { id: '4', title: 'FRB、次回FOMCで利下げ見送りの公算 - インフレ懸念根強く', summary: '米連邦準備制度理事会（FRB）は次回のFOMC会合で利下げを見送る公算が大きい。直近の雇用統計が予想を上回り、インフレ圧力が依然として強いとの見方。', source: 'CNBC', timestamp: '2025-02-03T06:20:00Z', category: 'economy', sentiment: 'negative' },
  { id: '5', title: 'ビットコイン、10万ドル目前 - ETF資金流入が加速', summary: 'ビットコインが10万ドルの大台に迫っている。米国のビットコインETFへの資金流入が加速し、機関投資家の参入が相場を押し上げている。', source: 'CoinDesk', timestamp: '2025-02-03T05:10:00Z', category: 'crypto', sentiment: 'positive' },
  { id: '6', title: '中国景気減速懸念でアジア株軟調 - 不動産セクターに売り', summary: '中国の製造業PMIが予想を下回り、景気減速懸念が広がった。香港ハンセン指数は1%超下落、不動産セクターが特に売り込まれた。', source: '日経新聞', timestamp: '2025-02-02T14:30:00Z', category: 'market', sentiment: 'negative' },
  { id: '7', title: 'ソフトバンクG、AI投資ファンド10兆円規模を計画', summary: 'ソフトバンクグループはAI関連企業への投資を加速するため、10兆円規模の新ファンドを設立する計画。OpenAIやArmの株式を活用した資金調達を検討。', source: 'Financial Times', timestamp: '2025-02-02T12:00:00Z', category: 'company', symbols: ['9984'], sentiment: 'positive' },
  { id: '8', title: 'ドル円、150円台を回復 - 米長期金利上昇で', summary: '外国為替市場でドル円が150円台を回復。米10年債利回りが4.5%を超え、日米金利差の拡大がドル買い・円売りを促した。', source: 'ロイター', timestamp: '2025-02-02T10:45:00Z', category: 'forex', sentiment: 'neutral' },
  { id: '9', title: 'キーエンス、工場自動化需要で受注好調 - FA関連銘柄に注目', summary: 'キーエンスの受注が好調に推移。製造業の自動化投資が世界的に拡大し、FA関連銘柄に対する市場の関心が高まっている。', source: 'Bloomberg', timestamp: '2025-02-02T09:00:00Z', category: 'company', symbols: ['6861'], sentiment: 'positive' },
  { id: '10', title: '三菱UFJ、米子会社の統合を完了 - 北米事業を強化', summary: '三菱UFJフィナンシャル・グループは米国子会社の統合を完了。北米での法人向け融資やウェルスマネジメント事業の拡大を目指す。', source: '日経新聞', timestamp: '2025-02-01T15:30:00Z', category: 'company', symbols: ['8306'], sentiment: 'positive' },
];

export const defaultWatchlist: WatchlistItem[] = [
  { symbol: '7203', name: 'トヨタ自動車', price: 2845.5, change: 32.0, changePercent: 1.14, volume: 12450000 },
  { symbol: '6758', name: 'ソニーグループ', price: 3215.0, change: -45.0, changePercent: -1.38, volume: 8920000 },
  { symbol: '9984', name: 'ソフトバンクG', price: 8965.0, change: 125.0, changePercent: 1.41, volume: 15670000 },
  { symbol: '8035', name: '東京エレクトロン', price: 23450.0, change: 560.0, changePercent: 2.45, volume: 2340000 },
  { symbol: '6861', name: 'キーエンス', price: 67890.0, change: 890.0, changePercent: 1.33, volume: 534000 },
  { symbol: '8306', name: '三菱UFJ FG', price: 1678.5, change: 23.5, changePercent: 1.42, volume: 32100000 },
];

export const technicalIndicators: TechnicalIndicator[] = [
  { name: 'RSI (14)', value: 58.4, signal: 'neutral' },
  { name: 'MACD', value: 12.5, signal: 'buy' },
  { name: 'SMA (20)', value: 2780.0, signal: 'buy' },
  { name: 'SMA (50)', value: 2720.0, signal: 'buy' },
  { name: 'SMA (200)', value: 2650.0, signal: 'buy' },
  { name: 'ボリンジャーバンド', value: 2845.0, signal: 'neutral' },
  { name: 'ストキャスティクス', value: 72.3, signal: 'neutral' },
  { name: 'ADX', value: 28.5, signal: 'buy' },
  { name: 'CCI (20)', value: 85.2, signal: 'neutral' },
  { name: 'ATR (14)', value: 45.8, signal: 'neutral' },
  { name: '一目均衡表', value: 2800.0, signal: 'buy' },
  { name: 'ウィリアムズ%R', value: -28.5, signal: 'sell' },
];

export const sectorPerformance = [
  { name: '電機', change: 1.85, stocks: 8 },
  { name: '自動車', change: 0.42, stocks: 5 },
  { name: '銀行', change: 1.28, stocks: 6 },
  { name: '通信', change: -0.34, stocks: 4 },
  { name: '医薬品', change: -0.89, stocks: 5 },
  { name: '化学', change: 1.12, stocks: 3 },
  { name: '機械', change: 0.95, stocks: 4 },
  { name: '精密機器', change: -0.67, stocks: 3 },
  { name: '不動産', change: -1.23, stocks: 4 },
  { name: '食品', change: 0.15, stocks: 3 },
];
