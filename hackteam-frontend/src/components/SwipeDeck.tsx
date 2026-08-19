import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { X, Heart, RotateCcw } from "lucide-react";
import type { ScoredCandidate, SwipeDirection } from "../types";
import CandidateCard from "./CandidateCard";

const SWIPE_THRESHOLD = 110; // px, past this the release counts as a swipe
const MAX_STACK_VISIBLE = 3;

interface DragState {
  active: boolean;
  startX: number;
  x: number;
  y: number;
}

export default function SwipeDeck({
  candidates,
  onSwipe,
}: {
  candidates: ScoredCandidate[];
  onSwipe: (candidate: ScoredCandidate, direction: SwipeDirection) => void;
}) {
  const [queue, setQueue] = useState(candidates);
  const [exiting, setExiting] = useState<{ dir: SwipeDirection; x: number } | null>(null);
  const [drag, setDrag] = useState<DragState>({ active: false, startX: 0, x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setQueue(candidates), [candidates]);

  const top = queue[0];
  const upcoming = useMemo(() => queue.slice(1, MAX_STACK_VISIBLE), [queue]);

  const commitSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!top) return;
      setExiting({ dir: direction, x: direction === "right" ? 600 : -600 });
      window.setTimeout(() => {
        onSwipe(top, direction);
        setQueue((q) => q.slice(1));
        setExiting(null);
        setDrag({ active: false, startX: 0, x: 0, y: 0 });
      }, 220);
    },
    [top, onSwipe]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ active: true, startX: e.clientX, x: 0, y: 0 });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.active) return;
    setDrag((d) => ({ ...d, x: e.clientX - d.startX, y: 0 }));
  };

  const endDrag = () => {
    if (!drag.active) return;
    if (Math.abs(drag.x) > SWIPE_THRESHOLD) {
      commitSwipe(drag.x > 0 ? "right" : "left");
    } else {
      setDrag({ active: false, startX: 0, x: 0, y: 0 });
    }
  };

  // Keyboard fallback: left / right arrows swipe the top card.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!top || exiting) return;
      if (e.key === "ArrowRight") commitSwipe("right");
      if (e.key === "ArrowLeft") commitSwipe("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [top, exiting, commitSwipe]);

  const dragX = exiting ? exiting.x : drag.x;
  const rotation = dragX / 18;
  const rightOpacity = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1);
  const leftOpacity = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1);

  if (!top) {
    return (
      <div className="w-full h-[65vh] max-h-[560px] min-h-[380px] flex flex-col items-center justify-center text-center gap-3 px-8">
        <div className="w-14 h-14 rounded-2xl bg-tier-college-soft flex items-center justify-center">
          <RotateCcw className="w-6 h-6 text-tier-college" />
        </div>
        <h3 className="font-display text-lg">That's everyone for now</h3>
        <p className="text-sm text-ink-soft max-w-xs">
          New people show up here as they register. Same college folks always surface first.
          {/* New people show up here as they register for this event. Check back closer to
          the date — same-college folks always surface first. */}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="relative w-full max-w-sm h-[65vh] max-h-[560px] min-h-[420px]">
        {upcoming
          .slice()
          .reverse()
          .map((c, i) => {
            const depth = upcoming.length - i;
            return (
              <div
                key={c.id}
                className="absolute inset-0 transition-transform"
                style={{
                  transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`,
                  zIndex: 10 - depth,
                }}
                aria-hidden
              >
                <CandidateCard candidate={c} />
              </div>
            );
          })}

        <div
          ref={cardRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
          style={{
            transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
            transition: drag.active ? "none" : "transform 220ms ease-out",
            zIndex: 20,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <CandidateCard candidate={top} />

          <div
            className="absolute top-6 left-6 px-3 py-1 rounded-lg border-2 border-tier-college text-tier-college font-display text-sm -rotate-12 bg-surface/90"
            style={{ opacity: rightOpacity }}
          >
            TEAM UP
          </div>
          <div
            className="absolute top-6 right-6 px-3 py-1 rounded-lg border-2 border-match text-match font-display text-sm rotate-12 bg-surface/90"
            style={{ opacity: leftOpacity }}
          >
            PASS
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => commitSwipe("left")}
          aria-label="Pass on this person"
          className="w-14 h-14 rounded-full bg-surface border border-border shadow-sm flex items-center justify-center text-match hover:scale-105 active:scale-95 transition-transform"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={() => commitSwipe("right")}
          aria-label="Interested in teaming up"
          className="w-16 h-16 rounded-full bg-brand text-brand-ink shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <Heart className="w-7 h-7" fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
