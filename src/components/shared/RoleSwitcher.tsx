import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/i18n';
import type { Database } from '@/integrations/supabase/types';
import { BookOpen, Pencil, CheckSquare, Shield } from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

const roleIcons: Record<AppRole, React.ElementType> = {
  learner: BookOpen,
  author: Pencil,
  reviewer: CheckSquare,
  admin: Shield,
};

interface RoleSwitcherProps {
  roles: AppRole[];
  activeRole: AppRole;
  onRoleChange: (role: AppRole) => void;
}

export default function RoleSwitcher({ roles, activeRole, onRoleChange }: RoleSwitcherProps) {
  const { t } = useI18n();

  if (roles.length <= 1) return null;

  return (
    <Tabs
      value={activeRole}
      onValueChange={(v) => onRoleChange(v as AppRole)}
      className="w-full"
    >
      <TabsList className="w-full" aria-label="Switch dashboard role">
        {roles.map((role) => {
          const Icon = roleIcons[role];
          return (
            <TabsTrigger
              key={role}
              value={role}
              className="flex items-center gap-1.5 flex-1"
              aria-label={t(`roles.${role}`)}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t(`roles.${role}`)}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
