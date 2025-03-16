import React from 'react';
import { RenderOptions } from './consistent-hashing-types';
import { resetPartitionColors } from './colorUtils';

interface ConsistentHashingControlsProps {
  renderOptions: RenderOptions;
  onOptionsChange: (options: RenderOptions) => void;
  onResetColors?: () => void;
}

const ConsistentHashingControls: React.FC<ConsistentHashingControlsProps> = ({
  renderOptions,
  onOptionsChange,
  onResetColors
}) => {
  const handleNodeColorToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...renderOptions,
      showNodeColors: e.target.checked
    });
  };

  const handleResetColors = () => {
    resetPartitionColors();
    if (onResetColors) {
      onResetColors();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row',
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '15px'
    }}>
      <label style={{ 
        display: 'flex', 
        alignItems: 'center',
        fontSize: '14px',
        userSelect: 'none'
      }}>
        <input
          type="checkbox"
          checked={renderOptions.showNodeColors}
          onChange={handleNodeColorToggle}
          style={{ marginRight: '8px' }}
        />
        Show Node Colors
      </label>
      
      <button
        onClick={handleResetColors}
        style={{
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Reset Partition Colors
      </button>
    </div>
  );
};

export default ConsistentHashingControls; 