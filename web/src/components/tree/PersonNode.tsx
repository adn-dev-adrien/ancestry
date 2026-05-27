import { memo } from 'react';
import { Handle, Position, useStore, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { GENDER_NODE_CLASSES, NEUTRAL_NODE_CLASS } from '@/constants/gender';
import type { PersonNode as PersonNodeType } from '@/utils/layout';
import { NODE_HEIGHT, NODE_WIDTH } from '@/utils/layout';
import { fullName, lifeSpan } from '@/utils/person';
import { nameFontSize, nodeDetailLevel } from '@/utils/nodeDetail';
import { cn } from '@/lib/utils';

function PersonNodeComponent({ data, selected }: NodeProps<PersonNodeType>) {
  const { t } = useTranslation();
  const { person } = data;
  // Round to 0.05 steps so the node only re-renders on meaningful zoom changes.
  const zoom = useStore((s) => Math.round(s.transform[2] * 20) / 20);
  const level = nodeDetailLevel(zoom);
  const nameStyle = { fontSize: `${nameFontSize(zoom)}px` };

  const span = lifeSpan(person, {
    born: t('person.bornPrefix'),
    death: t('person.deathPrefix'),
  });
  const tint = person.gender ? GENDER_NODE_CLASSES[person.gender] : NEUTRAL_NODE_CLASS;

  const avatar = person.photo && (
    <img
      src={person.photo}
      alt=""
      className="size-10 shrink-0 rounded-md border border-border object-cover"
    />
  );

  return (
    <div
      className={cn(
        'flex select-none items-center gap-2 rounded-lg border px-3 py-2 shadow-sm transition-transform',
        level === 'compact' && 'justify-center',
        tint,
        selected && 'border-primary ring-2 ring-primary scale-[1.03]',
      )}
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      <Handle id="pc-target" type="target" position={Position.Top} className="!bg-muted-foreground" />
      <Handle id="spouse-left" type="target" position={Position.Left} className="!bg-rose-300" />

      {level === 'compact' ? (
        <div className="truncate text-center font-semibold leading-tight" style={nameStyle}>
          {fullName(person)}
        </div>
      ) : (
        <>
          {avatar}
          <div className="flex min-w-0 flex-col justify-center">
            <div className="truncate font-semibold leading-tight" style={nameStyle}>
              {fullName(person)}
            </div>
            {level === 'full' && (
              <>
                {span && <div className="text-xs text-muted-foreground">{span}</div>}
                {person.birthPlace && (
                  <div className="truncate text-xs text-muted-foreground">
                    {person.birthPlace}
                    {person.birthPlaceUncertain ? ' ?' : ''}
                  </div>
                )}
                {person.gender && (
                  <span className="mt-1 w-fit rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t(`person.gender.${person.gender}`)}
                  </span>
                )}
              </>
            )}
          </div>
        </>
      )}

      <Handle id="spouse-right" type="source" position={Position.Right} className="!bg-rose-300" />
      <Handle id="pc-source" type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  );
}

export const PersonNode = memo(PersonNodeComponent);
