import "./globals.css";

export const metadata = {
  title: "ADHD-Timebox | Plan Less, Start Faster",
  description:
    "ADHD-Timebox is an AI-guided desktop app that helps you turn messy thoughts into focused timeboxes with planning, focus protection, thought parking, and gentle reviews.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
