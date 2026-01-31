import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import LanguageGrid from "@/components/LanguageGrid";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <section id="features">
          <Features />
        </section>
        <section id="languages">
          <LanguageGrid />
        </section>
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
