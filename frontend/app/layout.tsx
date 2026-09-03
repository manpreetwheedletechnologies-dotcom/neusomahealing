import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import { Preloader } from "@/components/Preloader";

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
        <Preloader /> 
        
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
