/**
 * Event QR Code Component
 * Displays shared QR code for event check-in
 */

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Maximize2,
  RefreshCw,
  X,
  FileDown,
  ImageDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventQRCodeProps {
  eventId: string;
  token: string | null;
  eventName: string;
  onRotateToken?: () => Promise<void>;
}

export function EventQRCode({
  eventId,
  token,
  eventName,
  onRotateToken,
}: EventQRCodeProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  if (!token) {
    return (
      <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <div className="text-sm text-zinc-500">
          QR Code not generated yet. Enable check-in to generate a QR code.
        </div>
      </div>
    );
  }

  // Generate check-in URL
  const checkinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/checkin/event/${eventId}?token=${token}`;

  const handleRotateToken = async () => {
    if (!onRotateToken) return;
    setIsRotating(true);
    try {
      await onRotateToken();
    } catch (error) {
      console.error('Failed to rotate token:', error);
    } finally {
      setIsRotating(false);
    }
  };

  const handleDownloadPNG = () => {
    const svg = document.getElementById(`qr-code-${eventId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1200;

      if (!ctx) return;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Event name
      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.fillText(eventName, canvas.width / 2, 60);

      // Instructions
      ctx.fillStyle = '#71717a';
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      ctx.fillText('Scan to check in', canvas.width / 2, 110);

      // QR code
      ctx.drawImage(img, 150, 150, 700, 700);

      // Footer
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      ctx.fillText('Powered by Miglee', canvas.width / 2, 1100);

      // Download
      const link = document.createElement('a');
      link.download = `${eventName.replace(/\s+/g, '-')}-checkin-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const handleDownloadPDF = () => {
    // This will be implemented when we add PDF library
    console.log('PDF download not yet implemented');
    // TODO: Implement PDF generation with jspdf
  };

  return (
    <>
      <div className="space-y-4">
        {/* QR Code Display */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-8">
          <div className="mb-4 text-center">
            <div className="text-lg font-semibold text-zinc-900">
              {eventName}
            </div>
            <div className="text-sm text-zinc-600">Scan to check in</div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <QRCodeSVG
              id={`qr-code-${eventId}`}
              value={checkinUrl}
              size={256}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#18181b"
            />
          </div>

          <div className="mt-4 text-center">
            <div className="text-xs text-zinc-500 font-mono break-all max-w-xs">
              {checkinUrl}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsFullScreen(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Maximize2 className="h-4 w-4" />
            Full Screen
          </button>
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <ImageDown className="h-4 w-4" />
            Download PNG
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <FileDown className="h-4 w-4" />
            Download PDF
          </button>
          {onRotateToken && (
            <button
              onClick={handleRotateToken}
              disabled={isRotating}
              className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRotating ? 'animate-spin' : ''}`} />
              {isRotating ? 'Rotating...' : 'Rotate Token'}
            </button>
          )}
        </div>

        {/* Security Notice */}
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          <div className="font-medium mb-1">Security Note</div>
          <div className="text-amber-700">
            This QR code allows anyone to check in to your event. Keep it
            secure and rotate the token if it gets compromised.
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
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
              className="flex flex-col items-center"
            >
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {eventName}
                </h2>
                <p className="text-xl text-white/80">Scan to check in</p>
              </div>

              <div className="rounded-2xl bg-white p-8 shadow-2xl">
                <QRCodeSVG
                  value={checkinUrl}
                  size={512}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#18181b"
                />
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-white/60">
                  Press ESC or click outside to close
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
