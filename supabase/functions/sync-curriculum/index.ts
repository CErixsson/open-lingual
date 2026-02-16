import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/CErixsson/open-lingual/main/public/data/curriculum";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const body = await req.json().catch(() => ({}));
  const syncTypes: string[] = body.types || [
    "descriptors",
    "lessons",
    "scenarios",
  ];
  const results: Record<string, unknown> = {};

  try {
    // --- DESCRIPTORS ---
    if (syncTypes.includes("descriptors")) {
      const res = await fetch(`${GITHUB_RAW_BASE}/descriptors.json`);
      if (res.ok) {
        const descriptors = await res.json();
        let upserted = 0;
        for (const d of descriptors) {
          const { error } = await supabase
            .from("cefr_descriptors")
            .upsert(
              {
                id: d.id,
                level: d.level,
                scale: d.scale,
                activity: d.activity,
                scheme: d.scheme,
                mode: d.mode || null,
                descriptor_number: d.descriptor_number,
                descriptor_text: d.descriptor_text,
              },
              { onConflict: "id" }
            );
          if (!error) upserted++;
        }
        results.descriptors = { total: descriptors.length, upserted };
      }
    }

    // --- LESSONS ---
    if (syncTypes.includes("lessons")) {
      // Fetch languages to know which folders to scan
      const langRes = await fetch(`${GITHUB_RAW_BASE}/languages.json`);
      if (langRes.ok) {
        const languages = await langRes.json();
        let lessonsUpserted = 0;
        const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

        for (const lang of languages) {
          for (const level of levels) {
            // Try to fetch an index or known lesson files
            // GitHub raw doesn't support directory listing, so we use
            // a manifest approach: lessons/{lang}/{level}/index.json
            const indexUrl = `${GITHUB_RAW_BASE}/lessons/${lang.code}/${level}/index.json`;
            const indexRes = await fetch(indexUrl);
            if (!indexRes.ok) continue;

            const fileList: string[] = await indexRes.json();
            for (const file of fileList) {
              const lessonUrl = `${GITHUB_RAW_BASE}/lessons/${lang.code}/${level}/${file}`;
              const lessonRes = await fetch(lessonUrl);
              if (!lessonRes.ok) continue;

              const lesson = await lessonRes.json();
              // Upsert lesson with phases support
              const { error } = await supabase.from("lessons").upsert(
                {
                  id: lesson.id,
                  title: lesson.title,
                  description: lesson.description || null,
                  language: lesson.language,
                  level: lesson.level,
                  tags: lesson.tags || [],
                  objectives: lesson.objectives || [],
                  exercises: lesson.exercises || [],
                  phases: lesson.phases || [],
                  descriptor_ids: lesson.descriptor_ids || [],
                  version: lesson.version || "1.0.0",
                  license: lesson.license || "CC-BY-SA-4.0",
                  status: "published",
                  author_id: "00000000-0000-0000-0000-000000000000",
                },
                { onConflict: "id" }
              );
              if (!error) {
                lessonsUpserted++;

                // Sync descriptor mappings if present
                if (lesson.descriptor_ids?.length) {
                  for (const descId of lesson.descriptor_ids) {
                    await supabase.from("lesson_descriptor_map").upsert(
                      {
                        lesson_id: lesson.id,
                        descriptor_id: descId,
                        is_primary: lesson.descriptor_ids.indexOf(descId) === 0,
                      },
                      { onConflict: "lesson_id,descriptor_id" }
                    );
                  }
                }
              }
            }
          }
        }
        results.lessons = { upserted: lessonsUpserted };
      }
    }

    // --- SCENARIOS ---
    if (syncTypes.includes("scenarios")) {
      const langRes = await fetch(`${GITHUB_RAW_BASE}/languages.json`);
      if (langRes.ok) {
        const languages = await langRes.json();
        let scenariosUpserted = 0;

        // Get language ID map
        const { data: dbLangs } = await supabase
          .from("languages")
          .select("id, code");
        const langMap = Object.fromEntries(
          (dbLangs || []).map((l: any) => [l.code, l.id])
        );

        for (const lang of languages) {
          const url = `${GITHUB_RAW_BASE}/scenarios/${lang.code}/scenarios.json`;
          const res = await fetch(url);
          if (!res.ok) continue;

          const scenarios = await res.json();
          const languageId = langMap[lang.code];
          if (!languageId) continue;

          for (const s of scenarios) {
            const { error } = await supabase.from("scenarios").upsert(
              {
                id: s.id,
                title: s.title,
                description: s.description || null,
                language_id: languageId,
                cefr_target: s.cefr_target,
                topic: s.topic,
                difficulty_elo: s.difficulty_elo || 1200,
                grammar_targets: s.grammar_targets || [],
                vocabulary_clusters: s.vocabulary_clusters || [],
                cultural_notes: s.cultural_notes || null,
              },
              { onConflict: "id" }
            );
            if (!error) scenariosUpserted++;
          }
        }
        results.scenarios = { upserted: scenariosUpserted };
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("sync-curriculum error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
