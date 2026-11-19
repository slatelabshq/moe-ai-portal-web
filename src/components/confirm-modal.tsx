'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** When set, the second button runs this and does not dismiss. Overlay and Escape still call onCancel. */
  onSecondary?: () => void;
  busy?: boolean;
  /** Disables confirm only. Cancel stays available. */
  confirmDisabled?: boolean;
  danger?: boolean;
};

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Keep it',
  onConfirm,
  onCancel,
  onSecondary,
  busy,
  confirmDisabled,
  danger,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        className="ov open"
        aria-label="Close dialog"
        onClick={onCancel}
        style={{ border: 0, padding: 0, cursor: 'pointer' }}
      />
      <div
        className="mdl mdl-center open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mdl-title"
      >
        <h3 id="mdl-title">{title}</h3>
        {children ? (
          <div style={{ margin: '10px 0 20px' }}>{children}</div>
        ) : (
          <div style={{ margin: '10px 0 20px' }} />
        )}
        <div className="row">
          <button
            type="button"
            className={`btn${danger ? '' : ''}`}
            disabled={busy || confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="btn o"
            disabled={busy}
            onClick={onSecondary ?? onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}