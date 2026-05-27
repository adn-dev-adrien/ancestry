import { useEffect } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Person, Relationship } from '@/services/types';
import { buildGraph } from '@/utils/layout';
import { PersonNode } from './PersonNode';

const nodeTypes = { person: PersonNode };

interface TreeCanvasProps {
  persons: Person[];
  relationships: Relationship[];
  selectedId: string | null;
  connectMode: boolean;
  connectSourceId: string | null;
  onNodeClick: (id: string) => void;
  onPaneClick: () => void;
  onPositionChange: (id: string, x: number, y: number) => void;
}

export function TreeCanvas({
  persons,
  relationships,
  selectedId,
  connectMode,
  connectSourceId,
  onNodeClick,
  onPaneClick,
  onPositionChange,
}: TreeCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Rebuild layout whenever the underlying graph changes.
  useEffect(() => {
    const graph = buildGraph(persons, relationships);
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [persons, relationships, setNodes, setEdges]);

  // Reflect selection / connect-source highlight without recomputing positions.
  useEffect(() => {
    setNodes((current) =>
      current.map((n) => ({
        ...n,
        selected: n.id === selectedId || n.id === connectSourceId,
      })),
    );
  }, [selectedId, connectSourceId, setNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_event, node: Node) => onNodeClick(node.id)}
      onNodeDragStop={(_event, node: Node) =>
        onPositionChange(node.id, node.position.x, node.position.y)
      }
      onPaneClick={onPaneClick}
      nodesConnectable={false}
      fitView
      proOptions={{ hideAttribution: true }}
      className={connectMode ? 'cursor-crosshair' : undefined}
    >
      <Background />
      <MiniMap pannable zoomable className="!hidden md:!block" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
