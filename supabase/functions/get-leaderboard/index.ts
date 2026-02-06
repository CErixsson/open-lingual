import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const languageId = url.searchParams.get('languageId');

    if (!languageId) {
      return new Response(JSON.stringify({ error: 'languageId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get all profiles for this language, ordered by elo
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('user_language_profiles')
      .select('user_id, overall_elo, overall_rd, overall_cefr')
      .eq('language_id', languageId)
      .order('overall_elo', { ascending: false })
      .limit(100);

    if (pErr) throw pErr;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get display names from profiles table
    const userIds = profiles.map(p => p.user_id);
    const { data: userProfiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    const nameMap = new Map<string, string>();
    userProfiles?.forEach(u => {
      if (u.display_name) nameMap.set(u.user_id, u.display_name);
    });

    const leaderboard = profiles.map((p, idx) => ({
      rank: idx + 1,
      userId: p.user_id,
      displayName: nameMap.get(p.user_id) || 'Anonym',
      rating: p.overall_elo,
      cefr: p.overall_cefr,
      rd: p.overall_rd,
    }));

    return new Response(JSON.stringify(leaderboard), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('get-leaderboard error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
