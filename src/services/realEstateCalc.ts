import type {
  RealEstateProperty,
  AnnualSimulationRow,
  SimulationResult,
} from '../types/realEstate';

/**
 * 元利均等返済の月々の返済額を計算
 */
function calcEqualInstallment(principal: number, annualRate: number, totalMonths: number): number {
  if (annualRate === 0) return principal / totalMonths;
  const r = annualRate / 100 / 12;
  return principal * r * Math.pow(1 + r, totalMonths) / (Math.pow(1 + r, totalMonths) - 1);
}

/**
 * ローン残高を計算（元利均等）
 */
function remainingBalanceEqualInstallment(
  principal: number,
  annualRate: number,
  totalMonths: number,
  monthsPaid: number
): number {
  if (annualRate === 0) return principal - (principal / totalMonths) * monthsPaid;
  const r = annualRate / 100 / 12;
  const monthlyPayment = calcEqualInstallment(principal, annualRate, totalMonths);
  return principal * Math.pow(1 + r, monthsPaid) - monthlyPayment * (Math.pow(1 + r, monthsPaid) - 1) / r;
}

/**
 * 元金均等返済の月々の返済額（n月目）
 */
function calcEqualPrincipalMonthly(
  principal: number,
  annualRate: number,
  totalMonths: number,
  monthNumber: number
): { total: number; principalPart: number; interestPart: number } {
  const principalPart = principal / totalMonths;
  const r = annualRate / 100 / 12;
  const remainingAtStart = principal - principalPart * (monthNumber - 1);
  const interestPart = remainingAtStart * r;
  return { total: principalPart + interestPart, principalPart, interestPart };
}

/**
 * 年間のローン返済内訳を計算
 */
function calcAnnualLoanPayment(
  principal: number,
  annualRate: number,
  totalMonths: number,
  year: number,
  method: 'equal_installment' | 'equal_principal'
): { totalPayment: number; principalPayment: number; interestPayment: number } {
  const startMonth = (year - 1) * 12 + 1;
  const endMonth = Math.min(year * 12, totalMonths);

  if (startMonth > totalMonths) {
    return { totalPayment: 0, principalPayment: 0, interestPayment: 0 };
  }

  let totalPayment = 0;
  let principalPayment = 0;
  let interestPayment = 0;

  if (method === 'equal_installment') {
    const monthlyPayment = calcEqualInstallment(principal, annualRate, totalMonths);
    const r = annualRate / 100 / 12;

    for (let m = startMonth; m <= endMonth; m++) {
      const balanceBefore = r === 0
        ? principal - (principal / totalMonths) * (m - 1)
        : remainingBalanceEqualInstallment(principal, annualRate, totalMonths, m - 1);
      const interest = balanceBefore * r;
      const principalPart = monthlyPayment - interest;
      totalPayment += monthlyPayment;
      principalPayment += principalPart;
      interestPayment += interest;
    }
  } else {
    for (let m = startMonth; m <= endMonth; m++) {
      const parts = calcEqualPrincipalMonthly(principal, annualRate, totalMonths, m);
      totalPayment += parts.total;
      principalPayment += parts.principalPart;
      interestPayment += parts.interestPart;
    }
  }

  return { totalPayment, principalPayment, interestPayment };
}

/**
 * ローン残高（年末時点）
 */
function calcRemainingLoan(
  principal: number,
  annualRate: number,
  totalMonths: number,
  year: number,
  method: 'equal_installment' | 'equal_principal'
): number {
  const monthsPaid = Math.min(year * 12, totalMonths);

  if (method === 'equal_installment') {
    return Math.max(0, remainingBalanceEqualInstallment(principal, annualRate, totalMonths, monthsPaid));
  } else {
    const principalPerMonth = principal / totalMonths;
    return Math.max(0, principal - principalPerMonth * monthsPaid);
  }
}

/**
 * 売却時の仲介手数料を計算（売買価格 × rate% + fixed）
 */
function calcSellingCosts(
  salePrice: number,
  agentFeeRate: number,
  agentFeeFixed: number,
  otherCosts: number
): number {
  return salePrice * (agentFeeRate / 100) + agentFeeFixed + otherCosts;
}

/**
 * 損益分岐点価格を計算
 * Sale price where: Sale price - Selling costs - Remaining loan - Net cash invested = 0
 * Sale price × (1 - rate/100) - fixed_selling - remaining_loan - net_cash = 0
 * Sale price = (remaining_loan + net_cash + fixed_selling) / (1 - rate/100)
 */
function calcBreakEvenPrice(
  remainingLoan: number,
  netCashInvested: number,
  agentFeeRate: number,
  agentFeeFixed: number,
  otherSellingCosts: number
): number {
  const fixedCosts = agentFeeFixed + otherSellingCosts;
  const rate = agentFeeRate / 100;
  return (remainingLoan + netCashInvested + fixedCosts) / (1 - rate);
}

/**
 * メインのシミュレーション計算
 */
export function runSimulation(property: RealEstateProperty): SimulationResult {
  const { property: prop, loan, initialCosts, annualCosts, sellingCosts } = property;

  // 頭金 = 購入価格 - 借入金額
  const downPayment = prop.purchasePrice - loan.loanAmount;

  // 諸費用合計
  const totalInitialCosts =
    initialCosts.agentFee +
    initialCosts.registrationFee +
    initialCosts.stampDuty +
    initialCosts.acquisitionTax +
    initialCosts.otherCosts;

  // 初期投資額（自己資金）
  const initialInvestment = downPayment + totalInitialCosts;

  // ローン基本情報
  const totalMonths = loan.loanTermYears * 12;
  const monthlyPayment =
    loan.repaymentMethod === 'equal_installment'
      ? calcEqualInstallment(loan.loanAmount, loan.interestRate, totalMonths)
      : calcEqualPrincipalMonthly(loan.loanAmount, loan.interestRate, totalMonths, 1).total;

  // 表面利回り
  const grossYield = (prop.monthlyRent * 12) / prop.purchasePrice * 100;

  // 年間経費
  const annualRent = prop.monthlyRent * 12 * (1 - annualCosts.vacancyRate / 100);
  const annualExpenseBase =
    annualCosts.propertyTax +
    (annualCosts.managementFee + annualCosts.maintenanceReserve) * 12 +
    annualCosts.insurance +
    annualRent * (annualCosts.pmFeeRate / 100);

  // 実質利回り
  const netYield = (annualRent - annualExpenseBase) / prop.purchasePrice * 100;

  // シミュレーション期間（ローン期間 or 最大35年）
  const simYears = Math.max(loan.loanTermYears, 35);

  const annualData: AnnualSimulationRow[] = [];
  let cumulativeCashFlow = -initialInvestment; // 初期投資はマイナス

  for (let year = 1; year <= simYears; year++) {
    // 家賃収入
    const rentalIncome = prop.monthlyRent * 12 * (1 - annualCosts.vacancyRate / 100);

    // ローン返済
    const loanResult = calcAnnualLoanPayment(
      loan.loanAmount,
      loan.interestRate,
      totalMonths,
      year,
      loan.repaymentMethod
    );

    // 年間経費
    const pmFee = rentalIncome * (annualCosts.pmFeeRate / 100);
    const expenses =
      annualCosts.propertyTax +
      (annualCosts.managementFee + annualCosts.maintenanceReserve) * 12 +
      annualCosts.insurance +
      pmFee;

    // キャッシュフロー
    const netCashFlow = rentalIncome - loanResult.totalPayment - expenses;
    cumulativeCashFlow += netCashFlow;

    // ローン残高
    const remainingLoan = calcRemainingLoan(
      loan.loanAmount,
      loan.interestRate,
      totalMonths,
      year,
      loan.repaymentMethod
    );

    // 累計投資額（自己資金ベース） = 初期投資 + 累計マイナスキャッシュフロー分
    const totalCashInvested = initialInvestment - Math.min(cumulativeCashFlow + initialInvestment, 0);

    // 損益分岐点価格
    // Net cash invested = 自分が実際に払った金額 - 受け取った金額 = -cumulativeCashFlow
    const netCashInvested = -cumulativeCashFlow;
    const breakEvenPrice = calcBreakEvenPrice(
      remainingLoan,
      Math.max(0, netCashInvested),
      sellingCosts.agentFeeRate,
      sellingCosts.agentFeeFixed,
      sellingCosts.otherSellingCosts
    );

    // 購入価格で売却した場合の費用・手残り・損益
    const sellingCostAtPurchasePrice = calcSellingCosts(
      prop.purchasePrice,
      sellingCosts.agentFeeRate,
      sellingCosts.agentFeeFixed,
      sellingCosts.otherSellingCosts
    );
    // 手残り = 売却価格 - 売却費用 - ローン残高
    const netProceeds = prop.purchasePrice - sellingCostAtPurchasePrice - remainingLoan;
    // 総合損益 = 手残り + 累計CF（初期投資分のマイナスを含む）
    const estimatedProfit = netProceeds + cumulativeCashFlow;

    annualData.push({
      year,
      rentalIncome: Math.round(rentalIncome),
      loanPayment: Math.round(loanResult.totalPayment),
      principalPayment: Math.round(loanResult.principalPayment),
      interestPayment: Math.round(loanResult.interestPayment),
      annualExpenses: Math.round(expenses),
      netCashFlow: Math.round(netCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      remainingLoan: Math.round(Math.max(0, remainingLoan)),
      totalCashInvested: Math.round(totalCashInvested),
      breakEvenPrice: Math.round(Math.max(0, breakEvenPrice)),
      estimatedProfit: Math.round(estimatedProfit),
      sellingCostsAmount: Math.round(sellingCostAtPurchasePrice),
      netProceeds: Math.round(netProceeds),
    });
  }

  return {
    downPayment: Math.round(downPayment),
    totalInitialCosts: Math.round(totalInitialCosts),
    monthlyPayment: Math.round(monthlyPayment),
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    annualData,
  };
}
