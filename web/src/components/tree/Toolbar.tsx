import { useReactFlow } from '@xyflow/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Download, Link2, Maximize, Save, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved';

const STATUS_KEY: Record<SaveStatus, string> = {
  idle: 'toolbar.statusIdle',
  dirty: 'toolbar.statusDirty',
  saving: 'toolbar.statusSaving',
  saved: 'toolbar.statusSaved',
};

interface ToolbarProps {
  connectMode: boolean;
  saveStatus: SaveStatus;
  onToggleConnect: () => void;
  onAddPerson: () => void;
  onSave: () => void;
  onExport: () => void;
}

export function Toolbar({
  connectMode,
  saveStatus,
  onToggleConnect,
  onAddPerson,
  onSave,
  onExport,
}: ToolbarProps) {
  const { t } = useTranslation();
  const { fitView } = useReactFlow();
  const canSave = saveStatus === 'dirty';
  const statusLabel = t(STATUS_KEY[saveStatus]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center md:inset-x-auto md:bottom-auto md:left-1/2 md:top-4 md:-translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-background/90 p-1 shadow-lg backdrop-blur">
        <Button asChild variant="ghost" size="icon" title={t('toolbar.back')}>
          <Link to="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={t('toolbar.fitView')}
          onClick={() => fitView({ duration: 300 })}
        >
          <Maximize className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" title={t('toolbar.addPerson')} onClick={onAddPerson}>
          <UserPlus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" title={t('toolbar.export')} onClick={onExport}>
          <Download className="size-4" />
        </Button>
        <Button
          variant={connectMode ? 'default' : 'ghost'}
          size="icon"
          title={t('toolbar.connectMode')}
          onClick={onToggleConnect}
        >
          <Link2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={statusLabel}
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
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
