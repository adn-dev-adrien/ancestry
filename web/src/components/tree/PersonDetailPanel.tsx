import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { PersonInput } from '@/services/persons';
import type { Person, Relationship } from '@/services/types';
import { childrenOf, parentsOf, spousesOf } from '@/utils/relationships';
import { fullName } from '@/utils/person';
import { PersonForm } from './PersonForm';

interface PersonDetailPanelProps {
  open: boolean;
  mode: 'create' | 'edit';
  person?: Person;
  persons: Person[];
  relationships: Relationship[];
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (input: PersonInput) => void;
  onExplicitSave?: () => void;
  onDelete?: () => void;
}

function RelativeList({
  label,
  ids,
  byId,
}: {
  label: string;
  ids: string[];
  byId: Map<string, Person>;
}) {
  const { t } = useTranslation();
  if (ids.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <ul className="mt-1 space-y-0.5 text-sm">
        {ids.map((id) => {
          const relative = byId.get(id);
          return <li key={id}>{relative ? fullName(relative) : t('common.unknown')}</li>;
        })}
      </ul>
    </div>
  );
}

function PanelBody({
  mode,
  person,
  persons,
  relationships,
  isSaving,
  onSubmit,
  onExplicitSave,
  onDelete,
}: Omit<PersonDetailPanelProps, 'open' | 'onClose'>) {
  const { t } = useTranslation();
  const byId = new Map(persons.map((p) => [p.id, p]));
  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <PersonForm
        key={person?.id ?? 'new'}
        person={person}
        mode={mode}
        onSubmit={onSubmit}
        onExplicitSave={onExplicitSave}
        onDelete={onDelete}
        isSaving={isSaving}
      />
      {mode === 'edit' && person && (
        <div className="space-y-3 border-t pt-4">
          <RelativeList label={t('panel.parents')} ids={parentsOf(person.id, relationships)} byId={byId} />
          <RelativeList label={t('panel.children')} ids={childrenOf(person.id, relationships)} byId={byId} />
          <RelativeList label={t('panel.spouses')} ids={spousesOf(person.id, relationships)} byId={byId} />
        </div>
      )}
    </div>
  );
}

export function PersonDetailPanel(props: PersonDetailPanelProps) {
  const { t } = useTranslation();
  const { open, mode, onClose } = props;
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const title = mode === 'create' ? t('panel.newPerson') : t('panel.editPerson');

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <PanelBody {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <PanelBody {...props} />
      </DrawerContent>
    </Drawer>
  );
}
