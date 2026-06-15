import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { CodeShowcase } from "@/components/CodeShowcase";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CodeShowcase />
      <Footer />
    </main>
  );
}
