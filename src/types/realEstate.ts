/** 物件情報 */
export interface PropertyInfo {
  name: string;
  purchasePrice: number;       // 購入価格（円）
  monthlyRent: number;         // 想定家賃月額（円）
  buildingAge: number;         // 築年数
  structure: 'RC' | 'SRC' | 'Wood' | 'Steel'; // 構造
  floorArea: number;           // 専有面積（㎡）
  location: string;            // 所在地
}

/** ローン情報 */
export interface LoanInfo {
  loanAmount: number;          // 借入金額（円）
  interestRate: number;        // 金利（%）
  loanTermYears: number;       // 返済期間（年）
  repaymentMethod: 'equal_installment' | 'equal_principal'; // 元利均等 / 元金均等
}

/** 諸費用（購入時） */
export interface InitialCosts {
  agentFee: number;            // 仲介手数料（円）
  registrationFee: number;     // 登記費用（円）
  stampDuty: number;           // 印紙税（円）
  acquisitionTax: number;      // 不動産取得税（円）
  otherCosts: number;          // その他初期費用（円）
}

/** 年間費用 */
export interface AnnualCosts {
  propertyTax: number;         // 固定資産税（円/年）
  managementFee: number;       // 管理費（円/月）
  maintenanceReserve: number;  // 修繕積立金（円/月）
  insurance: number;           // 火災保険料（円/年）
  vacancyRate: number;         // 空室率（%）
  pmFeeRate: number;           // 管理委託料率（%）
}

/** 売却時費用設定 */
export interface SellingCostConfig {
  agentFeeRate: number;        // 仲介手数料率（%、通常3%）
  agentFeeFixed: number;       // 仲介手数料固定額（円、通常6万円）
  otherSellingCosts: number;   // その他売却費用（円）
}

/** 全物件データ */
export interface RealEstateProperty {
  id: string;
  property: PropertyInfo;
  loan: LoanInfo;
  initialCosts: InitialCosts;
  annualCosts: AnnualCosts;
  sellingCosts: SellingCostConfig;
  createdAt: string;
}

/** 年次シミュレーション結果 */
export interface AnnualSimulationRow {
  year: number;
  rentalIncome: number;        // 年間家賃収入
  loanPayment: number;         // 年間ローン返済額
  principalPayment: number;    // 元金返済額
  interestPayment: number;     // 利息支払額
  annualExpenses: number;      // 年間経費
  netCashFlow: number;         // 年間キャッシュフロー
  cumulativeCashFlow: number;  // 累計キャッシュフロー
  remainingLoan: number;       // ローン残高
  totalCashInvested: number;   // 累計投資額（自己資金ベース）
  breakEvenPrice: number;      // 損益分岐点価格
  estimatedProfit: number;     // 購入価格で売却した場合の損益
}

/** シミュレーション全体の結果 */
export interface SimulationResult {
  downPayment: number;         // 頭金
  totalInitialCosts: number;   // 諸費用合計
  monthlyPayment: number;      // 月々の返済額（初月）
  grossYield: number;          // 表面利回り（%）
  netYield: number;            // 実質利回り（%）
  annualData: AnnualSimulationRow[];
}
