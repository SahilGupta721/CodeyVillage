import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codey Village",
  description: "Code your way to a mansion. Earn coins. Build your village.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
