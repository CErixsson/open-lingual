import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function expectedScore(playerRating: number, oppRating: number): number {
  return 1 / (1 + Math.pow(10, (oppRating - playerRating) / 400));
}

function calcNewRating(oldRating: number, kFactor: number, score: number, expected: number): number {
  return Math.round(oldRating + kFactor * (score - expected));
}

function getKFactor(rd: number, attempts: number): number {
  if (rd > 200 || attempts < 20) return 40;
  if (attempts > 100) return 10;
  return 20;
}

const CEFR_DIFFICULTY: Record<string, number> = {
  'Pre-A1': 800, 'A1': 1000, 'A2': 1200, 'B1': 1400, 'B2': 1600, 'C1': 1800, 'C2': 2000,
};

function mapEloToCefr(elo: number): string {
  if (elo < 900) return 'Pre-A1';
  if (elo < 1100) return 'A1';
  if (elo < 1300) return 'A2';
  if (elo < 1500) return 'B1';
  if (elo < 1700) return 'B2';
  if (elo < 1900) return 'C1';
  return 'C2';
}

function getAdaptivePromptModifiers(elo: number, mode: string): string {
  const cefr = mapEloToCefr(elo);
  const mods: string[] = [];

  if (elo > 1600) {
    mods.push('Use complex sentence structures, idioms, and nuanced vocabulary.');
    mods.push('Ask unexpected follow-up questions to test depth of understanding.');
    mods.push('Remove scaffolding — do not offer hints or simplifications.');
  } else if (elo > 1300) {
    mods.push('Use moderate complexity. Mix simple and compound sentences.');
    mods.push('Occasionally use idiomatic expressions with context clues.');
  } else {
    mods.push('Use simple, clear language. Short sentences.');
    mods.push('Offer supportive phrasing. Provide gentle corrections.');
    mods.push('If the user struggles, simplify further and offer hints.');
  }

  if (mode === 'controlled') {
    mods.push('Keep responses very structured. Provide multiple choice or fill-in-blank options.');
  } else if (mode === 'guided') {
    mods.push('Allow free text but offer vocabulary suggestions when appropriate.');
  } else {
    mods.push('Engage in fully natural conversation. Ask follow-up questions naturally.');
  }

  return mods.join(' ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, scenarioId, sessionId, message, mode } = await req.json();

    // ACTION: start - Start a new dialogue session
    if (action === 'start') {
      const { data: scenario, error: sErr } = await supabaseAdmin
        .from('scenarios')
        .select('*, dialogue_nodes(*)')
        .eq('id', scenarioId)
        .single();
      if (sErr || !scenario) {
        return new Response(JSON.stringify({ error: 'Scenario not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get user's language profile for this language
      let { data: profile } = await supabaseUser
        .from('user_language_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_id', scenario.language_id)
        .maybeSingle();

      if (!profile) {
        const { data: newProfile } = await supabaseUser
          .from('user_language_profiles')
          .insert({ user_id: user.id, language_id: scenario.language_id })
          .select()
          .single();
        profile = newProfile;
      }

      // Get skill ratings for reading/writing/listening/speaking
      const { data: skillRatings } = await supabaseUser
        .from('user_skill_ratings')
        .select('*, skills(*)')
        .eq('user_language_profile_id', profile!.id);

      const avgElo = skillRatings && skillRatings.length > 0
        ? Math.round(skillRatings.reduce((s, r) => s + r.elo, 0) / skillRatings.length)
        : 1200;

      // Sort dialogue nodes
      const nodes = (scenario.dialogue_nodes || []).sort((a: any, b: any) => a.node_order - b.node_order);
      const firstNode = nodes[0];

      const adaptiveMods = getAdaptivePromptModifiers(avgElo, mode || 'controlled');

      // Generate initial AI response
      const systemPrompt = `You are a language practice partner for ${scenario.cefr_target}-level learners.
Topic: ${scenario.topic}. Title: ${scenario.title}.
${scenario.cultural_notes ? `Cultural notes: ${scenario.cultural_notes}` : ''}
Grammar targets: ${(scenario.grammar_targets || []).join(', ')}
Vocabulary clusters: ${(scenario.vocabulary_clusters || []).join(', ')}
${adaptiveMods}
${firstNode ? `Start the conversation with this context: ${firstNode.prompt_text}` : 'Start a natural conversation on the topic.'}
Keep your response concise (2-3 sentences). Speak in the target language primarily.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Start the conversation.' },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limited. Please try again later.' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error('AI gateway error');
      }

      const aiData = await aiResponse.json();
      const aiMessage = aiData.choices?.[0]?.message?.content || 'Hello!';

      const initialMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: aiMessage },
      ];

      // Create session
      const { data: session, error: sessErr } = await supabaseUser
        .from('dialogue_sessions')
        .insert({
          user_id: user.id,
          scenario_id: scenarioId,
          mode: mode || 'controlled',
          messages: initialMessages,
        })
        .select()
        .single();

      if (sessErr) throw sessErr;

      // Generate controlled mode options if needed
      let options = null;
      if ((mode || 'controlled') === 'controlled' && firstNode) {
        options = firstNode.possible_responses;
      }

      return new Response(JSON.stringify({
        session,
        aiMessage,
        options,
        hints: firstNode?.hints || [],
        userCefr: mapEloToCefr(avgElo),
        userAvgElo: avgElo,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: respond - User sends a message
    if (action === 'respond') {
      const { data: session, error: sessErr } = await supabaseUser
        .from('dialogue_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (sessErr || !session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: scenario } = await supabaseAdmin
        .from('scenarios')
        .select('*')
        .eq('id', session.scenario_id)
        .single();

      // Get user skill ratings
      let { data: profile } = await supabaseUser
        .from('user_language_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_id', scenario!.language_id)
        .maybeSingle();

      const { data: skillRatings } = await supabaseUser
        .from('user_skill_ratings')
        .select('*, skills(*)')
        .eq('user_language_profile_id', profile!.id);

      const avgElo = skillRatings && skillRatings.length > 0
        ? Math.round(skillRatings.reduce((s, r) => s + r.elo, 0) / skillRatings.length)
        : 1200;

      const messages = [...(session.messages as any[])];
      messages.push({ role: 'user', content: message });

      // Evaluate + respond using AI with tool calling
      const evaluationPrompt = `Also evaluate the user's response internally on these criteria (0.0-1.0 each):
- grammar_accuracy: correctness of grammar
- lexical_complexity: richness and appropriateness of vocabulary
- fluency: natural flow, sentence length and structure
- register: appropriate formality level for the context
Then continue the conversation naturally. Keep responses to 2-3 sentences.`;

      const messagesForAI = messages.filter((m: any) => m.role !== 'system');
      const systemMsg = messages.find((m: any) => m.role === 'system');

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: (systemMsg?.content || '') + '\n' + evaluationPrompt },
            ...messagesForAI,
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'evaluate_response',
              description: 'Evaluate the user language response and provide AI reply',
              parameters: {
                type: 'object',
                properties: {
                  ai_reply: { type: 'string', description: 'The AI conversational reply' },
                  grammar_accuracy: { type: 'number', description: '0.0-1.0 grammar score' },
                  lexical_complexity: { type: 'number', description: '0.0-1.0 vocabulary score' },
                  fluency: { type: 'number', description: '0.0-1.0 fluency score' },
                  register: { type: 'number', description: '0.0-1.0 register appropriateness' },
                  corrections: { type: 'array', items: { type: 'string' }, description: 'Specific corrections if any' },
                },
                required: ['ai_reply', 'grammar_accuracy', 'lexical_complexity', 'fluency', 'register'],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'evaluate_response' } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limited. Please try again later.' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error('AI gateway error');
      }

      const aiData = await aiResponse.json();
      let evaluation: any = {};
      let aiReply = '';

      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          evaluation = JSON.parse(toolCall.function.arguments);
          aiReply = evaluation.ai_reply || '';
        } catch {
          aiReply = aiData.choices?.[0]?.message?.content || 'I understand.';
        }
      } else {
        aiReply = aiData.choices?.[0]?.message?.content || 'I understand.';
      }

      messages.push({ role: 'assistant', content: aiReply });

      // Calculate composite score
      const compositeScore = (
        (evaluation.grammar_accuracy || 0.5) * 0.3 +
        (evaluation.lexical_complexity || 0.5) * 0.2 +
        (evaluation.fluency || 0.5) * 0.3 +
        (evaluation.register || 0.5) * 0.2
      );

      // ELO adjustments per relevant skill
      const modeMultiplier = session.mode === 'controlled' ? 0.5 : session.mode === 'guided' ? 0.75 : 1.0;
      const difficultyElo = CEFR_DIFFICULTY[scenario!.cefr_target] || 1200;
      const ratingDeltas: Record<string, { before: number; after: number; delta: number; skillName: string }> = {};

      // Map evaluation criteria to skills
      const skillMapping: Record<string, string[]> = {
        'writing': ['grammar_accuracy', 'lexical_complexity'],
        'speaking': ['fluency', 'register'],
        'reading': ['lexical_complexity'],
        'grammar': ['grammar_accuracy'],
      };

      if (skillRatings) {
        for (const sr of skillRatings) {
          const skillKey = (sr.skills as any)?.key;
          if (!skillKey) continue;
          const relevantCriteria = skillMapping[skillKey];
          if (!relevantCriteria) continue;

          const skillScore = relevantCriteria.reduce((sum, c) => sum + (evaluation[c] || 0.5), 0) / relevantCriteria.length;
          const adjustedScore = skillScore * modeMultiplier;
          const exp = expectedScore(sr.elo, difficultyElo);
          const k = getKFactor(sr.rd, sr.attempts_count) * modeMultiplier;
          const newElo = calcNewRating(sr.elo, k, adjustedScore, exp);
          const newRd = Math.max(50, sr.rd - 5);

          ratingDeltas[skillKey] = {
            before: sr.elo,
            after: newElo,
            delta: newElo - sr.elo,
            skillName: (sr.skills as any)?.display_name || skillKey,
          };

          await supabaseUser.from('user_skill_ratings').update({
            elo: newElo,
            rd: newRd,
            attempts_count: sr.attempts_count + 1,
            last_update_at: new Date().toISOString(),
          }).eq('id', sr.id);
        }
      }

      // Update session
      await supabaseUser.from('dialogue_sessions').update({
        messages,
        evaluation: {
          ...evaluation,
          compositeScore,
        },
        skill_ratings_delta: ratingDeltas,
        score: compositeScore,
      }).eq('id', session.id);

      return new Response(JSON.stringify({
        aiReply,
        evaluation: {
          grammar_accuracy: evaluation.grammar_accuracy,
          lexical_complexity: evaluation.lexical_complexity,
          fluency: evaluation.fluency,
          register: evaluation.register,
          compositeScore,
          corrections: evaluation.corrections || [],
        },
        ratingDeltas,
        userCefr: mapEloToCefr(avgElo),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: complete - End the session
    if (action === 'complete') {
      const { data: session } = await supabaseUser
        .from('dialogue_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (session) {
        await supabaseUser.from('dialogue_sessions').update({
          completed_at: new Date().toISOString(),
        }).eq('id', session.id);

        // Update scenario progress
        const modeField = `${session.mode}_completed`;
        const nextMode = session.mode === 'controlled' ? 'guided' : session.mode === 'guided' ? 'open' : 'open';

        const { data: existing } = await supabaseUser
          .from('user_scenario_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('scenario_id', session.scenario_id)
          .maybeSingle();

        if (existing) {
          const update: any = {
            attempts_count: existing.attempts_count + 1,
            last_played_at: new Date().toISOString(),
            best_score: Math.max(existing.best_score, session.score || 0),
          };
          if (modeField === 'controlled_completed') update.controlled_completed = true;
          if (modeField === 'guided_completed') update.guided_completed = true;
          if (modeField === 'open_completed') update.open_completed = true;

          // Unlock next mode
          if (session.mode === 'controlled' && !existing.guided_completed) {
            update.mode_unlocked = 'guided';
          } else if (session.mode === 'guided' && !existing.open_completed) {
            update.mode_unlocked = 'open';
          }

          await supabaseUser.from('user_scenario_progress').update(update).eq('id', existing.id);
        } else {
          const insert: any = {
            user_id: user.id,
            scenario_id: session.scenario_id,
            attempts_count: 1,
            last_played_at: new Date().toISOString(),
            best_score: session.score || 0,
            mode_unlocked: session.mode === 'controlled' ? 'guided' : session.mode === 'guided' ? 'open' : 'open',
          };
          if (session.mode === 'controlled') insert.controlled_completed = true;
          if (session.mode === 'guided') insert.guided_completed = true;
          if (session.mode === 'open') insert.open_completed = true;

          await supabaseUser.from('user_scenario_progress').insert(insert);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('dialogue error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
