import React from 'react';

const MABatchActionBar = ({ dirtyCount, isSaving, errorMessage, onSave, onCancel }) => {
  if (dirtyCount === 0 && !errorMessage) return null;

  return (
    <div className="ma-batch-bar">
      <div className="ma-batch-bar-info">
        {isSaving ? (
          <>
            <span className="ma-batch-spinner" />
            <span>Saving {dirtyCount} row{dirtyCount !== 1 ? 's' : ''}...</span>
          </>
        ) : errorMessage ? (
          <span className="ma-batch-error-text">{errorMessage}</span>
        ) : (
          <span><strong>{dirtyCount}</strong> unsaved change{dirtyCount !== 1 ? 's' : ''}</span>
        )}
      </div>
      <div className="ma-batch-bar-actions">
        <button
          className="ma-btn ma-btn-secondary ma-batch-cancel"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          className="ma-btn ma-btn-primary ma-batch-save"
          onClick={onSave}
          disabled={isSaving || dirtyCount === 0}
        >
          {isSaving ? 'Saving...' : `Save Changes (${dirtyCount})`}
        </button>
      </div>
    </div>
  );
};

export default MABatchActionBar;
