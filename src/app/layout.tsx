import type { Metadata } from "next";
import "@crayonai/react-ui/styles/index.css";
import "./globals.css";
import "./overrides.css";

export const metadata: Metadata = {
  title: "Tool Router + Compact Demo",
  description:
    "Flight & hotel booking agent with tool routing and conversation compaction",
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
