import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { communeLabel, searchCommunes } from '@/services/communes';

interface CommuneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export function CommuneInput({ value, onChange, id, placeholder }: CommuneInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(value, 250);
  const enabled = debounced.trim().length >= 2;

  const { data: communes = [] } = useQuery({
    queryKey: ['communes', debounced],
    queryFn: ({ signal }) => searchCommunes(debounced.trim(), signal),
    enabled,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const showDropdown = open && enabled && communes.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      />

      {showDropdown && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
          {communes.map((commune) => (
            <li key={`${commune.nom}-${commune.codePostal ?? commune.departement}`}>
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(communeLabel(commune));
                  setOpen(false);
                }}
              >
                <span className="truncate font-medium">{commune.nom}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {commune.departement}
                  {commune.codePostal ? ` (${commune.codePostal})` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
