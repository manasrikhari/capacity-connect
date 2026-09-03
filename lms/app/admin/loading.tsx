/* Neutral ledger skeleton: a title, then hairline-ruled sections of quiet
   sunken blocks — plausible under any admin page, none in particular. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Page title */}
      <div className="space-y-2.5">
        <div className="h-8 w-56 max-w-full rounded-[10px] bg-sunken" />
        <div className="h-4 w-80 max-w-full rounded-[10px] bg-sunken/70" />
      </div>

      {/* First section */}
      <div className="space-y-3 border-t border-hair-strong pt-4">
        <div className="h-4 w-32 rounded-[10px] bg-sunken" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
      </div>

      {/* Second section */}
      <div className="space-y-3 border-t border-hair-strong pt-4">
        <div className="h-4 w-40 rounded-[10px] bg-sunken" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
        <div className="h-16 rounded-[10px] bg-sunken/70" />
      </div>
    </div>
  );
}
