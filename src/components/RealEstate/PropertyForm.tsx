import { useState } from 'react';
import type { RealEstateProperty } from '../../types/realEstate';

interface PropertyFormProps {
  onSubmit: (property: RealEstateProperty) => void;
  initialData?: RealEstateProperty;
  onCancel?: () => void;
}

export function PropertyForm({ onSubmit, initialData, onCancel }: PropertyFormProps) {
  const [step, setStep] = useState(0);

  const [name, setName] = useState(initialData?.property.name ?? '');
  const [purchasePrice, setPurchasePrice] = useState(initialData?.property.purchasePrice ?? 30000000);
  const [monthlyRent, setMonthlyRent] = useState(initialData?.property.monthlyRent ?? 120000);
  const [buildingAge, setBuildingAge] = useState(initialData?.property.buildingAge ?? 10);
  const [structure, setStructure] = useState<'RC' | 'SRC' | 'Wood' | 'Steel'>(
    initialData?.property.structure ?? 'RC'
  );
  const [floorArea, setFloorArea] = useState(initialData?.property.floorArea ?? 25);
  const [location, setLocation] = useState(initialData?.property.location ?? '');

  const [loanAmount, setLoanAmount] = useState(initialData?.loan.loanAmount ?? 27000000);
  const [interestRate, setInterestRate] = useState(initialData?.loan.interestRate ?? 1.5);
  const [loanTermYears, setLoanTermYears] = useState(initialData?.loan.loanTermYears ?? 35);
  const [repaymentMethod, setRepaymentMethod] = useState<'equal_installment' | 'equal_principal'>(
    initialData?.loan.repaymentMethod ?? 'equal_installment'
  );

  const [agentFee, setAgentFee] = useState(initialData?.initialCosts.agentFee ?? 1056000);
  const [registrationFee, setRegistrationFee] = useState(initialData?.initialCosts.registrationFee ?? 300000);
  const [stampDuty, setStampDuty] = useState(initialData?.initialCosts.stampDuty ?? 10000);
  const [acquisitionTax, setAcquisitionTax] = useState(initialData?.initialCosts.acquisitionTax ?? 300000);
  const [otherInitialCosts, setOtherInitialCosts] = useState(initialData?.initialCosts.otherCosts ?? 100000);

  const [propertyTax, setPropertyTax] = useState(initialData?.annualCosts.propertyTax ?? 80000);
  const [managementFee, setManagementFee] = useState(initialData?.annualCosts.managementFee ?? 10000);
  const [maintenanceReserve, setMaintenanceReserve] = useState(initialData?.annualCosts.maintenanceReserve ?? 8000);
  const [insurance, setInsurance] = useState(initialData?.annualCosts.insurance ?? 20000);
  const [vacancyRate, setVacancyRate] = useState(initialData?.annualCosts.vacancyRate ?? 5);
  const [pmFeeRate, setPmFeeRate] = useState(initialData?.annualCosts.pmFeeRate ?? 5);

  const [sellingAgentRate, setSellingAgentRate] = useState(initialData?.sellingCosts.agentFeeRate ?? 3);
  const [sellingAgentFixed, setSellingAgentFixed] = useState(initialData?.sellingCosts.agentFeeFixed ?? 60000);
  const [otherSellingCosts, setOtherSellingCosts] = useState(initialData?.sellingCosts.otherSellingCosts ?? 0);

  const steps = ['物件情報', 'ローン情報', '諸費用（購入時）', '年間費用', '売却時費用'];

  function handleSubmit() {
    const property: RealEstateProperty = {
      id: initialData?.id ?? crypto.randomUUID(),
      property: { name, purchasePrice, monthlyRent, buildingAge, structure, floorArea, location },
      loan: { loanAmount, interestRate, loanTermYears, repaymentMethod },
      initialCosts: { agentFee, registrationFee, stampDuty, acquisitionTax, otherCosts: otherInitialCosts },
      annualCosts: { propertyTax, managementFee, maintenanceReserve, insurance, vacancyRate, pmFeeRate },
      sellingCosts: { agentFeeRate: sellingAgentRate, agentFeeFixed: sellingAgentFixed, otherSellingCosts },
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
    };
    onSubmit(property);
  }

  function numInput(
    label: string,
    value: number,
    onChange: (v: number) => void,
    opts?: { suffix?: string; step?: number; min?: number; max?: number }
  ) {
    return (
      <div className="re-field">
        <label className="re-label">{label}</label>
        <div className="re-input-wrap">
          <input
            type="number"
            className="re-input"
            value={value}
            step={opts?.step ?? 1}
            min={opts?.min ?? 0}
            max={opts?.max}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {opts?.suffix && <span className="re-suffix">{opts.suffix}</span>}
        </div>
      </div>
    );
  }

  function textInput(label: string, value: string, onChange: (v: string) => void, placeholder?: string) {
    return (
      <div className="re-field">
        <label className="re-label">{label}</label>
        <input
          type="text"
          className="re-input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="re-form-grid">
            {textInput('物件名', name, setName, '例: 港区ワンルーム')}
            {numInput('購入価格', purchasePrice, setPurchasePrice, { suffix: '円', step: 100000 })}
            {numInput('想定家賃（月額）', monthlyRent, setMonthlyRent, { suffix: '円/月', step: 1000 })}
            {numInput('築年数', buildingAge, setBuildingAge, { suffix: '年' })}
            <div className="re-field">
              <label className="re-label">構造</label>
              <select
                className="re-input"
                value={structure}
                onChange={(e) => setStructure(e.target.value as 'RC' | 'SRC' | 'Wood' | 'Steel')}
              >
                <option value="RC">RC（鉄筋コンクリート）</option>
                <option value="SRC">SRC（鉄骨鉄筋コンクリート）</option>
                <option value="Steel">鉄骨造</option>
                <option value="Wood">木造</option>
              </select>
            </div>
            {numInput('専有面積', floorArea, setFloorArea, { suffix: '㎡', step: 0.1 })}
            {textInput('所在地', location, setLocation, '例: 東京都港区')}
          </div>
        );
      case 1:
        return (
          <div className="re-form-grid">
            {numInput('借入金額', loanAmount, setLoanAmount, { suffix: '円', step: 100000 })}
            {numInput('金利', interestRate, setInterestRate, { suffix: '%', step: 0.1, min: 0, max: 20 })}
            {numInput('返済期間', loanTermYears, setLoanTermYears, { suffix: '年', min: 1, max: 50 })}
            <div className="re-field">
              <label className="re-label">返済方式</label>
              <select
                className="re-input"
                value={repaymentMethod}
                onChange={(e) =>
                  setRepaymentMethod(e.target.value as 'equal_installment' | 'equal_principal')
                }
              >
                <option value="equal_installment">元利均等返済</option>
                <option value="equal_principal">元金均等返済</option>
              </select>
            </div>
            <div className="re-info-box">
              <div className="re-info-row">
                <span>頭金</span>
                <span>{(purchasePrice - loanAmount).toLocaleString()} 円</span>
              </div>
              <div className="re-info-row">
                <span>借入比率</span>
                <span>{((loanAmount / purchasePrice) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="re-form-grid">
            {numInput('仲介手数料', agentFee, setAgentFee, { suffix: '円', step: 10000 })}
            {numInput('登記費用', registrationFee, setRegistrationFee, { suffix: '円', step: 10000 })}
            {numInput('印紙税', stampDuty, setStampDuty, { suffix: '円', step: 1000 })}
            {numInput('不動産取得税', acquisitionTax, setAcquisitionTax, { suffix: '円', step: 10000 })}
            {numInput('その他初期費用', otherInitialCosts, setOtherInitialCosts, { suffix: '円', step: 10000 })}
            <div className="re-info-box">
              <div className="re-info-row">
                <span>諸費用合計</span>
                <span>
                  {(agentFee + registrationFee + stampDuty + acquisitionTax + otherInitialCosts).toLocaleString()} 円
                </span>
              </div>
              <div className="re-info-row">
                <span>購入価格比</span>
                <span>
                  {(
                    ((agentFee + registrationFee + stampDuty + acquisitionTax + otherInitialCosts) /
                      purchasePrice) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="re-form-grid">
            {numInput('固定資産税', propertyTax, setPropertyTax, { suffix: '円/年', step: 1000 })}
            {numInput('管理費', managementFee, setManagementFee, { suffix: '円/月', step: 100 })}
            {numInput('修繕積立金', maintenanceReserve, setMaintenanceReserve, { suffix: '円/月', step: 100 })}
            {numInput('火災保険料', insurance, setInsurance, { suffix: '円/年', step: 1000 })}
            {numInput('空室率', vacancyRate, setVacancyRate, { suffix: '%', step: 0.5, min: 0, max: 100 })}
            {numInput('管理委託料率', pmFeeRate, setPmFeeRate, { suffix: '%', step: 0.5, min: 0, max: 30 })}
          </div>
        );
      case 4:
        return (
          <div className="re-form-grid">
            {numInput('仲介手数料率', sellingAgentRate, setSellingAgentRate, {
              suffix: '%',
              step: 0.1,
              min: 0,
              max: 10,
            })}
            {numInput('仲介手数料（固定分）', sellingAgentFixed, setSellingAgentFixed, { suffix: '円', step: 10000 })}
            {numInput('その他売却費用', otherSellingCosts, setOtherSellingCosts, { suffix: '円', step: 10000 })}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="re-form-container">
      <div className="re-steps">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`re-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => setStep(i)}
          >
            <span className="re-step-num">{i + 1}</span>
            <span className="re-step-label">{s}</span>
          </div>
        ))}
      </div>

      <div className="re-form-body">
        <h3 className="re-form-title">{steps[step]}</h3>
        {renderStep()}
      </div>

      <div className="re-form-actions">
        {onCancel && (
          <button className="btn btn-ghost" onClick={onCancel}>
            キャンセル
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            戻る
          </button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
            次へ
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit}>
            {initialData ? '更新する' : '登録してシミュレーション'}
          </button>
        )}
      </div>
    </div>
  );
}
