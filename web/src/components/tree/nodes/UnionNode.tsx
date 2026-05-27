import { Handle, Position } from '@xyflow/react';
import { Baby } from 'lucide-react';

const hiddenHandle = '!h-px !w-px !min-w-0 !border-0 !bg-transparent';

/**
 * Decorative junction where a family's parents meet and the single connector to the
 * children branches out. Shows one baby badge for the whole family (instead of one per
 * child link). Not selectable/draggable (set in layout).
 */
export function UnionNode() {
  return (
    <div className="relative">
      <Handle id="union-target" type="target" position={Position.Top} className={hiddenHandle} />
      <div className="absolute left-0 top-0 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300 bg-background text-blue-500 shadow-sm">
        <Baby className="size-[13px]" strokeWidth={1.75} />
      </div>
      <Handle id="union-source" type="source" position={Position.Bottom} className={hiddenHandle} />
    </div>
  );
}
