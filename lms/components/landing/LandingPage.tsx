import { allLandingStyles } from "./styles";
import { LandingInit } from "./LandingInit";
import { LandingScrollbar } from "./sections/LandingScrollbar";
import { LandingHeader } from "./sections/LandingHeader";
import { LandingHero } from "./sections/LandingHero";
import { LandingFeatures } from "./sections/LandingFeatures";
import { LandingHowItWorks } from "./sections/LandingHowItWorks";
import { LandingPlatform } from "./sections/LandingPlatform";
import { LandingCTA } from "./sections/LandingCTA";
import { LandingFooter } from "./sections/LandingFooter";
export function LandingPage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: allLandingStyles }} />

      <LandingScrollbar />
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingPlatform />
      <LandingCTA />
      <LandingFooter />

      {/* Loads Lucide icons + runs scroll/animation scripts on the client */}
      <LandingInit />
    </>
  );
}
