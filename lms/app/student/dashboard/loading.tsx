/* Dashboard-shaped skeleton: bar, hero board, two stats, rail. */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="flex items-center justify-between gap-4 border-b border-hair pb-4">
        <div className="h-7 w-36 rounded-[10px] bg-sunken" />
        <div className="h-3 w-52 rounded-[10px] bg-sunken" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="h-3 w-28 rounded bg-sunken" />
          <div className="mt-3 h-56 rounded-3xl bg-sunken" />
          <div className="mt-7 grid grid-cols-2 gap-6">
            <div className="border-t border-hair-strong pt-3">
              <div className="h-9 w-24 rounded bg-sunken" />
              <div className="mt-2 h-3 w-20 rounded bg-sunken" />
            </div>
            <div className="border-t border-hair-strong pt-3">
              <div className="h-9 w-28 rounded bg-sunken" />
              <div className="mt-2 h-3 w-24 rounded bg-sunken" />
            </div>
          </div>
        </div>
        <div>
          <div className="h-3 w-32 rounded bg-sunken" />
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-12 w-10 rounded-md bg-sunken" />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-md bg-sunken" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
