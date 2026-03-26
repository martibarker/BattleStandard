/** Document Library page — browse and view PDFs and FAQs */
export default function DocumentLibrary() {
  return (
    <div className="p-6">
      <h1 className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>Document Library</h1>
      <p style={{ color: 'var(--color-text-secondary)' }} className="mt-2 text-base">
        Browse FAQs, errata, and supplementary documents.
      </p>
    </div>
  );
}
