import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CommuneInput } from './CommuneInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GENDERS } from '@/constants/gender';
import { fileToAvatarDataUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import type { PersonInput } from '@/services/persons';
import type { Person } from '@/services/types';

interface PersonFormValues {
  givenName: string;
  additionalGivenNames: string;
  birthName: string;
  familyName: string;
  birthDate: string;
  deathDate: string;
  living: boolean;
  birthPlace: string;
  birthPlaceUncertain: boolean;
  deathPlace: string;
  deathPlaceUncertain: boolean;
  photo: string;
  gender: '' | 'MALE' | 'FEMALE' | 'OTHER';
  notes: string;
}

function makeSchema(t: TFunction) {
  const optionalDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, t('form.errDateFormat'))
    .or(z.literal(''));

  return z
    .object({
      givenName: z.string().trim().min(1, t('form.errGivenNameRequired')).max(100),
      additionalGivenNames: z.string().max(200),
      birthName: z.string().max(100),
      familyName: z.string().max(100),
      birthDate: optionalDate,
      deathDate: optionalDate,
      living: z.boolean(),
      birthPlace: z.string().max(200),
      birthPlaceUncertain: z.boolean(),
      deathPlace: z.string().max(200),
      deathPlaceUncertain: z.boolean(),
      photo: z.string(),
      gender: z.enum(['', 'MALE', 'FEMALE', 'OTHER']),
      notes: z.string().max(2000),
    })
    .refine((d) => !(d.birthDate && d.deathDate) || d.deathDate >= d.birthDate, {
      message: t('form.errDeathBeforeBirth'),
      path: ['deathDate'],
    })
    .refine((d) => !(d.living && d.deathDate), {
      message: t('form.errLivingWithDeath'),
      path: ['deathDate'],
    });
}

function toFormValues(person?: Person): PersonFormValues {
  return {
    givenName: person?.givenName ?? '',
    additionalGivenNames: person?.additionalGivenNames ?? '',
    birthName: person?.birthName ?? '',
    familyName: person?.familyName ?? '',
    birthDate: person?.birthDate ?? '',
    deathDate: person?.deathDate ?? '',
    living: person?.living ?? false,
    birthPlace: person?.birthPlace ?? '',
    birthPlaceUncertain: person?.birthPlaceUncertain ?? false,
    deathPlace: person?.deathPlace ?? '',
    deathPlaceUncertain: person?.deathPlaceUncertain ?? false,
    photo: person?.photo ?? '',
    gender: person?.gender ?? '',
    notes: person?.notes ?? '',
  };
}

function toInput(values: PersonFormValues): PersonInput {
  return {
    givenName: values.givenName.trim(),
    additionalGivenNames: values.additionalGivenNames || null,
    birthName: values.birthName || null,
    familyName: values.familyName || null,
    birthDate: values.birthDate || null,
    deathDate: values.deathDate || null,
    living: values.living,
    birthPlace: values.birthPlace || null,
    birthPlaceUncertain: values.birthPlaceUncertain,
    deathPlace: values.deathPlace || null,
    deathPlaceUncertain: values.deathPlaceUncertain,
    photo: values.photo || null,
    gender: values.gender || null,
    notes: values.notes || null,
  };
}

interface PersonFormProps {
  person?: Person;
  mode: 'create' | 'edit';
  onSubmit: (input: PersonInput) => void;
  onExplicitSave?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
}

export function PersonForm({
  person,
  mode,
  onSubmit,
  onExplicitSave,
  onDelete,
  isSaving,
}: PersonFormProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => makeSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: toFormValues(person),
  });

  useEffect(() => {
    reset(toFormValues(person));
  }, [person, reset]);

  // Edit mode: debounce-save 500ms after the last valid change.
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  const watched = watch();
  useEffect(() => {
    if (mode !== 'edit' || !isDirty || !isValid) return;
    const timer = setTimeout(() => submitRef.current(toInput(watched)), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isDirty, isValid, JSON.stringify(watched)]);

  const gender = watch('gender');
  const living = watch('living');
  const birthPlaceUncertain = watch('birthPlaceUncertain');
  const birthPlace = watch('birthPlace');
  const deathPlaceUncertain = watch('deathPlaceUncertain');
  const deathPlace = watch('deathPlace');
  const photo = watch('photo');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const applyPhotoFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await fileToAvatarDataUrl(file);
    setValue('photo', dataUrl, { shouldDirty: true, shouldValidate: true });
  };

  const onPhotoPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    void applyPhotoFile(file);
  };

  const onPhotoDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void applyPhotoFile(event.dataTransfer.files?.[0]);
  };

  const setLiving = (checked: boolean) => {
    setValue('living', checked, { shouldDirty: true, shouldValidate: true });
    if (checked) {
      // Death date and death place disappear from the UI; clear them so we don't ship stale data.
      setValue('deathDate', '', { shouldDirty: true, shouldValidate: true });
      setValue('deathPlace', '', { shouldDirty: true, shouldValidate: true });
      setValue('deathPlaceUncertain', false, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => {
        onSubmit(toInput(values));
        onExplicitSave?.();
      })}
    >
      {/* Sticky action bar: stays visible while the user scrolls through the form. */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-2 border-b bg-background px-4 py-2">
        {onDelete ? (
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="size-4" /> {t('form.delete')}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={!isValid || isSaving}>
          {mode === 'create' ? t('form.addPerson') : t('form.save')}
        </Button>
      </div>

      <div
        className={cn(
          'flex items-center gap-3 rounded-md border border-dashed p-3 transition-colors',
          dragging ? 'border-primary bg-accent' : 'border-border',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onPhotoDrop}
      >
        <div className="size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
          {photo && <img src={photo} alt="" className="size-full object-cover" />}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoPicked}
          />
          <p className="text-xs text-muted-foreground">{t('form.dropHint')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => photoInputRef.current?.click()}
          >
            {t('form.choosePhoto')}
          </Button>
          {photo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setValue('photo', '', { shouldDirty: true, shouldValidate: true })}
            >
              {t('form.removePhoto')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="givenName">{t('form.givenName')}</Label>
        <Input id="givenName" {...register('givenName')} autoComplete="off" />
        {errors.givenName && (
          <p className="text-xs text-destructive">{errors.givenName.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="additionalGivenNames">{t('form.additionalGivenNames')}</Label>
        <Input id="additionalGivenNames" {...register('additionalGivenNames')} autoComplete="off" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="familyName">{t('form.familyName')}</Label>
        <Input id="familyName" {...register('familyName')} autoComplete="off" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="birthName">{t('form.birthName')}</Label>
        <Input id="birthName" {...register('birthName')} autoComplete="off" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="birthDate">{t('form.birthDate')}</Label>
        <Input id="birthDate" type="date" {...register('birthDate')} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="birthPlace">{t('form.birthPlace')}</Label>
        <CommuneInput
          id="birthPlace"
          value={birthPlace}
          placeholder={t('form.birthPlace')}
          onChange={(v) => setValue('birthPlace', v, { shouldDirty: true, shouldValidate: true })}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            id="birthPlaceUncertain"
            aria-label={t('form.uncertain')}
            checked={birthPlaceUncertain}
            onCheckedChange={(checked) =>
              setValue('birthPlaceUncertain', checked === true, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          {t('form.uncertain')}
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          id="living"
          aria-label={t('form.living')}
          checked={living}
          onCheckedChange={(checked) => setLiving(checked === true)}
        />
        {t('form.living')}
      </label>

      {!living && (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="deathDate">{t('form.deathDate')}</Label>
            <Input id="deathDate" type="date" {...register('deathDate')} />
            {errors.deathDate && (
              <p className="text-xs text-destructive">{errors.deathDate.message}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="deathPlace">{t('form.deathPlace')}</Label>
            <CommuneInput
              id="deathPlace"
              value={deathPlace}
              placeholder={t('form.deathPlace')}
              onChange={(v) =>
                setValue('deathPlace', v, { shouldDirty: true, shouldValidate: true })
              }
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                id="deathPlaceUncertain"
                aria-label={t('form.uncertain')}
                checked={deathPlaceUncertain}
                onCheckedChange={(checked) =>
                  setValue('deathPlaceUncertain', checked === true, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              {t('form.uncertain')}
            </label>
          </div>
        </>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="gender">{t('form.gender')}</Label>
        <Select
          value={gender || undefined}
          onValueChange={(value) =>
            setValue('gender', value as PersonFormValues['gender'], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="gender">
            <SelectValue placeholder={t('form.genderPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {GENDERS.map((g) => (
              <SelectItem key={g} value={g}>
                {t(`person.gender.${g}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">{t('form.notes')}</Label>
        <Textarea id="notes" rows={3} {...register('notes')} />
      </div>
    </form>
  );
}
