import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react';
import { Heart, HeartCrack } from 'lucide-react';
import { EdgeIconBadge } from './EdgeIconBadge';

export function SpouseEdge({ sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const meta = data as { divorced?: boolean; marriageDate?: string | null } | undefined;
  const divorced = Boolean(meta?.divorced);
  const marriageYear = meta?.marriageDate ? meta.marriageDate.slice(0, 4) : undefined;

  const style = divorced
    ? { strokeDasharray: '2 3', opacity: 0.5 }
    : { strokeDasharray: '6 4' };

  return (
    <>
      <BaseEdge path={path} style={style} />
      <EdgeIconBadge
        icon={divorced ? HeartCrack : Heart}
        x={labelX}
        y={labelY}
        label={marriageYear}
        className={
          divorced
            ? 'border-border text-muted-foreground opacity-70'
            : 'border-rose-300 text-rose-500'
        }
      />
    </>
  );
}
