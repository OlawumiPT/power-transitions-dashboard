import React from 'react';

const MAEditRow = ({ project, editedValues, onChange, isoOptions, maTierOptions, customFields = [], isDirty, saveResult }) => {
  const getVal = (field) => {
    if (editedValues && editedValues[field] !== undefined) return editedValues[field];
    return project[field] ?? '';
  };

  const handleChange = (field, value) => {
    onChange(project.id, field, value);
  };

  const rowClass = [
    'ma-edit-row',
    isDirty && 'ma-edit-row-dirty',
    saveResult === 'success' && 'ma-edit-row-saved',
    saveResult === 'error' && 'ma-edit-row-error',
  ].filter(Boolean).join(' ');

  return (
    <tr className={rowClass}>
      {/* Project Name */}
      <td className="ma-cell ma-cell-name ma-edit-cell">
        <input type="text" className="ma-edit-input" value={getVal('project_name')}
          onChange={(e) => handleChange('project_name', e.target.value)} />
      </td>

      {/* Capacity (MW) */}
      <td className="ma-cell ma-edit-cell">
        <input type="number" className="ma-edit-input ma-edit-right" value={getVal('legacy_nameplate_capacity_mw')}
          onChange={(e) => handleChange('legacy_nameplate_capacity_mw', e.target.value)} />
      </td>

      {/* Investment */}
      <td className="ma-cell ma-edit-cell">
        <input type="number" className="ma-edit-input ma-edit-right" value={getVal('ma_investment')}
          onChange={(e) => handleChange('ma_investment', e.target.value)} placeholder="USD" />
      </td>

      {/* IRR / MOIC */}
      <td className="ma-cell ma-edit-cell">
        <div className="ma-edit-dual">
          <input type="number" step="0.1" className="ma-edit-input ma-edit-center ma-edit-small"
            value={getVal('ma_irr')} onChange={(e) => handleChange('ma_irr', e.target.value)} placeholder="IRR %" />
          <input type="number" step="0.01" className="ma-edit-input ma-edit-center ma-edit-small"
            value={getVal('ma_moic')} onChange={(e) => handleChange('ma_moic', e.target.value)} placeholder="MOIC" />
        </div>
      </td>

      {/* Payback Period */}
      <td className="ma-cell ma-edit-cell">
        <input type="number" step="0.1" className="ma-edit-input ma-edit-center" value={getVal('ma_payback_period')}
          onChange={(e) => handleChange('ma_payback_period', e.target.value)} placeholder="Years" />
      </td>

      {/* NTM EBITDA + EV/EBITDA */}
      <td className="ma-cell ma-edit-cell">
        <div className="ma-edit-dual">
          <input type="number" className="ma-edit-input ma-edit-right ma-edit-small"
            value={getVal('ma_ntm_ebitda')} onChange={(e) => handleChange('ma_ntm_ebitda', e.target.value)} placeholder="EBITDA" />
          <input type="number" step="0.1" className="ma-edit-input ma-edit-right ma-edit-small"
            value={getVal('ma_ev_ebitda_multiple')} onChange={(e) => handleChange('ma_ev_ebitda_multiple', e.target.value)} placeholder="EV mult" />
        </div>
      </td>

      {/* Avg 5yr EBITDA + Multiple */}
      <td className="ma-cell ma-edit-cell">
        <div className="ma-edit-dual">
          <input type="number" className="ma-edit-input ma-edit-right ma-edit-small"
            value={getVal('ma_avg_5yr_ebitda')} onChange={(e) => handleChange('ma_avg_5yr_ebitda', e.target.value)} placeholder="5yr EBITDA" />
          <input type="number" step="0.1" className="ma-edit-input ma-edit-right ma-edit-small"
            value={getVal('ma_avg_5yr_multiple')} onChange={(e) => handleChange('ma_avg_5yr_multiple', e.target.value)} placeholder="5yr mult" />
        </div>
      </td>

      {/* LTM Capacity Factor */}
      <td className="ma-cell ma-edit-cell">
        <input type="text" className="ma-edit-input ma-edit-center" value={getVal('capacity_factor_2024')}
          onChange={(e) => handleChange('capacity_factor_2024', e.target.value)} placeholder="%" />
      </td>

      {/* COD / Projected Useful Life */}
      <td className="ma-cell ma-edit-cell">
        <div className="ma-edit-dual">
          <input type="text" className="ma-edit-input ma-edit-center ma-edit-small" value={getVal('legacy_cod')}
            onChange={(e) => handleChange('legacy_cod', e.target.value)} placeholder="COD year" />
          <input type="number" step="0.1" className="ma-edit-input ma-edit-center ma-edit-small"
            value={getVal('ma_projected_useful_life')} onChange={(e) => handleChange('ma_projected_useful_life', e.target.value)} placeholder="Useful life" />
        </div>
      </td>

      {/* Contracted/Hedged Capacity */}
      <td className="ma-cell ma-edit-cell">
        <input type="text" className="ma-edit-input" value={getVal('ma_contracted_hedged_capacity')}
          onChange={(e) => handleChange('ma_contracted_hedged_capacity', e.target.value)} />
      </td>

      {/* Capacity Market Structure */}
      <td className="ma-cell ma-edit-cell">
        <input type="text" className="ma-edit-input" value={getVal('ma_capacity_market_structure')}
          onChange={(e) => handleChange('ma_capacity_market_structure', e.target.value)} />
      </td>

      {/* Capacity Contract Term */}
      <td className="ma-cell ma-edit-cell">
        <input type="text" className="ma-edit-input" value={getVal('ma_capacity_contract_term')}
          onChange={(e) => handleChange('ma_capacity_contract_term', e.target.value)} />
      </td>

      {/* Capacity Contract Price */}
      <td className="ma-cell ma-edit-cell">
        <input type="number" step="0.01" className="ma-edit-input ma-edit-right" value={getVal('ma_capacity_contract_price')}
          onChange={(e) => handleChange('ma_capacity_contract_price', e.target.value)} placeholder="$/kW-mo" />
      </td>

      {/* Market */}
      <td className="ma-cell ma-edit-cell">
        <select className="ma-edit-select" value={getVal('iso')}
          onChange={(e) => handleChange('iso', e.target.value)}>
          <option value="">--</option>
          {(isoOptions || []).map((iso) => (
            <option key={iso} value={iso}>{iso}</option>
          ))}
        </select>
      </td>

      {/* Status */}
      <td className="ma-cell ma-edit-cell">
        <select className="ma-edit-select" value={getVal('ma_tier')}
          onChange={(e) => handleChange('ma_tier', e.target.value)}>
          <option value="">--</option>
          {(maTierOptions || []).map((t) => (
            <option key={t.value || t} value={t.value || t}>{t.value || t}</option>
          ))}
        </select>
      </td>

      {/* Custom fields */}
      {customFields.map((cf) => (
        <td key={cf.column_name} className="ma-cell ma-edit-cell">
          <input
            type={cf.data_type === 'number' ? 'number' : cf.data_type === 'date' ? 'date' : 'text'}
            className={`ma-edit-input ${cf.data_type === 'number' ? 'ma-edit-right' : ''}`}
            value={getVal(cf.column_name)}
            onChange={(e) => handleChange(cf.column_name, e.target.value)}
            placeholder={cf.display_name}
          />
        </td>
      ))}

    </tr>
  );
};

export default MAEditRow;
