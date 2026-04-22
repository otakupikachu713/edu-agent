import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduAgent",
  description: "A local-first AI learning assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-transparent antialiased">{children}</body>
    </html>
  );
}