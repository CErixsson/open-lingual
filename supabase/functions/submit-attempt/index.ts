import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function expectedScore(playerRating: number, oppRating: number): number {
  return 1 / (1 + Math.pow(10, (oppRating - playerRating) / 400));
}

function getKFactor(rd: number, attempts: number, elo: number): number {
  if (rd > 200 || attempts < 20) return 40;
  if (elo >= 1600 || attempts > 100) return 10;
  return 20;
}

function calcNewRating(oldRating: number, kFactor: number, score: number, expected: number): number {
  return Math.round(oldRating + kFactor * (score - expected));
}

function applyTimeBonus(scoreRaw: number, timeSpentSec: number, timeLimitSec: number | null): number {
  if (!timeLimitSec || timeSpentSec >= timeLimitSec) return scoreRaw;
  const bonus = 0.1 * (1 - timeSpentSec / timeLimitSec);
  return Math.min(1.0, scoreRaw + bonus);
}

function mapEloToCefr(elo: number, bands: { level: string; band_min: number; band_max: number }[]): string {
  const found = bands.find(b => elo >= b.band_min && elo <= b.band_max);
  if (found) return found.level;
  return elo < 800 ? 'A1' : 'C2';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { exerciseId, answer, scoreRaw: providedScore, timeSpentSec } = await req.json();

    // 1. Get exercise
    const { data: exercise, error: exErr } = await supabaseAdmin
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
    if (exErr || !exercise) {
      return new Response(JSON.stringify({ error: 'Exercise not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Calculate score
    let scoreRaw: number;
    if (answer !== undefined && exercise.content?.correctIndex !== undefined) {
      scoreRaw = answer === exercise.content.correctIndex ? 1.0 : 0.0;
    } else if (providedScore !== undefined) {
      scoreRaw = Math.max(0, Math.min(1, providedScore));
    } else {
      return new Response(JSON.stringify({ error: 'Either answer or scoreRaw required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply time bonus
    const adjustedScore = applyTimeBonus(scoreRaw, timeSpentSec || 0, exercise.time_limit_sec);

    // 3. Get or create user language profile
    let { data: profile } = await supabaseUser
      .from('user_language_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('language_id', exercise.language_id)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error: pErr } = await supabaseUser
        .from('user_language_profiles')
        .insert({ user_id: user.id, language_id: exercise.language_id })
        .select()
        .single();
      if (pErr) throw pErr;
      profile = newProfile;
    }

    // 4. Get or create skill rating
    let { data: skillRating } = await supabaseUser
      .from('user_skill_ratings')
      .select('*')
      .eq('user_language_profile_id', profile.id)
      .eq('skill_id', exercise.skill_id)
      .maybeSingle();

    if (!skillRating) {
      const { data: newRating, error: rErr } = await supabaseUser
        .from('user_skill_ratings')
        .insert({ user_language_profile_id: profile.id, skill_id: exercise.skill_id })
        .select()
        .single();
      if (rErr) throw rErr;
      skillRating = newRating;
    }

    // 5. Elo calculation
    const expected = expectedScore(skillRating.elo, exercise.difficulty_elo);
    const kFactor = getKFactor(skillRating.rd, skillRating.attempts_count, skillRating.elo);
    const newSkillElo = calcNewRating(skillRating.elo, kFactor, adjustedScore, expected);
    const newRd = Math.max(50, skillRating.rd - 10);

    // 6. Exercise difficulty update (slower K)
    const exerciseK = Math.max(5, Math.round(kFactor / 4));
    const exerciseExpected = expectedScore(exercise.difficulty_elo, skillRating.elo);
    const newDifficultyElo = calcNewRating(exercise.difficulty_elo, exerciseK, 1 - adjustedScore, exerciseExpected);

    // 7. Update skill rating
    await supabaseUser.from('user_skill_ratings').update({
      elo: newSkillElo,
      rd: newRd,
      attempts_count: skillRating.attempts_count + 1,
      last_update_at: new Date().toISOString(),
    }).eq('id', skillRating.id);

    // 8. Compute overall elo (weighted average of all skills)
    const { data: allSkills } = await supabaseUser
      .from('user_skill_ratings')
      .select('elo, attempts_count')
      .eq('user_language_profile_id', profile.id);

    let overallElo = newSkillElo;
    if (allSkills && allSkills.length > 0) {
      const totalWeight = allSkills.reduce((sum: number, s: any) => sum + Math.max(1, s.attempts_count), 0);
      const weightedSum = allSkills.reduce((sum: number, s: any) => sum + s.elo * Math.max(1, s.attempts_count), 0);
      overallElo = Math.round(weightedSum / totalWeight);
    }

    // 9. CEFR mapping
    const { data: bands } = await supabaseAdmin
      .from('cefr_band_config')
      .select('level, band_min, band_max')
      .eq('language_id', exercise.language_id)
      .order('band_min');

    const previousCefr = profile.overall_cefr;
    const newCefr = mapEloToCefr(overallElo, bands || []);

    // 10. Streak calculation
    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile.last_active_at
      ? new Date(profile.last_active_at).toISOString().split('T')[0]
      : null;

    let newStreak = profile.streak_count;
    if (lastActive === today) {
      // Already active today
    } else if (lastActive) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      newStreak = lastActive === yesterdayStr ? newStreak + 1 : 1;
    } else {
      newStreak = 1;
    }

    // 11. Update profile
    await supabaseUser.from('user_language_profiles').update({
      overall_elo: overallElo,
      overall_rd: Math.max(50, profile.overall_rd - 5),
      overall_cefr: newCefr,
      total_attempts: profile.total_attempts + 1,
      streak_count: newStreak,
      last_active_at: new Date().toISOString(),
    }).eq('id', profile.id);

    // 12. Update exercise difficulty (admin)
    await supabaseAdmin.from('exercises').update({
      difficulty_elo: newDifficultyElo,
    }).eq('id', exercise.id);

    // 13. Log attempt
    await supabaseUser.from('exercise_attempts').insert({
      exercise_id: exerciseId,
      user_id: user.id,
      user_language_profile_id: profile.id,
      skill_id: exercise.skill_id,
      completed_at: new Date().toISOString(),
      score_raw: adjustedScore,
      passed: adjustedScore >= 0.5,
      time_spent_sec: timeSpentSec || 0,
      elo_before: skillRating.elo,
      elo_after: newSkillElo,
      difficulty_elo_before: exercise.difficulty_elo,
      difficulty_elo_after: newDifficultyElo,
      k_factor_used: kFactor,
      rd_before: skillRating.rd,
      rd_after: newRd,
      expected_score: expected,
    });

    return new Response(JSON.stringify({
      skillRating: {
        eloBefore: skillRating.elo,
        eloAfter: newSkillElo,
        rdAfter: newRd,
      },
      overallElo,
      overallCefr: newCefr,
      previousCefr,
      expectedScore: expected,
      difficultyEloBefore: exercise.difficulty_elo,
      difficultyEloAfter: newDifficultyElo,
      streakCount: newStreak,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('submit-attempt error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
