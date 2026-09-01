/* Neutral ledger skeleton for the platform admin pages. */
export default function PlatformLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Page title */}
      <div className="space-y-2.5">
        <div className="h-8 w-64 max-w-full rounded-[10px] bg-sunken" />
        <div className="h-4 w-80 max-w-full rounded-[10px] bg-sunken/70" />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 border-t border-hair-strong pt-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-8 w-16 rounded-[10px] bg-sunken" />
            <div className="h-3 w-24 rounded-[10px] bg-sunken/70" />
          </div>
        ))}
      </div>

      {/* Section rows */}
      <div className="space-y-3 border-t border-hair-strong pt-4">
        <div className="h-4 w-36 rounded-[10px] bg-sunken" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
      </div>
    </div>
  );
}
