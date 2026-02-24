import type { Metadata } from "next";
import "@crayonai/react-ui/styles/index.css";
import "./globals.css";
import "./overrides.css";

export const metadata: Metadata = {
  title: "Voice Generative UI",
  description:
    "Voice AI agent with real-time generative UI powered by LiveKit and Thesys",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
