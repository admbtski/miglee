'use client';

import { Modal } from '@/components/feedback/modal';
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Link as LinkIcon,
  QrCode,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: (url: string, title: string, description?: string) => void;
}

export function ShareModal({
  open,
  onClose,
  url,
  title,
  description,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      name: copied ? 'Skopiowano!' : 'Kopiuj link',
      icon: LinkIcon,
      color: copied
        ? 'bg-green-600 hover:bg-green-700'
        : 'bg-violet-600 hover:bg-violet-700',
      action: handleCopyLink,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: (url) => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank',
          'width=600,height=400'
        );
      },
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: (url, title) => {
        window.open(
          `https://twitter.com/event/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank',
          'width=600,height=400'
        );
      },
    },
    {
      id: 'messenger',
      name: 'Messenger',
      icon: MessageCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: (url) => {
        window.open(
          `fb-messenger://share/?link=${encodeURIComponent(url)}`,
          '_blank'
        );
      },
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color:
        'bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 hover:opacity-90',
      action: () => {
        // Instagram doesn't have direct sharing API, copy link instead
        handleCopyLink();
      },
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'bg-zinc-600 hover:bg-zinc-700',
      action: (url, title, description) => {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`${description || ''}\n\n${url}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      },
    },
    {
      id: 'qr',
      name: 'QR Code',
      icon: QrCode,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => {
        setShowQR(true);
      },
    },
  ];

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centered"
      size="sm"
      density="comfortable"
      closeOnBackdrop
      closeOnEsc
      header={
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Udostępnij wydarzenie
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Wybierz sposób udostępnienia
          </p>
        </div>
      }
      content={
        <div className="space-y-6">
          {!showQR ? (
            <>
              {/* Share Options Grid */}
              <div className="grid grid-cols-4 gap-4">
                {shareOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    type="button"
                    onClick={() => option.action(url, title, description)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2.5 rounded-xl p-3 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div
                      className={twMerge(
                        'flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all',
                        option.color
                      )}
                    >
                      <option.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight">
                      {option.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* URL Display */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="truncate text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                  {url}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* QR Code Display */}
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="rounded-2xl border-4 border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                  <img src={qrCodeUrl} alt="QR Code" className="h-64 w-64" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Zeskanuj kod QR
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    aby otworzyć wydarzenie na telefonie
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQR(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  ← Powrót do opcji udostępniania
                </button>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
