/** Home page — landing/dashboard for Battle Standard */
export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-3xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent-amber)' }}>
        Battle Standard
      </h1>
      <p style={{ color: 'var(--color-text-secondary)' }} className="mt-2 text-base">
        Your companion for Warhammer: The Old World.
      </p>
    </div>
  );
}
