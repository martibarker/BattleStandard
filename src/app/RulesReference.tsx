/** Rules Reference page — searchable index of rules and special rules */
export default function RulesReference() {
  return (
    <div className="p-6">
      <h1 className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>Rules Reference</h1>
      <p style={{ color: 'var(--color-text-secondary)' }} className="mt-2 text-base">
        Browse and search the rules index.
      </p>
      <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Rules index sourced from the{' '}
        <a
          href="https://tow.whfb.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-accent-blue)' }}
        >
          Warhammer Fantasy Online Rules Index Project
        </a>
        .
      </p>
    </div>
  );
}
