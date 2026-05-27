import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react';
import { Heart } from 'lucide-react';
import { EdgeIconBadge } from './EdgeIconBadge';

export function SpouseEdge({ sourceX, sourceY, targetX, targetY, style }: EdgeProps) {
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return (
    <>
      <BaseEdge path={path} style={style} />
      <EdgeIconBadge
        icon={Heart}
        x={labelX}
        y={labelY}
        className="border-rose-300 text-rose-500"
      />
    </>
  );
}
