"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TopicNetworkData, TopicNode } from "@/types/dashboard";

export type TopicNetworkProps = {
  network: TopicNetworkData;
};

const nodeColor: Record<TopicNode["type"], string> = {
  topic: "#38bdf8",
  positive: "#14b8a6",
  neutral: "#94a3b8",
  negative: "#f43f5e",
};

export function TopicNetwork({ network }: TopicNetworkProps) {
  const nodes: Node[] = network.nodes.map((node, index) => ({
    id: node.id,
    position: { x: (index % 4) * 180, y: Math.floor(index / 4) * 126 },
    data: { label: node.label },
    style: {
      width: 132,
      border: `1px solid ${nodeColor[node.type]}`,
      background: "rgba(13, 18, 32, 0.92)",
      color: "#f8fafc",
      boxShadow: `0 0 ${Math.max(8, node.weight / 5)}px ${nodeColor[node.type]}55`,
    },
  }));

  const edges: Edge[] = network.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: edge.strength > 0.7,
    style: {
      stroke: "#67e8f9",
      strokeWidth: Math.max(1, edge.strength * 4),
    },
  }));

  return (
    <div className="ops-card-muted h-[330px] overflow-hidden rounded">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background color="rgba(125,211,252,0.18)" gap={18} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
