/**
 * Hook to manage the user's active learning language.
 * Persists the selected language in localStorage and syncs with user_language_profiles.
 */
import { useState, useEffect } from 'react';
import { useUserLanguageProfiles } from './useLanguageProfile';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'linguaflow_active_lang_id';

export function useActiveLanguage() {
  const { user } = useAuth();
  const { data: profiles, isLoading } = useUserLanguageProfiles();

  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  // When profiles load, default to stored preference or first profile
  useEffect(() => {
    if (!profiles || profiles.length === 0) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    const valid = profiles.find(p => p.id === stored);
    if (!valid) {
      // Default to first profile
      const first = profiles[0];
      setActiveProfileIdState(first.id);
      localStorage.setItem(STORAGE_KEY, first.id);
    }
  }, [profiles]);

  // Clear on logout
  useEffect(() => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      setActiveProfileIdState(null);
    }
  }, [user]);

  const setActiveProfileId = (id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const activeProfile = profiles?.find(p => p.id === activeProfileId) ?? profiles?.[0] ?? null;
  const activeLanguage = (activeProfile as any)?.languages ?? null;

  return {
    profiles: profiles ?? [],
    activeProfile,
    activeLanguage,
    activeLanguageCode: activeLanguage?.code ?? null,
    activeLanguageName: activeLanguage?.name ?? null,
    activeLanguageFlag: activeLanguage?.flag_emoji ?? null,
    setActiveProfileId,
    isLoading,
  };
}
