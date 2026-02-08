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
    const body = await req.json();

    // Validate languageId (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!body.languageId || typeof body.languageId !== 'string' || !uuidRegex.test(body.languageId)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing languageId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate languageCode (ISO 639 format: 2-3 lowercase letters)
    if (!body.languageCode || typeof body.languageCode !== 'string' || !/^[a-z]{2,3}$/i.test(body.languageCode)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing languageCode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate languageName (letters, spaces, hyphens, apostrophes only, max 50 chars)
    if (!body.languageName || typeof body.languageName !== 'string' ||
        body.languageName.length > 50 || !/^[\p{L}\s\-']+$/u.test(body.languageName)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing languageName' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const languageId = body.languageId;
    const languageCode = body.languageCode.toLowerCase();
    const languageName = body.languageName.trim();

    console.log(`[seed-courses] Generating exercises for ${languageName} (${languageCode})`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check how many exercises already exist for this language
    const { count: existingCount } = await supabaseAdmin
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('language_id', languageId);

    if ((existingCount ?? 0) >= 18) {
      console.log(`[seed-courses] ${languageName} already has ${existingCount} exercises, skipping`);
      return new Response(JSON.stringify({
        created: 0,
        existing: existingCount,
        language: languageName,
        message: 'Exercises already exist',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get skills
    const { data: skills } = await supabaseAdmin.from('skills').select('id, key, display_name');
    if (!skills) throw new Error('Could not fetch skills');

    const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const eloMap: Record<string, number> = {
      A1: 900, A2: 1050, B1: 1300, B2: 1450, C1: 1700, C2: 1900,
    };

    const mcqSkillKeys = ['vocabulary', 'grammar', 'reading'];
    const mcqSkills = skills.filter(s => mcqSkillKeys.includes(s.key));

    const allExercises: any[] = [];

    // Generate exercises for each CEFR level
    for (const level of cefrLevels) {
      console.log(`[seed-courses] Generating ${level} exercises for ${languageName}`);

      const prompt = `Generate exactly 3 multiple-choice language learning exercises for someone learning ${languageName} (language code: ${languageCode}) at CEFR level ${level}.

Create exactly one exercise for each skill: "vocabulary", "grammar", "reading".

IMPORTANT: Return a valid JSON array with 3 objects. Each object must have these exact fields:
- "skill": one of "vocabulary", "grammar", "reading"
- "title": Short descriptive title in English (max 50 chars)
- "description": Brief description of what's being tested (in English, max 80 chars)
- "question": The question (asking about ${languageName} words/grammar/text)
- "options": Array of exactly 4 answer options as strings
- "correctIndex": Integer 0-3 indicating the correct answer

Level guidelines for ${level}:
${level === 'A1' ? '- Basic: greetings, numbers 1-20, colors, common nouns (hello, goodbye, water, house)' : ''}
${level === 'A2' ? '- Elementary: food, family, time, weather, basic past tense, common adjectives' : ''}
${level === 'B1' ? '- Intermediate: travel, work, hobbies, conditional mood, opinions, connectors' : ''}
${level === 'B2' ? '- Upper intermediate: abstract topics, passive voice, idioms, formal/informal register' : ''}
${level === 'C1' ? '- Advanced: academic vocabulary, complex grammar, nuanced expressions, subtle differences' : ''}
${level === 'C2' ? '- Mastery: literary language, rare grammatical structures, cultural references, precision' : ''}

Questions should test knowledge OF ${languageName}. Use ${languageName} words/phrases in questions.
Make sure correctIndex actually points to the correct answer!

Return ONLY a JSON array. No markdown, no backticks, no explanation.`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`[seed-courses] AI API error for ${level}: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
          console.error(`[seed-courses] No AI content for ${level}`);
          continue;
        }

        let exercises;
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          exercises = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        } catch (parseErr) {
          console.error(`[seed-courses] Failed to parse AI response for ${level}:`, content.substring(0, 200));
          continue;
        }

        if (!Array.isArray(exercises)) {
          console.error(`[seed-courses] AI response is not an array for ${level}`);
          continue;
        }

        for (const ex of exercises) {
          const skill = mcqSkills.find(s => s.key === ex.skill);
          if (!skill || !ex.question || !Array.isArray(ex.options) || ex.options.length !== 4) {
            console.warn(`[seed-courses] Skipping invalid exercise:`, ex.title);
            continue;
          }

          allExercises.push({
            language_id: languageId,
            skill_id: skill.id,
            title: String(ex.title).substring(0, 200),
            description: String(ex.description || '').substring(0, 500),
            difficulty_elo: eloMap[level],
            tags: [level, ex.skill, languageCode],
            content: {
              type: 'multiple_choice',
              question: String(ex.question),
              options: ex.options.map(String),
              correctIndex: typeof ex.correctIndex === 'number' ? ex.correctIndex : 0,
            },
            status: 'active',
          });
        }
      } catch (levelErr) {
        console.error(`[seed-courses] Error generating ${level}:`, levelErr);
        continue;
      }
    }

    // Insert all exercises
    let created = 0;
    if (allExercises.length > 0) {
      const { error, data } = await supabaseAdmin
        .from('exercises')
        .insert(allExercises)
        .select('id');
      if (error) {
        console.error('[seed-courses] Insert error:', error);
        throw error;
      }
      created = data?.length ?? allExercises.length;
    }

    console.log(`[seed-courses] Created ${created} exercises for ${languageName}`);

    return new Response(JSON.stringify({
      created,
      language: languageName,
      levels: cefrLevels,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[seed-courses] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
