import React from 'react';

interface ControlsProps {
    onAddNode: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onAddNode }) => {
    return (
        <div 
            className="controls-container"
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '5px',
                marginBottom: '10px'
            }}
        >
            <button 
                onClick={onAddNode}
                style={{
                    padding: '15px 25px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(to bottom, #333333, #222222)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    minHeight: '60px', // Larger touch target for mobile
                    width: '100%', // Full width button
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #444444, #333333)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), 0 0 15px rgba(0,0,0,0.2)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #333333, #222222)';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1)';
                }}
                onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3), 0 0 5px rgba(0,0,0,0.1)';
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #222222, #333333)';
                }}
                onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1)';
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #333333, #222222)';
                }}
                onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3), 0 0 5px rgba(0,0,0,0.1)';
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #222222, #333333)';
                }}
                onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1)';
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #333333, #222222)';
                }}
            >
                <span style={{ position: 'relative', zIndex: 2 }}>Add Node</span>
            </button>
        </div>
    );
};

export default Controls;
  