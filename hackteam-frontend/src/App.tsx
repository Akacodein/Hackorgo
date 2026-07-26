import { useEffect, useState } from "react";
import { MapPin, LogOut, ArrowLeftRight } from "lucide-react";
import AuthPanel from "./components/AuthPanel";
import Onboarding from "./components/Onboarding";
import EventHome from "./components/EventHome";
import EventFlow from "./components/EventFlow";
import ProfileBackdrop from "./components/ProfileBackdrop";
import SwipeDeck from "./components/SwipeDeck";
import MatchModal from "./components/MatchModal";
import { fetchCandidates, recordSwipe, getMyProfile, getMyEvents } from "./lib/eventsApi";
import { getSession, signOut } from "./lib/authClient";
import type { EventOption, MyProfile, ScoredCandidate, SwipeDirection } from "./types";

type Phase = "loading" | "auth" | "profile" | "events" | "addEvent" | "ready";

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<MyProfile | null>(null);
  const [myEvents, setMyEvents] = useState<Array<EventOption & { lookingFor: string[] }>>([]);
  const [activeEvent, setActiveEvent] = useState<EventOption | null>(null);
  const [candidates, setCandidates] = useState<ScoredCandidate[] | null>(null);
  const [matched, setMatched] = useState<ScoredCandidate | null>(null);

  const goToEventsOrAdd = async () => {
    const events = await getMyEvents();
    setMyEvents(events);
    if (events.length === 0) setPhase("addEvent");
    else setPhase("events");
  };

  const loadAfterAuth = async () => {
    const profile = await getMyProfile();
    setMe(profile);
    if (!profile.profileComplete) setPhase("profile");
    else await goToEventsOrAdd();
  };

  useEffect(() => {
    getSession().then((s) => {
      if (s?.user) loadAfterAuth();
      else setPhase("auth");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "ready" || !activeEvent) return;
    setCandidates(null);
    fetchCandidates(activeEvent.id).then(setCandidates);
  }, [phase, activeEvent]);

  const handleSwipe = async (candidate: ScoredCandidate, direction: SwipeDirection) => {
    if (!activeEvent) return;
    const { matched: didMatch } = await recordSwipe(activeEvent.id, candidate.id, direction);
    if (didMatch) setMatched(candidate);
  };

  if (phase === "loading") return null;

  if (phase === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <AuthPanel onVerified={loadAfterAuth} />
      </div>
    );
  }

  if (phase === "profile" && me) {
    return (
      <Onboarding
        me={me}
        onComplete={(profile) => {
          setMe(profile);
          goToEventsOrAdd();
        }}
      />
    );
  }

  if (phase === "events") {
    return (
      <EventHome
        events={myEvents}
        onChoose={(event) => {
          setActiveEvent(event);
          setPhase("ready");
        }}
        onAddNew={() => setPhase("addEvent")}
      />
    );
  }

  if (phase === "addEvent") {
    return (
      <EventFlow
        onCancel={myEvents.length > 0 ? () => setPhase("events") : undefined}
        onComplete={(event) => {
          setActiveEvent(event);
          setPhase("ready");
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {me && <ProfileBackdrop me={me} />}

      <header className="relative z-10 px-6 py-5 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="min-w-0">
          <p className="font-mono-tag text-[11px] uppercase tracking-[0.15em] text-ink-soft truncate">
            {activeEvent?.organizer} · via {activeEvent?.platform}
          </p>
          <h1 className="font-display text-lg leading-tight truncate">{activeEvent?.name}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {me?.city && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-ink-soft">
              <MapPin className="w-3.5 h-3.5" />
              {me.city}, {me.state}
            </span>
          )}
          <button
            type="button"
            onClick={goToEventsOrAdd}
            aria-label="Switch event"
            title="Switch event"
            className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center text-ink-soft"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => signOut().then(() => setPhase("auth"))}
            aria-label="Sign out"
            className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center text-ink-soft"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {candidates ? (
          <SwipeDeck candidates={candidates} onSwipe={handleSwipe} />
        ) : (
          <p className="text-sm text-ink-soft">Finding people for this event…</p>
        )}
      </main>

      {matched && activeEvent && (
        <MatchModal
          candidate={matched}
          event={{
            id: activeEvent.id,
            name: activeEvent.name,
            organizer: activeEvent.organizer,
            platform: activeEvent.platform,
            mode: "offline",
            dateLabel: "",
          }}
          onClose={() => setMatched(null)}
        />
      )}
    </div>
  );
}
