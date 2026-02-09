import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import Header from '@/components/Header';
import RoleSwitcher from '@/components/shared/RoleSwitcher';
import SkeletonCard from '@/components/shared/SkeletonCard';
import LearnDashboard from '@/pages/dashboard/LearnDashboard';
import AuthorDashboard from '@/pages/dashboard/AuthorDashboard';
import ReviewDashboard from '@/pages/dashboard/ReviewDashboard';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleOrder: AppRole[] = ['learner', 'author', 'reviewer', 'admin'];

export default function DashboardRouter() {
  const navigate = useNavigate();
  const { user, status, roles } = useAuth();
  const { t } = useI18n();
  const [activeRole, setActiveRole] = useState<AppRole>('learner');

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') navigate('/auth');
  }, [status, navigate]);

  // Set initial active role based on user's roles
  useEffect(() => {
    if (roles.length > 0) {
      const sorted = roleOrder.filter(r => roles.includes(r));
      if (sorted.length > 0 && !roles.includes(activeRole)) {
        setActiveRole(sorted[0]);
      }
    }
  }, [roles, activeRole]);

  // Loading state
  if (status === 'loading' || (status === 'authenticated' && roles.length === 0)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl space-y-6">
          <SkeletonCard lines={2} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard lines={4} />
        </main>
      </div>
    );
  }

  const sortedRoles = roleOrder.filter(r => roles.includes(r));

  const renderDashboard = () => {
    switch (activeRole) {
      case 'learner':
        return <LearnDashboard />;
      case 'author':
        return <AuthorDashboard />;
      case 'reviewer':
        return <ReviewDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <LearnDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl space-y-6">
        {/* Role switcher */}
        {sortedRoles.length > 1 && (
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
            <RoleSwitcher
              roles={sortedRoles}
              activeRole={activeRole}
              onRoleChange={setActiveRole}
            />
          </div>
        )}

        {/* Active dashboard */}
        {renderDashboard()}
      </main>
    </div>
  );
}
