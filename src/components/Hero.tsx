import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
      
      {/* Floating language symbols */}
      <div className="absolute top-32 right-[15%] text-6xl animate-float opacity-20">あ</div>
      <div className="absolute top-48 left-[12%] text-5xl animate-float-delayed opacity-20">ñ</div>
      <div className="absolute bottom-40 right-[25%] text-4xl animate-float opacity-20">中</div>
      <div className="absolute bottom-32 left-[20%] text-5xl animate-float-delayed opacity-20">ß</div>
      
      <div className="container relative z-10 px-4 pt-32 pb-20 mx-auto">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Open Source Language Learning</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Learn Languages
            <span className="block text-gradient mt-2">The Natural Way</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Master any language with bite-sized lessons, interactive exercises, and a 
            supportive community. Free, open-source, and built for everyone.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl">
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 md:gap-16 mt-16 pt-16 border-t border-border/50 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground">1M+</div>
              <div className="text-sm text-muted-foreground mt-1">Learners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground mt-1">Free Forever</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
