import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      handleClose();
    }
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 240);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <div
        className={`sheet-backdrop${closing ? ' closing' : ''}`}
        onClick={onClose}
      />
      <div className={`sheet${closing ? ' closing' : ''}`}>
        <div className="sheet-handle-bar" />
        {title && (
          <div className="sheet-header">
            <span className="sheet-title">{title}</span>
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="sheet-body">
          {children}
        </div>
        {footer && (
          <div className="sheet-footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
