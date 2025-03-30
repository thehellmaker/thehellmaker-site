import { useEffect, useRef } from "react";
import anime from "animejs";
import { treeStructure } from "./types";

interface DiskStorageProps {
  diskPages: number[];
  highlightedPage: number | null;
  evictionPage: number | null;
  isCacheHit: boolean;
}

export default function DiskStorage({ diskPages, highlightedPage, evictionPage, isCacheHit }: DiskStorageProps) {
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    nodeRefs.current.forEach((node, index) => {
      if (node) {
        const isHighlighted = !isCacheHit && highlightedPage === diskPages[index];
        
        // Only handle highlighting animation for cache misses
        anime({
          targets: node,
          opacity: isHighlighted ? 1 : 0.3,
          scale: isHighlighted ? 1.05 : 1,
          duration: 500,
          easing: 'easeInOutQuad',
          delay: index * 100
        });
      }
    });
  }, [diskPages, highlightedPage, isCacheHit]);

  return (
    <div className="border-2 border-blue-500 rounded-lg pt-0 pb-1 px-1 bg-blue-50 w-full">
      <h3 className="text-[11px] font-bold py-0 my-0 mt-1 mb-2">Disk Storage</h3>
      <div className="flex gap-4">
        {diskPages.map((pageNumber, index) => {
          const pageData = treeStructure[pageNumber] || [];
          const midPoint = Math.ceil(pageData.length / 2);
          const sector1Data = pageData.slice(0, midPoint);
          const sector2Data = pageData.slice(midPoint);

          return (
            <div
              key={pageNumber}
              ref={el => nodeRefs.current[index] = el}
              className={`flex-1 pt-1 px-1 pb-1 border rounded relative overflow-hidden bg-blue-200 border-blue-500
                ${!isCacheHit && highlightedPage === pageNumber ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-[11px] font-bold leading-none mb-2">Block {pageNumber}</div>
                <div className="space-y-2 flex-grow">
                  <div className="border border-blue-400 rounded py-1 px-1 bg-blue-50">
                    <div className="text-[9px] font-semibold text-blue-700 leading-none mb-1">Sector 1</div>
                    <div className="space-y-1">
                      {sector1Data.map((uuid, idx) => (
                        <div key={idx} className="text-[10px] text-blue-600 leading-none pl-1">
                          {uuid}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-blue-400 rounded py-1 px-1 bg-blue-50">
                    <div className="text-[9px] font-semibold text-blue-700 leading-none mb-1">Sector 2</div>
                    <div className="space-y-1">
                      {sector2Data.map((uuid, idx) => (
                        <div key={idx} className="text-[10px] text-blue-600 leading-none pl-1">
                          {uuid}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-500 leading-none mt-1">
                  ({pageData.length} UUIDs)
                </div>
              </div>
              {!isCacheHit && highlightedPage === pageNumber && (
                <div className="absolute inset-0 bg-blue-200 opacity-50" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 