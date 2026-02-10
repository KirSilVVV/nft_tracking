// SystemModal - Universal system modal for Success/Error/Warning/Confirmation/Loading

import React from 'react';
import '../../styles/modals.css';

export type SystemModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'loading';

interface SystemModalProps {
  isOpen: boolean;
  type: SystemModalType;
  title: string;
  message: string;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmList?: string[]; // For confirmation modals with list of actions
  showCloseButton?: boolean;
  isDangerous?: boolean; // For delete/destructive actions
}

const ICONS: Record<SystemModalType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
  confirm: '❓',
  loading: '⏳',
};

const ICON_CLASSES: Record<SystemModalType, string> = {
  success: 'icon-success',
  error: 'icon-error',
  warning: 'icon-warning',
  info: 'icon-info',
  confirm: 'icon-warning',
  loading: 'icon-loading',
};

const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmList,
  showCloseButton = true,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (type !== 'loading' && onClose) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  const showActions = type === 'confirm' || (type !== 'loading' && onConfirm);
  const buttonClass = isDangerous ? 'btn-danger' : 'btn-primary';

  return (
    <div
      className={`modal-overlay ${isOpen ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="system-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        {showCloseButton && type !== 'loading' && onClose && (
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        )}

        {/* Content */}
        <div className="modal-content">
          {/* Icon */}
          <div className={`modal-icon ${ICON_CLASSES[type]}`}>
            {ICONS[type]}
          </div>

          {/* Title */}
          <h2 className="modal-title">{title}</h2>

          {/* Message */}
          <p className="modal-message">{message}</p>

          {/* Confirmation List */}
          {confirmList && confirmList.length > 0 && (
            <div className="confirmation-list">
              {confirmList.map((item, index) => (
                <div key={index} className="confirmation-list-item">
                  <span className="confirmation-list-icon">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="modal-actions">
              {onCancel && (
                <button className="btn btn-ghost" onClick={handleCancel}>
                  {cancelText}
                </button>
              )}
              {onConfirm && (
                <button className={`btn ${buttonClass}`} onClick={handleConfirm}>
                  {confirmText}
                </button>
              )}
            </div>
          )}

          {/* Single OK button for success/error/warning/info */}
          {!showActions && type !== 'loading' && (
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose}>
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemModal;
