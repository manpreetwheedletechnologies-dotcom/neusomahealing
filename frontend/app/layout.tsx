import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeusomaHealing Practice | Heal. Regulate. Transform.",
  description:
    "Compassionate, trauma-informed coaching to help you understand emotional patterns, regulate your inner world and create meaningful transformation."
};

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        
        {children}
      </body>
    </html>
  );
}
