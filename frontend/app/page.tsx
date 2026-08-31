import { Header } from "@/components/Header";
import { Hero } from "../components/Hero";
import { PauseSection } from "../components/PauseSection";
import { PatternsSection } from "../components/PatternsSection";
import { NotBrokenSection } from "../components/NotBrokenSection";
import { FrameworkSection } from "../components/FrameworkSection";
import { JourneySection } from "../components/JourneySection";
import { CoachingSection } from "../components/CoachingSection";
import { VideosSection } from "../components/VideosSection";
import { TestimonialsSection } from "../components/TestimonialsSection";
import { FinalCta } from "../components/FinalCta";
import { SiteFooter } from "../components/SiteFooter";
import { ScrollReveal } from "../components/ScrollReveal";

export default function Home() {
  return (
    <main className="bg-paper font-sans text-ink">
      <Header />
      <Hero />

      <ScrollReveal direction="up">
        <PauseSection />
      </ScrollReveal>

      <ScrollReveal direction="left">
        <PatternsSection />
      </ScrollReveal>

      <ScrollReveal direction="right">
        <NotBrokenSection />
      </ScrollReveal>

      <ScrollReveal direction="up">
        <FrameworkSection />
      </ScrollReveal>

      <ScrollReveal direction="left">
        <JourneySection />
      </ScrollReveal>

      <ScrollReveal direction="right">
        <CoachingSection />
      </ScrollReveal>

      <ScrollReveal direction="up">
        <VideosSection />
      </ScrollReveal>

      <ScrollReveal direction="left">
        <TestimonialsSection />
      </ScrollReveal>

      <ScrollReveal direction="up">
        <FinalCta />
      </ScrollReveal>

      <SiteFooter />
    </main>
  );
}