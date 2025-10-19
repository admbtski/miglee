'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function ModalShell({
  open,
  onClose,
  children,
  title,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
}) {
  // lock background scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 grid p-4 place-items-center">
        <div
          className={`w-full ${maxWidth} overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950 text-zinc-50 shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button
              className="grid rounded-lg h-9 w-9 place-items-center text-zinc-400 hover:bg-zinc-800"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
