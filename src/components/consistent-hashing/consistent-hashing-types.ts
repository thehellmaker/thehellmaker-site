// Core data types
export class NodeData {
  id: number;
  hash: number;
  color: string;
  isVirtual: boolean;
  parentId?: number;
  partition?: string;
}

// Extended node data with partition information
export class NodeWithPartitions {
  node: NodeData;
  primaryPartition: string;
  primaryPartitionColor: string;
  replicaPartitions: string[];
  replicaPartitionColors: string[];
}

// Range responsibility tracking
export class RangeResponsibility {
  startHash: number;
  endHash: number;
  isWrapping: boolean;
}

// Node position for rendering
export class NodePosition {
  x: number;
  y: number;
  partition: string;
  partitionColor: string;
}

// Color mapping
export class ColorMapping {
  [key: string]: string;
}

// Render options for the hash ring visualization
export class RenderOptions {
  showNodeColors: boolean;
}

// Default render options
export const defaultRenderOptions: RenderOptions = {
  showNodeColors: true
}; 
