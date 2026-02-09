import { useState } from 'react';
import { useI18n } from '@/i18n';
import { useLessonsByStatus } from '@/hooks/useLessons';
import { usePendingSubmissions } from '@/hooks/useSubmissions';
import ErrorPanel from '@/components/shared/ErrorPanel';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield, Users, BookOpen, BarChart3, Search,
  Plus, Trash2, Loader2, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type AppRole = Database['public']['Enums']['app_role'];
const ALL_ROLES: AppRole[] = ['learner', 'author', 'reviewer', 'admin'];

interface FoundUser {
  id: string;
  display_name: string | null;
  email?: string;
  roles: AppRole[];
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const { data: allLessons, isLoading: lessonsLoading, error: lessonsError, refetch: refetchLessons } = useLessonsByStatus();
  const { data: pendingSubmissions } = usePendingSubmissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>('author');
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  // Mocked DAU/WAU
  const dau = 42;
  const wau = 187;

  // Lesson counts by status
  const statusCounts = {
    draft: allLessons?.filter(l => l.status === 'draft').length ?? 0,
    in_review: allLessons?.filter(l => l.status === 'in_review').length ?? 0,
    approved: allLessons?.filter(l => l.status === 'approved').length ?? 0,
    published: allLessons?.filter(l => l.status === 'published').length ?? 0,
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .ilike('display_name', `%${searchQuery.trim()}%`)
        .limit(10);
      if (error) throw error;

      const results: FoundUser[] = [];
      for (const profile of data || []) {
        const { data: roles } = await supabase.rpc('get_user_roles', { _user_id: profile.user_id });
        results.push({
          id: profile.user_id,
          display_name: profile.display_name,
          roles: (roles as AppRole[]) || [],
        });
      }
      setSearchResults(results);
    } catch (e) {
      console.error('Search failed:', e);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAssignRole = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: selectedRole });
      if (error) throw error;
      toast.success(`Role "${selectedRole}" assigned!`);
      // Refresh search results
      handleSearch();
    } catch (e: any) {
      if (e.code === '23505') {
        toast.error('User already has this role');
      } else {
        toast.error('Failed to assign role');
      }
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;
      toast.success(`Role "${role}" removed!`);
      handleSearch();
    } catch {
      toast.error('Failed to remove role');
    } finally {
      setProcessingUser(null);
    }
  };

  if (lessonsError) return <ErrorPanel onRetry={refetchLessons} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <section aria-label={t('dashboard.admin.metrics')}>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          {t('dashboard.admin.metrics')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold tabular-nums text-primary">{dau}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.admin.dau')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold tabular-nums text-secondary">{wau}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.admin.wau')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold tabular-nums">{allLessons?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.admin.totalLessons')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold tabular-nums text-accent">{pendingSubmissions?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.admin.pendingReviews')}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Lessons by status */}
      <section aria-label={t('dashboard.admin.lessonsByStatus')}>
        <h3 className="text-lg font-semibold mb-3">{t('dashboard.admin.lessonsByStatus')}</h3>
        {lessonsLoading ? (
          <SkeletonCard lines={2} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Card key={status}>
                <CardContent className="pt-4 pb-3 flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">{status.replace('_', ' ')}</Badge>
                  <span className="text-xl font-bold tabular-nums">{count}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* User management */}
      <section aria-label={t('dashboard.admin.userManagement')}>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          {t('dashboard.admin.userManagement')}
        </h2>
        <Card>
          <CardContent className="pt-5 pb-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={t('dashboard.admin.searchByEmail')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                aria-label="Search users"
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((u) => (
                  <div key={u.id} className="rounded-xl border border-border/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{u.display_name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {u.roles.map(r => (
                          <Badge key={r} variant="secondary" className="text-xs gap-1">
                            {r}
                            <button
                              onClick={() => handleRemoveRole(u.id, r)}
                              className="hover:text-destructive ml-0.5"
                              aria-label={`Remove ${r} role`}
                              disabled={processingUser === u.id}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                        <SelectTrigger className="w-32 h-8" aria-label="Select role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignRole(u.id)}
                        disabled={processingUser === u.id}
                        aria-label={t('dashboard.admin.assignRole')}
                      >
                        {processingUser === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        {t('dashboard.admin.assignRole')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Content health */}
      <section aria-label={t('dashboard.admin.contentHealth')}>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-secondary" />
          {t('dashboard.admin.contentHealth')}
        </h2>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">Lessons without exercises</span>
                <Badge variant={allLessons?.filter(l => !l.exercises || (l.exercises as any[]).length === 0).length ? 'destructive' : 'outline'}>
                  {allLessons?.filter(l => !l.exercises || (l.exercises as any[]).length === 0).length ?? 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">Lessons missing description</span>
                <Badge variant={allLessons?.filter(l => !l.description).length ? 'secondary' : 'outline'}>
                  {allLessons?.filter(l => !l.description).length ?? 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Stale drafts (no update in 30+ days)</span>
                <Badge variant="outline">
                  {allLessons?.filter(l => {
                    if (l.status !== 'draft') return false;
                    const diff = Date.now() - new Date(l.updated_at).getTime();
                    return diff > 30 * 24 * 60 * 60 * 1000;
                  }).length ?? 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
