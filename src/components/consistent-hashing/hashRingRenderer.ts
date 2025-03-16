import { NodeData, NodeWithPartitions, NodePosition, RenderOptions } from "./consistent-hashing-types";
import { getPartitionColor } from './colorUtils';

// Main rendering function
export const renderHashRing = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  radius: number,
  nodes: NodeData[],
  sortedNodes: NodeData[],
  nodesWithPartitions: NodeWithPartitions[],
  nodePositions: Record<number, NodePosition>,
  options: RenderOptions
): void => {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Calculate scale factor based on canvas size for responsive sizing
  const scaleFactor = Math.min(canvasWidth, canvasHeight) / 1000;
  
  // For mobile devices, boost the scale factor to make elements more readable
  const isMobile = canvasWidth <= 768;
  const mobileBoost = isMobile ? 1.5 : 1.0; // Increase size by 50% on mobile
  const adjustedScaleFactor = scaleFactor * mobileBoost;
  
  // Clear the entire canvas first
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw the main ring
  drawMainRing(ctx, centerX, centerY, radius);
  
  // Draw partition ranges
  drawPartitionRanges(ctx, centerX, centerY, radius, sortedNodes);
  
  // Draw nodes
  drawNodes(ctx, centerX, centerY, radius, nodes, nodesWithPartitions, options, adjustedScaleFactor);
  
  // Draw node labels
  drawNodeLabels(ctx, centerX, centerY, radius, nodes, options, adjustedScaleFactor);
  
  // Draw title and legend - these should be drawn relative to the canvas, not the center
  // Only draw title and legend when not zoomed in too much
  if (scaleFactor < 1.5) {
    drawTitleAndLegend(ctx, centerX, centerY, radius, adjustedScaleFactor);
  }
};

// Draw the main hash ring circle
const drawMainRing = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Add a subtle shadow/glow effect to the main ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 5;
  ctx.stroke();
};

// Draw partition ranges between nodes
const drawPartitionRanges = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  sortedNodes: NodeData[]
): void => {
  if (sortedNodes.length === 0) return;
  
  // For each node, draw its responsibility range to the next node clockwise
  for (let i = 0; i < sortedNodes.length; i++) {
    const currentNode = sortedNodes[i];
    if (!currentNode.partition) continue;
    
    const nextIndex = (i + 1) % sortedNodes.length;
    const nextNode = sortedNodes[nextIndex];
    if (!nextNode.partition) continue;
    
    // Calculate start and end angles for clockwise assignment
    const startAngle = (currentNode.hash * Math.PI) / 180;
    const endAngle = (nextNode.hash * Math.PI) / 180;
    
    // In consistent hashing, the range from currentNode to nextNode belongs to nextNode
    // Use the new color utility to get consistent colors for partitions
    const partitionColor = nextNode.partition ? getPartitionColor(nextNode.partition) : "#999";
    
    drawPartitionArc(ctx, centerX, centerY, radius, startAngle, endAngle, partitionColor);
    drawDirectionArrow(ctx, centerX, centerY, radius, startAngle, endAngle);
  }
};

// Draw a partition arc
const drawPartitionArc = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: string
): void => {
  // Draw arc for this range with the next node's partition color
  ctx.beginPath();
  
  // Reduced radius for the partition arcs to prevent overlapping with nodes
  const arcRadius = radius - 40;
  
  // Handle the case where endAngle is less than startAngle (wrapping around the circle)
  if (endAngle <= startAngle) {
    // This means we need to draw from startAngle to 2π and then from 0 to endAngle
    ctx.arc(centerX, centerY, arcRadius, startAngle, Math.PI * 2);
    ctx.arc(centerX, centerY, arcRadius, 0, endAngle);
  } else {
    // Normal case: draw from startAngle to endAngle
    ctx.arc(centerX, centerY, arcRadius, startAngle, endAngle);
  }
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 15;
  ctx.stroke();
};

// Draw direction arrow on partition arc
const drawDirectionArrow = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): void => {
  // Calculate middle point of the arc
  let midAngle = (startAngle + endAngle) / 2;
  if (endAngle <= startAngle) { // Handle wrap-around
    midAngle = (startAngle + (endAngle + 2 * Math.PI)) / 2;
    if (midAngle > 2 * Math.PI) midAngle -= 2 * Math.PI;
  }
  
  const arcRadius = radius - 40;
  const arrowLength = 6;
  const arrowAngle = midAngle + Math.PI/2; // Perpendicular to radius, pointing clockwise
  
  // Start point of arrow - positioned in the middle of the arc
  const arrowStartX = centerX + arcRadius * Math.cos(midAngle);
  const arrowStartY = centerY + arcRadius * Math.sin(midAngle);
  
  // End point of arrow (in clockwise direction)
  const arrowEndX = arrowStartX + arrowLength * Math.cos(arrowAngle);
  const arrowEndY = arrowStartY + arrowLength * Math.sin(arrowAngle);
  
  // Draw arrow line
  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowStartY);
  ctx.lineTo(arrowEndX, arrowEndY);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Draw arrowhead
  const arrowHeadSize = 3;
  ctx.beginPath();
  ctx.moveTo(arrowEndX, arrowEndY);
  ctx.lineTo(
    arrowEndX - arrowHeadSize * Math.cos(arrowAngle - Math.PI / 6),
    arrowEndY - arrowHeadSize * Math.sin(arrowAngle - Math.PI / 6)
  );
  ctx.lineTo(
    arrowEndX - arrowHeadSize * Math.cos(arrowAngle + Math.PI / 6),
    arrowEndY - arrowHeadSize * Math.sin(arrowAngle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = "#333";
  ctx.fill();
};

// Draw nodes on the hash ring
const drawNodes = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  nodes: NodeData[],
  nodesWithPartitions: NodeWithPartitions[],
  options: RenderOptions,
  scaleFactor: number
): void => {
  nodes.forEach((node) => {
    const radian = (node.hash * Math.PI) / 180;
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);
    
    drawNodeCircle(ctx, x, y, node, options, scaleFactor);
    
    // Draw partition squares inside the node
    if (node.partition) {
      drawNodePartitions(ctx, x, y, node, nodesWithPartitions, scaleFactor);
    }
  });
};

// Draw a node circle
const drawNodeCircle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  node: NodeData,
  options: RenderOptions,
  scaleFactor: number
): void => {
  // Scale node size based on canvas size
  const nodeSize = 22 * scaleFactor;
  
  // Draw node circle with color based on options
  ctx.beginPath();
  ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
  
  // Use node color or neutral color based on options
  ctx.fillStyle = options.showNodeColors ? node.color : "#f0f0f0";
  ctx.fill();
  ctx.strokeStyle = options.showNodeColors ? "#000" : "#666";
  ctx.lineWidth = 2 * scaleFactor;
  ctx.stroke();
  
  // For physical nodes, draw a second circle outside the main circle
  if (!node.isVirtual) {
    ctx.beginPath();
    ctx.arc(x, y, nodeSize + 5 * scaleFactor, 0, Math.PI * 2);
    ctx.strokeStyle = options.showNodeColors ? node.color : "#888";
    ctx.lineWidth = 2 * scaleFactor;
    ctx.stroke();
  }
};

// Draw partition squares inside a node
const drawNodePartitions = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  node: NodeData,
  nodesWithPartitions: NodeWithPartitions[],
  scaleFactor: number
): void => {
  // Find this node in our extended data structure
  const nodeWithPartitions = nodesWithPartitions.find(n => n.node.id === node.id);
  
  if (nodeWithPartitions) {
    // Scale sizes based on canvas size
    const primarySize = 14 * scaleFactor;
    const replicaSize = 8 * scaleFactor;
    const horizontalSpacing = 4 * scaleFactor;
    const verticalSpacing = 10 * scaleFactor;
    
    // Overall vertical offset to move everything up
    const verticalOffset = -3 * scaleFactor;
    
    // Calculate total width needed for all replicas
    const replicasWidth = nodeWithPartitions.replicaPartitions.length > 0 ? 
                         (replicaSize * nodeWithPartitions.replicaPartitions.length) + 
                         (horizontalSpacing * (nodeWithPartitions.replicaPartitions.length - 1)) : 0;
    
    // Draw primary partition moved up
    ctx.fillStyle = nodeWithPartitions.primaryPartitionColor;
    ctx.fillRect(
      x - primarySize/2, 
      y - primarySize/2 - 4 * scaleFactor + verticalOffset, 
      primarySize, 
      primarySize
    );
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5 * scaleFactor;
    ctx.strokeRect(
      x - primarySize/2, 
      y - primarySize/2 - 4 * scaleFactor + verticalOffset, 
      primarySize, 
      primarySize
    );
    
    // Draw a subtle separator line if there are replica partitions
    if (nodeWithPartitions.replicaPartitions.length > 0) {
      // Draw a subtle separator line
      const lineWidth = Math.max(replicasWidth, primarySize) * 0.7;
      ctx.beginPath();
      ctx.moveTo(x - lineWidth/2, y + 2 * scaleFactor + verticalOffset);
      ctx.lineTo(x + lineWidth/2, y + 2 * scaleFactor + verticalOffset);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5 * scaleFactor;
      ctx.stroke();
      
      let startX = x - replicasWidth / 2;
      
      // Draw each replica partition
      for (let i = 0; i < nodeWithPartitions.replicaPartitions.length; i++) {
        const replicaColor = nodeWithPartitions.replicaPartitionColors[i];
        
        // Draw a smaller square for this replica partition with increased vertical spacing
        ctx.fillStyle = replicaColor;
        ctx.fillRect(
          startX, 
          y + verticalSpacing + verticalOffset, 
          replicaSize, 
          replicaSize
        );
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 0.75 * scaleFactor;
        ctx.strokeRect(
          startX, 
          y + verticalSpacing + verticalOffset, 
          replicaSize, 
          replicaSize
        );
        
        // Move to the next square position
        startX += replicaSize + horizontalSpacing;
      }
    }
  }
};

// Draw node labels
const drawNodeLabels = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  nodes: NodeData[],
  options: RenderOptions,
  scaleFactor: number
): void => {
  // For small screens, reduce the number of labels to avoid clutter
  // Increase the threshold to show fewer labels on mobile
  const isMobile = ctx.canvas.width <= 768;
  const shouldShowAllLabels = isMobile ? false : scaleFactor > 0.65;
  
  // If screen is too small, only show labels for physical nodes
  const nodesToLabel = shouldShowAllLabels ? nodes : nodes.filter(node => !node.isVirtual);
  
  nodesToLabel.forEach((node) => {
    const radian = (node.hash * Math.PI) / 180;
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);
    
    // Calculate position for the label at a radius proportional to canvas size
    // For smaller screens, bring labels closer to the ring
    const labelRadiusMultiplier = isMobile ? 1.1 : (scaleFactor < 0.7 ? 1.12 : (node.isVirtual ? 1.25 : 1.4));
    const labelRadius = radius * labelRadiusMultiplier;
    const labelX = centerX + labelRadius * Math.cos(radian);
    const labelY = centerY + labelRadius * Math.sin(radian);
    
    drawNodeLabel(ctx, x, y, labelX, labelY, node, options, scaleFactor);
  });
};

// Draw a node label with connecting line
const drawNodeLabel = (
  ctx: CanvasRenderingContext2D,
  nodeX: number,
  nodeY: number,
  labelX: number,
  labelY: number,
  node: NodeData,
  options: RenderOptions,
  scaleFactor: number
): void => {
  // Scale label size based on canvas size
  const bgWidth = (node.isVirtual ? 100 : 120) * scaleFactor;
  const bgHeight = 40 * scaleFactor;
  
  // Add a subtle shadow for depth
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 5 * scaleFactor;
  ctx.shadowOffsetX = 2 * scaleFactor;
  ctx.shadowOffsetY = 2 * scaleFactor;
  
  // Draw label background with rounded corners
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.roundRect(labelX - bgWidth/2, labelY - bgHeight/2, bgWidth, bgHeight, 10 * scaleFactor);
  ctx.fill();
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Draw border
  ctx.strokeStyle = options.showNodeColors ? node.color : "#888";
  ctx.lineWidth = 2 * scaleFactor;
  ctx.stroke();
  
  // Draw connecting line from node to label
  drawConnectingLine(ctx, nodeX, nodeY, labelX, labelY, node, bgWidth, bgHeight, options, scaleFactor);
  
  // Draw label text
  if (node.isVirtual) {
    // Draw virtual node info
    ctx.fillStyle = "#000";
    ctx.font = `${12 * scaleFactor}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`V-Node ${node.id % 100}`, labelX, labelY - 10 * scaleFactor);
    
    // Draw parent node reference
    ctx.fillStyle = "#666";
    ctx.font = `${10 * scaleFactor}px Arial`;
    ctx.fillText(`(Node ${node.parentId})`, labelX, labelY + 10 * scaleFactor);
  } else {
    // Draw physical node ID
    ctx.fillStyle = "#000";
    ctx.font = `bold ${16 * scaleFactor}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Node ${node.id}`, labelX, labelY);
  }
};

// Polyfill for Math.sign if not available
const mathSign = (x: number): number => {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
};

// Draw connecting line from node to label
const drawConnectingLine = (
  ctx: CanvasRenderingContext2D,
  nodeX: number,
  nodeY: number,
  labelX: number,
  labelY: number,
  node: NodeData,
  bgWidth: number,
  bgHeight: number,
  options: RenderOptions,
  scaleFactor: number
): void => {
  // Calculate the points where the line should start and end
  const nodeSize = (node.isVirtual ? 22 : 27) * scaleFactor;
  const nodeToLabelAngle = Math.atan2(labelY - nodeY, labelX - nodeX);
  const nodeEdgeX = nodeX + nodeSize * Math.cos(nodeToLabelAngle);
  const nodeEdgeY = nodeY + nodeSize * Math.sin(nodeToLabelAngle);
  
  // For the label rectangle, calculate the point on the rectangle's edge
  const labelToNodeAngle = Math.atan2(nodeY - labelY, nodeX - labelX);
  let labelEdgeX, labelEdgeY;
  
  // Determine the intersection point with the rectangle
  const halfWidth = bgWidth / 2;
  const halfHeight = bgHeight / 2;
  
  // Calculate slopes for the four edges of the rectangle
  const topSlope = Math.abs(Math.tan(labelToNodeAngle)) < Math.abs(halfHeight / halfWidth);
  
  if (topSlope) {
    // Intersects with left or right edge
    const xSign = mathSign(Math.cos(labelToNodeAngle));
    labelEdgeX = labelX + xSign * halfWidth;
    labelEdgeY = labelY + Math.tan(labelToNodeAngle) * xSign * halfWidth;
  } else {
    // Intersects with top or bottom edge
    const ySign = mathSign(Math.sin(labelToNodeAngle));
    labelEdgeY = labelY + ySign * halfHeight;
    labelEdgeX = labelX + (1 / Math.tan(labelToNodeAngle)) * ySign * halfHeight;
  }
  
  // Draw connecting line from node edge to label edge
  ctx.beginPath();
  ctx.moveTo(nodeEdgeX, nodeEdgeY);
  ctx.lineTo(labelEdgeX, labelEdgeY);
  ctx.strokeStyle = options.showNodeColors ? node.color : "#888";
  ctx.lineWidth = 1.5 * scaleFactor;
  ctx.stroke();
};

// Draw title and legend
const drawTitleAndLegend = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  scaleFactor: number
): void => {
  // Add a title background
  const isMobile = ctx.canvas.width <= 768;
  const title = isMobile ? "Consistent Hashing" : "Consistent Hashing Visualization (RF=2)";
  
  // On mobile, only show title when not zoomed in
  if (isMobile && scaleFactor > 1.2) return;
  
  // Measure the title text
  ctx.font = `bold ${18 * scaleFactor}px Arial`;
  const titleWidth = ctx.measureText(title).width;
  const titleHeight = 30 * scaleFactor;
  const padding = 15 * scaleFactor;
  
  // Draw a light background with border for the title
  ctx.fillStyle = "rgba(245, 245, 245, 0.9)";
  ctx.beginPath();
  ctx.roundRect(
    centerX - titleWidth/2 - padding, 
    30 * scaleFactor - titleHeight/2, 
    titleWidth + padding * 2, 
    titleHeight, 
    6 * scaleFactor
  );
  ctx.fill();
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1 * scaleFactor;
  ctx.stroke();
  
  // Add a title for the visualization
  ctx.fillStyle = "#333";
  ctx.font = `bold ${18 * scaleFactor}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Position the title at the top of the canvas
  ctx.fillText(title, centerX, 30 * scaleFactor);
  
  // On mobile, don't show the legend to save space
  if (isMobile) return;
  
  // Add a legend to explain the partition squares
  const legendX = 120 * scaleFactor;
  const legendY = 80 * scaleFactor;
  const legendSpacing = 25 * scaleFactor;
  
  drawLegendItem(ctx, legendX, legendY, 14 * scaleFactor, "#3F51B5", "Primary Partition", scaleFactor);
  drawLegendItem(ctx, legendX, legendY + legendSpacing, 8 * scaleFactor, "#FF5722", "Replica Partitions", scaleFactor);
};

// Draw a legend item
const drawLegendItem = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  label: string,
  scaleFactor: number
): void => {
  // Create a background for the legend
  const textWidth = ctx.measureText(label).width;
  const padding = 10 * scaleFactor;
  const bgWidth = size + padding + textWidth + 15 * scaleFactor;
  const bgHeight = 30 * scaleFactor;
  
  // Draw a light background with border
  ctx.fillStyle = "rgba(245, 245, 245, 0.9)";
  ctx.beginPath();
  ctx.roundRect(x - size/2 - padding, y - bgHeight/2, bgWidth, bgHeight, 6 * scaleFactor);
  ctx.fill();
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1 * scaleFactor;
  ctx.stroke();
  
  // Draw the label text
  ctx.fillStyle = "#333";
  ctx.font = `${14 * scaleFactor}px Arial`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + size + 10 * scaleFactor, y);
  
  // Draw the colored square
  ctx.fillStyle = color;
  ctx.fillRect(x - size/2, y - size/2, size, size);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = (size === 14 * scaleFactor) ? 1.5 * scaleFactor : 0.75 * scaleFactor;
  ctx.strokeRect(x - size/2, y - size/2, size, size);
}; 