import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, type Locale } from '@/i18n';
import { cn } from '@/lib/utils';

const FLAGS: Record<Locale, string> = { fr: '🇫🇷', en: '🇬🇧' };

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'fr') as Locale;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {SUPPORTED_LOCALES.map((lng) => (
        <button
          key={lng}
          type="button"
          aria-label={lng}
          aria-pressed={current === lng}
          onClick={() => i18n.changeLanguage(lng)}
          className={cn(
            'rounded px-1.5 py-0.5 text-lg leading-none transition-opacity',
            current === lng ? 'opacity-100' : 'opacity-40 hover:opacity-70',
          )}
        >
          {FLAGS[lng]}
        </button>
      ))}
    </div>
  );
}
