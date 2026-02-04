interface PriceChangeProps {
  value: number;
  percent?: number;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceChange({ value, percent, showBadge = false, size = 'md' }: PriceChangeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const className = isNeutral ? 'price-neutral' : isPositive ? 'price-up' : 'price-down';
  const arrow = isPositive ? '\u25B2' : '\u25BC';
  const sign = isPositive ? '+' : '';

  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '15px' : '12px';

  if (showBadge) {
    return (
      <span className={`change-badge ${isPositive ? 'up' : 'down'}`}>
        {arrow} {sign}{value.toFixed(2)} {percent !== undefined && `(${sign}${percent.toFixed(2)}%)`}
      </span>
    );
  }

  return (
    <span className={className} style={{ fontFamily: 'var(--font-mono)', fontSize, fontWeight: 500 }}>
      {!isNeutral && arrow} {sign}{value.toFixed(2)}
      {percent !== undefined && ` (${sign}${percent.toFixed(2)}%)`}
    </span>
  );
}
