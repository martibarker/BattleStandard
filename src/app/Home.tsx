import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import bannerImg from '../assets/banner.png';

const FEATURES = [
  {
    id: 'army-builder',
    to: '/army-builder',
    icon: '⚔',
    title: 'Army Builder',
    subtitle: 'Forge your force',
    description:
      'Construct, validate, and refine army lists for Warhammer: The Old World. ' +
      'Browse every unit, option, and magic item for your faction. ' +
      'Live points tracking and composition rules keep your list battle-legal at a glance.',
    cta: 'Open Army Builder',
    accent: 'var(--f-cat-characters)',
  },
  {
    id: 'adjutant',
    to: '/turn-tracker',
    icon: '🎲',
    title: "General's Adjutant",
    subtitle: 'Command the battlefield',
    description:
      'Track turns, phases, and game state during your battles. ' +
      'Record spell casts, power dice, and special rule triggers so nothing is forgotten ' +
      'in the heat of combat. A loyal aide-de-camp for every engagement.',
    cta: 'Open Adjutant',
    accent: 'var(--f-cat-core)',
  },
];

/** Triggers a fade-up animation once the element enters the viewport */
function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animation = 'fade-up 0.7s ease both';
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  const taglineRef = useRevealOnScroll();
  const cardsRef = useRevealOnScroll();
  const loginRef = useRevealOnScroll();
  const footerRef = useRevealOnScroll();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Full banner — no crop ── */}
      <img
        src={bannerImg}
        alt="Battle Standard — Warhammer: The Old World companion"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />

      {/* ── Body ── */}
      <div style={{ flex: 1, backgroundColor: 'var(--f-bg)', padding: '0 16px 64px' }}>

        {/* Tagline card */}
        <div
          ref={taglineRef}
          style={{ opacity: 0, textAlign: 'center', padding: '40px 0 36px' }}
        >
          <p style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '9px',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: 'var(--f-text-4)',
            marginBottom: '10px',
          }}>
            Warhammer: The Old World
          </p>
          <h1 style={{
            fontFamily: "'Cinzel Decorative', 'Cinzel', Georgia, serif",
            fontSize: 'clamp(22px, 4vw, 36px)',
            fontWeight: 700,
            color: 'var(--f-text)',
            letterSpacing: '0.04em',
            margin: '0 0 12px',
            lineHeight: 1.1,
          }}>
            Your Companion to<br />the Battlefield
          </h1>
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'var(--f-text-3)',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Build armies, manage games, and master the rules — all in one offline-first app.
          </p>
          <div className="faction-gold-rule" style={{ maxWidth: '320px', margin: '24px auto 0' }} />
        </div>

        {/* Feature cards */}
        <div
          ref={cardsRef}
          style={{
            opacity: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            maxWidth: '860px',
            margin: '0 auto 40px',
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.id} style={{
              backgroundColor: 'var(--f-card)',
              border: '1px solid var(--f-border)',
              borderTop: `4px solid ${f.accent}`,
              padding: '28px 28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ fontSize: '28px', lineHeight: 1 }}>{f.icon}</div>
              <div>
                <p style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '8px',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: 'var(--f-text-4)',
                  margin: '0 0 4px',
                }}>
                  {f.subtitle}
                </p>
                <h2 style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--f-text)',
                  margin: 0,
                  letterSpacing: '0.03em',
                }}>
                  {f.title}
                </h2>
              </div>
              <p style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: '14px',
                lineHeight: 1.65,
                color: 'var(--f-text-3)',
                margin: 0,
                flex: 1,
              }}>
                {f.description}
              </p>
              <NavLink
                to={f.to}
                style={{
                  display: 'block',
                  marginTop: '8px',
                  padding: '11px 20px',
                  backgroundColor: 'var(--f-primary)',
                  color: '#fff',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {f.cta} →
              </NavLink>
            </div>
          ))}
        </div>

        {/* Login scaffold */}
        <div
          ref={loginRef}
          style={{
            opacity: 0,
            maxWidth: '480px',
            margin: '0 auto 40px',
            backgroundColor: 'var(--f-elevated)',
            border: '1px solid var(--f-border)',
            padding: '28px 32px',
            textAlign: 'center',
          }}
        >
          <p style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '8px',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color: 'var(--f-text-4)',
            marginBottom: '8px',
          }}>
            Your Account
          </p>
          <h3 style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--f-text)',
            margin: '0 0 8px',
          }}>
            Sync Across Devices
          </h3>
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'var(--f-text-3)',
            lineHeight: 1.6,
            margin: '0 0 20px',
          }}>
            Sign in to keep your armies safe in the cloud and access them from any device.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '14px' }}>
            <button disabled style={{
              padding: '9px 22px',
              backgroundColor: 'var(--f-primary)',
              color: '#fff',
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'not-allowed',
              opacity: 0.45,
            }}>
              Sign In
            </button>
            <button disabled style={{
              padding: '9px 22px',
              backgroundColor: 'transparent',
              color: 'var(--f-primary)',
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              border: '1px solid var(--f-primary)',
              cursor: 'not-allowed',
              opacity: 0.45,
            }}>
              Create Account
            </button>
          </div>
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '11px',
            color: 'var(--f-text-4)',
            margin: 0,
          }}>
            ⚔ Cloud sync coming in a future update. Your armies are saved locally in the meantime.
          </p>
        </div>

        {/* Attribution footer */}
        <div
          ref={footerRef}
          style={{ opacity: 0, textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--f-border)', maxWidth: '600px', margin: '0 auto' }}
        >
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '11px',
            color: 'var(--f-text-4)',
            lineHeight: 1.7,
            margin: 0,
          }}>
            Rules index data courtesy of the{' '}
            <a href="https://tow.whfb.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--f-gold)', textDecoration: 'none' }}>
              Warhammer Fantasy Online Rules Index Project
            </a>
            .<br />
            Icons from{' '}
            <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--f-gold)', textDecoration: 'none' }}>
              game-icons.net
            </a>{' '}
            (CC BY 3.0). Unofficial. Not endorsed by Games Workshop Limited.
          </p>
        </div>

      </div>
    </div>
  );
}
