import { NodeData, NodeWithPartitions, NodePosition, RangeResponsibility } from "./consistent-hashing-types";
import { getPartitionColor, preassignPartitionColors } from "./colorUtils";

// Sort nodes by hash position (ascending order)
export const sortNodesByHash = (nodes: NodeData[]): NodeData[] => {
    return [...nodes].sort((a, b) => a.hash - b.hash);
};

// Calculate node positions for rendering
export const calculateNodePositions = (
    nodes: NodeData[],
    canvasWidth: number,
    canvasHeight: number,
    radius: number,
    nodesWithPartitions: NodeWithPartitions[]
): Record<number, NodePosition> => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const nodePositions: Record<number, NodePosition> = {};

    nodes.forEach((node) => {
        if (!node.partition) return;

        const radian = (node.hash * Math.PI) / 180;
        const x = centerX + radius * Math.cos(radian);
        const y = centerY + radius * Math.sin(radian);

        nodePositions[node.id] = {
            x,
            y,
            partition: node.partition,
            partitionColor: getPartitionColor(node.partition)
        };
    });

    return nodePositions;
};

// Assign partitions to nodes based on consistent hashing algorithm
export const assignPartitions = (sortedNodes: NodeData[]): {
    nodesWithPartitions: NodeWithPartitions[],
    rangeResponsibility: Record<number, RangeResponsibility>
} => {
    // Pre-assign colors to all partitions
    preassignPartitionColors(sortedNodes);

    // Create the extended node data with partition information
    const nodesWithPartitions: NodeWithPartitions[] = [];

    // Map to track which node is responsible for which range
    const rangeResponsibility: Record<number, RangeResponsibility> = {};
    if (sortedNodes.length > 0) {
        // First, create the basic structure for each node
        for (let i = 0; i < sortedNodes.length; i++) {
            const currentNode = sortedNodes[i];
            if (!currentNode.partition) continue;
            // Find the previous node (wrapping around the ring if needed)
            const prevIndex = (i - 1 + sortedNodes.length) % sortedNodes.length;
            const prevNode = sortedNodes[prevIndex];

            // Calculate the range this node is responsible for
            const startHash = prevNode.hash;
            const endHash = currentNode.hash;
            const isWrapping = endHash < startHash; // Check if we're wrapping around the circle
            //   console.log("rangeResponsibility adding1", JSON.stringify(rangeResponsibility));
            // Store the range responsibility
            rangeResponsibility[currentNode.id] = {
                startHash,
                endHash,
                isWrapping
            };


            // The current node is responsible for the range from prevNode to itself
            nodesWithPartitions.push({
                node: currentNode,
                primaryPartition: currentNode.partition,
                primaryPartitionColor: getPartitionColor(currentNode.partition),
                replicaPartitions: [],
                replicaPartitionColors: []
            });
        }

        // Implement replication factor of 3 (each partition is stored on 3 consecutive nodes)
        for (let i = 0; i < sortedNodes.length; i++) {
            const currentNode = sortedNodes[i];
            if (!currentNode.partition) continue;

            // Find the next two nodes to replicate to
            for (let r = 1; r <= 2; r++) {  // Replicate to 2 more nodes (for RF=3)
                const replicaIndex = (i + r) % sortedNodes.length;
                const replicaNode = sortedNodes[replicaIndex];
                
                // Find the replica node in our extended data structure
                const replicaNodeWithPartitions = nodesWithPartitions.find(
                    n => n.node.id === replicaNode.id
                );
                
                if (replicaNodeWithPartitions) {
                    // Only add if not already present (avoid duplicates)
                    if (!replicaNodeWithPartitions.replicaPartitions.includes(currentNode.partition!)) {
                        replicaNodeWithPartitions.replicaPartitions.push(currentNode.partition!);
                        replicaNodeWithPartitions.replicaPartitionColors.push(getPartitionColor(currentNode.partition!));
                    }
                }
            }
        }
    }

    return { nodesWithPartitions, rangeResponsibility };
}; 