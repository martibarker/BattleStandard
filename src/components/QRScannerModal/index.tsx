import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import type { ArmyList } from '../../types/army';

interface Props {
  onScanned: (army: ArmyList) => void;
  onClose: () => void;
}

export default function QRScannerModal({ onScanned, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(true);

  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    activeRef.current = true;

    const tick = () => {
      if (!activeRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code?.data) {
            try {
              const parsed = JSON.parse(code.data) as ArmyList;
              // Validate it looks like an army list
              if (parsed.id && parsed.name && parsed.factionId && Array.isArray(parsed.entries)) {
                setDetected(true);
                stopCamera();
                onScanned(parsed);
                return;
              }
            } catch {
              // Not valid army JSON — keep scanning
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!activeRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            rafRef.current = requestAnimationFrame(tick);
          });
        }
      })
      .catch(() =>
        setError('Camera access denied. Please allow camera access and try again.'),
      );

    return () => {
      stopCamera();
    };
  }, [onScanned, stopCamera]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontFamily: 'Cinzel,serif', color: '#fff', margin: 0, fontSize: '18px' }}>
            Scan Army QR Code
          </h3>
          <button
            onClick={handleClose}
            style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', fontSize: '28px', lineHeight: 1, cursor: 'pointer', padding: '0 4px' }}
          >
            ×
          </button>
        </div>

        {error ? (
          <p style={{ color: '#ef4444', textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>
            {error}
          </p>
        ) : detected ? (
          <p style={{ color: '#22c55e', textAlign: 'center', padding: '32px 0', fontSize: '16px', fontFamily: 'Cinzel,serif' }}>
            ✓ Army scanned successfully
          </p>
        ) : (
          <>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>
              Point your camera at your opponent's army QR code
            </p>
            {/* Camera viewport with targeting reticle */}
            <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                playsInline
                muted
              />
              {/* Corner targeting marks */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: '60%', aspectRatio: '1', position: 'relative' }}>
                  {[
                    { top: 0, left: 0, borderTop: '3px solid #D97706', borderLeft: '3px solid #D97706' },
                    { top: 0, right: 0, borderTop: '3px solid #D97706', borderRight: '3px solid #D97706' },
                    { bottom: 0, left: 0, borderBottom: '3px solid #D97706', borderLeft: '3px solid #D97706' },
                    { bottom: 0, right: 0, borderBottom: '3px solid #D97706', borderRight: '3px solid #D97706' },
                  ].map((style, i) => (
                    <div key={i} style={{ position: 'absolute', width: '20%', aspectRatio: '1', ...style }} />
                  ))}
                </div>
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        )}

        <button
          onClick={handleClose}
          style={{
            marginTop: '16px', width: '100%', padding: '12px',
            borderRadius: '6px', background: 'var(--color-bg-elevated)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '14px', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
