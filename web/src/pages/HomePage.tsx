import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Plus, TreePine } from 'lucide-react';
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
import { useCreateTree, useTrees } from '@/hooks/useTrees';

export function HomePage() {
  const { data: trees, isLoading } = useTrees();
  const createTree = useCreateTree();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 py-6 md:px-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Ancestry</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New tree
        </Button>
      </header>

      <main className="mt-8 flex-1">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
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
                      <span>
                        {tree.personCount} {tree.personCount === 1 ? 'person' : 'people'}
                      </span>
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
              <CardTitle>Start your first tree</CardTitle>
              <CardDescription>
                Create a family tree, add people, and link them together.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" /> New tree
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New tree</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="tree-title">Title</Label>
              <Input
                id="tree-title"
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tree-description">Description</Label>
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
              Cancel
            </Button>
            <Button onClick={submit} disabled={!title.trim() || createTree.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
