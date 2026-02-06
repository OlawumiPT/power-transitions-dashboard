import React from 'react';

const fmtCurrency = (val) => {
  if (val == null || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return '—';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}mm`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
};

const MAKPICards = ({ stats, loading }) => {
  const cards = [
    {
      label: 'Total Pipeline',
      value: loading ? '...' : `${Number(stats?.total_pipeline_mw || 0).toLocaleString()} MW`,
      sub: `${stats?.total_deals || 0} projects`
    },
    {
      label: 'Total Investment',
      value: loading ? '...' : fmtCurrency(stats?.total_investment),
      sub: `Across ${stats?.total_deals || 0} projects`
    },
    {
      label: 'Avg EV/EBITDA',
      value: loading ? '...' : stats?.avg_ev_ebitda ? `${stats.avg_ev_ebitda}x` : '—',
      sub: 'NTM multiple'
    },
    {
      label: 'Active Deals',
      value: loading ? '...' : String(stats?.active_deals || 0),
      sub: `of ${stats?.total_deals || 0} total`
    }
  ];

  return (
    <div className="ma-kpi-grid">
      {cards.map((card) => (
        <div key={card.label} className="ma-kpi-card">
          <div className="ma-kpi-label">{card.label}</div>
          <div className="ma-kpi-value">{card.value}</div>
          {card.sub && <div className="ma-kpi-sub">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
};

export default MAKPICards;
