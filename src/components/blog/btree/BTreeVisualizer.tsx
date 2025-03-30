import { useEffect, useRef } from "react";

interface TreeNode {
  id: number;
  keys: string[];
  children: TreeNode[];
}

interface BTreeVisualizerProps {
  highlightedNode: number | null;
  evictionNode: number | null;
}

const treeData: TreeNode = {
  id: 1,
  keys: ["30", "33", "35"],
  children: [
    {
      id: 2,
      keys: ["10", "15", "20"],
      children: [
        { id: 4, keys: ["5"], children: [] },
        { id: 5, keys: ["12"], children: [] },
        { id: 6, keys: ["18"], children: [] },
        { id: 7, keys: ["25"], children: [] },
      ],
    },
    {
      id: 12,
      keys: ["31", "32"],
      children: [],
    },
    {
      id: 13,
      keys: ["34"],
      children: [],
    },
    {
      id: 3,
      keys: ["40", "45", "50"],
      children: [
        { id: 8, keys: ["38"], children: [] },
        { id: 9, keys: ["42"], children: [] },
        { id: 10, keys: ["48"], children: [] },
        { id: 11, keys: ["55"], children: [] },
      ],
    },
  ],
};

const NODE_HEIGHT = 40;
const NODE_WIDTH = 160;
const VERTICAL_SPACING = 60;
const NODE_PADDING = 10;
const HORIZONTAL_SPACING = 20;
const LEVEL1_HORIZONTAL_SPACING = 100;

interface NodePosition {
  x: number;
  y: number;
  width: number;
}

const getNodeWidth = (level: number, keysCount: number) => {
  if (level === 2) {
    return 80; // Smaller width for leaf nodes with single key
  }
  return NODE_WIDTH;
};

const drawNode = (
  ctx: CanvasRenderingContext2D,
  node: TreeNode,
  x: number,
  y: number,
  width: number,
  isHighlighted: boolean,
  isEvicted: boolean
) => {
  // Draw node background
  ctx.fillStyle = isEvicted ? 'rgba(254, 202, 202, 0.5)' : 
                 isHighlighted ? 'rgba(191, 219, 254, 0.5)' : 
                 '#ffffff';
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(x, y, width, NODE_HEIGHT);
  ctx.fill();
  ctx.stroke();

  // Draw node ID
  ctx.fillStyle = '#64748b';  // Slate gray color for node ID
  ctx.font = '500 11px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Node ${node.id}`, x + width / 2, y + 12);  // Position ID higher up

  // Draw keys
  ctx.fillStyle = '#16a34a';
  ctx.font = '600 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const keyWidth = (width - 2 * NODE_PADDING) / node.keys.length;
  node.keys.forEach((key, index) => {
    const keyX = x + NODE_PADDING + keyWidth * index + keyWidth / 2;
    const keyY = y + NODE_HEIGHT - 12;  // Position keys lower down
    ctx.fillText(key, keyX, keyY);
  });

  return { x, y, width };
};

const drawTree = (
  ctx: CanvasRenderingContext2D,
  node: TreeNode,
  x: number,
  y: number,
  width: number,
  highlightedNode: number | null,
  evictionNode: number | null,
  level: number = 0
): NodePosition => {
  const nodeWidth = getNodeWidth(level, node.keys.length);
  const nodePos = drawNode(ctx, node, x, y, nodeWidth, node.id === highlightedNode, node.id === evictionNode);

  if (node.children.length > 0) {
    const spacing = level === 0 ? LEVEL1_HORIZONTAL_SPACING : HORIZONTAL_SPACING;
    const totalSpacing = spacing * (node.children.length - 1);
    const childWidth = getNodeWidth(level + 1, node.children[0].keys.length);
    const childrenTotalWidth = (childWidth * node.children.length) + totalSpacing;
    const startX = x + (width - childrenTotalWidth) / 2;

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;

    node.children.forEach((child, index) => {
      const childX = startX + (childWidth + spacing) * index;
      const childY = y + NODE_HEIGHT + VERTICAL_SPACING;

      // Calculate line start position to align with keys or spaces between keys
      let lineStartX;
      if (index === 0) {
        // First child: align with start of node
        lineStartX = x + NODE_PADDING;
      } else if (index === node.children.length - 1) {
        // Last child: align with end of node
        lineStartX = x + nodeWidth - NODE_PADDING;
      } else {
        // Middle children: align with key positions
        const keyPosition = x + NODE_PADDING + (nodeWidth - 2 * NODE_PADDING) * (index / node.keys.length);
        lineStartX = keyPosition;
      }
      
      ctx.beginPath();
      ctx.moveTo(lineStartX, y + NODE_HEIGHT);
      ctx.lineTo(childX + childWidth / 2, childY);
      ctx.stroke();

      drawTree(
        ctx,
        child,
        childX,
        childY,
        childWidth,
        highlightedNode,
        evictionNode,
        level + 1
      );
    });
  }

  return nodePos;
};

export default function BTreeVisualizer({ highlightedNode, evictionNode }: BTreeVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 260;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startX = (canvas.width - NODE_WIDTH) / 2;
    drawTree(ctx, treeData, startX, 5, NODE_WIDTH, highlightedNode, evictionNode);

  }, [highlightedNode, evictionNode]);

  return (
    <div className="flex flex-col items-center border border-green-500 rounded bg-green-50">
      <h3 className="text-sm font-bold py-1 my-0 w-full px-1 text-center">B-Tree Structure</h3>
      <canvas 
        ref={canvasRef}
        className="w-full max-w-[1200px]"
        style={{ height: '260px', marginBottom: '-5px' }}
      />
    </div>
  );
} 