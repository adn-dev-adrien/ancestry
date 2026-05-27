import { Handle, Position } from '@xyflow/react';

const hiddenHandle = '!h-px !w-px !min-w-0 !border-0 !bg-transparent';

/**
 * Tiny decorative junction where a family's parents meet and the single connector
 * to the children branches out. Not selectable/draggable (set in layout).
 */
export function UnionNode() {
  return (
    <div className="size-1.5 -translate-x-1/2 rounded-full bg-muted-foreground/40">
      <Handle id="union-target" type="target" position={Position.Top} className={hiddenHandle} />
      <Handle id="union-source" type="source" position={Position.Bottom} className={hiddenHandle} />
    </div>
  );
}
