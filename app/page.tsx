import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  AIComparisonSection,
  AIInsightsSection,
  AISearchSection,
  BuilderShowcaseSection,
  CTASection,
  FeaturedProjectsSection,
  HeroSection,
  InvestmentIntelligenceSection,
  LocalityDiscoverySection,
  WhyPropAISection,
} from "@/components/home";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <AISearchSection />
        <FeaturedProjectsSection />
        <LocalityDiscoverySection />
        <AIInsightsSection />
        <BuilderShowcaseSection />
        <AIComparisonSection />
        <InvestmentIntelligenceSection />
        <WhyPropAISection />
        <CTASection />
      </main>
      <SiteFooter />
    </>
  );
}
