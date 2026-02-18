import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, LogOut, User, Languages } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, type Locale } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  sv: 'Svenska',
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">DialectDrift</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.dashboard')}
                </Link>
                <Link to="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.leaderboard')}
                </Link>
                <Link to="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.courses')}
                </Link>
              </>
            ) : (
              <>
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.features')}
                </a>
                <a href="#languages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.languages')}
                </a>
              </>
            )}
            <a href="https://github.com/CErixsson/open-dialectdrift" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Change language">
                  <Languages className="w-4 h-4 mr-1" />
                  {locale.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(localeLabels) as Locale[]).map((l) => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => setLocale(l)}
                    className={locale === l ? 'font-semibold' : ''}
                  >
                    {localeLabels[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
                  <User className="w-4 h-4" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
                <Button variant="ghost" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('nav.logOut')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">{t('nav.logIn')}</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="default">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                    {t('nav.dashboard')}
                  </Link>
                  <Link to="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                    {t('nav.leaderboard')}
                  </Link>
                  <Link to="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                    {t('nav.courses')}
                  </Link>
                </>
              ) : (
                <>
                  <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                    {t('nav.features')}
                  </a>
                  <a href="#languages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                    {t('nav.languages')}
                  </a>
                </>
              )}

              {/* Mobile language switcher */}
              <div className="flex gap-2 px-2 py-2">
                {(Object.keys(localeLabels) as Locale[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={`text-xs px-2 py-1 rounded ${locale === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {localeLabels[l]}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.logOut')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="ghost" className="justify-start w-full">{t('nav.logIn')}</Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="default" className="w-full">{t('nav.register')}</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
