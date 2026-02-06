import { useEffect, useState } from 'react';

export function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  };

  return (
    <header className="header">
      <div className="header-logo">
        <div className="logo-icon">S</div>
        SILVER
      </div>

      <div className="header-time">
        <span>{formatDate(time)}</span>
        <span style={{ fontWeight: 600 }}>{formatTime(time)}</span>
        <span style={{ color: 'var(--text-muted)' }}>JST</span>
      </div>
    </header>
  );
}
