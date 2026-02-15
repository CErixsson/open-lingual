import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

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
    const offset = body.offset || 0;
    const batchSize = body.batchSize || 200;
    const autoChain = body.autoChain ?? false;
    const generateExercises = body.generateExercises ?? false;
    const languageCode = body.languageCode || null;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── PHASE 2: Exercise generation for a specific language ──
    if (generateExercises && languageCode) {
      return await handleExerciseGeneration(supabaseAdmin, body);
    }

    // ── PHASE 1: Populate cefr_descriptors ──
    let rows: any[] = body.descriptors || [];

    // If no descriptors in body, fetch and parse the Excel
    if (rows.length === 0) {
      const excelUrl = body.excelUrl || `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/cefr-data/CEFR_Descriptors_2020.xlsx`;
      console.log(`[seed] Fetching Excel from ${excelUrl}`);
      const resp = await fetch(excelUrl, {
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      });
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: `Failed to fetch Excel: ${resp.status}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const contentType = resp.headers.get('content-type') || '';
      console.log(`[seed] Response content-type: ${contentType}`);
      const buffer = await resp.arrayBuffer();
      console.log(`[seed] Downloaded ${buffer.byteLength} bytes`);
      
      if (buffer.byteLength < 1000) {
        const text = new TextDecoder().decode(buffer.slice(0, 500));
        return new Response(JSON.stringify({ error: `Response too small (${buffer.byteLength} bytes), likely not Excel`, preview: text }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      console.log(`[seed] Sheets: ${workbook.SheetNames.join(', ')}`);
      // First sheet = English descriptors
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      // Skip header row, map to objects
      rows = (rawRows as any[]).slice(1).map((r: any[]) => ({
        descriptor_number: r[0],
        scheme: r[1],
        mode: r[2],
        activity: r[3],
        scale: r[4],
        level: r[5],
        descriptor_text: r[6],
      })).filter((r: any) => r.descriptor_number && r.descriptor_text);
      console.log(`[seed] Parsed ${rows.length} descriptors from Excel`);
    } else {
      console.log(`[seed] Received ${rows.length} descriptors from POST body`);
    }

    // Take batch slice
    const batch = rows.slice(offset, offset + batchSize);
    if (batch.length === 0) {
      return new Response(JSON.stringify({ message: 'All descriptors processed', totalRows: rows.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`[seed] Processing batch ${offset}-${offset + batch.length - 1} of ${rows.length}`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    // Process all descriptors from POST body
    const descriptorsToInsert = [];
    for (const row of rows) {
      const no = row.descriptor_number || row.no;
      const scheme = row.scheme;
      const mode = row.mode;
      const activity = row.activity;
      const scale = row.scale;
      const level = row.level;
      const descriptor = row.descriptor_text || row.descriptor;

      if (!no || !descriptor || !level || !scale) {
        skipped++;
        continue;
      }

      descriptorsToInsert.push({
        descriptor_number: Number(no),
        scheme: String(scheme || '').trim(),
        mode: mode ? String(mode).trim() : null,
        activity: String(activity || '').trim(),
        scale: String(scale || '').trim(),
        level: String(level).trim(),
        descriptor_text: String(descriptor).trim(),
      });
    }

    // Upsert in chunks of 50
    for (let i = 0; i < descriptorsToInsert.length; i += 50) {
      const chunk = descriptorsToInsert.slice(i, i + 50);
      const { error } = await supabaseAdmin
        .from('cefr_descriptors')
        .upsert(chunk, { onConflict: 'descriptor_number', ignoreDuplicates: false });

      if (error) {
        console.error(`[seed] Upsert error at chunk ${i}:`, error);
        errors += chunk.length;
      } else {
        inserted += chunk.length;
        console.log(`[seed] Upserted ${chunk.length} descriptors (${i + chunk.length}/${descriptorsToInsert.length})`);
      }
    }

    return new Response(JSON.stringify({
      inserted,
      skipped,
      errors,
      totalRows: rows.length,
      message: `Done: ${inserted} upserted, ${skipped} skipped, ${errors} errors.`,
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

// ── Phase 2: Generate exercises for descriptors in a target language ──
async function handleExerciseGeneration(supabaseAdmin: any, body: any) {
  const languageCode = body.languageCode;
  const exOffset = body.exerciseOffset || 0;
  const exBatchSize = body.exerciseBatchSize || 5;
  const autoChain = body.autoChain ?? false;

  // Get language
  const { data: lang } = await supabaseAdmin
    .from('languages')
    .select('id, name, code')
    .eq('code', languageCode)
    .single();

  if (!lang) {
    return new Response(JSON.stringify({ error: `Language not found: ${languageCode}` }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get descriptors that don't yet have exercises for this language
  const { data: descriptors, error: descError } = await supabaseAdmin
    .from('cefr_descriptors')
    .select('id, descriptor_number, scheme, mode, activity, scale, level, descriptor_text')
    .not('descriptor_text', 'ilike', '%No descriptor%')
    .not('descriptor_text', 'ilike', '%No descriptors available%')
    .order('descriptor_number', { ascending: true })
    .range(exOffset, exOffset + exBatchSize - 1);

  if (descError) {
    console.error('[seed-ex] Descriptor fetch error:', descError);
    return new Response(JSON.stringify({ error: descError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!descriptors || descriptors.length === 0) {
    return new Response(JSON.stringify({
      message: 'No more descriptors to process',
      language: lang.name,
      exerciseOffset: exOffset,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`[seed-ex] Generating exercises for ${lang.name}: descriptors ${exOffset}-${exOffset + descriptors.length - 1}`);

  let created = 0;
  let skipped = 0;

  for (const desc of descriptors) {
    // Check if exercises already exist for this descriptor + language
    const { count } = await supabaseAdmin
      .from('descriptor_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('descriptor_id', desc.id)
      .eq('language_id', lang.id);

    if ((count ?? 0) > 0) {
      skipped++;
      continue;
    }

    // Skip \"no descriptor available\" entries
    if (desc.descriptor_text.toLowerCase().includes('no descriptor') || 
        desc.descriptor_text.toLowerCase().includes('keine deskriptor')) {
      skipped++;
      continue;
    }

    const levelGuide = getLevelGuide(desc.level);

    const prompt = `Generate 3 exercises for learning ${lang.name} at CEFR level ${desc.level}.
Topic: \"${desc.scale}\" (Category: ${desc.activity}, Area: ${desc.scheme})
CEFR Descriptor: \"${desc.descriptor_text}\"

Create a mix of exercise types. Return a JSON array with exactly 3 objects, each having:
- \"type\": one of \"multiple_choice\", \"cloze\", \"word_order\"
For multiple_choice:
  - \"question\": the question text (in English with ${lang.name} elements)
  - \"options\": array of 4 strings
  - \"correctIndex\": 0-3
For cloze:
  - \"text\": sentence with ___ for the blank (in ${lang.name})
  - \"correctAnswer\": the correct word/phrase
For word_order:
  - \"words\": array of words to arrange (in ${lang.name})
  - \"correctOrder\": array of indices showing correct order

Level ${desc.level} guidelines: ${levelGuide}

All ${lang.name} text must be authentic. Return ONLY the JSON array, no markdown.`;

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
        const errorBody = await aiResponse.text().catch(() => 'no body');
        console.warn(`[seed-ex] AI error for desc ${desc.descriptor_number}: ${aiResponse.status} - ${errorBody.slice(0, 200)}`);
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
        console.warn(`[seed-ex] Parse error for desc ${desc.descriptor_number}`);
        continue;
      }

      if (!Array.isArray(exercises)) continue;

      // Insert each valid exercise
      for (const ex of exercises) {
        const exerciseType = ex.type;
        if (!['multiple_choice', 'cloze', 'word_order'].includes(exerciseType)) continue;

        // Validate based on type
        if (exerciseType === 'multiple_choice' && (!ex.question || !Array.isArray(ex.options) || ex.options.length !== 4)) continue;
        if (exerciseType === 'cloze' && (!ex.text || !ex.correctAnswer)) continue;
        if (exerciseType === 'word_order' && (!Array.isArray(ex.words) || !Array.isArray(ex.correctOrder))) continue;

        const eloMap: Record<string, number> = {
          'Pre-A1': 700, 'A1': 900, 'A2': 1050, 'A2+': 1100,
          'B1': 1300, 'B1+': 1350, 'B2': 1450, 'B2+': 1500,
          'C1': 1700, 'C2': 1900,
        };

        const { error } = await supabaseAdmin.from('descriptor_exercises').insert({
          descriptor_id: desc.id,
          language_id: lang.id,
          exercise_type: exerciseType,
          difficulty_elo: eloMap[desc.level] || 1200,
          content_json: ex,
          status: 'active',
        });

        if (error) {
          console.error(`[seed-ex] Insert error:`, error);
        } else {
          created++;
        }
      }

      console.log(`[seed-ex] Created exercises for desc #${desc.descriptor_number} \"${desc.scale}\" (${desc.level})`);
    } catch (err) {
      console.warn(`[seed-ex] Error for desc ${desc.descriptor_number}:`, err);
      continue;
    }
  }

  const nextExOffset = exOffset + exBatchSize;

  // Self-chain for next batch
  if (autoChain && descriptors.length === exBatchSize) {
    const selfUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/seed-descriptors`;
    EdgeRuntime.waitUntil(
      fetch(selfUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          generateExercises: true,
          languageCode,
          exerciseOffset: nextExOffset,
          exerciseBatchSize: exBatchSize,
          autoChain: true,
        }),
      })
    );
  }

  return new Response(JSON.stringify({
    created,
    skipped,
    language: lang.name,
    descriptorsProcessed: descriptors.length,
    exerciseOffset: exOffset,
    nextExerciseOffset: nextExOffset,
    autoChaining: autoChain && descriptors.length === exBatchSize,
    message: `Exercises: ${created} created, ${skipped} skipped for descriptors ${exOffset}-${exOffset + descriptors.length - 1}`,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getLevelGuide(level: string): string {
  const guides: Record<string, string> = {
    'Pre-A1': 'Absolute beginner: single words, gestures, visual recognition',
    'A1': 'Very basic: greetings, numbers, colors, simple nouns',
    'A2': 'Elementary: daily routines, shopping, past tense',
    'A2+': 'Elementary+: slightly more complex daily interactions',
    'B1': 'Intermediate: opinions, plans, conditionals',
    'B1+': 'Strong intermediate: more detailed explanations and arguments',
    'B2': 'Upper intermediate: abstract topics, passive voice, idioms',
    'B2+': 'Strong upper intermediate: complex discussions',
    'C1': 'Advanced: complex grammar, nuanced expressions',
    'C2': 'Mastery: subtle distinctions, literary references, rare vocabulary',
  };
  return guides[level] || 'Intermediate level content';
}
