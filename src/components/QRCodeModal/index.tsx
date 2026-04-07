import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { ArmyList } from '../../types/army';

interface Props {
  army: ArmyList;
  onClose: () => void;
}

export default function QRCodeModal({ army, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const payload = JSON.stringify(army);
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'L',
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setDataUrl)
      .catch(() =>
        setError(
          'This army list is too large to encode as a QR code. Use the JSON export instead.',
        ),
      );
  }, [army]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff', borderRadius: '12px', padding: '24px',
          maxWidth: '340px', width: '100%', textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: 'Cinzel,serif', marginBottom: '4px', color: '#1a1a2e', fontSize: '18px' }}>
          {army.name}
        </h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px', lineHeight: 1.4 }}>
          Your opponent can scan this in the General's Adjutant setup to import your list.
        </p>

        {error ? (
          <p style={{ color: '#dc2626', fontSize: '13px', padding: '16px 0' }}>{error}</p>
        ) : dataUrl ? (
          <img src={dataUrl} alt={`QR code for ${army.name}`} style={{ width: 280, height: 280, display: 'block', margin: '0 auto' }} />
        ) : (
          <div style={{ width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '13px', margin: '0 auto' }}>
            Generating…
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: '20px', padding: '10px 32px', borderRadius: '6px',
            background: '#D97706', color: '#fff', border: 'none',
            fontFamily: 'Cinzel,serif', fontSize: '14px', cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
