/**
 * Event QR Code Component
 * Displays shared QR code for event check-in
 */

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize2, RefreshCw, X, FileDown, ImageDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { useRotateEventCheckinTokenMutation } from '@/features/checkin';

interface EventQRCodeProps {
  eventId: string;
  token: string | null;
  eventName: string;
}

export function EventQRCode({ eventId, token, eventName }: EventQRCodeProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const rotateTokenMutation = useRotateEventCheckinTokenMutation();

  console.log('[EventQRCode] Rendered', {
    eventId,
    token: token ? `${token.substring(0, 10)}...` : null,
    eventName,
    isFullScreen,
    mutationStatus: rotateTokenMutation.status,
  });

  if (!token) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          QR Code not generated yet. Enable check-in to generate a QR code.
        </div>
      </div>
    );
  }

  // Generate check-in URL
  const checkinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/checkin/event/${eventId}?token=${token}`;

  const handleRotateToken = async () => {
    console.log('[EventQRCode] handleRotateToken called', { eventId });
    try {
      console.log('[EventQRCode] Starting mutation...');
      const result = await rotateTokenMutation.mutateAsync({ eventId });
      console.log('[EventQRCode] Mutation success:', result);
      toast.success('QR code token rotated', {
        description: 'The old QR code is no longer valid',
      });
    } catch (error) {
      console.error('[EventQRCode] Mutation error:', error);
      toast.error('Failed to rotate token', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleDownloadPNG = () => {
    console.log('[EventQRCode] handleDownloadPNG called', { eventId });
    const svg = document.getElementById(`qr-code-${eventId}`);
    if (!svg) {
      console.error(
        '[EventQRCode] SVG element not found!',
        `qr-code-${eventId}`
      );
      toast.error('Failed to find QR code element');
      return;
    }

    console.log('[EventQRCode] SVG found, generating PNG...');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      console.log('[EventQRCode] Image loaded, drawing canvas...');
      canvas.width = 1000;
      canvas.height = 1200;

      if (!ctx) {
        console.error('[EventQRCode] Canvas context is null');
        return;
      }

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
      console.log('[EventQRCode] Initiating download...');
      const link = document.createElement('a');
      link.download = `${eventName.replace(/\s+/g, '-')}-checkin-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      console.log('[EventQRCode] Download completed');
      toast.success('QR code downloaded');
    };

    img.onerror = (error) => {
      console.error('[EventQRCode] Image load error:', error);
      toast.error('Failed to generate PNG');
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const handleDownloadPDF = () => {
    console.log('[EventQRCode] handleDownloadPDF called');
    const svg = document.getElementById(`qr-code-${eventId}`);
    if (!svg) {
      console.error(
        '[EventQRCode] SVG element not found!',
        `qr-code-${eventId}`
      );
      toast.error('Failed to find QR code element');
      return;
    }

    try {
      console.log('[EventQRCode] Generating PDF...');
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        console.log('[EventQRCode] Image loaded, creating PDF...');
        // Set canvas size for high quality QR code
        canvas.width = 1000;
        canvas.height = 1000;

        if (!ctx) {
          console.error('[EventQRCode] Canvas context is null');
          toast.error('Failed to generate PDF');
          return;
        }

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png');

        // Create PDF (A4 portrait)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // A4 dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;

        // Add title
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(eventName, pageWidth / 2, margin + 10, {
          align: 'center',
        });

        // Add subtitle
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Scan to check in', pageWidth / 2, margin + 20, {
          align: 'center',
        });

        // Calculate QR code dimensions (centered, max 150mm)
        const qrSize = 150;
        const qrX = (pageWidth - qrSize) / 2;
        const qrY = margin + 35;

        // Add QR code image
        pdf.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize);

        // Add instructions
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const instructions = [
          'How to use:',
          '1. Display this QR code at your event entrance',
          '2. Ask attendees to scan with their mobile device',
          '3. They will be automatically checked in',
        ];
        let yPos = qrY + qrSize + 20;
        instructions.forEach((line) => {
          pdf.text(line, margin, yPos);
          yPos += 7;
        });

        // Add security note
        pdf.setFontSize(10);
        pdf.setTextColor(200, 100, 50);
        pdf.text(
          'Security: Keep this QR code secure. Rotate the token if compromised.',
          margin,
          pageHeight - 30,
          { maxWidth: pageWidth - 2 * margin }
        );

        // Add footer
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Powered by Miglee', pageWidth / 2, pageHeight - 15, {
          align: 'center',
        });

        // Add URL at bottom
        pdf.setFontSize(8);
        pdf.text(checkinUrl, pageWidth / 2, pageHeight - 10, {
          align: 'center',
          maxWidth: pageWidth - 2 * margin,
        });

        // Save PDF
        const filename = `${eventName.replace(/\s+/g, '-')}-checkin-qr.pdf`;
        pdf.save(filename);

        console.log('[EventQRCode] PDF download completed');
        toast.success('QR code PDF downloaded');
      };

      img.onerror = (error) => {
        console.error('[EventQRCode] Image load error:', error);
        toast.error('Failed to generate PDF');
      };

      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    } catch (error) {
      console.error('[EventQRCode] PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Security Notice */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Security Note
              </div>
              <div className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                This QR code allows anyone to check in to your event. Keep it
                secure and rotate the token if it gets compromised.
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-6 text-center">
              <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {eventName}
              </div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Scan to check in
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
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

            <div className="mt-6 text-center">
              <div className="max-w-xs break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {checkinUrl}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              console.log('[EventQRCode] Full Screen button clicked');
              setIsFullScreen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <Maximize2 className="h-4 w-4" />
            Full Screen
          </button>
          <button
            onClick={handleDownloadPNG}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <ImageDown className="h-4 w-4" />
            Download PNG
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <FileDown className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={handleRotateToken}
            disabled={rotateTokenMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/40"
          >
            <RefreshCw
              className={`h-4 w-4 ${rotateTokenMutation.isPending ? 'animate-spin' : ''}`}
            />
            {rotateTokenMutation.isPending ? 'Rotating...' : 'Rotate Token'}
          </button>
        </div>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
            onClick={() => setIsFullScreen(false)}
          >
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute right-4 top-4 rounded-xl bg-white/10 p-2.5 text-white shadow-lg transition-colors hover:bg-white/20"
              aria-label="Close fullscreen"
            >
              <X className="h-6 w-6" />
            </button>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center"
            >
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-3xl font-bold tracking-tight text-white">
                  {eventName}
                </h2>
                <p className="text-xl text-white/70">Scan to check in</p>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-white/10">
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
                <p className="text-sm text-white/50">
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
