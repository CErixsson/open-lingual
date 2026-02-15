import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DESCRIPTOR_SCALES } from './scales.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetLangCode = body.languageCode || null;
    const scaleOffset = body.scaleOffset || 0;
    const scaleBatchSize = body.scaleBatchSize || 5;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: languages } = await supabaseAdmin.from('languages').select('*');
    if (!languages?.length) throw new Error('No languages found');

    const { data: authorRole } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['author', 'admin'])
      .limit(1);
    
    if (!authorRole?.length) throw new Error('No author found');
    const authorId = authorRole[0].user_id;

    const langsToSeed = targetLangCode
      ? languages.filter(l => l.code === targetLangCode)
      : languages;

    // Use all CEFR levels including C2 and Pre-A1
    const cefrLevels = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let totalCreated = 0;
    let totalSkipped = 0;

    // Slice scales for batching
    const scaleBatch = DESCRIPTOR_SCALES.slice(scaleOffset, scaleOffset + scaleBatchSize);
    if (scaleBatch.length === 0) {
      return new Response(JSON.stringify({
        message: 'No more scales to process',
        totalCreated: 0,
        totalScales: DESCRIPTOR_SCALES.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const lang of langsToSeed) {
      console.log(`[seed] Processing ${lang.name} (${lang.code}), scales ${scaleOffset}-${scaleOffset + scaleBatch.length - 1}`);

      const lessonsToInsert: any[] = [];

      for (const scale of scaleBatch) {
        for (const level of cefrLevels) {
          const descriptor = scale.descriptors[level];
          if (!descriptor || descriptor.includes('No descriptor')) continue;

          // Check if lesson already exists
          const { data: existing } = await supabaseAdmin
            .from('lessons')
            .select('id')
            .eq('language', lang.code)
            .eq('level', level)
            .ilike('title', `%${scale.title}%`)
            .limit(1);

          if (existing && existing.length > 0) {
            totalSkipped++;
            continue;
          }

          // Generate exercises via AI
          const prompt = `Generate 4 exercises for learning ${lang.name} (code: ${lang.code}) at CEFR level ${level}.
Topic: "${scale.title}" (Category: ${scale.category}, Skill: ${scale.skill})
CEFR Descriptor: "${descriptor}"

Create a mix of exercise types. Return a JSON array with exactly 4 objects, each having:
- "type": one of "multiple_choice", "cloze", "word_order"
- "question": the question text (in English with ${lang.name} elements)
For multiple_choice:
  - "options": array of 4 strings
  - "correctIndex": 0-3
For cloze:
  - "text": sentence with ___ for the blank
  - "correctAnswer": the correct word/phrase
For word_order:
  - "words": array of words to arrange
  - "correctOrder": array of indices showing correct order

Level ${level} guidelines:
${level === 'Pre-A1' ? 'Absolute beginner: single words, gestures, visual recognition, numbers, greetings' : ''}
${level === 'A1' ? 'Very basic: greetings, numbers, colors, simple nouns, present tense' : ''}
${level === 'A2' ? 'Elementary: daily routines, shopping, past tense, common adjectives' : ''}
${level === 'B1' ? 'Intermediate: opinions, plans, conditionals, connectors' : ''}
${level === 'B2' ? 'Upper intermediate: abstract topics, passive voice, idioms, formal register' : ''}
${level === 'C1' ? 'Advanced: complex grammar, nuanced expressions, academic vocabulary' : ''}
${level === 'C2' ? 'Mastery: subtle distinctions, literary references, sophisticated rhetoric, rare vocabulary' : ''}

All ${lang.name} text must be authentic to the language.
Return ONLY the JSON array. No markdown, no explanation.`;

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
                temperature: 0.7,
              }),
            });

            if (!aiResponse.ok) {
              console.warn(`[seed] AI error for ${scale.id}/${level}: ${aiResponse.status}`);
              continue;
            }

            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            if (!content) continue;

            let exercises;
            try {
              const jsonMatch = content.match(/\[[\s\S]*\]/);
              exercises = JSON.parse(jsonMatch ? jsonMatch[0] : content);
            } catch {
              console.warn(`[seed] Parse error for ${scale.id}/${level}`);
              continue;
            }

            if (!Array.isArray(exercises)) continue;

            const validExercises = exercises.filter((ex: any) => {
              if (ex.type === 'multiple_choice') {
                return ex.question && Array.isArray(ex.options) && ex.options.length === 4 && typeof ex.correctIndex === 'number';
              }
              if (ex.type === 'cloze') {
                return ex.text && ex.correctAnswer;
              }
              if (ex.type === 'word_order') {
                return Array.isArray(ex.words) && Array.isArray(ex.correctOrder);
              }
              return false;
            });

            if (validExercises.length === 0) continue;

            lessonsToInsert.push({
              title: `${scale.title} (${level})`,
              description: descriptor,
              language: lang.code,
              level,
              author_id: authorId,
              status: 'published',
              license: 'CC-BY-SA-4.0',
              version: '1.0.0',
              objectives: [descriptor],
              tags: [scale.skill, scale.id, scale.category.toLowerCase()],
              exercises: validExercises,
            });
          } catch (err) {
            console.warn(`[seed] Error for ${scale.id}/${level}:`, err);
            continue;
          }
        }
      }

      // Batch insert
      if (lessonsToInsert.length > 0) {
        const { error, data } = await supabaseAdmin
          .from('lessons')
          .insert(lessonsToInsert)
          .select('id');
        
        if (error) {
          console.error(`[seed] Insert error for ${lang.name}:`, error);
        } else {
          totalCreated += data?.length ?? lessonsToInsert.length;
          console.log(`[seed] Created ${data?.length ?? lessonsToInsert.length} lessons for ${lang.name}`);
        }
      }
    }

    return new Response(JSON.stringify({
      totalCreated,
      totalSkipped,
      languages: langsToSeed.map(l => l.name),
      scalesProcessed: scaleBatch.map(s => s.id),
      totalScales: DESCRIPTOR_SCALES.length,
      nextOffset: scaleOffset + scaleBatchSize,
      hasMore: scaleOffset + scaleBatchSize < DESCRIPTOR_SCALES.length,
      message: `Seeded ${totalCreated} lessons (skipped ${totalSkipped} existing), batch ${scaleOffset / scaleBatchSize + 1}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[seed] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
