import { useEffect, useMemo, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Person } from '@/services/types';
import { lifeSpan, searchLabel } from '@/utils/person';
import { searchPersons } from '@/utils/search';

interface TreeSearchProps {
  persons: Person[];
  onSelect: (personId: string) => void;
}

export function TreeSearch({ persons, onSelect }: TreeSearchProps) {
  const { t } = useTranslation();
  const { fitView } = useReactFlow();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchPersons(persons, query), [persons, query]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const handleSelect = (person: Person) => {
    fitView({ nodes: [{ id: person.id }], duration: 500, maxZoom: 1.2 });
    onSelect(person.id);
    setQuery('');
    setOpen(false);
  };

  const showDropdown = open && query.trim() !== '';

  return (
    <div ref={containerRef} className="relative w-56 max-w-[60vw]">
      <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        placeholder={t('search.placeholder')}
        className="bg-background/90 pl-8 backdrop-blur"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            e.currentTarget.blur();
          }
        }}
      />

      {showDropdown && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">{t('search.noResults')}</li>
          ) : (
            results.map((person) => {
              const span = lifeSpan(person, {
                born: t('person.bornPrefix'),
                death: t('person.deathPrefix'),
              });
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    className="flex w-full items-baseline justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(person);
                    }}
                  >
                    <span className="truncate">{searchLabel(person)}</span>
                    {span && <span className="shrink-0 text-xs text-muted-foreground">{span}</span>}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
