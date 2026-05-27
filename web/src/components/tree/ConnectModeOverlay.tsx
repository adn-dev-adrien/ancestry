import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export type ConnectChoice =
  | { type: 'PARENT_CHILD'; sourceIsParent: boolean }
  | { type: 'SPOUSE' };

interface ConnectModeOverlayProps {
  sourceName: string;
  targetName: string;
  onPick: (choice: ConnectChoice) => void;
  onCancel: () => void;
}

export function ConnectModeOverlay({
  sourceName,
  targetName,
  onPick,
  onCancel,
}: ConnectModeOverlayProps) {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-x-0 top-20 z-20 flex justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-4 shadow-xl">
        <p className="text-sm">{t('connect.prompt', { source: sourceName })}</p>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => onPick({ type: 'PARENT_CHILD', sourceIsParent: true })}
          >
            {t('connect.parentOf', { target: targetName })}
          </Button>
          <Button
            variant="outline"
            onClick={() => onPick({ type: 'PARENT_CHILD', sourceIsParent: false })}
          >
            {t('connect.childOf', { target: targetName })}
          </Button>
          <Button variant="outline" onClick={() => onPick({ type: 'SPOUSE' })}>
            {t('connect.spouseOf', { target: targetName })}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={onCancel}>
          {t('connect.cancel')}
        </Button>
      </div>
    </div>
  );
}
