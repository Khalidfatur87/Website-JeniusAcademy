/** Tampil seketika saat berpindah halaman CMS, selagi data dimuat di server. */
export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-24 animate-pulse bg-surface-2" />
      ))}
    </div>
  );
}
