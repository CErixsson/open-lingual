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
    const scaleBatchSize = body.scaleBatchSize || 3; // smaller default for safety
    const autoChain = body.autoChain ?? false;

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

    const cefrLevels = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

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

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const lang of langsToSeed) {
      console.log(`[seed] Processing ${lang.name} (${lang.code}), scales ${scaleOffset}-${scaleOffset + scaleBatch.length - 1}`);

      for (const scale of scaleBatch) {
        for (const level of cefrLevels) {
          const descriptor = scale.descriptors[level];
          if (!descriptor || descriptor.includes('No descriptor')) continue;

          // Check duplicate
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

          // Generate exercises
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
${level === 'Pre-A1' ? 'Absolute beginner: single words, gestures, visual recognition' : ''}
${level === 'A1' ? 'Very basic: greetings, numbers, colors, simple nouns' : ''}
${level === 'A2' ? 'Elementary: daily routines, shopping, past tense' : ''}
${level === 'B1' ? 'Intermediate: opinions, plans, conditionals' : ''}
${level === 'B2' ? 'Upper intermediate: abstract topics, passive voice, idioms' : ''}
${level === 'C1' ? 'Advanced: complex grammar, nuanced expressions' : ''}
${level === 'C2' ? 'Mastery: subtle distinctions, literary references, rare vocabulary' : ''}

All ${lang.name} text must be authentic. Return ONLY the JSON array.`;

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
              if (ex.type === 'multiple_choice') return ex.question && Array.isArray(ex.options) && ex.options.length === 4 && typeof ex.correctIndex === 'number';
              if (ex.type === 'cloze') return ex.text && ex.correctAnswer;
              if (ex.type === 'word_order') return Array.isArray(ex.words) && Array.isArray(ex.correctOrder);
              return false;
            });

            if (validExercises.length === 0) continue;

            // Save IMMEDIATELY after creation
            const { error } = await supabaseAdmin.from('lessons').insert({
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

            if (error) {
              console.error(`[seed] Insert error:`, error);
            } else {
              totalCreated++;
              console.log(`[seed] Saved: ${scale.title} (${level}) for ${lang.name}`);
            }
          } catch (err) {
            console.warn(`[seed] Error for ${scale.id}/${level}:`, err);
            continue;
          }
        }
      }
    }

    const nextOffset = scaleOffset + scaleBatchSize;
    const hasMore = nextOffset < DESCRIPTOR_SCALES.length;

    // Self-chain: trigger next batch automatically
    if (hasMore && autoChain) {
      const selfUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/seed-descriptor-lessons`;
      globalThis.EdgeRuntime?.waitUntil?.(
        fetch(selfUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            languageCode: targetLangCode,
            scaleOffset: nextOffset,
            scaleBatchSize,
            autoChain: true,
          }),
        })
      );
    }

    return new Response(JSON.stringify({
      totalCreated,
      totalSkipped,
      languages: langsToSeed.map(l => l.name),
      scalesProcessed: scaleBatch.map(s => s.id),
      totalScales: DESCRIPTOR_SCALES.length,
      nextOffset,
      hasMore,
      autoChaining: hasMore && autoChain,
      message: `Batch done: ${totalCreated} created, ${totalSkipped} skipped. Scales ${scaleOffset}-${scaleOffset + scaleBatch.length - 1} of ${DESCRIPTOR_SCALES.length}.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[seed] Fatal error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
