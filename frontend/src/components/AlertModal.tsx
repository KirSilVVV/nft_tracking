// Modal component with React Portal (renders to document.body)
import React from 'react';
import { createPortal } from 'react-dom';
import '../styles/Modal.css';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, children }) => {
  // Debug logging
  console.log('🔍 [Modal Debug] Rendering Modal component, show:', show);

  if (!show) {
    console.log('❌ [Modal Debug] show=false, returning null (not rendering)');
    return null;
  }

  console.log('✅ [Modal Debug] show=true, creating portal to document.body');
  console.log('📍 [Modal Debug] document.body:', document.body);
  console.log('👶 [Modal Debug] children:', children);

  return createPortal(
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </>,
    document.body
  );
};

export default Modal;
