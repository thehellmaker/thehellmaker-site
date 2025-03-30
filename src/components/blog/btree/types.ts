export interface TreeNode {
  id: number;
  keys: string[];
  children: TreeNode[];
}

export interface TreeStructure {
  [key: number]: string[];
}

export const treeStructure: TreeStructure = {
  1: ["uuid-30", "uuid-33", "uuid-35"],
  2: ["uuid-10", "uuid-15", "uuid-20"],
  12: ["uuid-31", "uuid-32"],
  13: ["uuid-34"],
  3: ["uuid-40", "uuid-45", "uuid-50"],
  4: ["uuid-5"],
  5: ["uuid-12"],
  6: ["uuid-18"],
  7: ["uuid-25"],
  8: ["uuid-38"],
  9: ["uuid-42"],
  10: ["uuid-48"],
  11: ["uuid-55"]
}; 

export const SEQUENTIAL_ACCESS_SEQUENCE_FOR_CACHE_MISS_SIMULATION = ["1", "4", "7", "3", "6", "2", "5"];

export const SEQUENTIAL_ACCESS_SEQUENCE_FOR_CACHE_HIT_SIMULATION = ["1", "2", "3", "4"];