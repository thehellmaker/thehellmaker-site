import { useEffect, useState } from "react";
import BTreeVisualizer from "./BTreeVisualizer";
import RAMCache from "./RAMCache";
import DiskStorage from "./DiskStorage";

const MAX_RAM_PAGES = 4;
const ANIMATION_INTERVAL = 2000;
const ANIMATION_DURATION = 1000;

type BTreeAnimationProps = {
  sequence: string[];
  autoPlay: boolean;
  stepDuration: number;
}

type PageState = {
  ramPages: number[];
  pageAccessTimes: { [key: number]: number };  // Track last access time for each page
  highlightedPage: number | null;
  evictionPage: number | null;
  highlightedNode: number | null;
  evictionNode: number | null;
  isCacheHit: boolean;
}

export default function BTreeAnimation({ 
  sequence = ["1", "2", "3", "4", "5", "6", "7"], 
  autoPlay = true, 
  stepDuration = 2000 
}: BTreeAnimationProps) {
  const [pageState, setPageState] = useState<PageState>({
    ramPages: [],
    pageAccessTimes: {},
    highlightedPage: null,
    evictionPage: null,
    highlightedNode: null,
    evictionNode: null,
    isCacheHit: false
  });
  const [currentStep, setCurrentStep] = useState(0);

  const handlePageHit = (pageNumber: number) => {
    setPageState(prev => ({
      ...prev,
      highlightedPage: pageNumber,
      highlightedNode: pageNumber,
      isCacheHit: true,
      pageAccessTimes: {
        ...prev.pageAccessTimes,
        [pageNumber]: Date.now()
      }
    }));

    setTimeout(() => {
      setPageState(prev => ({
        ...prev,
        highlightedPage: null,
        highlightedNode: null,
        isCacheHit: false
      }));
    }, stepDuration);
  };

  const handlePageEviction = (pageNumber: number, evictedPage: number) => {
    setPageState(prev => ({
      ...prev,
      evictionPage: evictedPage,
      evictionNode: evictedPage
    }));

    setTimeout(() => {
      setPageState(prev => ({
        ...prev,
        evictionPage: null,
        evictionNode: null,
        ramPages: prev.ramPages.map((page, index) => 
          page === evictedPage ? pageNumber : page
        ),
        pageAccessTimes: {
          ...prev.pageAccessTimes,
          [pageNumber]: Date.now()
        }
      }));
    }, ANIMATION_DURATION);
  };

  const handlePageAddition = (pageNumber: number) => {
    setPageState(prev => ({
      ...prev,
      ramPages: [...prev.ramPages, pageNumber],
      pageAccessTimes: {
        ...prev.pageAccessTimes,
        [pageNumber]: Date.now()
      }
    }));
  };

  const findLRUPage = (pages: number[], accessTimes: { [key: number]: number }): number => {
    return pages.reduce((lru, current) => {
      return (accessTimes[current] || 0) < (accessTimes[lru] || 0) ? current : lru;
    });
  };

  const handlePageAccess = (pageNumber: number) => {
    setPageState(prev => ({
      ...prev,
      highlightedPage: pageNumber,
      highlightedNode: pageNumber,
      isCacheHit: false
    }));

    if (pageState.ramPages.includes(pageNumber)) {
      handlePageHit(pageNumber);
    } else if (pageState.ramPages.length >= MAX_RAM_PAGES) {
      // Find and evict the least recently used page
      const lruPage = findLRUPage(pageState.ramPages, pageState.pageAccessTimes);
      handlePageEviction(pageNumber, lruPage);
    } else {
      handlePageAddition(pageNumber);
    }
  };

  // Handle page access and RAM cache updates
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      // Get the next page number from the sequence
      const pageNumber = parseInt(sequence[currentStep]);
      handlePageAccess(pageNumber);

      // Move to next step, loop back to start if at end
      setCurrentStep(prev => (prev + 1) % sequence.length);
    }, ANIMATION_INTERVAL);

    return () => clearInterval(interval);
  }, [currentStep, sequence, autoPlay, pageState.ramPages]);

  // Get all disk pages (1-7)
  const diskPages = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4">
      {/* B-tree at the top */}
      <BTreeVisualizer 
        highlightedNode={pageState.highlightedNode}
        evictionNode={pageState.evictionNode}
      />
      
      {/* RAM Cache in the middle */}
      <RAMCache 
        ramPages={pageState.ramPages}
        highlightedPage={pageState.highlightedPage}
        evictionPage={pageState.evictionPage}
      />
      
      {/* Disk Storage at the bottom */}
      <DiskStorage 
        diskPages={diskPages}
        highlightedPage={pageState.highlightedPage}
        evictionPage={pageState.evictionPage}
        isCacheHit={pageState.isCacheHit}
      />
    </div>
  );
}
