import React from 'react';
import { UlidStructure } from './UuidStructures';

const UlidViz: React.FC = () => {
  return (
    <div className="uuid-viz p-4 border rounded bg-gray-50 mb-8">
      <h3 className="text-xl font-bold mb-5">ULID Structure</h3>
      
      {/* Structure Diagram */}
      <div className="mb-6">
        <UlidStructure />
      </div>
      
      {/* Example Visualization */}
      <div className="mb-5">
        <h4 className="text-lg font-semibold mb-3">Example IDs</h4>
      </div>
      
      <div className="flex mb-5">
        <div style={{width: '38%'}} className="bg-green-200 text-center p-2 text-xs">Time (48 bits)</div>
        <div style={{width: '62%'}} className="bg-red-200 text-center p-2 text-xs">Random (80 bits)</div>
      </div>
      
      <div className="example-ids space-y-3 mb-5">
        <div className="font-mono text-sm p-1">
          <span className="bg-green-100 px-1 py-0.5 rounded">01HNZ7BPQJ</span>
          <span className="px-1 py-0.5">9Z8P2NRXGA</span>
        </div>
        <div className="font-mono text-sm p-1">
          <span className="bg-green-100 px-1 py-0.5 rounded">01HNZ7BPQK</span>
          <span className="px-1 py-0.5">9Z8P2NRXGB</span>
        </div>
        <div className="font-mono text-sm p-1">
          <span className="bg-green-100 px-1 py-0.5 rounded">01HNZ7CDE5</span>
          <span className="px-1 py-0.5">9Z8P2NRXGC</span>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
        <h4 className="font-semibold mb-3">Performance Benefits:</h4>
        <p className="text-sm leading-relaxed">
          ✅ <strong>Time-ordered + Human-readable:</strong> ULIDs combine time-ordering for performance 
          with Crockford's base32 encoding for improved readability. The 48-bit timestamp (first 10 characters) 
          ensures chronological sorting, while the 80-bit randomness component maintains uniqueness even 
          with high concurrency.
        </p>
      </div>
      
      <div className="mt-4 p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded">
        <strong>Note:</strong> ULIDs are designed to be lexicographically sortable as strings, making them 
        ideal for systems where string-based sorting is common.
      </div>
    </div>
  );
};

export default UlidViz; 