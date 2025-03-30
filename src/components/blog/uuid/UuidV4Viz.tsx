import React from 'react';
import { UuidV4Structure } from './UuidStructures';

const UuidV4Viz: React.FC = () => {
  return (
    <div className="uuid-viz p-4 border rounded bg-gray-50 mb-8">
      <h3 className="text-xl font-bold mb-5">UUID v4 Structure</h3>
      
      {/* Structure Diagram */}
      <div className="mb-6">
        <UuidV4Structure />
      </div>
      
      {/* Example Visualization */}
      <div className="mb-5">
        <h4 className="text-lg font-semibold mb-3">Example IDs</h4>
      </div>
      
      {/* The diagram proportions - adjusting to give small fields minimum visual space */}
      <div className="flex mb-5 h-10 overflow-hidden rounded">
        <div style={{width: '37.5%'}} className="bg-red-200 text-center p-2 text-xs">Random A+B</div>
        <div style={{width: '3.5%'}} className="bg-blue-200 flex items-center justify-center text-xs">
          <span className="transform -rotate-90 whitespace-nowrap">Ver (4b)</span>
        </div>
        <div style={{width: '10%'}} className="bg-red-200 text-center p-2 text-xs">Random C</div>
        <div style={{width: '2.5%'}} className="bg-blue-300 flex items-center justify-center text-xs">
          <span className="transform -rotate-90 whitespace-nowrap">Var (2b)</span>
        </div>
        <div style={{width: '46.5%'}} className="bg-red-200 text-center p-2 text-xs">Random D+E</div>
      </div>
      
      <div className="example-ids space-y-3 mb-5">
        <div className="font-mono text-sm p-1">
          <span className="bg-red-100 px-1 py-0.5 rounded">550e8400-e29b-</span>
          <span className="bg-blue-100 px-1 py-0.5 rounded">4</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">1d4-a</span>
          <span className="bg-blue-200 px-1 py-0.5 rounded">7</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">16-446655440000</span>
        </div>
        <div className="font-mono text-sm p-1">
          <span className="bg-red-100 px-1 py-0.5 rounded">6ba7b810-9dad-</span>
          <span className="bg-blue-100 px-1 py-0.5 rounded">4</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">1d1-8</span>
          <span className="bg-blue-200 px-1 py-0.5 rounded">0</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">b4-00c04fd430c8</span>
        </div>
        <div className="font-mono text-sm p-1">
          <span className="bg-red-100 px-1 py-0.5 rounded">f47ac10b-58cc-</span>
          <span className="bg-blue-100 px-1 py-0.5 rounded">4</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">372-a</span>
          <span className="bg-blue-200 px-1 py-0.5 rounded">5</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">67-0e02b2c3d479</span>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold mb-3">Performance Impact:</h4>
        <p className="text-sm leading-relaxed">
          ⚠️ <strong>Random distribution</strong> means lookups and inserts target scattered blocks across storage,
          leading to poor cache utilization, frequent page splits, and excessive disk I/O.
        </p>
      </div>
      
      <div className="mt-4 p-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded">
        <strong>Note:</strong> Version bits (4 bits, value=4) and variant bits (2 bits, value=10) are shown with increased 
        width to make them visible. In reality, they occupy just 6 bits of the total 128 bits.
      </div>
    </div>
  );
};

export default UuidV4Viz; 