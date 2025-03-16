// Create a hash code function for consistent coloring
export const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Primary partition colors - more distinct and vibrant
const primaryColors = [
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#009688', // Teal
  '#4CAF50', // Green
  '#8BC34A', // Light Green
  '#CDDC39', // Lime
  '#FFEB3B', // Yellow
  '#FFC107', // Amber
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
  '#795548', // Brown
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#E91E63', // Pink
  '#F44336', // Red
];

// Replica partition colors - lighter versions of primary colors
const replicaColors = [
  '#7986CB', // Lighter Indigo
  '#64B5F6', // Lighter Blue
  '#4DB6AC', // Lighter Teal
  '#81C784', // Lighter Green
  '#AED581', // Lighter Light Green
  '#DCE775', // Lighter Lime
  '#FFF176', // Lighter Yellow
  '#FFD54F', // Lighter Amber
  '#FFB74D', // Lighter Orange
  '#FF8A65', // Lighter Deep Orange
  '#A1887F', // Lighter Brown
  '#BA68C8', // Lighter Purple
  '#9575CD', // Lighter Deep Purple
  '#F06292', // Lighter Pink
  '#E57373', // Lighter Red
];

// Maps to store partition colors
const partitionColorMap = new Map<string, string>();
let primaryColorIndex = 0;
let replicaColorIndex = 0;

// Reset color assignments
export const resetPartitionColors = (): void => {
  partitionColorMap.clear();
  primaryColorIndex = 0;
  replicaColorIndex = 0;
};

// Get a consistent color for a partition
export const getPartitionColor = (partitionId: string): string => {
  // If we already assigned a color, return it
  if (partitionColorMap.has(partitionId)) {
    return partitionColorMap.get(partitionId)!;
  }

  // Determine if this is likely a primary or replica partition based on the ID
  // This is a simple heuristic - primary partitions typically have shorter IDs
  const isPrimaryPartition = !partitionId.includes("replica");
  
  // Choose the appropriate color palette and index
  let color: string;
  if (isPrimaryPartition) {
    color = primaryColors[primaryColorIndex % primaryColors.length];
    primaryColorIndex++;
  } else {
    color = replicaColors[replicaColorIndex % replicaColors.length];
    replicaColorIndex++;
  }
  
  // Store the color for future use
  partitionColorMap.set(partitionId, color);
  
  return color;
};

// Get a color for a partition that's guaranteed to be from the primary palette
export const getPrimaryPartitionColor = (partitionId: string): string => {
  if (partitionColorMap.has(partitionId)) {
    return partitionColorMap.get(partitionId)!;
  }
  
  const color = primaryColors[primaryColorIndex % primaryColors.length];
  primaryColorIndex++;
  
  partitionColorMap.set(partitionId, color);
  return color;
};

// Get a color for a partition that's guaranteed to be from the replica palette
export const getReplicaPartitionColor = (partitionId: string): string => {
  if (partitionColorMap.has(partitionId)) {
    return partitionColorMap.get(partitionId)!;
  }
  
  const color = replicaColors[replicaColorIndex % replicaColors.length];
  replicaColorIndex++;
  
  partitionColorMap.set(partitionId, color);
  return color;
};

// Pre-assign colors to all partitions to ensure consistency
export const preassignPartitionColors = (nodes: any[]): void => {
  // First pass: mark partitions as primary or replica
  nodes.forEach(node => {
    if (node.partition && !node.isVirtual) {
      getPartitionColor(node.partition);
    } else if (node.partition && node.isVirtual) {
      getPartitionColor(node.partition);
    }
  });
}; 