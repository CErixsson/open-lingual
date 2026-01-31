import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const languages = [
  { code: "es", name: "Spanish", flag: "🇪🇸", learners: "450K", native: "Hola" },
  { code: "fr", name: "French", flag: "🇫🇷", learners: "380K", native: "Bonjour" },
  { code: "de", name: "German", flag: "🇩🇪", learners: "290K", native: "Hallo" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", learners: "320K", native: "こんにちは" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", learners: "410K", native: "你好" },
  { code: "ko", name: "Korean", flag: "🇰🇷", learners: "280K", native: "안녕하세요" },
  { code: "it", name: "Italian", flag: "🇮🇹", learners: "220K", native: "Ciao" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", learners: "190K", native: "Olá" },
  { code: "ru", name: "Russian", flag: "🇷🇺", learners: "180K", native: "Привет" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", learners: "150K", native: "مرحبا" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", learners: "170K", native: "नमस्ते" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", learners: "95K", native: "Hallo" },
];

const LanguageGrid = () => {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  return (
    <section className="py-24 bg-muted/50">
      <div className="container px-4 mx-auto">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Choose Your
            <span className="text-gradient block mt-1">Language Journey</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with any of our 50+ languages and begin your adventure today.
          </p>
        </div>

        {/* Language grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
                selectedLang === lang.code
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-card shadow-soft hover:shadow-card"
              }`}
            >
              {selectedLang === lang.code && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="text-4xl mb-3">{lang.flag}</div>
              <div className="font-bold mb-1">{lang.name}</div>
              <div className={`text-sm ${selectedLang === lang.code ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {lang.learners} learners
              </div>
              <div className={`text-lg font-medium mt-2 ${selectedLang === lang.code ? "text-primary-foreground/90" : "text-primary"}`}>
                {lang.native}
              </div>
            </button>
          ))}
        </div>

        {/* More languages */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ...and 38 more languages available
          </p>
          <Button variant="outline" size="lg">
            View All Languages
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LanguageGrid;
