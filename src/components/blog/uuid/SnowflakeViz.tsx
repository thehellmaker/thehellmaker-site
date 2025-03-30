import React from 'react';
import { SnowflakeStructure } from './UuidStructures';

const SnowflakeViz: React.FC = () => {
  return (
    <div className="uuid-viz p-4 border rounded bg-gray-50 mb-8">
      <h3 className="text-xl font-bold mb-5">Snowflake ID Structure</h3>
      
      {/* Structure Diagram */}
      <div className="mb-6">
        <SnowflakeStructure />
      </div>
      
      {/* Example Visualization */}
      <div className="mb-5">
        <h4 className="text-lg font-semibold mb-3">Example IDs</h4>
      </div>
      
      {/* The diagram proportions - adjusting to give small fields minimum visual space */}
      <div className="flex mb-5 h-10 overflow-hidden rounded">
        <div style={{width: '2%'}} className="bg-gray-200 flex items-center justify-center text-xs">
          <span>0</span>
        </div>
        <div style={{width: '64%'}} className="bg-green-200 text-center p-2 text-xs">Timestamp (41 bits)</div>
        <div style={{width: '16%'}} className="bg-yellow-200 text-center p-2 text-xs">Node ID (10 bits)</div>
        <div style={{width: '18%'}} className="bg-purple-200 text-center p-2 text-xs">Sequence (12 bits)</div>
      </div>
      
      <div className="example-ids space-y-3 mb-5">
        <div className="font-mono text-sm p-1">
          <span className="bg-gray-100 px-1 py-0.5 rounded mr-1">0</span>
          <span className="bg-green-100 px-1 py-0.5 rounded">1647794966</span>
          <span className="bg-yellow-100 px-1 py-0.5 rounded mx-1">123</span>
          <span className="bg-purple-100 px-1 py-0.5 rounded">118592</span>
        </div>
        <div className="font-mono text-sm p-1">
          <span className="bg-gray-100 px-1 py-0.5 rounded mr-1">0</span>
          <span className="bg-green-100 px-1 py-0.5 rounded">1647794966</span>
          <span className="bg-yellow-100 px-1 py-0.5 rounded mx-1">123</span>
          <span className="bg-purple-100 px-1 py-0.5 rounded">118593</span>
        </div>
        <div className="font-mono text-sm p-1">
          <span className="bg-gray-100 px-1 py-0.5 rounded mr-1">0</span>
          <span className="bg-green-100 px-1 py-0.5 rounded">1647795087</span>
          <span className="bg-yellow-100 px-1 py-0.5 rounded mx-1">654</span>
          <span className="bg-purple-100 px-1 py-0.5 rounded">387712</span>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
        <h4 className="font-semibold mb-3">Performance Benefits:</h4>
        <p className="text-sm leading-relaxed">
          ✅ <strong>Time-ordered + Compact:</strong> Snowflake IDs use only 64 bits (half the size of UUIDs) while 
          maintaining time-ordering for sequential database access. The worker ID allows for distributed generation 
          without coordination, and the sequence number enables up to 4,096 IDs per millisecond per node.
        </p>
      </div>
      
      <div className="mt-4 p-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded">
        <strong>Note:</strong> The sign bit (always 0) is shown with increased width to make it visible. 
        In reality, it's just 1 bit of the total 64 bits.
      </div>
    </div>
  );
};

export default SnowflakeViz; 