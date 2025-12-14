/**
 * User QR Code Component
 * Displays individual user QR code for check-in
 */

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize2, RefreshCw, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRotateMemberCheckinTokenMutation } from '@/features/events/api/checkin';

interface UserQRCodeProps {
  eventId: string;
  userId: string;
  memberId: string;
  token: string | null;
  eventName: string;
  userName: string;
  onTokenRotated?: (newToken: string) => void;
}

export function UserQRCode({
  eventId,
  userId,
  memberId,
  token,
  eventName,
  userName,
  onTokenRotated,
}: UserQRCodeProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const rotateTokenMutation = useRotateMemberCheckinTokenMutation();

  if (!token) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Your personal QR code is not available yet.
        </div>
      </div>
    );
  }

  // Generate check-in URL with user token
  const checkinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/checkin/user?token=${token}`;

  const handleRotateToken = async () => {
    try {
      const result = await rotateTokenMutation.mutateAsync({
        eventId,
        userId: memberId,
      });

      // Get new token from result
      const newToken = result?.rotateMemberCheckinToken?.memberCheckinToken;

      if (newToken && onTokenRotated) {
        onTokenRotated(newToken);
      }

      toast.success('QR code token rotated', {
        description: 'Your old QR code is no longer valid',
      });
    } catch (error) {
      toast.error('Failed to rotate token', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById(`user-qr-code-${userId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 800;
      canvas.height = 1000;

      if (!ctx) return;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Event name
      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.fillText(eventName, canvas.width / 2, 50);

      // User name
      ctx.fillStyle = '#3f3f46';
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      ctx.fillText(userName, canvas.width / 2, 90);

      // QR code
      ctx.drawImage(img, 150, 130, 500, 500);

      // Instructions
      ctx.fillStyle = '#71717a';
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      ctx.fillText('Show this code to event staff', canvas.width / 2, 680);

      // Footer
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      ctx.fillText('Personal check-in code', canvas.width / 2, 720);

      // Download
      const link = document.createElement('a');
      link.download = `${eventName.replace(/\s+/g, '-')}-my-ticket.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <>
      <div className="space-y-4">
        {/* QR Code Display */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {eventName}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {userName}
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-300">
              <QRCodeSVG
                id={`user-qr-code-${userId}`}
                value={checkinUrl}
                size={200}
                level="H"
                bgColor="#ffffff"
                fgColor="#18181b"
              />
            </div>

            <div className="mt-4 text-center">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Show this code to event staff
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsFullScreen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <Maximize2 className="h-4 w-4" />
            Full Screen
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>

        {/* Rotate Token Button */}
        <button
          onClick={handleRotateToken}
          disabled={rotateTokenMutation.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          title="Rotate token (if compromised)"
        >
          <RefreshCw
            className={`h-4 w-4 ${rotateTokenMutation.isPending ? 'animate-spin' : ''}`}
          />
          {rotateTokenMutation.isPending ? 'Rotating...' : 'Rotate Token'}
        </button>

        {/* Info Notice */}
        <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
            Your Personal Code
          </div>
          <div className="text-xs text-blue-800 dark:text-blue-200">
            This QR code is unique to you. Don&apos;t share it with others.
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-4"
            onClick={() => setIsFullScreen(false)}
          >
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center max-w-md w-full"
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {eventName}
                </h2>
                <p className="text-lg text-white/80">{userName}</p>
              </div>

              <div className="rounded-2xl bg-white p-8 shadow-2xl w-full flex justify-center">
                <QRCodeSVG
                  value={checkinUrl}
                  size={400}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#18181b"
                />
              </div>

              <div className="mt-6 text-center">
                <p className="text-white/90 font-medium mb-1">
                  Show this code to event staff
                </p>
                <p className="text-sm text-white/60">
                  Press ESC or tap outside to close
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
