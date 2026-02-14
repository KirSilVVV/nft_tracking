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
  if (!show) return null;

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
