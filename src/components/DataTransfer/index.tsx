import { useRef, useState } from 'react';
import { useArmyStore } from '../../store/armyStore';
import { useGameStore } from '../../store/gameStore';
import {
  exportTransferJson,
  parseImport,
  generateArmyText,
  copyToClipboard,
  shareNative,
  whatsAppShareUrl,
  type ShareFormat,
} from '../../utils/dataTransfer';
import QRCodeModal from '../QRCodeModal';
import QRScannerModal from '../QRScannerModal';
import type { ArmyList } from '../../types/army';

type Status = { type: 'ok' | 'err'; msg: string } | null;

interface DataTransferProps {
  /** Compact single-row layout for the sidebar — shows transfer only */
  compact?: boolean;
}

function useFlash() {
  const [status, setStatus] = useState<Status>(null);
  function flash(type: 'ok' | 'err', msg: string) {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  }
  return { status, flash };
}

const label: React.CSSProperties = {
  fontFamily: "'Cinzel', Georgia, serif",
  fontSize: '8.5px',
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  color: 'var(--f-text-4)',
  marginBottom: '8px',
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Cinzel', Georgia, serif",
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--f-text)',
  margin: '0 0 6px',
};

const subText: React.CSSProperties = {
  fontFamily: "'Source Serif 4', Georgia, serif",
  fontStyle: 'italic',
  fontSize: '12px',
  color: 'var(--f-text-3)',
  lineHeight: 1.5,
  margin: '0 0 12px',
};

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p style={{
      marginTop: '6px',
      fontFamily: "'Source Serif 4', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '11px',
      color: status.type === 'ok' ? 'var(--f-gold)' : '#f87171',
    }}>
      {status.msg}
    </p>
  );
}

// ── Transfer section (JSON backup / restore) ─────────────────────────────────

function TransferSection({ compact }: { compact: boolean }) {
  const armies = useArmyStore((s) => s.armies);
  const importArmies = useArmyStore((s) => s.importArmies);
  const savedGames = useGameStore((s) => s.savedGames);
  const importSavedGames = useGameStore((s) => s.importSavedGames);

  const fileRef = useRef<HTMLInputElement>(null);
  const { status, flash } = useFlash();

  function handleExport() {
    exportTransferJson(armies, savedGames);
    flash('ok', `Exported ${armies.length} ${armies.length === 1 ? 'army' : 'armies'} + ${savedGames.length} ${savedGames.length === 1 ? 'game' : 'games'}`);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = parseImport(ev.target?.result as string);
        const addedArmies = importArmies(data.armies);
        const addedGames = importSavedGames(data.savedGames);
        flash('ok', `Imported ${addedArmies} ${addedArmies === 1 ? 'army' : 'armies'}, ${addedGames} ${addedGames === 1 ? 'game' : 'games'}`);
      } catch (err) {
        flash('err', err instanceof Error ? err.message : 'Import failed.');
      }
    };
    reader.readAsText(file);
  }

  const btnStyle = (variant: 'primary' | 'ghost'): React.CSSProperties => ({
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: '9.5px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    border: variant === 'primary' ? '1px solid var(--f-border)' : '1px solid var(--f-border)',
    borderRadius: '3px',
    cursor: 'pointer',
    padding: compact ? '5px 10px' : '7px 14px',
    backgroundColor: variant === 'primary' ? 'var(--f-elevated)' : 'transparent',
    color: variant === 'primary' ? 'var(--f-text-3)' : 'var(--f-gold)',
    borderColor: variant === 'primary' ? 'var(--f-border)' : 'var(--f-gold)',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s',
  });

  return (
    <div>
      {!compact && (
        <>
          <p style={label}>Transfer Data</p>
          <p style={sectionHeading}>Move to Another Device</p>
          <p style={subText}>Export a backup file and import it on your other device. No account required.</p>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          style={btnStyle('primary')}
          onClick={handleExport}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Export
        </button>
        <button
          style={btnStyle('ghost')}
          onClick={() => fileRef.current?.click()}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Import
        </button>
      </div>

      <StatusLine status={status} />
    </div>
  );
}

// ── QR Import section ────────────────────────────────────────────────────────

function QRImportSection() {
  const importArmies = useArmyStore((s) => s.importArmies);
  const [scanning, setScanning] = useState(false);
  const { status, flash } = useFlash();

  return (
    <div>
      <p style={label}>Import via QR</p>
      <p style={sectionHeading}>Add Army via QR Code</p>
      <p style={subText}>Scan another Battle Standard user's army QR code to instantly add their list to your collection.</p>

      <button
        onClick={() => setScanning(true)}
        style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: '9.5px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: '1px solid var(--f-primary)',
          borderRadius: '3px',
          cursor: 'pointer',
          padding: '7px 14px',
          backgroundColor: 'transparent',
          color: 'var(--f-primary)',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Scan QR Code
      </button>

      <StatusLine status={status} />

      {scanning && (
        <QRScannerModal
          onScanned={(army: ArmyList) => {
            setScanning(false);
            importArmies([army]);
            flash('ok', `Added "${army.name}" to your armies`);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}

// ── Share section (human-readable text for social / BCP) ─────────────────────

function ShareSection() {
  const armies = useArmyStore((s) => s.armies);
  const [selectedArmyId, setSelectedArmyId] = useState<string>('');
  const [format, setFormat] = useState<ShareFormat>('social');
  const [qrArmy, setQrArmy] = useState<ArmyList | null>(null);
  const { status, flash } = useFlash();

  // Resolve effective ID — handles async store hydration where armies may load
  // after useState initialises, leaving selectedArmyId as ''.
  const effectiveId = selectedArmyId || armies[0]?.id || '';
  const selectedArmy = armies.find((a) => a.id === effectiveId);
  const canShare = !!selectedArmy;

  function getText() {
    if (!selectedArmy) return '';
    return generateArmyText(selectedArmy, format);
  }

  async function handleCopy() {
    try {
      await copyToClipboard(getText());
      flash('ok', 'Copied to clipboard');
    } catch {
      flash('err', 'Copy failed — try selecting and copying the text manually.');
    }
  }

  async function handleShare() {
    const army = selectedArmy;
    if (!army) return;
    const text = getText();
    const shared = await shareNative(`${army.name} — Battle Standard`, text);
    if (!shared) {
      // Fallback to copy
      try {
        await copyToClipboard(text);
        flash('ok', 'Sharing not available — copied to clipboard instead');
      } catch {
        flash('err', 'Could not share or copy.');
      }
    }
  }

  function handleWhatsApp() {
    window.open(whatsAppShareUrl(getText()), '_blank', 'noopener');
  }

  const selectStyle: React.CSSProperties = {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: '10px',
    letterSpacing: '0.05em',
    backgroundColor: 'var(--f-elevated)',
    border: '1px solid var(--f-border)',
    borderRadius: '3px',
    color: 'var(--f-text)',
    padding: '5px 8px',
    cursor: 'pointer',
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: '9px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    border: `1px solid ${color}`,
    borderRadius: '3px',
    cursor: canShare ? 'pointer' : 'not-allowed',
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: canShare ? color : 'var(--f-text-4)',
    borderColor: canShare ? color : 'var(--f-border)',
    opacity: canShare ? 1 : 0.45,
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s',
  });

  return (
    <div>
      <p style={label}>Share a List</p>
      <p style={sectionHeading}>Share Your Army</p>
      <p style={subText}>Share to Discord, WhatsApp, or paste into Best Coast Pairings for tournaments.</p>

      {armies.length === 0 ? (
        <p style={{ ...subText, color: 'var(--f-text-4)' }}>No armies yet — create one in the Army Builder.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {/* Army selector */}
            <select
              value={selectedArmyId}
              onChange={(e) => setSelectedArmyId(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
            >
              {armies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            {/* Format selector */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['social', 'bcp'] as ShareFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '9px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    border: '1px solid',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    borderColor: format === f ? 'var(--f-primary)' : 'var(--f-border)',
                    backgroundColor: format === f ? 'var(--f-primary)' : 'transparent',
                    color: format === f ? '#fff' : 'var(--f-text-3)',
                    transition: 'all 0.15s',
                  }}
                >
                  {f === 'social' ? 'Discord / Social' : 'BCP'}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              disabled={!canShare}
              onClick={handleCopy}
              style={btnStyle('var(--f-text-2)')}
              onMouseEnter={(e) => canShare && (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = canShare ? '1' : '0.45')}
            >
              Copy
            </button>
            <button
              disabled={!canShare}
              onClick={handleShare}
              style={btnStyle('var(--f-primary)')}
              onMouseEnter={(e) => canShare && (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = canShare ? '1' : '0.45')}
              title="Share via your device's share sheet (includes WhatsApp, Discord, etc.)"
            >
              Share
            </button>
            <button
              disabled={!canShare}
              onClick={handleWhatsApp}
              style={btnStyle('#25D366')}
              onMouseEnter={(e) => canShare && (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = canShare ? '1' : '0.45')}
            >
              WhatsApp
            </button>
            <button
              disabled={!canShare}
              onClick={() => selectedArmy && setQrArmy(selectedArmy)}
              style={btnStyle('var(--f-gold)')}
              onMouseEnter={(e) => canShare && (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = canShare ? '1' : '0.45')}
              title="Generate a QR code others can scan"
            >
              QR Code
            </button>
          </div>

          <StatusLine status={status} />
          {qrArmy && <QRCodeModal army={qrArmy} onClose={() => setQrArmy(null)} />}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  border: '1px solid var(--f-border)',
  borderRadius: '4px',
  padding: '20px',
  backgroundColor: 'var(--f-elevated)',
};

export default function DataTransfer({ compact = false }: DataTransferProps) {
  if (compact) {
    return <TransferSection compact />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={card}>
        <QRImportSection />
      </div>
      <div style={card}>
        <ShareSection />
      </div>
      <div style={card}>
        <TransferSection compact={false} />
      </div>
    </div>
  );
}
