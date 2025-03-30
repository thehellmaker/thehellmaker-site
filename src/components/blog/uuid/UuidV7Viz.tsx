import React from 'react';
import { UuidV7Structure } from './UuidStructures';

const UuidV7Viz: React.FC = () => {
  return (
    <div className="uuid-viz p-4 border rounded bg-gray-50 mb-8">
      <h3 className="text-xl font-bold mb-5">UUID v7 Structure</h3>
      
      {/* Structure Diagram */}
      <div className="mb-6">
        <UuidV7Structure />
      </div>
      
      {/* Example Visualization */}
      <div className="mb-5">
        <h4 className="text-lg font-semibold mb-3">Example IDs</h4>
      </div>
      
      {/* The diagram proportions - adjusting to give small fields minimum visual space */}
      <div className="flex mb-5 h-10 overflow-hidden rounded">
        <div style={{width: '37.5%'}} className="bg-green-200 text-center p-2 text-xs">Time (48 bits)</div>
        <div style={{width: '3.5%'}} className="bg-blue-200 flex items-center justify-center text-xs">
          <span className="transform -rotate-90 whitespace-nowrap">Ver (4b)</span>
        </div>
        <div style={{width: '10%'}} className="bg-red-200 text-center p-2 text-xs">Rand A</div>
        <div style={{width: '2.5%'}} className="bg-blue-300 flex items-center justify-center text-xs">
          <span className="transform -rotate-90 whitespace-nowrap">Var (2b)</span>
        </div>
        <div style={{width: '46.5%'}} className="bg-red-200 text-center p-2 text-xs">Rand B+C</div>
      </div>
      
      <div className="example-ids space-y-3 mb-5">
        <div className="font-mono text-sm p-1">
          <span className="bg-green-100 px-1 py-0.5 rounded">018f0f3d</span>-
          <span className="bg-blue-100 px-1 py-0.5 rounded">7</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">c3b</span>-
          <span className="bg-blue-200 px-1 py-0.5 rounded">9</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">c3b-1c3b-7c3b9c3b</span>
        </div>
        <div className="font-mono text-sm p-1">
          <span className="bg-green-100 px-1 py-0.5 rounded">018f0f3d</span>-
          <span className="bg-blue-100 px-1 py-0.5 rounded">7</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">c3b</span>-
          <span className="bg-blue-200 px-1 py-0.5 rounded">9</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">c3b-1c3b-7c3b9c3c</span>
        </div>
        <div className="font-mono text-sm p-1">
          <span className="bg-green-100 px-1 py-0.5 rounded">018f0f3e</span>-
          <span className="bg-blue-100 px-1 py-0.5 rounded">7</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">a7d</span>-
          <span className="bg-blue-200 px-1 py-0.5 rounded">8</span>
          <span className="bg-red-100 px-1 py-0.5 rounded">c4f-a32e-5b6c9d8f3e7a</span>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
        <h4 className="font-semibold mb-3">Performance Benefits:</h4>
        <p className="text-sm leading-relaxed">
          ✅ <strong>Time-ordered</strong> structure ensures adjacent values in time have adjacent sortable values,
          enabling sequential database inserts, efficient caching, and minimizing page splits.
        </p>
      </div>
      
      <div className="mt-4 p-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded">
        <strong>Note:</strong> Version bits (4 bits, value=7) and variant bits (2 bits, value=10) are shown with increased 
        width to make them visible. In reality, they occupy just 6 bits of the total 128 bits.
      </div>
    </div>
  );
};

export default UuidV7Viz; 