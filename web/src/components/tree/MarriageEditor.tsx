import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { MarriageInput } from '@/services/relationships';
import type { Relationship } from '@/services/types';

interface MarriageEditorProps {
  relationship: Relationship | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (input: MarriageInput) => void;
}

export function MarriageEditor({ relationship, isSaving, onClose, onSave }: MarriageEditorProps) {
  const { t } = useTranslation();
  const [marriageDate, setMarriageDate] = useState('');
  const [divorced, setDivorced] = useState(false);
  const [divorceDate, setDivorceDate] = useState('');

  useEffect(() => {
    setMarriageDate(relationship?.marriageDate ?? '');
    setDivorced(relationship?.divorced ?? false);
    setDivorceDate(relationship?.divorceDate ?? '');
  }, [relationship]);

  const submit = () => {
    onSave({
      marriageDate: marriageDate || null,
      divorced,
      divorceDate: divorced ? divorceDate || null : null,
    });
  };

  return (
    <Dialog open={relationship !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('marriage.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="marriageDate">{t('marriage.date')}</Label>
            <Input
              id="marriageDate"
              type="date"
              value={marriageDate}
              onChange={(e) => setMarriageDate(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              aria-label={t('marriage.divorced')}
              checked={divorced}
              onCheckedChange={(checked) => {
                const next = checked === true;
                setDivorced(next);
                if (!next) setDivorceDate('');
              }}
            />
            {t('marriage.divorced')}
          </label>

          <div className="grid gap-1.5">
            <Label htmlFor="divorceDate">{t('marriage.divorceDate')}</Label>
            <Input
              id="divorceDate"
              type="date"
              value={divorceDate}
              disabled={!divorced}
              onChange={(e) => setDivorceDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
