export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <p>Crew API is running.</p>
      <p>Endpoints: /api/auth/*, /api/candidates, /api/events/[eventId]/swipe</p>
    </main>
  );
}
