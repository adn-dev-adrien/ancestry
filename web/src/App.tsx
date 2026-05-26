import { Background, Controls, MiniMap, ReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
        <h1 className="text-lg font-semibold tracking-tight md:text-xl">Ancestry</h1>
        <Button size="sm" variant="outline" disabled>
          New tree
        </Button>
      </header>

      <main className="relative flex-1">
        <ReactFlow
          nodes={[]}
          edges={[]}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <MiniMap pannable zoomable className="!hidden md:!block" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </main>
    </div>
  );
}

export default App;
