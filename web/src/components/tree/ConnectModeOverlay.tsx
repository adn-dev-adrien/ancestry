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
  return (
    <div className="absolute inset-x-0 top-20 z-20 flex justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-4 shadow-xl">
        <p className="text-sm">
          <span className="font-semibold">{sourceName}</span> is…
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => onPick({ type: 'PARENT_CHILD', sourceIsParent: true })}
          >
            Parent of {targetName}
          </Button>
          <Button
            variant="outline"
            onClick={() => onPick({ type: 'PARENT_CHILD', sourceIsParent: false })}
          >
            Child of {targetName}
          </Button>
          <Button variant="outline" onClick={() => onPick({ type: 'SPOUSE' })}>
            Spouse of {targetName}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
