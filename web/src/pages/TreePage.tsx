import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TreeSearch } from '@/components/tree/TreeSearch';
import { downloadTreeExport } from '@/services/importExport';
import { useTree } from '@/hooks/useTree';
import { usePersonMutations } from '@/hooks/usePersonMutations';
import { useRelationshipMutations } from '@/hooks/useRelationshipMutations';
import { useUpdateTree } from '@/hooks/useTrees';
import { ApiError } from '@/services/api';
import type { PersonInput } from '@/services/persons';
import type { Person, Relationship } from '@/services/types';
import { fullName } from '@/utils/person';
import { relationshipIdsForEdge, type ParentChildEdgeData } from '@/utils/edgeDeletion';
import type { Edge } from '@xyflow/react';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { Toolbar, type SaveStatus } from '@/components/tree/Toolbar';
import { PersonDetailPanel } from '@/components/tree/PersonDetailPanel';
import { MarriageEditor } from '@/components/tree/MarriageEditor';
import {
  ConnectModeOverlay,
  type ConnectChoice,
} from '@/components/tree/ConnectModeOverlay';

type PanelState = { mode: 'create' } | { mode: 'edit'; personId: string } | null;

export function TreePage() {
  const { t } = useTranslation();
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
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingMarriage, setEditingMarriage] = useState<Relationship | null>(null);

  const byId = (id: string | null) => persons.find((p) => p.id === id);
  const showError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError) {
        setError(e.body.code ? t(`errors.${e.body.code}`, { defaultValue: e.message }) : e.message);
      } else {
        setError(t('tree.errorGeneric'));
      }
    },
    [t],
  );

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
  }, [personMutations.savePosition, showError]);

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
    setFocusedId(null);
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
      t('tree.deleteConfirm', { name: person ? fullName(person) : t('common.unknown') }),
    );
    if (!confirmed) return;
    personMutations.remove.mutate(panel.personId, {
      onError: showError,
      onSuccess: () => setPanel(null),
    });
  };

  // ---- Relationship deletion (graph edge + in-panel trash) ----
  const deleteRelationships = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map((id) => relationshipMutations.remove.mutateAsync(id).catch(showError)),
      );
    } catch (e) {
      showError(e);
    }
  };

  const confirmEdgeDeletion = (edge: Edge): boolean => {
    if (edge.type === 'spouse') {
      const rel = relationships.find((r) => r.id === edge.id);
      if (!rel) return false;
      const a = byId(rel.sourcePersonId);
      const b = byId(rel.targetPersonId);
      return window.confirm(
        t('tree.removeSpouseLinkConfirm', {
          a: a ? fullName(a) : t('common.unknown'),
          b: b ? fullName(b) : t('common.unknown'),
        }),
      );
    }
    const data = edge.data as ParentChildEdgeData | undefined;
    if (!data) return false;
    if (data.kind === 'parent-of-family') {
      return window.confirm(
        t('tree.removeBranchParentConfirm', { count: data.childrenIds.length }),
      );
    }
    const child = byId(data.childId);
    return window.confirm(
      t('tree.removeBranchChildConfirm', {
        count: data.parentIds.length,
        name: child ? fullName(child) : t('common.unknown'),
      }),
    );
  };

  const onEdgesDelete = (deleted: Edge[]) => {
    const ids = new Set<string>();
    for (const edge of deleted) {
      if (!confirmEdgeDeletion(edge)) continue;
      relationshipIdsForEdge(edge, relationships).forEach((id) => ids.add(id));
    }
    if (ids.size > 0) void deleteRelationships([...ids]);
  };

  const onDeleteParent = (personId: string, parentId: string) => {
    const parent = byId(parentId);
    if (!window.confirm(
      t('panel.removeParentConfirm', { name: parent ? fullName(parent) : t('common.unknown') }),
    )) return;
    const rel = relationships.find(
      (r) => r.type === 'PARENT_CHILD' && r.sourcePersonId === parentId && r.targetPersonId === personId,
    );
    if (rel) void deleteRelationships([rel.id]);
  };

  const onDeleteChild = (personId: string, childId: string) => {
    const child = byId(childId);
    if (!window.confirm(
      t('panel.removeChildConfirm', { name: child ? fullName(child) : t('common.unknown') }),
    )) return;
    const rel = relationships.find(
      (r) => r.type === 'PARENT_CHILD' && r.sourcePersonId === personId && r.targetPersonId === childId,
    );
    if (rel) void deleteRelationships([rel.id]);
  };

  const onDeleteSpouse = (relationship: Relationship) => {
    const partnerId =
      relationship.sourcePersonId === (panel?.mode === 'edit' ? panel.personId : '')
        ? relationship.targetPersonId
        : relationship.sourcePersonId;
    const partner = byId(partnerId);
    if (!window.confirm(
      t('panel.removeSpouseConfirm', { name: partner ? fullName(partner) : t('common.unknown') }),
    )) return;
    void deleteRelationships([relationship.id]);
  };

  const editingPerson: Person | undefined =
    panel?.mode === 'edit' ? byId(panel.personId) : undefined;

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }
  if (!tree) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted-foreground">
        {t('tree.notFound')}
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="relative h-dvh w-full">
        <input
          aria-label={t('tree.titleAria')}
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

        <LanguageSwitcher className="absolute right-4 top-4 z-10" />

        <div className="absolute left-4 top-16 z-10">
          <TreeSearch persons={persons} onSelect={setFocusedId} />
        </div>

        <TreeCanvas
          treeId={treeId}
          persons={persons}
          relationships={relationships}
          selectedId={panel?.mode === 'edit' ? panel.personId : null}
          focusedId={focusedId}
          connectMode={connectMode}
          connectSourceId={connectSourceId}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onPositionChange={onPositionChange}
          onSpouseEdgeClick={(id) => {
            const rel = relationships.find((r) => r.id === id);
            if (rel) setEditingMarriage(rel);
          }}
          onEdgesDelete={onEdgesDelete}
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
          onExport={() => {
            downloadTreeExport(treeId, tree.title).catch(showError);
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
          onEditMarriage={setEditingMarriage}
          onDeleteParent={onDeleteParent}
          onDeleteChild={onDeleteChild}
          onDeleteSpouse={onDeleteSpouse}
        />

        <MarriageEditor
          relationship={editingMarriage}
          isSaving={relationshipMutations.update.isPending}
          onClose={() => setEditingMarriage(null)}
          onSave={(input) => {
            if (!editingMarriage) return;
            relationshipMutations.update.mutate(
              { id: editingMarriage.id, ...input },
              { onError: showError, onSuccess: () => setEditingMarriage(null) },
            );
          }}
        />
      </div>
    </ReactFlowProvider>
  );
}
