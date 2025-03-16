import React, { useState, useEffect, useRef } from 'react';
import { 
  NodeData, 
  RenderOptions,
  defaultRenderOptions
} from "./consistent-hashing-types";
import { 
  calculateNodePositions,
  assignPartitions,
  sortNodesByHash
} from "./hashRingLogic";
import { renderHashRing } from "./hashRingRenderer";
import { getPartitionColor } from './colorUtils';

// CSS for animations
const styles = {
  container: {
    width: '100%', 
    position: 'relative',
    transition: 'all 0.3s ease'
  },
  canvas: {
    display: 'block',
    height: 'auto',
    margin: '0 auto',
    transition: 'cursor 0.2s ease',
    maxHeight: '75vh'
  },
  mobileHint: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '4px',
    padding: '5px 10px',
    fontSize: '12px',
    color: '#666',
    zIndex: 10,
    pointerEvents: 'none',
    opacity: 0.8,
    transition: 'opacity 0.5s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    animation: 'fadeIn 0.5s ease-in-out'
  },
  resetButton: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'all 0.2s ease',
    animation: 'fadeIn 0.3s ease-in-out'
  }
};

// Polyfill for Math.hypot if not available
const mathHypot = (x: number, y: number): number => {
  return Math.sqrt(x * x + y * y);
};

interface HashRingProps {
  nodes: NodeData[];
  renderOptions?: Partial<RenderOptions>;
}

const HashRing = ({ nodes, renderOptions = {} }: HashRingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // State for zoom and pan functionality
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTapTime, setLastTapTime] = useState(0);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  
  // Check if the device is mobile
  const [isMobile, setIsMobile] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  
  // Merge default options with provided options
  const options = { ...defaultRenderOptions, ...renderOptions };

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth <= 768;
      
      // If switching between mobile and desktop, reset zoom and pan
      if (isMobileView !== isMobile) {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
      
      setIsMobile(isMobileView);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener to update mobile status
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  // Hide the hint after 5 seconds on mobile
  useEffect(() => {
    if (isMobile && hintVisible) {
      const timer = setTimeout(() => {
        setHintVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, hintVisible]);

  // Update canvas dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Make the canvas square with the width as the limiting factor
        setDimensions({
          width: containerWidth,
          height: containerWidth
        });
      }
    };
    
    // Initial update
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save the current transformation
    ctx.save();
    
    // Apply zoom and pan transformations with smooth animation
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    // Sort nodes by hash position (ascending order)
    const sortedNodes = sortNodesByHash(nodes);
    
    // Process data and assign partitions
    const { nodesWithPartitions, rangeResponsibility } = assignPartitions(sortedNodes);
    
    // Calculate node positions for rendering
    const nodePositions = calculateNodePositions(nodes, canvas.width, canvas.height, Math.min(canvas.width, canvas.height) * 0.3, nodesWithPartitions);
    
    // Render the hash ring visualization
    renderHashRing(
      ctx, 
      canvas.width, 
      canvas.height, 
      Math.min(canvas.width, canvas.height) * 0.3, // Responsive radius based on canvas size
      nodes, 
      sortedNodes, 
      nodesWithPartitions, 
      nodePositions,
      options
    );
    
    // Restore the transformation
    ctx.restore();
    
    // Log for debugging
    console.log('Sorted nodes:', sortedNodes);
    console.log('Assigned partitions:', nodesWithPartitions);
  }, [nodes, options, dimensions, scale, offset]);

  // Handle touch/mouse events for zooming and panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return; // Only handle touch events on mobile
    
    if (e.touches.length === 1) {
      // Single touch - prepare for potential drag
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
      setIsDragging(true);
      
      // Check for double tap (zoom in)
      const now = new Date().getTime();
      const timeSinceLastTap = now - lastTapTime;
      
      if (timeSinceLastTap < 300) {
        // Double tap detected - zoom in
        setScale(prevScale => Math.min(prevScale * 1.5, 3));
        
        // Center zoom on tap location
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const touchX = touch.clientX - rect.left;
          const touchY = touch.clientY - rect.top;
          
          // Adjust offset to zoom toward touch point
          setOffset(prevOffset => ({
            x: prevOffset.x - (touchX - dimensions.width/2) * 0.3,
            y: prevOffset.y - (touchY - dimensions.height/2) * 0.3
          }));
        }
        
        // Hide the hint when user starts interacting
        setHintVisible(false);
      }
      
      setLastTapTime(now);
    } else if (e.touches.length === 2) {
      // Pinch gesture - prepare for zoom
      e.preventDefault(); // Prevent default browser pinch zoom
      
      // Calculate initial distance between two fingers
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = mathHypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setLastPinchDistance(distance);
      
      // Calculate the midpoint between the two touches
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      
      // Store the midpoint for zooming
      setDragStart({ x: midX, y: midY });
      
      // Hide the hint when user starts interacting
      setHintVisible(false);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return; // Only handle touch events on mobile
    
    if (isDragging && e.touches.length === 1) {
      // Pan the view
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
      e.preventDefault();
      
      // Calculate new distance between fingers
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = mathHypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // Calculate zoom factor based on finger distance change
      if (lastPinchDistance > 0) {
        const delta = distance / lastPinchDistance;
        
        // Apply zoom with limits
        setScale(prevScale => {
          const newScale = prevScale * delta;
          return Math.max(0.5, Math.min(newScale, 3));
        });
        
        // Calculate the midpoint between the two touches
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        
        // Get canvas position
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasMidX = midX - rect.left;
          const canvasMidY = midY - rect.top;
          
          // Adjust offset to zoom toward pinch midpoint
          setOffset(prevOffset => ({
            x: prevOffset.x - (canvasMidX - dimensions.width/2) * 0.1 * (delta - 1),
            y: prevOffset.y - (canvasMidY - dimensions.height/2) * 0.1 * (delta - 1)
          }));
        }
      }
      
      // Update last distance
      setLastPinchDistance(distance);
    }
  };
  
  const handleTouchEnd = () => {
    if (!isMobile) return; // Only handle touch events on mobile
    
    setIsDragging(false);
    setLastPinchDistance(0); // Reset pinch distance when touch ends
  };
  
  // Handle mouse down - only for mobile devices
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only enable zoom/pan functionality on mobile
    if (!isMobile) return;
    
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    setIsDragging(true);
  };
  
  // Handle mouse move - only for mobile devices
  const handleMouseMove = (e: React.MouseEvent) => {
    // Only enable zoom/pan functionality on mobile
    if (!isMobile) return;
    
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  // Handle mouse up - only for mobile devices
  const handleMouseUp = () => {
    // Only enable zoom/pan functionality on mobile
    if (!isMobile) return;
    
    setIsDragging(false);
  };
  
  // Handle wheel events - completely prevent zooming on desktop
  const handleWheel = (e: React.WheelEvent) => {
    // Always prevent default browser zoom behavior
    e.preventDefault();
    
    // Only allow zooming on mobile devices
    if (!isMobile) return;
    
    // Zoom in or out based on wheel direction
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => {
      const newScale = prevScale * delta;
      // Limit zoom range
      return Math.max(0.5, Math.min(newScale, 3));
    });
    
    // Adjust offset to zoom toward mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setOffset(prevOffset => ({
        x: prevOffset.x - (mouseX - dimensions.width/2) * 0.1 * (delta - 1),
        y: prevOffset.y - (mouseY - dimensions.height/2) * 0.1 * (delta - 1)
      }));
    }
  };
  
  const handleReset = () => {
    // Add smooth animation for reset
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        ...styles.container,
        touchAction: isMobile ? 'none' : 'auto' // Only prevent browser handling of touch events on mobile
      }}
    >
      {isMobile && hintVisible && (
        <div style={styles.mobileHint}>
          <span style={{ fontSize: '16px' }}>👆</span> Tap to zoom, drag to pan
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ 
          ...styles.canvas,
          cursor: isDragging && isMobile ? 'grabbing' : 'default'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      {isMobile && scale !== 1 && (
        <button
          onClick={handleReset}
          style={styles.resetButton}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Reset View
        </button>
      )}
    </div>
  );
};

export default HashRing;
