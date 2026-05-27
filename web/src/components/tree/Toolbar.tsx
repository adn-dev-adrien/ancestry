import { useReactFlow } from '@xyflow/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Link2, Maximize, Save, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved';

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: 'Saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
};

interface ToolbarProps {
  connectMode: boolean;
  saveStatus: SaveStatus;
  onToggleConnect: () => void;
  onAddPerson: () => void;
  onSave: () => void;
}

export function Toolbar({
  connectMode,
  saveStatus,
  onToggleConnect,
  onAddPerson,
  onSave,
}: ToolbarProps) {
  const { fitView } = useReactFlow();
  const canSave = saveStatus === 'dirty';

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center md:inset-x-auto md:bottom-auto md:left-1/2 md:top-4 md:-translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-background/90 p-1 shadow-lg backdrop-blur">
        <Button asChild variant="ghost" size="icon" title="Back to trees">
          <Link to="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Fit view"
          onClick={() => fitView({ duration: 300 })}
        >
          <Maximize className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Add person" onClick={onAddPerson}>
          <UserPlus className="size-4" />
        </Button>
        <Button
          variant={connectMode ? 'default' : 'ghost'}
          size="icon"
          title="Connect mode"
          onClick={onToggleConnect}
        >
          <Link2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={STATUS_LABEL[saveStatus]}
          disabled={!canSave}
          onClick={onSave}
        >
          {saveStatus === 'saved' || saveStatus === 'idle' ? (
            <Check className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
        </Button>
        <span
          className={cn(
            'px-2 text-xs',
            saveStatus === 'dirty' ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {STATUS_LABEL[saveStatus]}
        </span>
      </div>
    </div>
  );
}
