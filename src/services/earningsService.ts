// 企業決算情報サービス
// Yahoo Finance APIから実際の決算データを取得

const YAHOO_API = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

export interface EarningsData {
  symbol: string;
  companyName: string;
  reportDate: string;
  fiscalQuarter: string;
  estimatedEPS: number | null;
  actualEPS: number | null;
  estimatedRevenue: number | null;
  actualRevenue: number | null;
  surprise: number | null;
  category: string;
  status: 'upcoming' | 'reported';
}

// 業種別の主要企業リスト
const COMPANIES_BY_CATEGORY: Record<string, { symbol: string; name: string }[]> = {
  semiconductor: [
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'AMD', name: 'AMD' },
    { symbol: 'INTC', name: 'Intel' },
    { symbol: 'AVGO', name: 'Broadcom' },
    { symbol: 'TSM', name: 'TSMC' },
  ],
  innovation: [
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'PLTR', name: 'Palantir' },
  ],
  cleanenergy: [
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'ENPH', name: 'Enphase' },
    { symbol: 'NEE', name: 'NextEra Energy' },
    { symbol: 'FSLR', name: 'First Solar' },
  ],
  biotech: [
    { symbol: 'MRNA', name: 'Moderna' },
    { symbol: 'REGN', name: 'Regeneron' },
    { symbol: 'VRTX', name: 'Vertex Pharma' },
    { symbol: 'ILMN', name: 'Illumina' },
  ],
  space: [
    { symbol: 'LMT', name: 'Lockheed Martin' },
    { symbol: 'BA', name: 'Boeing' },
    { symbol: 'NOC', name: 'Northrop Grumman' },
    { symbol: 'RKLB', name: 'Rocket Lab' },
  ],
  resources: [
    { symbol: 'XOM', name: 'Exxon Mobil' },
    { symbol: 'CVX', name: 'Chevron' },
    { symbol: 'NEM', name: 'Newmont' },
    { symbol: 'FCX', name: 'Freeport-McMoRan' },
  ],
};

// キャッシュ
const LS_EARNINGS_KEY = 'earnings_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1時間

interface CacheEntry {
  data: EarningsData[];
  timestamp: number;
}

function loadCache(): CacheEntry | null {
  try {
    const cached = localStorage.getItem(LS_EARNINGS_KEY);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        return entry;
      }
    }
  } catch (e) {
    console.warn('[Earnings] Cache load error:', e);
  }
  return null;
}

function saveCache(data: EarningsData[]) {
  try {
    localStorage.setItem(LS_EARNINGS_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    // 容量オーバー等
  }
}

// プロキシ経由でフェッチ
async function fetchWithProxy(url: string, timeout = 3000): Promise<Response | null> {
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) return response;
    } catch (e) {
      // 次のプロキシを試す
    }
  }
  return null;
}

// 個別銘柄の決算情報を取得
async function fetchEarningsForSymbol(
  symbol: string,
  companyName: string,
  category: string
): Promise<EarningsData | null> {
  const url = `${YAHOO_API}/${symbol}?modules=calendarEvents,earnings`;

  try {
    const response = await fetchWithProxy(url);
    if (!response) return null;

    const data = await response.json();
    const result = data.quoteSummary?.result?.[0];
    if (!result) return null;

    const calendar = result.calendarEvents;
    const earnings = result.earnings;

    // 次回決算日
    const earningsDate = calendar?.earnings?.earningsDate?.[0]?.raw;
    const epsEstimate = calendar?.earnings?.earningsAverage?.raw;
    const revenueEstimate = calendar?.earnings?.revenueAverage?.raw;

    // 直近の決算結果
    const history = earnings?.earningsChart?.quarterly;
    const latestQuarter = history?.[history.length - 1];
    const actualEPS = latestQuarter?.actual?.raw;
    const estimateEPS = latestQuarter?.estimate?.raw;

    const today = new Date();
    const reportDate = earningsDate ? new Date(earningsDate * 1000) : null;
    const isUpcoming = reportDate && reportDate > today;

    // 四半期を推定
    const fiscalQuarter = reportDate
      ? `Q${Math.ceil((reportDate.getMonth() + 1) / 3)} ${reportDate.getFullYear()}`
      : 'N/A';

    // サプライズ計算
    let surprise: number | null = null;
    if (actualEPS !== undefined && estimateEPS !== undefined && estimateEPS !== 0) {
      surprise = ((actualEPS - estimateEPS) / Math.abs(estimateEPS)) * 100;
    }

    return {
      symbol,
      companyName,
      reportDate: reportDate ? reportDate.toISOString().split('T')[0] : 'TBD',
      fiscalQuarter,
      estimatedEPS: epsEstimate ?? estimateEPS ?? null,
      actualEPS: isUpcoming ? null : (actualEPS ?? null),
      estimatedRevenue: revenueEstimate ? revenueEstimate / 1e9 : null, // 億ドル換算
      actualRevenue: null, // Yahoo APIからは取得困難
      surprise: isUpcoming ? null : surprise,
      category,
      status: isUpcoming ? 'upcoming' : 'reported',
    };
  } catch (e) {
    console.warn('[Earnings] Error fetching', symbol, e);
    return null;
  }
}

// 全決算データを取得
export async function fetchEarningsData(): Promise<EarningsData[]> {
  // キャッシュ確認
  const cached = loadCache();
  if (cached) {
    console.log('[Earnings] Using cached data');
    return cached.data;
  }

  console.log('[Earnings] Fetching fresh data...');
  const allCompanies: { symbol: string; name: string; category: string }[] = [];

  for (const [category, companies] of Object.entries(COMPANIES_BY_CATEGORY)) {
    for (const company of companies) {
      allCompanies.push({ ...company, category });
    }
  }

  // 並列取得（レート制限を考慮して少しずつ）
  const results: EarningsData[] = [];
  const batchSize = 5;

  for (let i = 0; i < allCompanies.length; i += batchSize) {
    const batch = allCompanies.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(c => fetchEarningsForSymbol(c.symbol, c.name, c.category))
    );
    results.push(...batchResults.filter((r): r is EarningsData => r !== null));

    // レート制限回避のため少し待機
    if (i + batchSize < allCompanies.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // キャッシュ保存
  if (results.length > 0) {
    saveCache(results);
  }

  console.log('[Earnings] Fetched', results.length, 'earnings');
  return results;
}

// カテゴリ別決算データを取得
export function getEarningsByCategory(data: EarningsData[], categoryId: string): EarningsData[] {
  return data.filter(e => e.category === categoryId);
}

// 今後の決算予定を取得
export function getUpcomingEarnings(data: EarningsData[]): EarningsData[] {
  const today = new Date();
  return data
    .filter(e => e.status === 'upcoming' && e.reportDate !== 'TBD' && new Date(e.reportDate) >= today)
    .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());
}

// 最近の決算発表を取得
export function getRecentEarnings(data: EarningsData[]): EarningsData[] {
  return data
    .filter(e => e.status === 'reported')
    .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
}
