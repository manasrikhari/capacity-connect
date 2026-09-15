/* Neutral page skeleton for public/content routes (courses, announcements,
   calendar, search…): a title block, then hairline-ruled sections of quiet
   sunken blocks. Same visual language as the admin/student ledgers. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1180px] animate-pulse space-y-8 px-7 py-10">
      <div className="space-y-2.5">
        <div className="h-8 w-64 max-w-full rounded-[10px] bg-sunken" />
        <div className="h-4 w-96 max-w-full rounded-[10px] bg-sunken/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-[10px] bg-sunken/70" />
        ))}
      </div>
      <div className="space-y-3 border-t border-hair-strong pt-4">
        <div className="h-4 w-40 rounded-[10px] bg-sunken" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
      </div>
    </div>
  );
}
