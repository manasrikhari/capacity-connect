import { cn } from "@/lib/utils";

export type RadarAxis = {
  label: string;
  /** Value on the axis. */
  value: number;
  /** Axis maximum (defaults to 5). */
  max?: number;
};

/**
 * A dependency-free SVG radar/spider chart. Plum polygon on a hairline grid;
 * mono micro-caps axis labels. Sized to its container via viewBox.
 */
export function RadarChart({
  axes,
  className,
  size = 260,
}: {
  axes: RadarAxis[];
  className?: string;
  size?: number;
}) {
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.32; // leave room for labels
  // Labels sit outside the outer ring and anchor away from the centre, so the
  // left/right ones need horizontal room beyond the square — widen the viewBox
  // rather than letting "METEOROLOGY" run off the edge.
  const padX = size * 0.3;
  const rings = [0.25, 0.5, 0.75, 1];

  if (n < 3) {
    return (
      <p className={cn("text-sm text-ink-500", className)}>
        Add at least three skill categories to see the competency radar.
      </p>
    );
  }

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, radius: number) => {
    const a = angleFor(i);
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)] as const;
  };

  const valuePoints = axes.map((ax, i) => {
    const max = ax.max ?? 5;
    const frac = max > 0 ? Math.max(0, Math.min(1, ax.value / max)) : 0;
    return point(i, r * frac);
  });
  const polygon = valuePoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`${-padX} 0 ${size + padX * 2} ${size}`}
      className={cn("h-auto w-full max-w-[420px]", className)}
      role="img"
      aria-label="Competency radar by category"
    >
      {/* Concentric grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes
            .map((_, i) => {
              const [x, y] = point(i, r * ring);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ")}
          className="fill-none stroke-hair-strong"
          strokeWidth={1}
        />
      ))}

      {/* Spokes */}
      {axes.map((_, i) => {
        const [x, y] = point(i, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x.toFixed(1)}
            y2={y.toFixed(1)}
            className="stroke-hair-strong"
            strokeWidth={1}
          />
        );
      })}

      {/* Value polygon */}
      <polygon points={polygon} className="fill-plum-100/60 stroke-plum-600" strokeWidth={2} />
      {valuePoints.map(([x, y], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={2.5} className="fill-plum-600" />
      ))}

      {/* Axis labels */}
      {axes.map((ax, i) => {
        const [x, y] = point(i, r + 18);
        const a = angleFor(i);
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        const words = ax.label.split(" ");
        const twoLines = words.length > 2 || (words.length === 2 && ax.label.length > 12);
        return (
          <text
            key={ax.label}
            x={x.toFixed(1)}
            y={y.toFixed(1)}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-ink-500 font-mono text-[8px] uppercase tracking-[0.1em]"
          >
            {twoLines ? (
              <>
                <tspan x={x.toFixed(1)} dy="-0.5em">
                  {words.slice(0, Math.ceil(words.length / 2)).join(" ")}
                </tspan>
                <tspan x={x.toFixed(1)} dy="1em">
                  {words.slice(Math.ceil(words.length / 2)).join(" ")}
                </tspan>
              </>
            ) : (
              ax.label
            )}
          </text>
        );
      })}
    </svg>
  );
}
