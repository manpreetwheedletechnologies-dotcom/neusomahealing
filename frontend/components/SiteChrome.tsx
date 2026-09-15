"use client";

import { usePathname } from "next/navigation";

import { Header } from "@/components/Header";
import { FinalCta } from "@/components/FinalCta";
import { SiteFooter } from "@/components/SiteFooter";
import ChatWidget from "@/components/ChatWidget";

export function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  // Admin pages par sirf admin content
  if (isAdmin) {
    return <>{children}</>;
  }

  // Normal website pages
  return (
    <>
      <Header />

      {/* Main page content */}
      {children}

      {/* Footer area */}
      <FinalCta />
      <SiteFooter />

      {/* Floating chatbot */}
      <ChatWidget />
    </>
  );
}