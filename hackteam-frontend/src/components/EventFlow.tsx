import { useState } from "react";
import type { EventOption } from "../types";
import { createEvent, setMyParticipation } from "../lib/eventsApi";
import EventPicker from "./EventPicker";
import SkillsInput from "./SkillsInput";

export default function EventFlow({
  preselectedEvent,
  onComplete,
  onCancel,
}: {
  preselectedEvent?: EventOption;
  onComplete: (event: EventOption) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<"event" | "looking">(preselectedEvent ? "looking" : "event");
  const [event, setEvent] = useState<EventOption | null>(preselectedEvent ?? null);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseEvent = async (input: { name: string; organizer: string; link: string }) => {
    setError(null);
    setSaving(true);
    try {
      const created = await createEvent(input);
      setEvent(created);
      setStep("looking");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that event.");
    } finally {
      setSaving(false);
    }
  };

  const submitLookingFor = async () => {
    if (!event) return;
    setError(null);
    if (lookingFor.length === 0) return setError("Pick at least one thing you're looking for.");

    setSaving(true);
    try {
      await setMyParticipation(event.id, lookingFor);
      onComplete(event);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {!preselectedEvent && (
          <div className="flex gap-1.5 mb-6" aria-hidden>
            <div className="h-1.5 flex-1 rounded-full bg-brand" />
            <div className={`h-1.5 flex-1 rounded-full ${step === "looking" ? "bg-brand" : "bg-border"}`} />
          </div>
        )}

        {step === "event" ? (
          <>
            <h1 className="font-display text-2xl mb-1">Which event?</h1>
            <p className="text-sm text-ink-soft mb-6">
              Search for it, or add it with a link if it's not here yet — any platform works.
            </p>

            <EventPicker
              selected={event}
              onSelect={setEvent}
              onAddNew={chooseEvent}
              onClear={() => setEvent(null)}
            />

            {event && (
              <button
                type="button"
                onClick={() => setStep("looking")}
                className="w-full mt-5 rounded-xl bg-brand text-brand-ink py-3 font-medium"
              >
                Continue
              </button>
            )}

            {error && <p className="text-sm text-match mt-4">{error}</p>}
            {saving && <p className="text-sm text-ink-soft mt-4">Adding…</p>}

            {onCancel && (
              <button type="button" onClick={onCancel} className="w-full mt-3 text-sm text-ink-soft py-1">
                Back
              </button>
            )}
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl mb-1">One more thing</h1>
            <p className="text-sm text-ink-soft mb-1">You're finding teammates for:</p>
            <p className="font-display text-lg mb-6">
              {event?.name}{" "}
              <span className="text-ink-soft text-sm font-body">
                · {event?.organizer} · via {event?.platform}
              </span>
            </p>

            <div className="mb-6">
              <SkillsInput
                label="What are you looking for in a teammate?"
                value={lookingFor}
                onChange={setLookingFor}
              />
            </div>

            {error && <p className="text-sm text-match mb-4">{error}</p>}

            <button
              type="button"
              disabled={saving}
              onClick={submitLookingFor}
              className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium disabled:opacity-50 mb-3"
            >
              {saving ? "Saving…" : "Find teammates"}
            </button>
            {!preselectedEvent && (
              <button type="button" onClick={() => setStep("event")} className="w-full text-sm text-ink-soft py-1">
                Back
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
