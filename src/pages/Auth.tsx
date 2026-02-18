import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Mail, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { useLanguages } from "@/hooks/useLanguages";
import { useCreateLanguageProfile } from "@/hooks/useLanguageProfile";
import { toast } from "sonner";

// Step 1: Credentials form
// Step 2: Language picker (after new signup)

const Auth = () => {
  const [step, setStep] = useState<'credentials' | 'language'>('credentials');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [savingLang, setSavingLang] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: languages } = useLanguages();
  const createProfile = useCreateLanguageProfile();

  // If already logged in and has a language profile, go to dashboard
  useEffect(() => {
    if (user && step !== 'language') {
      navigate("/dashboard");
    }
  }, [user, step, navigate]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        toast.error(result.error.message || "Failed to sign in with Google");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message.includes("Invalid login credentials") ? "Invalid email or password" : error.message);
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) {
          toast.error(error.message.includes("already registered")
            ? "This email is already registered. Try logging in instead."
            : error.message);
        } else {
          // Go to language picker step
          setStep('language');
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLanguage = async () => {
    if (!selectedLangId) return;
    setSavingLang(true);
    try {
      await createProfile.mutateAsync(selectedLangId);
      toast.success("Great choice! Let's start learning 🎉");
      navigate("/dashboard");
    } catch {
      toast.error("Could not save your language choice. Please try again.");
    } finally {
      setSavingLang(false);
    }
  };

  // --- LANGUAGE PICKER STEP ---
  if (step === 'language') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-soft mx-auto mb-4">
              <Globe className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">What do you want to learn?</h1>
            <p className="text-muted-foreground">Choose your first language. You can add more later.</p>
          </div>

          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {languages?.map(lang => {
                const isSelected = selectedLangId === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLangId(lang.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-soft'
                        : 'border-border/50 hover:border-primary/30 bg-background'
                    }`}
                  >
                    <span className="text-3xl">{lang.flag_emoji}</span>
                    <span className="text-sm font-medium text-center leading-tight">{lang.name}</span>
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full h-12"
              disabled={!selectedLangId || savingLang}
              onClick={handleSaveLanguage}
            >
              {savingLang ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <ChevronRight className="w-5 h-5 mr-2" />
              )}
              Start Learning
            </Button>
          </div>

          <p className="text-center mt-4 text-sm text-muted-foreground">
            <button
              onClick={() => navigate("/dashboard")}
              className="hover:text-foreground transition-colors underline"
            >
              Skip for now
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --- CREDENTIALS STEP ---
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">LinguaFlow</span>
          </a>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-2xl shadow-card p-8 border border-border/50">
          <h1 className="text-2xl font-bold text-center mb-2">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isLogin
              ? "Log in to continue your learning journey"
              : "Start your language learning adventure"}
          </p>

          {/* Google Login Button */}
          <Button
            variant="outline"
            className="w-full mb-4 h-12"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full h-12" variant="default" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Mail className="w-5 h-5 mr-2" />
              )}
              {isLogin ? "Log In" : "Create Account"}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center mt-6 text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors">← Back to home</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
