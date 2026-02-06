import React, { useState } from 'react';

const INITIAL_FORM = {
  project_name: '',
  project_type: 'M&A',
  plant_owner: '',
  contact: '',
  legacy_nameplate_capacity_mw: '',
  tech: '',
  fuel: '',
  iso: '',
  legacy_cod: '',
  capacity_factor_2024: '',
  ma_tier: '',
  ma_investment: '',
  ma_irr: '',
  ma_moic: '',
  ma_payback_period: '',
  ma_ntm_ebitda: '',
  ma_ev_ebitda_multiple: '',
  ma_avg_5yr_ebitda: '',
  ma_avg_5yr_multiple: '',
  ma_projected_useful_life: '',
  ma_contracted_hedged_capacity: '',
  ma_capacity_market_structure: '',
  ma_capacity_contract_term: '',
  ma_capacity_contract_price: '',
};

const SECTIONS = [
  {
    title: 'Basic Information',
    fields: [
      { key: 'project_name', label: 'Project Name', type: 'text', required: true },
      { key: 'plant_owner', label: 'Plant Owner', type: 'text' },
      { key: 'contact', label: 'Contact', type: 'text' },
      { key: 'iso', label: 'ISO/RTO (Market)', type: 'select', optionsKey: 'isoOptions' },
      { key: 'legacy_nameplate_capacity_mw', label: 'Capacity (MW)', type: 'number' },
      { key: 'tech', label: 'Technology', type: 'text' },
      { key: 'fuel', label: 'Fuel', type: 'text' },
      { key: 'legacy_cod', label: 'COD (Year)', type: 'text', placeholder: 'e.g. 1992' },
      { key: 'capacity_factor_2024', label: 'LTM Capacity Factor (%)', type: 'text', placeholder: 'e.g. 8.3% or <5%' },
      { key: 'ma_tier', label: 'M&A Tier (Status)', type: 'select', optionsKey: 'maTierOptions' },
    ]
  },
  {
    title: 'Valuation',
    fields: [
      { key: 'ma_investment', label: 'Investment (USD)', type: 'number', placeholder: 'e.g. 32000000' },
      { key: 'ma_irr', label: 'Unlevered IRR (%)', type: 'number', step: '0.1', placeholder: 'e.g. 16.1' },
      { key: 'ma_moic', label: 'MOIC', type: 'number', step: '0.01', placeholder: 'e.g. 1.54' },
      { key: 'ma_payback_period', label: 'Payback Period (Years)', type: 'number', step: '0.1' },
      { key: 'ma_ntm_ebitda', label: 'NTM EBITDA (USD)', type: 'number' },
      { key: 'ma_ev_ebitda_multiple', label: 'EV/EBITDA Multiple', type: 'number', step: '0.1' },
      { key: 'ma_avg_5yr_ebitda', label: 'Avg 5yr EBITDA (USD)', type: 'number' },
      { key: 'ma_avg_5yr_multiple', label: 'Avg 5yr Multiple', type: 'number', step: '0.1' },
      { key: 'ma_projected_useful_life', label: 'Projected Useful Life (Years)', type: 'number', step: '0.1' },
    ]
  },
  {
    title: 'Capacity & Contracts',
    fields: [
      { key: 'ma_contracted_hedged_capacity', label: 'Contracted/Hedged Capacity', type: 'textarea', placeholder: "e.g. '26-'30: 55% GM Contracted" },
      { key: 'ma_capacity_market_structure', label: 'Capacity Market Structure', type: 'text', placeholder: 'e.g. Multi-Year Forward' },
      { key: 'ma_capacity_contract_term', label: 'Capacity Contract Term', type: 'text', placeholder: 'e.g. 3 Yrs' },
      { key: 'ma_capacity_contract_price', label: 'Capacity Contract Price ($/kW-mo)', type: 'number', step: '0.01' },
    ]
  }
];

const MAAddProjectModal = ({ isOpen, onClose, onSubmit, isoOptions, maTierOptions, customFields = [] }) => {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_name.trim()) {
      setError('Project name is required');
      return;
    }

    // Clean empty strings to null for numeric fields
    const cleaned = { ...form };
    Object.keys(cleaned).forEach(k => {
      if (cleaned[k] === '') cleaned[k] = null;
    });
    cleaned.project_type = 'M&A';

    setSaving(true);
    try {
      await onSubmit(cleaned);
      setForm({ ...INITIAL_FORM });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const getOptions = (optionsKey) => {
    if (optionsKey === 'isoOptions') return isoOptions || [];
    if (optionsKey === 'maTierOptions') return maTierOptions || [];
    return [];
  };

  return (
    <div className="ma-modal-overlay" onClick={onClose}>
      <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ma-modal-header">
          <h2>New M&A Project</h2>
          <button className="ma-modal-close" onClick={onClose}>&#10005;</button>
        </div>

        <form onSubmit={handleSubmit} className="ma-modal-body">
          {error && <div className="ma-modal-error">{error}</div>}

          {SECTIONS.map((section) => (
            <div key={section.title} className="ma-form-section">
              <h3 className="ma-form-section-title">{section.title}</h3>
              <div className="ma-form-grid">
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className={`ma-form-field ${field.type === 'textarea' ? 'ma-form-field-wide' : ''}`}
                  >
                    <label className="ma-form-label">
                      {field.label}
                      {field.required && <span className="ma-form-required">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="ma-form-input"
                        value={form[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      >
                        <option value="">-- Select --</option>
                        {getOptions(field.optionsKey).map((opt) => {
                          const val = typeof opt === 'object' ? opt.value : opt;
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="ma-form-input ma-form-textarea"
                        value={form[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <input
                        className="ma-form-input"
                        type={field.type}
                        step={field.step}
                        value={form[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Custom fields section */}
          {customFields.length > 0 && (
            <div className="ma-form-section">
              <h3 className="ma-form-section-title">Custom Fields</h3>
              <div className="ma-form-grid">
                {customFields.map((cf) => (
                  <div key={cf.column_name} className="ma-form-field">
                    <label className="ma-form-label">{cf.display_name}</label>
                    <input
                      className="ma-form-input"
                      type={cf.data_type === 'number' ? 'number' : cf.data_type === 'date' ? 'date' : 'text'}
                      value={form[cf.column_name] || ''}
                      onChange={(e) => handleChange(cf.column_name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ma-modal-footer">
            <button type="button" className="ma-btn ma-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="ma-btn ma-btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MAAddProjectModal;
