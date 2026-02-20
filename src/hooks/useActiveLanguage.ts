/**
 * Hook to manage the user's active learning language.
 * Persists the selected language code in localStorage.
 * Works with both DB profiles (for Elo/skills) and JSON languages (for curriculum).
 */
import { useState, useEffect, useMemo } from 'react';
import { useUserLanguageProfiles } from './useLanguageProfile';
import { useLanguages, type CurriculumLanguage } from './useLanguages';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'linguaflow_active_lang_code';

export function useActiveLanguage() {
  const { user } = useAuth();
  const { data: profiles, isLoading: profilesLoading } = useUserLanguageProfiles();
  const { data: allLanguages } = useLanguages();

  const [activeLangCode, setActiveLangCodeState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  // When profiles load, default to stored preference or first profile's language
  useEffect(() => {
    if (!profiles || profiles.length === 0) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    // Verify stored code matches a profile
    const valid = profiles.find((p: any) => p.languages?.code === stored);
    if (!valid) {
      const first = (profiles[0] as any)?.languages?.code;
      if (first) {
        setActiveLangCodeState(first);
        localStorage.setItem(STORAGE_KEY, first);
      }
    }
  }, [profiles]);

  // Clear on logout
  useEffect(() => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      setActiveLangCodeState(null);
    }
  }, [user]);

  const setActiveLangCode = (code: string) => {
    setActiveLangCodeState(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  // Find the matching DB profile for the active language code
  const activeProfile = useMemo(() => {
    if (!profiles) return null;
    return profiles.find((p: any) => p.languages?.code === activeLangCode)
      ?? profiles[0]
      ?? null;
  }, [profiles, activeLangCode]);

  const activeLanguage: CurriculumLanguage | null = useMemo(() => {
    const code = (activeProfile as any)?.languages?.code ?? activeLangCode;
    if (!code) return null;
    // Try DB profile language first
    const dbLang = (activeProfile as any)?.languages;
    if (dbLang) return { code: dbLang.code, name: dbLang.name, flag_emoji: dbLang.flag_emoji };
    // Fallback to JSON languages
    return allLanguages?.find(l => l.code === code) ?? null;
  }, [activeProfile, activeLangCode, allLanguages]);

  // For backward compat, also expose setActiveProfileId
  const setActiveProfileId = (profileId: string) => {
    const profile = profiles?.find((p: any) => p.id === profileId);
    if (profile) {
      const code = (profile as any)?.languages?.code;
      if (code) setActiveLangCode(code);
    }
  };

  return {
    profiles: profiles ?? [],
    activeProfile,
    activeLanguage,
    activeLanguageCode: activeLanguage?.code ?? activeLangCode,
    activeLanguageName: activeLanguage?.name ?? null,
    activeLanguageFlag: activeLanguage?.flag_emoji ?? null,
    setActiveProfileId,
    setActiveLangCode,
    isLoading: profilesLoading,
  };
}
