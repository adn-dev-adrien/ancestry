import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { Baby } from 'lucide-react';
import { EdgeIconBadge } from './EdgeIconBadge';

export function ParentChildEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} />
      <EdgeIconBadge
        icon={Baby}
        x={labelX}
        y={labelY}
        className="border-blue-300 text-blue-500"
      />
    </>
  );
}
