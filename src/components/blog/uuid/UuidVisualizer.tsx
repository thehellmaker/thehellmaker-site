import { useState } from 'react';
import { UuidV4Structure, UuidV7Structure, SnowflakeStructure, UlidStructure } from './UuidStructures';

interface UuidVisualizerProps {
  defaultType?: 'uuidv4' | 'uuidv7' | 'snowflake' | 'ulid';
}

const UuidVisualizer: React.FC<UuidVisualizerProps> = ({ defaultType = 'uuidv4' }) => {
  const [idType, setIdType] = useState(defaultType);
  
  return (
    <div className="uuid-visualizer p-4 border rounded bg-gray-50">
      <div className="controls mb-4">
        <h4 className="text-lg font-bold mb-2">Select ID Type:</h4>
        <div className="flex gap-2">
          <button 
            onClick={() => setIdType('uuidv4')}
            className={`px-3 py-1 rounded ${idType === 'uuidv4' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            UUID v4
          </button>
          <button 
            onClick={() => setIdType('uuidv7')}
            className={`px-3 py-1 rounded ${idType === 'uuidv7' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            UUID v7
          </button>
          <button 
            onClick={() => setIdType('snowflake')}
            className={`px-3 py-1 rounded ${idType === 'snowflake' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            Snowflake
          </button>
          <button 
            onClick={() => setIdType('ulid')}
            className={`px-3 py-1 rounded ${idType === 'ulid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            ULID
          </button>
        </div>
      </div>
      
      {/* Structure Diagram */}
      <div className="mb-6">
        {idType === 'uuidv4' && <UuidV4Structure />}
        {idType === 'uuidv7' && <UuidV7Structure />}
        {idType === 'snowflake' && <SnowflakeStructure />}
        {idType === 'ulid' && <UlidStructure />}
      </div>
      
      {/* Example Visualization */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold mb-2">Example IDs</h4>
      </div>
      
      {idType === 'uuidv4' && (
        <div className="uuidv4-visualization">
          <div className="flex mb-4">
            <div style={{width: '122px'}} className="bg-red-200 text-center p-2 text-xs">Random (122 bits)</div>
            <div style={{width: '6px'}} className="bg-blue-200 text-center text-xs">Fixed</div>
          </div>
          <div className="example-ids space-y-1">
            <div className="font-mono text-sm">550e8400-e29b-41d4-a716-446655440000</div>
            <div className="font-mono text-sm">6ba7b810-9dad-11d1-80b4-00c04fd430c8</div>
            <div className="font-mono text-sm">f47ac10b-58cc-4372-a567-0e02b2c3d479</div>
          </div>
          <p className="mt-3 text-sm">
            ⚠️ Random distribution = scattered database inserts = frequent page splits
          </p>
        </div>
      )}
      
      {idType === 'uuidv7' && (
        <div className="uuidv7-visualization">
          <div className="flex mb-4">
            <div style={{width: '48px'}} className="bg-green-200 text-center p-2 text-xs">Time (48 bits)</div>
            <div style={{width: '6px'}} className="bg-blue-200 text-center text-xs">Fixed</div>
            <div style={{width: '74px'}} className="bg-red-200 text-center p-2 text-xs">Random (74 bits)</div>
          </div>
          <div className="example-ids space-y-1">
            <div className="font-mono text-sm"><span className="bg-green-100">018f0f3d</span>-1c3b-7c3b-9c3b-1c3b7c3b9c3b</div>
            <div className="font-mono text-sm"><span className="bg-green-100">018f0f3d</span>-1c3b-7c3b-9c3b-1c3b7c3b9c3c</div>
            <div className="font-mono text-sm"><span className="bg-green-100">018f0f3e</span>-2a7d-8c4f-a32e-5b6c9d8f3e7a</div>
          </div>
          <p className="mt-3 text-sm">
            ✅ Time-ordered = sequential database inserts = minimal page splits
          </p>
        </div>
      )}
      
      {idType === 'snowflake' && (
        <div className="snowflake-visualization">
          <div className="flex mb-4">
            <div style={{width: '1px'}} className="bg-gray-200 text-center text-xs">0</div>
            <div style={{width: '41px'}} className="bg-green-200 text-center p-2 text-xs">Time (41 bits)</div>
            <div style={{width: '10px'}} className="bg-yellow-200 text-center text-xs">Node</div>
            <div style={{width: '12px'}} className="bg-purple-200 text-center text-xs">Seq</div>
          </div>
          <div className="example-ids space-y-1">
            <div className="font-mono text-sm">1647794966123118592</div>
            <div className="font-mono text-sm">1647794966123118593</div>
            <div className="font-mono text-sm">1647795087654387712</div>
          </div>
          <p className="mt-3 text-sm">
            ✅ Time-ordered + compact (64-bit) = optimal for high-throughput systems
          </p>
        </div>
      )}
      
      {idType === 'ulid' && (
        <div className="ulid-visualization">
          <div className="flex mb-4">
            <div style={{width: '48px'}} className="bg-green-200 text-center p-2 text-xs">Time (48 bits)</div>
            <div style={{width: '80px'}} className="bg-red-200 text-center p-2 text-xs">Random (80 bits)</div>
          </div>
          <div className="example-ids space-y-1">
            <div className="font-mono text-sm"><span className="bg-green-100">01HNZ7BPQJ</span>9Z8P2NRXGA</div>
            <div className="font-mono text-sm"><span className="bg-green-100">01HNZ7BPQK</span>9Z8P2NRXGB</div>
            <div className="font-mono text-sm"><span className="bg-green-100">01HNZ7CDE5</span>9Z8P2NRXGC</div>
          </div>
          <p className="mt-3 text-sm">
            ✅ Time-ordered + base32 encoding = sortable and human-readable
          </p>
        </div>
      )}
    </div>
  );
};

export default UuidVisualizer; 