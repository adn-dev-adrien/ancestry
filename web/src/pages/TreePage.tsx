import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { useTree } from '@/hooks/useTree';
import { usePersonMutations } from '@/hooks/usePersonMutations';
import { useRelationshipMutations } from '@/hooks/useRelationshipMutations';
import { useUpdateTree } from '@/hooks/useTrees';
import { ApiError } from '@/services/api';
import type { PersonInput } from '@/services/persons';
import type { Person } from '@/services/types';
import { fullName } from '@/utils/person';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { Toolbar, type SaveStatus } from '@/components/tree/Toolbar';
import { PersonDetailPanel } from '@/components/tree/PersonDetailPanel';
import {
  ConnectModeOverlay,
  type ConnectChoice,
} from '@/components/tree/ConnectModeOverlay';

type PanelState = { mode: 'create' } | { mode: 'edit'; personId: string } | null;

export function TreePage() {
  const { treeId = '' } = useParams();
  const { data: tree, isLoading } = useTree(treeId);
  const persons = tree?.persons ?? [];
  const relationships = tree?.relationships ?? [];

  const personMutations = usePersonMutations(treeId);
  const relationshipMutations = useRelationshipMutations(treeId);
  const updateTree = useUpdateTree();

  const [panel, setPanel] = useState<PanelState>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [connectTargetId, setConnectTargetId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const byId = (id: string | null) => persons.find((p) => p.id === id);
  const showError = (e: unknown) =>
    setError(e instanceof ApiError ? e.message : 'Something went wrong');

  // ---- Position autosave (1s debounce + explicit flush) ----
  const pending = useRef<Map<string, { x: number; y: number }>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(async () => {
    if (pending.current.size === 0) return;
    const entries = [...pending.current.entries()];
    pending.current.clear();
    setSaveStatus('saving');
    try {
      await Promise.all(
        entries.map(([id, pos]) => personMutations.savePosition.mutateAsync({ id, ...pos })),
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 1500);
    } catch (e) {
      showError(e);
      setSaveStatus('dirty');
    }
  }, [personMutations.savePosition]);

  const onPositionChange = (id: string, x: number, y: number) => {
    pending.current.set(id, { x, y });
    setSaveStatus('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 1000);
  };

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  // ---- Node interactions ----
  const exitConnect = () => {
    setConnectSourceId(null);
    setConnectTargetId(null);
  };

  const onNodeClick = (id: string) => {
    if (connectMode) {
      if (!connectSourceId) {
        setConnectSourceId(id);
      } else if (id === connectSourceId) {
        setConnectSourceId(null);
      } else {
        setConnectTargetId(id);
      }
      return;
    }
    setPanel({ mode: 'edit', personId: id });
  };

  const onPaneClick = () => {
    if (connectMode) {
      setConnectMode(false);
      exitConnect();
    }
    setPanel(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (connectMode) {
        setConnectMode(false);
        exitConnect();
      }
      setPanel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connectMode]);

  const onConnectPick = (choice: ConnectChoice) => {
    if (!connectSourceId || !connectTargetId) return;
    const body =
      choice.type === 'SPOUSE'
        ? { sourcePersonId: connectSourceId, targetPersonId: connectTargetId, type: 'SPOUSE' as const }
        : choice.sourceIsParent
          ? {
              sourcePersonId: connectSourceId,
              targetPersonId: connectTargetId,
              type: 'PARENT_CHILD' as const,
            }
          : {
              sourcePersonId: connectTargetId,
              targetPersonId: connectSourceId,
              type: 'PARENT_CHILD' as const,
            };
    relationshipMutations.create.mutate(body, {
      onError: showError,
      onSettled: exitConnect,
    });
  };

  // ---- Person create / edit / delete ----
  const onSubmitPerson = (input: PersonInput) => {
    if (panel?.mode === 'edit') {
      personMutations.update.mutate({ id: panel.personId, ...input }, { onError: showError });
    } else {
      personMutations.create.mutate(input, {
        onError: showError,
        onSuccess: () => setPanel(null),
      });
    }
  };

  const onDeletePerson = () => {
    if (panel?.mode !== 'edit') return;
    const person = byId(panel.personId);
    const confirmed = window.confirm(
      `Delete ${person ? fullName(person) : 'this person'} and all their relationships?`,
    );
    if (!confirmed) return;
    personMutations.remove.mutate(panel.personId, {
      onError: showError,
      onSuccess: () => setPanel(null),
    });
  };

  const editingPerson: Person | undefined =
    panel?.mode === 'edit' ? byId(panel.personId) : undefined;

  if (isLoading) {
    return <div className="grid min-h-dvh place-items-center text-muted-foreground">Loading…</div>;
  }
  if (!tree) {
    return <div className="grid min-h-dvh place-items-center text-muted-foreground">Tree not found.</div>;
  }

  return (
    <ReactFlowProvider>
      <div className="relative h-dvh w-full">
        <input
          aria-label="Tree title"
          defaultValue={tree.title}
          key={tree.title}
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (value && value !== tree.title) {
              updateTree.mutate({ id: treeId, title: value }, { onError: showError });
            }
          }}
          className="absolute left-4 top-4 z-10 max-w-[50%] truncate rounded bg-transparent px-1 text-lg font-semibold outline-none focus:bg-background focus:ring-1 focus:ring-ring"
        />

        <TreeCanvas
          persons={persons}
          relationships={relationships}
          selectedId={panel?.mode === 'edit' ? panel.personId : null}
          connectMode={connectMode}
          connectSourceId={connectSourceId}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onPositionChange={onPositionChange}
        />

        <Toolbar
          connectMode={connectMode}
          saveStatus={saveStatus}
          onToggleConnect={() => {
            setConnectMode((on) => !on);
            exitConnect();
          }}
          onAddPerson={() => {
            setConnectMode(false);
            exitConnect();
            setPanel({ mode: 'create' });
          }}
          onSave={() => {
            if (timer.current) clearTimeout(timer.current);
            void flush();
          }}
        />

        {connectMode && connectSourceId && connectTargetId && (
          <ConnectModeOverlay
            sourceName={fullName(byId(connectSourceId)!)}
            targetName={fullName(byId(connectTargetId)!)}
            onPick={onConnectPick}
            onCancel={() => setConnectTargetId(null)}
          />
        )}

        {error && (
          <div className="absolute inset-x-0 top-16 z-30 mx-auto w-fit max-w-[90%] rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground shadow-lg">
            <button className="font-medium" onClick={() => setError(null)}>
              {error} ✕
            </button>
          </div>
        )}

        <PersonDetailPanel
          open={panel !== null}
          mode={panel?.mode ?? 'edit'}
          person={editingPerson}
          persons={persons}
          relationships={relationships}
          isSaving={personMutations.update.isPending || personMutations.create.isPending}
          onClose={() => setPanel(null)}
          onSubmit={onSubmitPerson}
          onExplicitSave={panel?.mode === 'edit' ? () => setPanel(null) : undefined}
          onDelete={panel?.mode === 'edit' ? onDeletePerson : undefined}
        />
      </div>
    </ReactFlowProvider>
  );
}
