import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cozy Village",
  description: "A cozy top-down multiplayer island village",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body style={{ margin: 0, padding: 0, height: "100%", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
