/**
 * QR Scanner Component
 * Allows organizers to scan user QR codes for check-in
 */

'use client';

import { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { X, Camera, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanResult {
  success: boolean;
  message: string;
  userName?: string;
  userId?: string;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (token: string) => Promise<ScanResult>;
  eventName: string;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  eventName,
}: QRScannerModalProps) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    if (isOpen) {
      // Check camera permission
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' as PermissionName }).then((result) => {
          setCameraPermission(result.state as 'granted' | 'denied' | 'prompt');
        });
      }
    }
  }, [isOpen]);

  const handleScan = async (result: any) => {
    if (!result || isProcessing) return;

    const data = result?.text || result;
    if (!data) return;

    setIsProcessing(true);
    setError(null);
    setScanResult(null);

    try {
      // Extract token from URL or use data directly
      let token = data;
      try {
        const url = new URL(data);
        const tokenParam = url.searchParams.get('token');
        if (tokenParam) {
          token = tokenParam;
        }
      } catch {
        // Not a URL, assume it's a token directly
      }

      const result = await onScan(token);
      setScanResult(result);

      // Auto-close after successful scan
      if (result.success) {
        setTimeout(() => {
          setScanResult(null);
          setIsProcessing(false);
        }, 2000);
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process QR code');
      setIsProcessing(false);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Reader error:', error);
    setError('Camera error. Please check permissions.');
  };

  const handleClose = () => {
    setScanResult(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="border-b border-zinc-200 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Camera className="h-6 w-6" />
                <div>
                  <h2 className="text-lg font-semibold">Scan QR Code</h2>
                  <p className="text-sm text-white/80">{eventName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Scanner */}
          <div className="relative">
            {cameraPermission === 'denied' && (
              <div className="p-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  Camera Access Denied
                </h3>
                <p className="text-sm text-zinc-600 mb-4">
                  Please enable camera access in your browser settings to scan QR codes.
                </p>
                <button
                  onClick={handleClose}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            )}

            {cameraPermission !== 'denied' && (
              <>
                <div className="relative aspect-square bg-zinc-900">
                  <QrReader
                    onResult={handleScan}
                    constraints={{ facingMode: 'environment' }}
                    containerStyle={{
                      width: '100%',
                      height: '100%',
                    }}
                    videoContainerStyle={{
                      width: '100%',
                      height: '100%',
                      paddingTop: '0',
                    }}
                    videoStyle={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Scanner overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-white/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-64 w-64 border-4 border-white rounded-lg shadow-lg" />
                    </div>
                  </div>

                  {/* Processing indicator */}
                  {checkInByQrMutation.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="rounded-lg bg-white p-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-zinc-50 px-6 py-4 text-center">
                  <p className="text-sm text-zinc-600">
                    Position the QR code within the frame
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Result Display */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border-t px-6 py-4 ${
                  scanResult.success
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {scanResult.success ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div
                      className={`font-semibold ${
                        scanResult.success ? 'text-emerald-900' : 'text-red-900'
                      }`}
                    >
                      {scanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
                    </div>
                    {scanResult.userName && (
                      <div
                        className={`text-sm ${
                          scanResult.success ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {scanResult.userName}
                      </div>
                    )}
                    <div
                      className={`mt-1 text-sm ${
                        scanResult.success ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {scanResult.message}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border-t border-red-200 bg-red-50 px-6 py-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-900">Error</div>
                    <div className="mt-1 text-sm text-red-600">{error}</div>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
