import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './QrScannerDialog.css';

type QrScannerDialogProps = {
  open: boolean;
  scanning: boolean;
  onClose: () => void;
  onDetected: (qrToken: string) => Promise<void>;
};

const SCAN_INTERVAL_MS = 500;

function getBrowserSupportMessage() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Ovaj browser ne podrzava pristup kameri. Koristi rucni unos QR koda.';
  }

  if (typeof BarcodeDetector === 'undefined') {
    return 'Ovaj browser ne podrzava automatsko QR skeniranje. Koristi rucni unos QR koda.';
  }

  return null;
}

export function QrScannerDialog({
  open,
  scanning,
  onClose,
  onDetected,
}: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const supportMessage = useMemo(() => getBrowserSupportMessage(), []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopScanner = useCallback(() => {
    stopInterval();

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [stopInterval]);

  const detectQrCode = useCallback(async () => {
    if (isDetecting || scanning) {
      return;
    }

    const detector = detectorRef.current;
    const video = videoRef.current;

    if (!detector || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    try {
      setIsDetecting(true);
      const detectedBarcodes = await detector.detect(video);
      const qrToken = detectedBarcodes.find((barcode) => barcode.rawValue?.trim())?.rawValue?.trim();

      if (!qrToken) {
        return;
      }

      stopInterval();
      await onDetected(qrToken);
      stopScanner();
      onClose();
    } catch (detectError) {
      setError('QR kod nije moguce procitati iz kamere. Pokusaj ponovo ili koristi rucni unos.');
      stopInterval();
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting, onClose, onDetected, scanning, stopInterval, stopScanner]);

  const startScanner = useCallback(() => {
    if (intervalRef.current !== null || scanning) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      void detectQrCode();
    }, SCAN_INTERVAL_MS);
  }, [detectQrCode, scanning]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      setError(null);
      setIsCameraReady(false);
      setIsDetecting(false);
      return;
    }

    if (supportMessage) {
      setError(supportMessage);
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
        setIsCameraReady(true);
        startScanner();
      } catch (cameraError) {
        setError('Kamera nije dostupna. Proveri dozvole ili koristi rucni unos QR koda.');
      }
    })();

    return () => {
      isActive = false;
      stopScanner();
    };
  }, [open, startScanner, stopScanner, supportMessage]);

  useEffect(() => {
    if (!open || !isCameraReady || supportMessage) {
      return;
    }

    if (scanning) {
      stopInterval();
      return;
    }

    startScanner();
  }, [isCameraReady, open, scanning, startScanner, stopInterval, supportMessage]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      className="qr-scanner-dialog"
    >
      <DialogTitle>Skeniranje QR koda</DialogTitle>
      <DialogContent className="qr-scanner-dialog__content">
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Usmeri kameru ka QR kodu sa emaila, PNG slike ili PDF ulaznice.
          </Typography>

          {error ? <Alert severity="warning">{error}</Alert> : null}

          <Box className="qr-scanner-dialog__viewport">
            <video
              ref={videoRef}
              className="qr-scanner-dialog__video"
              autoPlay
              playsInline
              muted
            />
            <Box className="qr-scanner-dialog__frame" />
          </Box>

          {!error && !isCameraReady ? (
            <Typography variant="body2" color="text.secondary">
              Pokrecemo kameru...
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Zatvori</Button>
      </DialogActions>
    </Dialog>
  );
}
