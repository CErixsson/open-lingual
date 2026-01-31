import { BookOpen, Brain, Globe2, MessageCircle, Target, Trophy, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Learning",
    description: "AI-powered lessons adapt to your pace and learning style for maximum retention.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Target,
    title: "Bite-sized Lessons",
    description: "Learn in just 5 minutes a day with focused, effective micro-lessons.",
    color: "bg-secondary/20 text-secondary-foreground",
  },
  {
    icon: MessageCircle,
    title: "Conversation Practice",
    description: "Practice real conversations with AI tutors and native speakers.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Trophy,
    title: "Gamified Progress",
    description: "Earn XP, unlock achievements, and compete on leaderboards.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Users,
    title: "Community",
    description: "Join study groups, find language partners, and learn together.",
    color: "bg-secondary/20 text-secondary-foreground",
  },
  {
    icon: BookOpen,
    title: "Rich Content",
    description: "Stories, podcasts, and videos to immerse yourself in the language.",
    color: "bg-accent/10 text-accent",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary-foreground mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need to
            <span className="text-gradient block mt-1">Master Any Language</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From vocabulary to fluency, we've got the tools to take you there.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-card shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Open source banner */}
        <div className="mt-20 p-8 md:p-12 rounded-3xl gradient-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Globe2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">100% Open Source</h3>
                <p className="text-primary-foreground/80">Built by the community, for the community</p>
              </div>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
