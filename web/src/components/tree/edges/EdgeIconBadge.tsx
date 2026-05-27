import type { LucideIcon } from 'lucide-react';
import { EdgeLabelRenderer } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface EdgeIconBadgeProps {
  icon: LucideIcon;
  x: number;
  y: number;
  className?: string;
  label?: string;
}

/**
 * Identical circular badge for every relationship edge, centered at (x, y).
 * Only the icon and its color (via `className`) differ between edge types,
 * so parent-child and spouse badges stay visually uniform. An optional `label`
 * is shown just below the badge (e.g. the marriage year).
 */
export function EdgeIconBadge({ icon: Icon, x, y, className, label }: EdgeIconBadgeProps) {
  return (
    <EdgeLabelRenderer>
      <div
        className="nodrag nopan absolute flex flex-col items-center gap-0.5"
        style={{
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          pointerEvents: 'none',
        }}
      >
        <div
          className={cn(
            'flex size-5 items-center justify-center rounded-full border bg-background shadow-sm',
            className,
          )}
        >
          <Icon className="size-[13px]" strokeWidth={1.75} />
        </div>
        {label && (
          <span className="rounded bg-background/80 px-1 text-[10px] leading-tight text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </EdgeLabelRenderer>
  );
}
