export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-violet-100" />
          <div className="h-4 w-72 rounded-md bg-slate-200" />
        </div>
        <div className="h-11 w-44 rounded-xl bg-violet-100" />
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[13px] border border-violet-100 bg-white/80 px-3.5 py-2.5"
          >
            <div className="size-7.5 rounded-[9px] bg-violet-100" />
            <div className="space-y-1.5">
              <div className="h-5 w-8 rounded bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Section label */}
      <div className="flex items-center gap-3">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-px flex-1 bg-violet-100" />
        <div className="h-3 w-14 rounded bg-slate-100" />
      </div>

      {/* Batch cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex min-h-42 flex-col rounded-2xl border border-white/60 bg-white/80 p-4.5"
          >
            <div className="size-11.5 rounded-[13px] bg-violet-100" />
            <div className="mt-3 h-5 w-24 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-16 rounded bg-slate-100" />
            <div className="mt-auto flex gap-2 pt-4">
              <div className="h-7 w-24 rounded-lg bg-violet-50" />
              <div className="h-7 w-20 rounded-lg bg-violet-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
