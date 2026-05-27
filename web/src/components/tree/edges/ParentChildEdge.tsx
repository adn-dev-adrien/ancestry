import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

// Plain, light orthogonal connector used for both parent→union and union→child segments
// (the "family bus"). No icon badge, so multiple children stay uncluttered.
export function ParentChildEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return <BaseEdge path={path} markerEnd={markerEnd} style={{ strokeWidth: 1.5 }} />;
}
