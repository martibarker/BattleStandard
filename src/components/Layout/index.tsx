import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore, THEME_OPTIONS } from '../../store/themeStore';
import { useArmyStore } from '../../store/armyStore';
import bannerNoTextImg from '../../assets/banner-no-text.png';
import DataTransfer from '../DataTransfer';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const companionItems: NavItem[] = [
  { to: '/turn-tracker', label: "General's Adjutant", icon: '⏱' },
  { to: '/rules', label: 'Rules', icon: '📖' },
  { to: '/documents', label: 'Documents', icon: '📄' },
];

const mobileTabItems: NavItem[] = [
  { to: '/', label: 'Home', icon: '⚔', end: true },
  { to: '/army-builder', label: 'My Lists', icon: '🛡', end: true },
  { to: '/turn-tracker', label: 'Adjutant', icon: '⏱' },
  { to: '/rules', label: 'Rules', icon: '📖' },
  { to: '/documents', label: 'Docs', icon: '📄' },
];


function SidebarNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 20px',
        fontFamily: "'Cinzel', Georgia, serif",
        fontSize: '11px',
        letterSpacing: '0.06em',
        color: isActive ? 'var(--f-primary)' : 'var(--f-text-3)',
        borderLeft: isActive ? '3px solid var(--f-primary)' : '3px solid transparent',
        backgroundColor: isActive ? 'rgba(0,0,0,0.025)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
      })}
    >
      <span style={{ fontSize: '14px' }}>{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );
}

function TabItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors flex-1"
      style={({ isActive }) => ({
        color: isActive ? 'var(--f-primary)' : 'var(--f-text-3)',
      })}
    >
      <span className="text-lg leading-none">{item.icon}</span>
      <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '9px', letterSpacing: '0.08em' }}>{item.label}</span>
    </NavLink>
  );
}

function SidebarSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{
        padding: '0 20px 8px',
        borderBottom: '1px solid var(--f-border)',
        marginBottom: '4px',
        fontFamily: "'Cinzel', Georgia, serif",
        fontSize: '8.5px',
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: 'var(--f-text-4)',
      }}>
        {title}
      </p>
      <div>
        {items.map((item) => (
          <SidebarNavItem key={item.to} item={item} />
        ))}
      </div>
    </div>
  );
}

function ThemePicker() {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = THEME_OPTIONS.find((t) => t.id === theme) ?? THEME_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change army theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '4px',
          border: '1px solid var(--f-border)',
          backgroundColor: 'var(--f-elevated)',
          color: 'var(--f-text-3)',
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
      >
        {/* Faction colour pip */}
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--f-primary)',
          flexShrink: 0,
        }} />
        <span style={{ color: 'var(--f-text-2)' }}>{current.label}</span>
        <span style={{ fontSize: '8px', opacity: 0.5 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          width: '230px',
          backgroundColor: 'var(--f-elevated)',
          border: '1px solid var(--f-border-mid)',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          zIndex: 100,
        }}>
          <div style={{
            padding: '8px 14px 6px',
            borderBottom: '1px solid var(--f-border)',
          }}>
            <p style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '8px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--f-text-4)',
              margin: 0,
            }}>Army Colours</p>
          </div>

          {THEME_OPTIONS.map((opt) => {
            const isActive = theme === opt.id;
            return (
              <button
                key={opt.id}
                disabled={!opt.available}
                onClick={() => { if (opt.available) { setTheme(opt.id); setOpen(false); } }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 14px',
                  backgroundColor: isActive ? 'var(--f-gold-dim)' : 'transparent',
                  borderBottom: '1px solid var(--f-border)',
                  cursor: opt.available ? 'pointer' : 'default',
                  opacity: opt.available ? 1 : 0.4,
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  border: isActive ? '2px solid var(--f-gold)' : '1px solid var(--f-border-mid)',
                  backgroundColor: isActive ? 'var(--f-gold)' : 'transparent',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? 'var(--f-primary)' : 'var(--f-text)',
                    margin: 0,
                    transition: 'color 0.2s',
                  }}>{opt.label}</p>
                  <p style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: '10px',
                    fontStyle: 'italic',
                    color: 'var(--f-text-4)',
                    margin: 0,
                  }}>{opt.hint}</p>
                </div>
                {isActive && <span style={{ color: 'var(--f-gold)', fontSize: '12px' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MyListsSection() {
  const armies = useArmyStore((s) => s.armies);
  const createArmy = useArmyStore((s) => s.createArmy);
  const navigate = useNavigate();

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{
        padding: '0 20px 8px',
        borderBottom: '1px solid var(--f-border)',
        marginBottom: '4px',
        fontFamily: "'Cinzel', Georgia, serif",
        fontSize: '8.5px',
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: 'var(--f-text-4)',
      }}>
        My Lists
      </p>
      <div>
        {armies.length === 0 && (
          <p style={{
            padding: '6px 20px',
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '11px',
            color: 'var(--f-text-4)',
          }}>No armies yet</p>
        )}
        {armies.map((army) => (
          <NavLink
            key={army.id}
            to={`/army-builder/${army.id}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 20px',
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '10px',
              letterSpacing: '0.04em',
              color: isActive ? 'var(--f-primary)' : 'var(--f-text-3)',
              borderLeft: isActive ? '3px solid var(--f-primary)' : '3px solid transparent',
              backgroundColor: isActive ? 'rgba(0,0,0,0.025)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            })}
          >
            <span style={{ fontSize: '10px', flexShrink: 0 }}>🛡</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{army.name}</span>
          </NavLink>
        ))}
        <button
          onClick={() => {
            const id = createArmy({
              name: 'New Army',
              factionId: 'empire-of-man',
              compositionId: 'standard',
              matchedPlayFormats: [],
              pointsLimit: 2000,
            });
            navigate(`/army-builder/${id}`);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 20px',
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '10px',
            letterSpacing: '0.04em',
            color: 'var(--f-gold)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            transition: 'color 0.15s',
          }}
        >
          <span style={{ flexShrink: 0 }}>＋</span>
          <span>New Army</span>
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const theme = useThemeStore((s) => s.theme);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-faction', theme);
  }, [theme]);

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--f-bg)', color: 'var(--f-text)', transition: 'background 0.4s, color 0.4s' }}>

      {/* ── Top header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 20px rgba(0,0,0,0.18)' }}>

        {/* Banner masthead — hidden on home (home page owns its hero) */}
        {!isHome && (
          <NavLink to="/" style={{ display: 'block', textDecoration: 'none', lineHeight: 0 }}>
            <img
              src={bannerNoTextImg}
              alt="Battle Standard"
              style={{ width: '100%', height: '110px', objectFit: 'cover', objectPosition: 'center center', display: 'block' }}
            />
          </NavLink>
        )}

        {/* Nav bar */}
        <div style={{
          backgroundColor: 'var(--f-surface)',
          borderBottom: '1px solid var(--f-border-mid)',
          transition: 'background 0.4s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          gap: '16px',
        }}>
          {/* Desktop nav */}
          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 0 }}>
            {[
              { to: '/army-builder', label: 'My Lists', end: true },
              { to: '/turn-tracker', label: "General's Adjutant" },
              { to: '/rules', label: 'Rules' },
              { to: '/documents', label: 'Documents' },
            ].map((item, idx, arr) => (
              <span key={item.to} style={{ display: 'flex', alignItems: 'center' }}>
                <NavLink
                  to={item.to}
                  end={'end' in item ? item.end : undefined}
                  style={({ isActive }) => ({
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: isActive ? 'var(--f-primary)' : 'var(--f-text-3)',
                    padding: '10px 16px',
                    textDecoration: 'none',
                    borderBottom: isActive ? '2px solid var(--f-primary)' : '2px solid transparent',
                    transition: 'color 0.2s, border-color 0.2s',
                    display: 'block',
                  })}
                >
                  {item.label}
                </NavLink>
                {idx < arr.length - 1 && (
                  <span style={{ color: 'var(--f-border)', fontSize: '16px', lineHeight: 1 }}>·</span>
                )}
              </span>
            ))}
          </nav>

          {/* Right: theme picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <ThemePicker />
          </div>
        </div>

        {/* Gold shimmer rule */}
        <div className="faction-gold-rule" />
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Desktop sidebar — hidden on home page */}
        {!isHome && (
          <aside className="hidden md:flex" style={{
            flexDirection: 'column',
            width: '210px',
            borderRight: '1px solid var(--f-border)',
            flexShrink: 0,
            padding: '20px 0',
            backgroundColor: 'var(--f-surface)',
            transition: 'background 0.4s',
          }}>
            <MyListsSection />
            <SidebarSection title="General's Adjutant" items={companionItems} />
            <div style={{ marginTop: 'auto', padding: '16px 20px 0', borderTop: '1px solid var(--f-border)' }}>
              <p style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '8.5px',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'var(--f-text-4)',
                marginBottom: '10px',
              }}>
                My Data
              </p>
              <DataTransfer compact />
            </div>
          </aside>
        )}

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }} className="md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Desktop footer */}
      <footer className="hidden md:block" style={{
        borderTop: '1px solid var(--f-border)',
        padding: '10px 24px',
        fontSize: '11px',
        textAlign: 'center',
        backgroundColor: 'var(--f-surface)',
        color: 'var(--f-text-4)',
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontStyle: 'italic',
        transition: 'background 0.4s',
      }}>
        Unofficial. Not affiliated with Games Workshop Limited.
        <span style={{ margin: '0 8px', color: 'var(--f-border-mid)' }}>·</span>
        Rules index:{' '}
        <a href="https://tow.whfb.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--f-primary)' }}>
          tow.whfb.app
        </a>
      </footer>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 flex items-center border-t md:hidden z-40" style={{
        backgroundColor: 'var(--f-surface)',
        borderColor: 'var(--f-border)',
      }}>
        {mobileTabItems.map((item) => (
          <TabItem key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}
