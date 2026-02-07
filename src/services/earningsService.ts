// 企業決算情報サービス
// 業種別の主要企業の決算スケジュールと結果を提供

export interface EarningsData {
  symbol: string;
  companyName: string;
  reportDate: string;
  fiscalQuarter: string;
  estimatedEPS: number | null;
  actualEPS: number | null;
  estimatedRevenue: number | null;  // 億ドル
  actualRevenue: number | null;     // 億ドル
  surprise: number | null;          // EPS サプライズ %
  category: string;
  status: 'upcoming' | 'reported';
}

// 業種別の主要企業決算データ
const EARNINGS_DATA: EarningsData[] = [
  // 半導体・テクノロジー
  { symbol: 'NVDA', companyName: 'NVIDIA', reportDate: '2026-02-26', fiscalQuarter: 'Q4 2026', estimatedEPS: 0.89, actualEPS: null, estimatedRevenue: 380, actualRevenue: null, surprise: null, category: 'semiconductor', status: 'upcoming' },
  { symbol: 'AMD', companyName: 'AMD', reportDate: '2026-02-04', fiscalQuarter: 'Q4 2025', estimatedEPS: 1.08, actualEPS: 1.12, estimatedRevenue: 75, actualRevenue: 76.7, surprise: 3.7, category: 'semiconductor', status: 'reported' },
  { symbol: 'INTC', companyName: 'Intel', reportDate: '2026-01-30', fiscalQuarter: 'Q4 2025', estimatedEPS: 0.12, actualEPS: 0.13, estimatedRevenue: 137, actualRevenue: 142, surprise: 8.3, category: 'semiconductor', status: 'reported' },
  { symbol: 'AVGO', companyName: 'Broadcom', reportDate: '2026-03-06', fiscalQuarter: 'Q1 2026', estimatedEPS: 1.52, actualEPS: null, estimatedRevenue: 146, actualRevenue: null, surprise: null, category: 'semiconductor', status: 'upcoming' },
  { symbol: 'TSM', companyName: 'TSMC', reportDate: '2026-01-16', fiscalQuarter: 'Q4 2025', estimatedEPS: 2.18, actualEPS: 2.24, estimatedRevenue: 268, actualRevenue: 270, surprise: 2.8, category: 'semiconductor', status: 'reported' },

  // AI・イノベーション
  { symbol: 'MSFT', companyName: 'Microsoft', reportDate: '2026-01-28', fiscalQuarter: 'Q2 2026', estimatedEPS: 3.12, actualEPS: 3.23, estimatedRevenue: 688, actualRevenue: 695, surprise: 3.5, category: 'innovation', status: 'reported' },
  { symbol: 'GOOGL', companyName: 'Alphabet', reportDate: '2026-02-04', fiscalQuarter: 'Q4 2025', estimatedEPS: 2.05, actualEPS: 2.15, estimatedRevenue: 965, actualRevenue: 984, surprise: 4.9, category: 'innovation', status: 'reported' },
  { symbol: 'META', companyName: 'Meta Platforms', reportDate: '2026-01-29', fiscalQuarter: 'Q4 2025', estimatedEPS: 6.72, actualEPS: 6.98, estimatedRevenue: 462, actualRevenue: 480, surprise: 3.9, category: 'innovation', status: 'reported' },
  { symbol: 'AMZN', companyName: 'Amazon', reportDate: '2026-02-06', fiscalQuarter: 'Q4 2025', estimatedEPS: 1.48, actualEPS: 1.59, estimatedRevenue: 1875, actualRevenue: 1900, surprise: 7.4, category: 'innovation', status: 'reported' },
  { symbol: 'PLTR', companyName: 'Palantir', reportDate: '2026-02-18', fiscalQuarter: 'Q4 2025', estimatedEPS: 0.11, actualEPS: null, estimatedRevenue: 7.8, actualRevenue: null, surprise: null, category: 'innovation', status: 'upcoming' },

  // クリーンエネルギー
  { symbol: 'TSLA', companyName: 'Tesla', reportDate: '2026-01-29', fiscalQuarter: 'Q4 2025', estimatedEPS: 0.72, actualEPS: 0.76, estimatedRevenue: 276, actualRevenue: 282, surprise: 5.6, category: 'cleanenergy', status: 'reported' },
  { symbol: 'ENPH', companyName: 'Enphase Energy', reportDate: '2026-02-11', fiscalQuarter: 'Q4 2025', estimatedEPS: 0.85, actualEPS: null, estimatedRevenue: 3.8, actualRevenue: null, surprise: null, category: 'cleanenergy', status: 'upcoming' },
  { symbol: 'NEE', companyName: 'NextEra Energy', reportDate: '2026-01-24', fiscalQuarter: 'Q4 2025', estimatedEPS: 0.52, actualEPS: 0.55, estimatedRevenue: 68, actualRevenue: 72, surprise: 5.8, category: 'cleanenergy', status: 'reported' },
  { symbol: 'FSLR', companyName: 'First Solar', reportDate: '2026-02-25', fiscalQuarter: 'Q4 2025', estimatedEPS: 4.20, actualEPS: null, estimatedRevenue: 12.5, actualRevenue: null, surprise: null, category: 'cleanenergy', status: 'upcoming' },

  // バイオテック
  { symbol: 'MRNA', companyName: 'Moderna', reportDate: '2026-02-13', fiscalQuarter: 'Q4 2025', estimatedEPS: -2.45, actualEPS: null, estimatedRevenue: 8.5, actualRevenue: null, surprise: null, category: 'biotech', status: 'upcoming' },
  { symbol: 'REGN', companyName: 'Regeneron', reportDate: '2026-02-06', fiscalQuarter: 'Q4 2025', estimatedEPS: 11.85, actualEPS: 12.10, estimatedRevenue: 36, actualRevenue: 37.2, surprise: 2.1, category: 'biotech', status: 'reported' },
  { symbol: 'VRTX', companyName: 'Vertex Pharma', reportDate: '2026-02-10', fiscalQuarter: 'Q4 2025', estimatedEPS: 4.32, actualEPS: null, estimatedRevenue: 28, actualRevenue: null, surprise: null, category: 'biotech', status: 'upcoming' },
  { symbol: 'ILMN', companyName: 'Illumina', reportDate: '2026-02-11', fiscalQuarter: 'Q4 2025', estimatedEPS: 1.05, actualEPS: null, estimatedRevenue: 10.8, actualRevenue: null, surprise: null, category: 'biotech', status: 'upcoming' },

  // 宇宙開発
  { symbol: 'LMT', companyName: 'Lockheed Martin', reportDate: '2026-01-28', fiscalQuarter: 'Q4 2025', estimatedEPS: 7.24, actualEPS: 7.58, estimatedRevenue: 186, actualRevenue: 191, surprise: 4.7, category: 'space', status: 'reported' },
  { symbol: 'BA', companyName: 'Boeing', reportDate: '2026-01-29', fiscalQuarter: 'Q4 2025', estimatedEPS: -0.45, actualEPS: -0.35, estimatedRevenue: 168, actualRevenue: 172, surprise: 22.2, category: 'space', status: 'reported' },
  { symbol: 'NOC', companyName: 'Northrop Grumman', reportDate: '2026-01-30', fiscalQuarter: 'Q4 2025', estimatedEPS: 6.82, actualEPS: 7.15, estimatedRevenue: 102, actualRevenue: 104, surprise: 4.8, category: 'space', status: 'reported' },
  { symbol: 'RKLB', companyName: 'Rocket Lab', reportDate: '2026-02-27', fiscalQuarter: 'Q4 2025', estimatedEPS: -0.08, actualEPS: null, estimatedRevenue: 1.3, actualRevenue: null, surprise: null, category: 'space', status: 'upcoming' },

  // 資源・コモディティ
  { symbol: 'XOM', companyName: 'Exxon Mobil', reportDate: '2026-01-31', fiscalQuarter: 'Q4 2025', estimatedEPS: 1.78, actualEPS: 1.92, estimatedRevenue: 885, actualRevenue: 912, surprise: 7.9, category: 'resources', status: 'reported' },
  { symbol: 'CVX', companyName: 'Chevron', reportDate: '2026-01-31', fiscalQuarter: 'Q4 2025', estimatedEPS: 2.85, actualEPS: 2.96, estimatedRevenue: 485, actualRevenue: 492, surprise: 3.9, category: 'resources', status: 'reported' },
  { symbol: 'NEM', companyName: 'Newmont Mining', reportDate: '2026-02-20', fiscalQuarter: 'Q4 2025', estimatedEPS: 0.92, actualEPS: null, estimatedRevenue: 48, actualRevenue: null, surprise: null, category: 'resources', status: 'upcoming' },
  { symbol: 'FCX', companyName: 'Freeport-McMoRan', reportDate: '2026-01-23', fiscalQuarter: 'Q4 2025', estimatedEPS: 0.28, actualEPS: 0.31, estimatedRevenue: 58, actualRevenue: 62, surprise: 10.7, category: 'resources', status: 'reported' },
];

// 決算データを取得
export async function fetchEarningsData(): Promise<EarningsData[]> {
  // 実際のプロダクションでは、Financial Modeling Prep API やAlpha Vantage APIなどを使用
  // 今回はデモ用データを返す
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(EARNINGS_DATA);
    }, 100);
  });
}

// カテゴリ別決算データを取得
export function getEarningsByCategory(data: EarningsData[], categoryId: string): EarningsData[] {
  return data.filter(e => e.category === categoryId);
}

// 今後の決算予定を取得
export function getUpcomingEarnings(data: EarningsData[]): EarningsData[] {
  const today = new Date();
  return data
    .filter(e => e.status === 'upcoming' && new Date(e.reportDate) >= today)
    .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());
}

// 最近の決算発表を取得
export function getRecentEarnings(data: EarningsData[]): EarningsData[] {
  return data
    .filter(e => e.status === 'reported')
    .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
}
