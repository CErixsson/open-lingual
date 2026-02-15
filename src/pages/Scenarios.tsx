import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useScenarios, useScenarioPacks, useScenarioProgress } from '@/hooks/useScenarios';
import { useUserLanguageProfiles } from '@/hooks/useLanguageProfile';
import Header from '@/components/Header';
import EmptyState from '@/components/shared/EmptyState';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageCircle, Lock, CheckCircle2, Star,
  Briefcase, Plane, Users, Mic, Crown,
  Package,
} from 'lucide-react';

const TOPIC_ICONS: Record<string, any> = {
  travel: Plane, work: Briefcase, social: Users, general: MessageCircle,
  debate: Mic, interview: Briefcase, slang: Star,
};

export default function ScenariosPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profiles, isLoading: profilesLoading } = useUserLanguageProfiles();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const languageId = selectedLang || profiles?.[0]?.language_id || null;
  const { data: scenarios, isLoading: scenariosLoading } = useScenarios(languageId);
  const { data: packs } = useScenarioPacks(languageId);
  const { data: progress } = useScenarioProgress();

  if (!loading && !user) {
    navigate('/auth');
    return null;
  }

  const getProgress = (scenarioId: string) =>
    progress?.find(p => p.scenario_id === scenarioId);

  // Group scenarios by pack
  const packedScenarios = new Map<string | null, any[]>();
  (scenarios || []).forEach(s => {
    const key = s.pack_id || null;
    if (!packedScenarios.has(key)) packedScenarios.set(key, []);
    packedScenarios.get(key)!.push(s);
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scenarios</h1>
            <p className="text-sm text-muted-foreground">Practice conversations in real-world situations</p>
          </div>
          {profiles && profiles.length > 1 && (
            <Select value={languageId || ''} onValueChange={setSelectedLang}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.language_id} value={p.language_id}>
                    {(p.languages as any)?.flag_emoji} {(p.languages as any)?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {scenariosLoading || profilesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : !scenarios?.length ? (
          <EmptyState
            icon={MessageCircle}
            title="No scenarios available"
            description="Scenarios will appear here once they're created for your language."
          />
        ) : (
          <>
            {/* Packs overview */}
            {packs && packs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {packs.map(pack => {
                  const packProfile = profiles?.find(p => p.language_id === languageId);
                  const isLocked = pack.is_premium || (packProfile && packProfile.overall_elo < pack.rating_threshold);
                  return (
                    <Card key={pack.id} className={`${isLocked ? 'opacity-60' : ''}`}>
                      <CardContent className="pt-4 pb-3 text-center">
                        {isLocked ? (
                          <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        ) : pack.is_premium ? (
                          <Crown className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                        ) : (
                          <Package className="w-8 h-8 mx-auto text-primary mb-2" />
                        )}
                        <p className="font-semibold text-sm">{pack.title}</p>
                        {pack.rating_threshold > 0 && (
                          <p className="text-xs text-muted-foreground">Unlock at {pack.rating_threshold} ELO</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Scenarios grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(scenarios || []).map(scenario => {
                const prog = getProgress(scenario.id);
                const TopicIcon = TOPIC_ICONS[scenario.topic] || MessageCircle;
                return (
                  <Card
                    key={scenario.id}
                    className="hover:shadow-card transition-shadow cursor-pointer group"
                    onClick={() => navigate(`/scenarios/${scenario.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TopicIcon className="w-4 h-4 text-primary" />
                          <Badge variant="outline" className="text-xs">{scenario.cefr_target}</Badge>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">{scenario.topic}</Badge>
                      </div>
                      <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors">
                        {scenario.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scenario.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{scenario.description}</p>
                      )}
                      {/* Mode progress */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs ${prog?.controlled_completed ? 'text-primary' : 'text-muted-foreground'}`}>
                            {prog?.controlled_completed ? <CheckCircle2 className="w-3 h-3 inline" /> : '○'} Controlled
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs ${prog?.guided_completed ? 'text-primary' : 'text-muted-foreground'}`}>
                            {prog?.guided_completed ? <CheckCircle2 className="w-3 h-3 inline" /> : prog?.mode_unlocked === 'guided' || prog?.mode_unlocked === 'open' ? '○' : <Lock className="w-3 h-3 inline" />} Guided
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs ${prog?.open_completed ? 'text-primary' : 'text-muted-foreground'}`}>
                            {prog?.open_completed ? <CheckCircle2 className="w-3 h-3 inline" /> : prog?.mode_unlocked === 'open' ? '○' : <Lock className="w-3 h-3 inline" />} Open
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
