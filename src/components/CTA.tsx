import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Start Your Journey Today</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Ready to Speak a
            <span className="text-gradient block mt-2">New Language?</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join millions of learners who are already on their path to fluency. 
            It's free, fun, and only takes 5 minutes a day.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground">
              No credit card required
            </p>
          </div>

          {/* Testimonial preview */}
          <div className="mt-16 p-6 rounded-2xl bg-card shadow-card max-w-lg mx-auto">
            <div className="flex items-center gap-1 text-secondary mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <p className="text-foreground mb-4">
              "I went from knowing nothing to having basic conversations in Spanish in just 3 months. 
              The gamification keeps me coming back every day!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                M
              </div>
              <div className="text-left">
                <div className="font-medium">Maria S.</div>
                <div className="text-sm text-muted-foreground">Learning Spanish • 127 day streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
