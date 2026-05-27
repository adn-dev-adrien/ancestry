import type { LucideIcon } from 'lucide-react';
import { EdgeLabelRenderer } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface EdgeIconBadgeProps {
  icon: LucideIcon;
  x: number;
  y: number;
  className?: string;
}

/**
 * Identical circular badge for every relationship edge, centered at (x, y).
 * Only the icon and its color (via `className`) differ between edge types,
 * so parent-child and spouse badges stay visually uniform.
 */
export function EdgeIconBadge({ icon: Icon, x, y, className }: EdgeIconBadgeProps) {
  return (
    <EdgeLabelRenderer>
      <div
        className={cn(
          'nodrag nopan absolute flex size-5 items-center justify-center rounded-full border bg-background shadow-sm',
          className,
        )}
        style={{
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          pointerEvents: 'none',
        }}
      >
        <Icon className="size-[13px]" strokeWidth={1.75} />
      </div>
    </EdgeLabelRenderer>
  );
}
