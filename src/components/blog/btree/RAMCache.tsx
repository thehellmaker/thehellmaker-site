import { useEffect, useRef } from "react";
import anime from "animejs";
import { treeStructure } from "./types";

interface RAMCacheProps {
  ramPages: number[];
  highlightedPage: number | null;
  evictionPage: number | null;
}

export default function RAMCache({ ramPages, highlightedPage, evictionPage }: RAMCacheProps) {
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    nodeRefs.current.forEach((node, index) => {
      if (node) {
        const isHighlighted = highlightedPage === ramPages[index];
        const isEvicting = evictionPage === ramPages[index];

        if (isEvicting) {
          // Eviction animation sequence
          anime({
            targets: node,
            translateX: [-100],
            opacity: [1, 0.5],
            scale: [1, 0.8],
            duration: 500,
            easing: 'easeInOutQuad',
            complete: () => {
              // Return to original position
              anime({
                targets: node,
                translateX: 0,
                opacity: 1,
                scale: 1,
                duration: 300,
                easing: 'easeInOutQuad'
              });
            }
          });
        } else {
          // Normal highlight animation
          anime({
            targets: node,
            opacity: isHighlighted ? 1 : 0.3,
            scale: isHighlighted ? 1.05 : 1,
            duration: 500,
            easing: 'easeInOutQuad',
            delay: index * 100
          });
        }
      }
    });
  }, [ramPages, highlightedPage, evictionPage]);

  return (
    <div className="border-2 border-green-500 rounded-lg pt-0 pb-1 px-1 bg-green-50 w-full">
      <h3 className="text-[11px] font-bold py-0 my-0 mt-1 mb-2">RAM Cache</h3>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((slot) => {
          const pageNumber = ramPages[slot - 1];
          const pageData = pageNumber ? treeStructure[pageNumber] : [];
          const firstUUID = pageData[0] || "";
          const lastUUID = pageData[pageData.length - 1] || "";

          return (
            <div
              key={slot}
              ref={el => nodeRefs.current[slot - 1] = el}
              className={`pt-1 px-1 pb-1 border rounded relative overflow-hidden bg-green-200 border-green-500
                ${highlightedPage === pageNumber ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="relative z-10">
                <div className="text-[11px] font-bold leading-none mb-2">Page {pageNumber || "Empty"}</div>
                {pageNumber && (
                  <>
                    <div className="text-[9px] text-blue-600 leading-none mb-2 pl-1">
                      {firstUUID} ... {lastUUID}
                    </div>
                    <div className="flex justify-between mt-1">
                      <div className="text-[9px] text-gray-500 leading-none">
                        ({pageData.length} UUIDs)
                      </div>
                      <div className="text-[8px] text-blue-800 bg-blue-100 px-0.5 rounded leading-none">
                        → Block {pageNumber}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {evictionPage === pageNumber && (
                <div className="absolute inset-0 bg-red-200 opacity-50" />
              )}
              {highlightedPage === pageNumber && evictionPage !== pageNumber && (
                <div className="absolute inset-0 bg-blue-200 opacity-50" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 