import { Globe, Github, Twitter, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LinguaFlow</span>
            </a>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
              Free, open-source language learning for everyone. Built with love by learners, for learners.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Features</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Languages</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Mobile Apps</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Browser Extension</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-bold mb-4">Community</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Discord</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Forums</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Contribute</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Leaderboard</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">API</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Status</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/50">
            © 2024 LinguaFlow. Open source under MIT License.
          </p>
          <p className="text-sm text-primary-foreground/50 flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-accent" /> by the community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
