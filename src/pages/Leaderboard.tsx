import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages } from '@/hooks/useLanguages';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import Header from '@/components/Header';
import LanguageSelector from '@/components/elo/LanguageSelector';
import { mapEloToCefr, getCefrColor } from '@/lib/elo';
import { Trophy, Medal, Loader2 } from 'lucide-react';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null); // uses language code now

  const { data: languages } = useLanguages();
  const { data: entries, isLoading } = useLeaderboard(selectedLanguageId);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (languages?.length && !selectedLanguageId) {
      setSelectedLanguageId(languages[0].code);
    }
  }, [languages, selectedLanguageId]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-secondary" />;
    if (rank <= 3) return <Medal className="w-5 h-5 text-muted-foreground" />;
    return <span className="w-5 text-center text-sm font-bold text-muted-foreground tabular-nums">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-secondary" />
            Leaderboard
          </h1>
          <LanguageSelector
            languages={languages || []}
            selectedId={selectedLanguageId}
            onSelect={setSelectedLanguageId}
          />
        </div>

        <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries?.length ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 w-12">#</th>
                  <th className="p-4">Spelare</th>
                  <th className="p-4 text-right">Rating</th>
                  <th className="p-4 text-right">CEFR</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const cefr = entry.cefr || mapEloToCefr(entry.rating);
                  const cefrColor = getCefrColor(cefr);
                  const isMe = entry.userId === user?.id;

                  return (
                    <tr
                      key={entry.rank}
                      className={`border-b border-border/30 last:border-0 transition-colors ${
                        isMe ? 'bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <td className="p-4">{getRankIcon(entry.rank)}</td>
                      <td className="p-4">
                        <span className={`font-medium ${isMe ? 'text-primary' : ''}`}>
                          {entry.displayName || 'Anonym'}
                          {isMe && <span className="text-xs ml-2 text-primary">(du)</span>}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold tabular-nums">{entry.rating}</span>
                        {entry.rd > 100 && (
                          <span className="text-xs text-muted-foreground ml-1">±{entry.rd}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `hsl(${cefrColor} / 0.15)`,
                            color: `hsl(${cefrColor})`,
                          }}
                        >
                          {cefr}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Inga spelare på leaderboard ännu. Var först!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
