export const metadata = {
  title: "Crew API",
  description: "Backend for the Crew teammate-matching app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
