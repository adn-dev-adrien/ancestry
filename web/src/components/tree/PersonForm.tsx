import { useEffect, useMemo, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GENDERS } from '@/constants/gender';
import type { PersonInput } from '@/services/persons';
import type { Person } from '@/services/types';

interface PersonFormValues {
  givenName: string;
  birthName: string;
  familyName: string;
  birthDate: string;
  deathDate: string;
  living: boolean;
  birthPlace: string;
  birthPlaceUncertain: boolean;
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
      birthName: z.string().max(100),
      familyName: z.string().max(100),
      birthDate: optionalDate,
      deathDate: optionalDate,
      living: z.boolean(),
      birthPlace: z.string().max(200),
      birthPlaceUncertain: z.boolean(),
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
    birthName: person?.birthName ?? '',
    familyName: person?.familyName ?? '',
    birthDate: person?.birthDate ?? '',
    deathDate: person?.deathDate ?? '',
    living: person?.living ?? false,
    birthPlace: person?.birthPlace ?? '',
    birthPlaceUncertain: person?.birthPlaceUncertain ?? false,
    gender: person?.gender ?? '',
    notes: person?.notes ?? '',
  };
}

function toInput(values: PersonFormValues): PersonInput {
  return {
    givenName: values.givenName.trim(),
    birthName: values.birthName || null,
    familyName: values.familyName || null,
    birthDate: values.birthDate || null,
    deathDate: values.deathDate || null,
    living: values.living,
    birthPlace: values.birthPlace || null,
    birthPlaceUncertain: values.birthPlaceUncertain,
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

  const setLiving = (checked: boolean) => {
    setValue('living', checked, { shouldDirty: true, shouldValidate: true });
    if (checked) setValue('deathDate', '', { shouldDirty: true, shouldValidate: true });
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => {
        onSubmit(toInput(values));
        onExplicitSave?.();
      })}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="givenName">{t('form.givenName')}</Label>
        <Input id="givenName" {...register('givenName')} autoComplete="off" />
        {errors.givenName && (
          <p className="text-xs text-destructive">{errors.givenName.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="birthName">{t('form.birthName')}</Label>
        <Input id="birthName" {...register('birthName')} autoComplete="off" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="familyName">{t('form.familyName')}</Label>
        <Input id="familyName" {...register('familyName')} autoComplete="off" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="birthDate">{t('form.birthDate')}</Label>
          <Input id="birthDate" type="date" {...register('birthDate')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="deathDate">{t('form.deathDate')}</Label>
          <Input id="deathDate" type="date" disabled={living} {...register('deathDate')} />
          {errors.deathDate && (
            <p className="text-xs text-destructive">{errors.deathDate.message}</p>
          )}
        </div>
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

      <div className="grid gap-1.5">
        <Label htmlFor="birthPlace">{t('form.birthPlace')}</Label>
        <Input id="birthPlace" {...register('birthPlace')} autoComplete="off" />
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

      <div className="flex items-center justify-between gap-2 pt-1">
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
    </form>
  );
}
