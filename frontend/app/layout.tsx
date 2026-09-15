import type { Metadata } from "next";
import "./globals.css";
import { PreloaderGate } from "@/components/PreloaderGate";
import { SiteChrome } from "@/components/SiteChrome";
import { UserAuthProvider } from "@/components/UserAuthProvider";

export const metadata: Metadata = {
  title: "NeusomaHealing Practice | Heal. Regulate. Transform.",
  description:
    "Compassionate, trauma-informed coaching to help you understand emotional patterns, regulate your inner world and create meaningful transformation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <UserAuthProvider>
          <PreloaderGate>
            <SiteChrome>
              {children}
            </SiteChrome>
          </PreloaderGate>
        </UserAuthProvider>
      </body>
    </html>
  );
}