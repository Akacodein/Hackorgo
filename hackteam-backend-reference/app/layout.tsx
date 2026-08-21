export const metadata = {
  title: "Jabo API",
  description: "Backend for the Jabo teammate-matching app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
