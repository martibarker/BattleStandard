import React from 'react';

/** Document Library — FAQs, errata, and supplementary documents */

interface Document {
  title: string;
  subtitle: string;
  url: string;
  /** Approximate date from URL slug */
  date: string;
}

const FAQ_DOCUMENTS: Document[] = [
  {
    title: 'Rulebook FAQ & Errata',
    subtitle: 'Warhammer: The Old World core rulebook',
    url: 'https://assets.warhammer-community.com/eng_28-01_warhammer_the_old_world_faq_and_errata_rulebook-cypy1xqrht-t4jzdire13.pdf',
    date: 'Jan 2025',
  },
  {
    title: 'Forces of Fantasy FAQ & Errata',
    subtitle: 'Empire, Bretonnia, Dwarfs, High Elves, Wood Elves',
    url: 'https://assets.warhammer-community.com/eng_28-01_warhammer_the_old_world_faq_and_errata_forces_of_fantasy-i2x9zdjv39-wlwtl54hxm.pdf',
    date: 'Jan 2025',
  },
  {
    title: 'Ravening Hordes FAQ & Errata',
    subtitle: 'Orcs & Goblins, Warriors of Chaos, Beastmen, Tomb Kings',
    url: 'https://assets.warhammer-community.com/eng_28-01_warhammer_the_old_world_faq_and_errata_ravening_hordes-jrpaxmw1gz-5cb3elwsoq.pdf',
    date: 'Jan 2025',
  },
  {
    title: "Settra's Fury FAQ & Errata",
    subtitle: 'Arcane Journal supplement',
    url: 'https://assets.warhammer-community.com/eng_08-10_whtow_faqs&errata_settras_fury-p4fxvsyn9h-bu6twplljz.pdf',
    date: 'Oct 2024',
  },
  {
    title: 'Grand Cathay FAQ & Errata',
    subtitle: 'Armies of Grand Cathay',
    url: 'https://assets.warhammer-community.com/eng_18-03_warhammer_the_old_world_faq_and_errata_armies_of_grand_cathay-6quu5ow3zn-ifffabcydt.pdf',
    date: 'Mar 2025',
  },
];

const label: React.CSSProperties = {
  fontFamily: "'Cinzel', Georgia, serif",
  fontSize: '8px',
  letterSpacing: '0.45em',
  textTransform: 'uppercase',
  color: 'var(--f-text-4)',
  margin: '0 0 8px',
};

const heading: React.CSSProperties = {
  fontFamily: "'Cinzel', Georgia, serif",
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--f-text)',
  margin: '0 0 6px',
  letterSpacing: '0.03em',
};

const subText: React.CSSProperties = {
  fontFamily: "'Source Serif 4', Georgia, serif",
  fontStyle: 'italic',
  fontSize: '13px',
  color: 'var(--f-text-3)',
  lineHeight: 1.6,
  margin: '0 0 20px',
};

export default function DocumentLibrary() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 64px' }}>

      <div style={{ marginBottom: '32px' }}>
        <p style={label}>Document Library</p>
        <h1 style={heading}>FAQs &amp; Errata</h1>
        <p style={subText}>
          Direct links to the official Games Workshop FAQ and Errata documents hosted on
          Warhammer Community. These links always point to the current live version — bookmark
          this page rather than saving the PDFs locally.
        </p>
        <p style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontStyle: 'italic',
          fontSize: '11px',
          color: 'var(--f-text-4)',
          lineHeight: 1.6,
          margin: 0,
          padding: '10px 14px',
          border: '1px solid var(--f-border)',
          borderLeft: '3px solid var(--f-gold)',
          backgroundColor: 'var(--f-elevated)',
        }}>
          Note: these are official Games Workshop documents hosted on assets.warhammer-community.com.
          Battle Standard links to them for convenience only — all content is the property of Games Workshop Limited.
          GW may update URLs without notice; if a link stops working, check{' '}
          <a href="https://www.warhammer-community.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--f-gold)', textDecoration: 'none' }}>
            warhammer-community.com
          </a>{' '}
          directly.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {FAQ_DOCUMENTS.map((doc) => (
          <a
            key={doc.url}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '16px 20px',
              backgroundColor: 'var(--f-card)',
              border: '1px solid var(--f-border)',
              borderRadius: '4px',
              textDecoration: 'none',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--f-gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--f-border)')}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--f-text)',
                margin: '0 0 3px',
                letterSpacing: '0.02em',
              }}>
                {doc.title}
              </p>
              <p style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '12px',
                color: 'var(--f-text-3)',
                margin: 0,
              }}>
                {doc.subtitle}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '9px',
                letterSpacing: '0.1em',
                color: 'var(--f-text-4)',
              }}>
                {doc.date}
              </span>
              <span style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '9px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--f-gold)',
                border: '1px solid var(--f-gold)',
                borderRadius: '3px',
                padding: '3px 8px',
              }}>
                PDF ↗
              </span>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
}
