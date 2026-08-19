import { useEffect, useState } from "react";
import { MapPin, ArrowLeftRight, MessageCircle } from "lucide-react";
import AuthPanel from "./components/AuthPanel";
import Onboarding from "./components/Onboarding";
import EventHome from "./components/EventHome";
import EventFlow from "./components/EventFlow";
import InviteLanding from "./components/InviteLanding";
import ProfilePage from "./components/ProfilePage";
import ProfileDetailsForm from "./components/ProfileDetailsForm";
import HeaderProfileMenu from "./components/HeaderProfileMenu";
import ChatInbox from "./components/ChatInbox";
import ChatThread from "./components/ChatThread";
import ProfileBackdrop from "./components/ProfileBackdrop";
import SwipeDeck from "./components/SwipeDeck";
import MatchModal from "./components/MatchModal";
import { fetchCandidates, recordSwipe, getMyProfile, getMyEvents, getPublicEvent, getMyParticipation } from "./lib/eventsApi";
import { getSession, signOut, consumeTokenFromUrl } from "./lib/authClient";
import type { EventOption, MatchSummary, MyProfile, ScoredCandidate, SwipeDirection } from "./types";

type Phase = "loading" | "inviteLanding" | "auth" | "profile" | "events" | "addEvent" | "ready";
type Overlay = null | "profileView" | "profileEdit" | "chatInbox" | { type: "chatThread"; match: MatchSummary };

function readInviteIdFromUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get("invite");
  return id && id.trim() ? id.trim() : null;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<MyProfile | null>(null);
  const [myEvents, setMyEvents] = useState<Array<EventOption & { lookingFor: string[] }>>([]);
  const [candidates, setCandidates] = useState<ScoredCandidate[] | null>(null);
  const [matched, setMatched] = useState<ScoredCandidate | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [inviteEventId, setInviteEventId] = useState<string | null>(() => readInviteIdFromUrl());
  const [preselectedEventForFlow, setPreselectedEventForFlow] = useState<EventOption | undefined>(undefined);

  // Clean the ?invite= param out of the URL once we've read it, so a
  // refresh later doesn't keep re-triggering invite handling.
  useEffect(() => {
    if (inviteEventId) window.history.replaceState({}, "", window.location.pathname);
  }, [inviteEventId]);

  const goToEventsOrAdd = async () => {
    const events = await getMyEvents();
    setMyEvents(events);
    if (events.length === 0) setPhase("addEvent");
    else setPhase("events");
  };

  // If someone arrived via a shared invite link, make sure they're
  // listed for that event (joining it if needed), then drop them into
  // the universal feed — that event will now rank at the top of it,
  // which is the whole point of the link being low-friction.
  const resolveInviteOrGoHome = async () => {
    if (inviteEventId) {
      const invited = await getPublicEvent(inviteEventId);
      setInviteEventId(null);
      if (invited) {
        const participation = await getMyParticipation(invited.id);
        if (participation.exists) {
          setPhase("ready");
          return;
        }
        setPreselectedEventForFlow(invited);
        setPhase("addEvent");
        return;
      }
    }
    setPhase("ready");
  };

  const loadAfterAuth = async () => {
    try {
      const profile = await getMyProfile();
      setMe(profile);
      if (!profile.profileComplete) setPhase("profile");
      else {
        // Still need at least one event listing for the feed to have any
        // "this is mine" priority to work with.
        const events = await getMyEvents();
        setMyEvents(events);
        if (events.length === 0 && !inviteEventId) setPhase("addEvent");
        else await resolveInviteOrGoHome();
      }
    } catch {
      // Stored token turned out to be invalid/expired — authedFetch
      // already cleared it. Don't leave the screen blank, just ask
      // them to sign in again instead of failing silently.
      setPhase(inviteEventId ? "inviteLanding" : "auth");
    }
  };

  useEffect(() => {
    // Google/GitHub land back here with ?token=... on the URL — grab it
    // before checking whether anyone's signed in.
    consumeTokenFromUrl();
    getSession().then((s) => {
      if (s?.user) loadAfterAuth();
      else setPhase(inviteEventId ? "inviteLanding" : "auth");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Universal feed: fetch once per time we land on "ready" — no eventId
  // needed anymore, the backend ranks by whatever I'm listed for.
  useEffect(() => {
    if (phase !== "ready") return;
    setCandidates(null);
    fetchCandidates().then(setCandidates);
  }, [phase]);

  const handleSwipe = async (candidate: ScoredCandidate, direction: SwipeDirection) => {
    const { matched: didMatch } = await recordSwipe(candidate.eventId, candidate.id, direction);
    if (didMatch) setMatched(candidate);
  };

  if (phase === "loading") return null;

  if (phase === "inviteLanding" && inviteEventId) {
    return <InviteLanding eventId={inviteEventId} onContinue={() => setPhase("auth")} />;
  }

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
          setPhase("addEvent");
        }}
      />
    );
  }

  if (phase === "events") {
    return (
      <EventHome
        events={myEvents}
        onDone={() => setPhase("ready")}
        onAddNew={() => {
          setPreselectedEventForFlow(undefined);
          setPhase("addEvent");
        }}
      />
    );
  }

  if (phase === "addEvent") {
    return (
      <EventFlow
        preselectedEvent={preselectedEventForFlow}
        onCancel={myEvents.length > 0 ? () => setPhase("events") : undefined}
        onComplete={() => {
          setPreselectedEventForFlow(undefined);
          resolveInviteOrGoHome();
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {me && <ProfileBackdrop me={me} />}

      <header className="relative z-50 px-6 py-5 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md">
        <h1 className="archivo-black text-4xl leading-tight">Jabo</h1>
        <div className="flex items-center gap-2.5 shrink-0">
          {me?.city && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-ink-soft mr-1">
              <MapPin className="w-3.5 h-3.5" />
              {me.city}, {me.state}
            </span>
          )}
          <button
            type="button"
            onClick={goToEventsOrAdd}
            aria-label="Manage your events"
            title="Manage your events"
            className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center text-ink-soft"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setOverlay("chatInbox")}
            aria-label="Messages"
            title="Messages"
            className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center text-ink-soft"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <HeaderProfileMenu
            me={me}
            onViewProfile={() => setOverlay("profileView")}
            onEditDetails={() => setOverlay("profileEdit")}
            onSignOut={() => signOut().then(() => setPhase("auth"))}
          />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {candidates ? (
          <SwipeDeck candidates={candidates} onSwipe={handleSwipe} />
        ) : (
          <p className="text-sm text-ink-soft">Finding people to swipe through…</p>
        )}
      </main>

      {matched && (
        <MatchModal
          candidate={matched}
          event={{
            id: matched.eventId,
            name: matched.eventName,
            organizer: matched.eventOrganizer,
            platform: matched.eventPlatform,
            mode: "offline",
            dateLabel: "",
          }}
          onClose={() => setMatched(null)}
        />
      )}

      {overlay === "profileView" && me && (
        <ProfilePage me={me} onEdit={() => setOverlay("profileEdit")} onBack={() => setOverlay(null)} />
      )}
      {overlay === "profileEdit" && me && (
        <ProfileDetailsForm
          me={me}
          onSaved={(profile) => {
            setMe(profile);
            setOverlay("profileView");
          }}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "chatInbox" && (
        <ChatInbox
          onOpenThread={(match) => setOverlay({ type: "chatThread", match })}
          onClose={() => setOverlay(null)}
        />
      )}
      {typeof overlay === "object" && overlay?.type === "chatThread" && (
        <ChatThread match={overlay.match} onBack={() => setOverlay("chatInbox")} />
      )}
    </div>
  );
}
