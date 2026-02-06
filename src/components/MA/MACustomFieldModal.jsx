import React, { useState } from 'react';

const MACustomFieldModal = ({ isOpen, onClose, customFields, onAdd, onRemove }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('text');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Field name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onAdd(newName.trim(), newType);
      setNewName('');
      setNewType('text');
    } catch (err) {
      setError(err.message || 'Failed to add field');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (field) => {
    if (!window.confirm(`Remove custom field "${field.display_name}"? This will delete the column and all its data from the database.`)) return;
    setRemoving(field.id);
    setError('');
    try {
      await onRemove(field.id);
    } catch (err) {
      setError(err.message || 'Failed to remove field');
    } finally {
      setRemoving(null);
    }
  };

  const typeLabel = { text: 'Text', number: 'Number', date: 'Date' };

  return (
    <div className="ma-modal-overlay" onClick={onClose}>
      <div className="ma-modal ma-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="ma-modal-header">
          <h2>Manage Custom Fields</h2>
          <button className="ma-modal-close" onClick={onClose}>&#10005;</button>
        </div>

        <div className="ma-modal-body">
          {error && <div className="ma-modal-error">{error}</div>}

          {/* Add new field */}
          <form onSubmit={handleAdd} className="ma-cf-add-form">
            <div className="ma-cf-add-row">
              <input
                type="text"
                className="ma-form-input"
                placeholder="Field name (e.g. Debt Ratio)"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setError(''); }}
              />
              <select
                className="ma-form-input ma-cf-type-select"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
              <button type="submit" className="ma-btn ma-btn-primary" disabled={saving}>
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>

          {/* Existing custom fields list */}
          <div className="ma-cf-list">
            {customFields.length === 0 ? (
              <p className="ma-cf-empty">No custom fields yet. Add one above.</p>
            ) : (
              customFields.map((field) => (
                <div key={field.id} className="ma-cf-item">
                  <div className="ma-cf-info">
                    <span className="ma-cf-name">{field.display_name}</span>
                    <span className="ma-cf-type">{typeLabel[field.data_type] || field.data_type}</span>
                  </div>
                  <button
                    className="ma-cf-remove-btn"
                    onClick={() => handleRemove(field)}
                    disabled={removing === field.id}
                  >
                    {removing === field.id ? '...' : 'Remove'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MACustomFieldModal;
