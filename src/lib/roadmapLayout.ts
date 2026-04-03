export interface RoadmapNode {
  id: string;
  label: string;
  duration: string;
  depth: number;
  branch: number;
}

export interface RoadmapEdge {
  from: string;
  to: string;
}

const NODE_W = 200;
const NODE_H = 120;
const COL_GAP = 80;
const ROW_GAP = 40;

const REGULAR_STYLE = {
  backgroundColor: '#fef9c3',
  textColor: '#1a1a1a',
  fontFamily: 'caveat',
  fontSize: 16,
  opacity: 1,
  roughEdges: true,
} as const;

const START_STYLE = {
  ...REGULAR_STYLE,
  backgroundColor: '#e0e7ff',
} as const;

export interface LayoutResult {
  canvasNodes: {
    type: 'sticky';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    style: typeof REGULAR_STYLE;
  }[];
  aiNodeIds: string[];
  durationMap: Map<string, string>;
}

export function layoutRoadmap(
  source: { x: number; y: number; height: number },
  nodes: RoadmapNode[],
): LayoutResult {
  const baseY = source.y + source.height + 60;

  // Compute x/y for each AI node
  const positioned = nodes.map((n) => ({
    ...n,
    x: source.x + n.depth * (NODE_W + COL_GAP),
    y: baseY + n.branch * (NODE_H + ROW_GAP),
  }));

  // Start node: one column left of depth-0, vertically centered across depth-0 branches
  const depth0Branches = nodes.filter((n) => n.depth === 0).map((n) => n.branch);
  const minBranch = Math.min(...depth0Branches);
  const maxBranch = Math.max(...depth0Branches);
  const startBranchCenter = (minBranch + maxBranch) / 2;

  const startNode = {
    type: 'sticky' as const,
    x: source.x - NODE_W - COL_GAP,
    y: baseY + startBranchCenter * (NODE_H + ROW_GAP),
    width: NODE_W,
    height: NODE_H,
    content: 'Start',
    style: START_STYLE,
  };

  const regularNodes = positioned.map((n) => ({
    type: 'sticky' as const,
    x: n.x,
    y: n.y,
    width: NODE_W,
    height: NODE_H,
    content: n.label,
    style: REGULAR_STYLE,
  }));

  const durationMap = new Map(nodes.map((n) => [n.id, n.duration]));

  return {
    canvasNodes: [startNode, ...regularNodes],
    aiNodeIds: ['__START__', ...nodes.map((n) => n.id)],
    durationMap,
  };
}
