import React from 'react';

const fmt = (val) => {
  if (val == null || val === '') return '—';
  return String(val);
};

const fmtCurrency = (val) => {
  if (val == null || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return fmt(val);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}mm`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
};

const fmtNum = (val, decimals = 0) => {
  if (val == null || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return fmt(val);
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const calcDollarPerKw = (investment, capacityMw) => {
  const inv = Number(investment);
  const cap = Number(capacityMw);
  if (!inv || !cap) return null;
  return Math.round(inv / (cap * 1000));
};

const getTierColor = (tierName, tierColor) => {
  if (tierColor) return tierColor;
  const colors = {
    'Owned': '#8b5cf6',
    'Signed': '#10b981',
    'Exclusivity': '#10b981',
    'second round': '#3b82f6',
    'first round': '#f59e0b',
    'pipeline': '#6b7280',
    'passed': '#ef4444'
  };
  return colors[tierName] || '#6b7280';
};

const MATableRow = ({ project, customFields = [] }) => {
  const dollarPerKw = calcDollarPerKw(project.ma_investment, project.legacy_nameplate_capacity_mw);
  const tierColor = getTierColor(project.ma_tier, project.ma_tier_color);

  return (
    <tr className="ma-table-row">
      {/* Project Name */}
      <td className="ma-cell ma-cell-name">
        <div className="ma-project-name">
          <span className="ma-dot" style={{ background: tierColor }}></span>
          {project.project_name || '—'}
        </div>
      </td>

      {/* Capacity (MW) */}
      <td className="ma-cell ma-cell-right ma-cell-mono">
        {project.legacy_nameplate_capacity_mw ? fmtNum(project.legacy_nameplate_capacity_mw) : '—'}
      </td>

      {/* Investment + $/kW */}
      <td className="ma-cell ma-cell-right ma-cell-mono">
        <div className="ma-cell-primary">{fmtCurrency(project.ma_investment)}</div>
        {dollarPerKw && <div className="ma-cell-secondary">${dollarPerKw}/kW</div>}
      </td>

      {/* IRR / MOIC */}
      <td className="ma-cell ma-cell-center">
        {project.ma_irr != null ? (
          <span className="ma-irr-badge">{Number(project.ma_irr).toFixed(1)}%</span>
        ) : '—'}
        {project.ma_moic != null && (
          <span className="ma-moic-text">{Number(project.ma_moic).toFixed(2)}x</span>
        )}
      </td>

      {/* Payback Period */}
      <td className="ma-cell ma-cell-center">
        {project.ma_payback_period != null ? `${Number(project.ma_payback_period).toFixed(1)} Yrs` : '—'}
      </td>

      {/* NTM EBITDA + EV/EBITDA */}
      <td className="ma-cell ma-cell-right ma-cell-mono">
        <div>{fmtCurrency(project.ma_ntm_ebitda)}</div>
        {project.ma_ev_ebitda_multiple != null && (
          <div className="ma-cell-secondary">{Number(project.ma_ev_ebitda_multiple).toFixed(1)}x EV</div>
        )}
      </td>

      {/* Avg 5yr EBITDA + Multiple */}
      <td className="ma-cell ma-cell-right ma-cell-mono">
        <div>{fmtCurrency(project.ma_avg_5yr_ebitda)}</div>
        {project.ma_avg_5yr_multiple != null && (
          <div className="ma-cell-secondary">{Number(project.ma_avg_5yr_multiple).toFixed(1)}x</div>
        )}
      </td>

      {/* LTM Capacity Factor */}
      <td className="ma-cell ma-cell-center">
        {project.capacity_factor_2024 != null ? `${project.capacity_factor_2024}%` : '—'}
      </td>

      {/* COD / Projected Useful Life */}
      <td className="ma-cell ma-cell-center">
        <div>{fmt(project.legacy_cod)}</div>
        {project.ma_projected_useful_life != null && (
          <div className="ma-cell-secondary">{Number(project.ma_projected_useful_life).toFixed(0)} Yrs</div>
        )}
      </td>

      {/* Contracted/Hedged Capacity */}
      <td className="ma-cell ma-cell-wrap">
        {fmt(project.ma_contracted_hedged_capacity)}
      </td>

      {/* Capacity Market Structure */}
      <td className="ma-cell">
        {fmt(project.ma_capacity_market_structure)}
      </td>

      {/* Capacity Contract Term */}
      <td className="ma-cell">
        {fmt(project.ma_capacity_contract_term)}
      </td>

      {/* Capacity Contract Price */}
      <td className="ma-cell ma-cell-right ma-cell-mono">
        {project.ma_capacity_contract_price != null
          ? `$${Number(project.ma_capacity_contract_price).toFixed(2)}/kW-mo`
          : fmt(project.ma_capacity_contract_price)}
      </td>

      {/* Market */}
      <td className="ma-cell ma-cell-market">
        {project.iso ? (
          <span className="ma-market-badge">{project.iso}</span>
        ) : '—'}
      </td>

      {/* Status */}
      <td className="ma-cell ma-cell-center">
        {project.ma_tier ? (
          <span className="ma-status-badge" style={{ background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}>
            {project.ma_tier}
          </span>
        ) : '—'}
      </td>

      {/* Custom fields */}
      {customFields.map((cf) => (
        <td key={cf.column_name} className={`ma-cell ${cf.data_type === 'number' ? 'ma-cell-right ma-cell-mono' : ''}`}>
          {fmt(project[cf.column_name])}
        </td>
      ))}

    </tr>
  );
};

export default MATableRow;
