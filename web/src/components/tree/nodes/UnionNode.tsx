import { Handle, Position } from '@xyflow/react';
import { Baby } from 'lucide-react';

const hiddenHandle = '!h-px !w-px !min-w-0 !border-0 !bg-transparent';

/**
 * Decorative junction where a family's parents meet and the single connector to the
 * children branches out. Shows one baby badge for the whole family (instead of one per
 * child link). Must keep a real (non-zero) size so React Flow can position its handles
 * and the connecting edges render. Not selectable/draggable (set in layout).
 */
export function UnionNode() {
  return (
    <div className="flex size-5 items-center justify-center rounded-full border border-blue-300 bg-background text-blue-500 shadow-sm">
      <Handle id="union-target" type="target" position={Position.Top} className={hiddenHandle} />
      <Baby className="size-[13px]" strokeWidth={1.75} />
      <Handle id="union-source" type="source" position={Position.Bottom} className={hiddenHandle} />
    </div>
  );
}
