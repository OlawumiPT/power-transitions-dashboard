import React from 'react';

const MAConfirmModal = ({ isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="ma-modal-overlay" onClick={onCancel}>
      <div className="ma-modal ma-modal-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="ma-modal-header">
          <h2>{title || 'Confirm'}</h2>
        </div>
        <div className="ma-modal-body">
          <p className="ma-confirm-message">{message}</p>
        </div>
        <div className="ma-confirm-footer">
          <button className="ma-btn ma-btn-secondary" onClick={onCancel}>
            {cancelLabel || 'Cancel'}
          </button>
          <button className="ma-btn ma-btn-danger" onClick={onConfirm}>
            {confirmLabel || 'Discard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MAConfirmModal;
