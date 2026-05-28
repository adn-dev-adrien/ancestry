import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, TreePine, Upload } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { VersionBadge } from '@/components/VersionBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTree, useTrees } from '@/hooks/useTrees';
import { useImportExport } from '@/hooks/useImportExport';
import { ApiError } from '@/services/api';
import type { ExportPayload } from '@/services/importExport';

type ImportMode = 'new' | 'replace';

export function HomePage() {
  const { t } = useTranslation();
  const { data: trees, isLoading } = useTrees();
  const createTree = useCreateTree();
  const { importNew, importReplace } = useImportExport();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPayload, setImportPayload] = useState<ExportPayload | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('new');
  const [replaceTargetId, setReplaceTargetId] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTree.mutate(
      { title: trimmed, description: description.trim() || null },
      {
        onSuccess: (tree) => {
          setOpen(false);
          setTitle('');
          setDescription('');
          navigate(`/trees/${tree.id}`);
        },
      },
    );
  };

  const onFilePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportMode('new');
    setReplaceTargetId('');
    setImportError(null);
    try {
      const parsed = JSON.parse(await file.text()) as ExportPayload;
      setImportPayload(parsed);
    } catch {
      setImportPayload({} as ExportPayload);
      setImportError(t('importDialog.invalidFile'));
    }
  };

  const runImport = () => {
    if (!importPayload) return;
    setImportError(null);
    const onError = (e: unknown) =>
      setImportError(e instanceof ApiError ? e.message : t('importDialog.importFailed'));
    const onSuccess = (tree: { id: string }) => {
      setImportPayload(null);
      navigate(`/trees/${tree.id}`);
    };

    if (importMode === 'replace') {
      if (!replaceTargetId) return;
      importReplace.mutate({ treeId: replaceTargetId, payload: importPayload }, { onSuccess, onError });
    } else {
      importNew.mutate(importPayload, { onSuccess, onError });
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Ancestry</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LanguageSwitcher />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFilePicked}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" /> {t('home.import')}
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> {t('home.newTree')}
          </Button>
        </div>
      </header>

      <main className="mt-8 flex-1">
        {isLoading ? (
          <p className="text-muted-foreground">{t('common.loading')}</p>
        ) : trees && trees.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {trees.map((tree) => (
              <li key={tree.id}>
                <Link to={`/trees/${tree.id}`}>
                  <Card className="transition-colors hover:border-primary">
                    <CardHeader>
                      <CardTitle className="truncate">{tree.title}</CardTitle>
                      {tree.description && (
                        <CardDescription className="line-clamp-2">
                          {tree.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex justify-between text-sm text-muted-foreground">
                      <span>{t('home.people', { count: tree.personCount })}</span>
                      <span>{new Date(tree.updatedAt).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <TreePine className="mx-auto size-10 text-muted-foreground" />
              <CardTitle>{t('home.emptyTitle')}</CardTitle>
              <CardDescription>{t('home.emptyDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" /> {t('home.newTree')}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="mt-6 text-center text-xs text-muted-foreground">
        <VersionBadge />
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('home.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="tree-title">{t('home.titleLabel')}</Label>
              <Input
                id="tree-title"
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tree-description">{t('home.descriptionLabel')}</Label>
              <Textarea
                id="tree-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} disabled={!title.trim() || createTree.isPending}>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importPayload !== null} onOpenChange={(next) => !next && setImportPayload(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('importDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="import-mode">{t('importDialog.chooseTarget')}</Label>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                <SelectTrigger id="import-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t('importDialog.newTree')}</SelectItem>
                  <SelectItem value="replace">{t('importDialog.replace')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {importMode === 'replace' && (
              <div className="grid gap-1.5">
                <Label htmlFor="replace-target">{t('importDialog.selectTree')}</Label>
                <Select value={replaceTargetId} onValueChange={setReplaceTargetId}>
                  <SelectTrigger id="replace-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(trees ?? []).map((tree) => (
                      <SelectItem key={tree.id} value={tree.id}>
                        {tree.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('importDialog.replaceWarning')}</p>
              </div>
            )}

            {importError && <p className="text-sm text-destructive">{importError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportPayload(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={runImport}
              disabled={
                Boolean(importError) ||
                (importMode === 'replace' && !replaceTargetId) ||
                importNew.isPending ||
                importReplace.isPending
              }
            >
              {t('importDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
