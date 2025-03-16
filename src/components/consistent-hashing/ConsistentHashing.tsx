import { useState, useEffect } from "react";
import HashRing from "./HashRing";
import Controls from "./Controls";
import { v4 as uuidv4 } from 'uuid';
import ConsistentHashingControls from './ConsistentHashingControls';
import { RenderOptions, defaultRenderOptions } from './consistent-hashing-types';
import { resetPartitionColors } from './colorUtils';
// Define types for our nodes
interface NodeData {
    id: number;
    hash: number;
    color: string;
    isVirtual: boolean;
    parentId?: number; // For virtual nodes, reference to the parent node
    partition?: string; // Data partition this node is responsible for
}

const ConsistentHashing = () => {
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [nextNodeId, setNextNodeId] = useState(1); // Start node ID from 0 instead of 1
    const [usedColors, setUsedColors] = useState<string[]>([]);
    const [renderOptions, setRenderOptions] = useState<RenderOptions>(defaultRenderOptions);
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileHint, setShowMobileHint] = useState(true);

    // Check if the device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        // Initial check
        checkMobile();
        
        // Add resize listener
        window.addEventListener('resize', checkMobile);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Hide the mobile hint after 5 seconds
    useEffect(() => {
        if (isMobile && showMobileHint) {
            const timer = setTimeout(() => {
                setShowMobileHint(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [isMobile, showMobileHint]);

    // Generate a unique color not used by any other physical node
    const getUniqueColor = () => {
        // Extended color palette with more distinct colors
        const colorPalette = [
            // Vibrant primary and secondary colors
            "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", 
            "#FF8000", "#FF0080", "#80FF00", "#00FF80", "#8000FF", "#0080FF",
            
            // Pastel colors
            "#FFB6C1", "#FFD700", "#98FB98", "#ADD8E6", "#DDA0DD", "#F0E68C",
            "#E6E6FA", "#FFA07A", "#20B2AA", "#87CEFA", "#778899", "#B0C4DE",
            
            // Dark rich colors
            "#800000", "#008000", "#000080", "#808000", "#800080", "#008080",
            "#A52A2A", "#2E8B57", "#4B0082", "#696969", "#556B2F", "#8B4513",
            
            // Bright vivid colors
            "#FF1493", "#00BFFF", "#32CD32", "#BA55D3", "#1E90FF", "#FF6347",
            "#7CFC00", "#DC143C", "#00CED1", "#9370DB", "#FF4500", "#3CB371",
            
            // Muted colors
            "#D2B48C", "#BC8F8F", "#A0522D", "#6B8E23", "#708090", "#CD853F",
            "#4682B4", "#BDB76B", "#DAA520", "#808080", "#F4A460", "#2F4F4F",
            
            // Light colors
            "#F0FFFF", "#F5F5DC", "#FAEBD7", "#E0FFFF", "#FAFAD2", "#FFF0F5",
            "#F0F8FF", "#F8F8FF", "#FFFAFA", "#F5FFFA", "#FFFFF0", "#F0FFF0",
            
            // Additional vibrant colors
            "#FF00AA", "#AA00FF", "#00AAFF", "#00FFAA", "#AAFF00", "#FFAA00",
            "#CC0000", "#00CC00", "#0000CC", "#CCCC00", "#CC00CC", "#00CCCC",
            
            // Additional pastel colors
            "#FFD1DC", "#FFECB3", "#E6FFB3", "#B3FFD9", "#B3ECFF", "#D1B3FF",
            "#FFB3E6", "#FFCCB3", "#E6FFE6", "#B3FFFF", "#E6E6FF", "#FFE6E6",
            
            // Additional dark colors
            "#330000", "#003300", "#000033", "#333300", "#330033", "#003333",
            "#663300", "#336600", "#006633", "#330066", "#660033", "#003366"
        ];
      
        // Get the colors currently in use by existing physical nodes
        const activeColors = nodes
            .filter(node => !node.isVirtual)
            .map(node => node.color);
        
        // Filter out colors that are currently in use by physical nodes
        const availableColors = colorPalette.filter(color => !activeColors.includes(color));

        // If we're running out of colors (less than 10 left), reset the used colors tracking
        // but still avoid colors that are actively in use
        if (availableColors.length < 10) {
            // Reset used colors to only those actively in use
            setUsedColors(activeColors);
        }
        
        // Get all available colors (those not currently in use by nodes)
        const currentlyAvailableColors = colorPalette.filter(color => 
            !activeColors.includes(color) && !usedColors.includes(color)
        );

        // If all colors have been used or are in use, generate a random color
        if (currentlyAvailableColors.length === 0) {
            // Generate a random hex color
            let randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            // Ensure the color is 6 characters long
            while (randomColor.length < 7) {
                randomColor += '0';
            }
            return randomColor;
        }

        // Pick a random color from available colors
        const randomIndex = Math.floor(Math.random() * currentlyAvailableColors.length);
        const selectedColor = currentlyAvailableColors[randomIndex];

        // Update used colors
        setUsedColors(prev => [...prev, selectedColor]);

        return selectedColor;
    };

    // Find the best position for a new node
    const findBestPosition = (existingNodes: NodeData[]) => {
        if (existingNodes.length === 0) return 0;

        // Get all hash positions
        const positions = existingNodes.map(node => node.hash).sort((a, b) => a - b);

        // Add the first position + 360 to the end to handle the wrap-around
        positions.push(positions[0] + 360);

        // Find the largest gap
        let maxGap = 0;
        let gapStartPosition = 0;

        for (let i = 0; i < positions.length - 1; i++) {
            const gap = positions[i + 1] - positions[i];
            if (gap > maxGap) {
                maxGap = gap;
                gapStartPosition = positions[i];
            }
        }

        // Add some randomness within the gap
        const randomOffset = (Math.random() * 0.4 - 0.2) * maxGap; // ±20% randomness
        const newPosition = (gapStartPosition + maxGap / 2 + randomOffset) % 360;

        return Math.max(0, Math.min(359, newPosition)); // Ensure it's between 0-359
    };

  // Alternative approach with UUID if you prefer
    const generatePartition = (): string => {
        return `partition-${uuidv4()}`;
    };
  

    // Add a real node with virtual nodes
    const addNode = () => {
        const nodeColor = getUniqueColor();
        const nodeId = nextNodeId;
        setNextNodeId(prev => prev + 1);

        // Create the main node
        const mainNodeHash = findBestPosition(nodes);
        const mainNodePartition = generatePartition();

        const mainNode: NodeData = {
            id: nodeId,
            hash: mainNodeHash,
            color: nodeColor,
            isVirtual: false,
            partition: mainNodePartition
        };

        // Track partitions used by this node and its virtual nodes
        const nodePartitions = [mainNodePartition];

        // Create exactly 2 virtual nodes for this main node
        const virtualNodesCount = 2; // Always create 2 virtual nodes
        const virtualNodes: NodeData[] = [];

        for (let i = 1; i <= virtualNodesCount; i++) {
            // Create virtual nodes at different positions
            const allNodes = [...nodes, mainNode, ...virtualNodes];
            const virtualNodeHash = findBestPosition(allNodes);

            // Assign a different partition to each virtual node
            const virtualNodePartition = generatePartition();
            nodePartitions.push(virtualNodePartition);

            virtualNodes.push({
                id: nodeId * 100 + i, // Unique ID for virtual node
                hash: virtualNodeHash,
                color: nodeColor, // Same color as parent
                isVirtual: true,
                parentId: nodeId,
                partition: virtualNodePartition
            });
        }
        const newNodes = [...nodes, mainNode, ...virtualNodes].sort((a, b) => a.hash - b.hash)
        // Add all nodes
        setNodes(prevNodes => newNodes);
    };

    // Reset all nodes and start fresh
    const resetNodes = () => {
        setNodes([]);
        setNextNodeId(1);
        setUsedColors([]);
        resetPartitionColors(); // Reset partition colors when resetting nodes
    };

    // Reset used colors when component mounts or when nodes are empty
    useEffect(() => {
        if (nodes.length === 0) {
            setUsedColors([]);
            resetPartitionColors(); // Reset partition colors when nodes are empty
        }
    }, [nodes.length]);

    // Handle reset of partition colors
    const handleResetColors = () => {
        // Force a re-render by creating a new renderOptions object
        setRenderOptions({...renderOptions});
    };

    return (
        <div className="consistent-hashing-container" style={{
            maxWidth: '100%',
            margin: '0 auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Only show mobile hint on mobile devices */}
            {isMobile && showMobileHint && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    zIndex: 100,
                    textAlign: 'center',
                    maxWidth: '80%',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    animation: 'fadeIn 0.5s ease-in-out'
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>👆 👇</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Mobile Zoom Enabled</div>
                    <div>Double-tap to zoom in, pinch to zoom, drag to pan</div>
                </div>
            )}
            
            <HashRing
                nodes={nodes}
                renderOptions={renderOptions}
            />
            
            <div style={{ width: '100%', marginTop: '20px' }}>
                <ConsistentHashingControls
                    renderOptions={renderOptions}
                    onOptionsChange={setRenderOptions}
                    onResetColors={handleResetColors}
                />
                
                {/* Node color toggle */}
                <Controls onAddNode={addNode} />
                
                {/* Reset button - only show if there are nodes */}
                {nodes.length > 0 && (
                    <button
                        onClick={resetNodes}
                        style={{
                            padding: '15px 25px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(to bottom, #f44336, #d32f2f)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 3px 6px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            minHeight: '60px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to bottom, #f55549, #e33e36)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), 0 0 15px rgba(0,0,0,0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to bottom, #f44336, #d32f2f)';
                            e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1)';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3), 0 0 5px rgba(0,0,0,0.1)';
                            e.currentTarget.style.background = 'linear-gradient(to bottom, #d32f2f, #f44336)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1)';
                            e.currentTarget.style.background = 'linear-gradient(to bottom, #f44336, #d32f2f)';
                        }}
                        onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3), 0 0 5px rgba(0,0,0,0.1)';
                            e.currentTarget.style.background = 'linear-gradient(to bottom, #d32f2f, #f44336)';
                        }}
                        onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1)';
                            e.currentTarget.style.background = 'linear-gradient(to bottom, #f44336, #d32f2f)';
                        }}
                    >
                        <span style={{ position: 'relative', zIndex: 2 }}>Reset All Nodes</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ConsistentHashing;
