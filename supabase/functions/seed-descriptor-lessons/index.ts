import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curated CEFR descriptor scales for lesson generation
const DESCRIPTOR_SCALES = [
  {
    id: 'oral-comprehension',
    title: 'Overall Oral Comprehension',
    skill: 'listening',
    descriptors: {
      A1: 'Can follow language which is very slow and carefully articulated, with long pauses.',
      A2: 'Can understand phrases and expressions related to areas of most immediate priority.',
      B1: 'Can understand main points in clear standard language on familiar matters.',
      B2: 'Can understand main ideas of complex discourse on both concrete and abstract topics.',
      C1: 'Can follow extended discourse on abstract and complex topics beyond their field.',
    },
  },
  {
    id: 'understanding-conversation',
    title: 'Understanding Conversation',
    skill: 'listening',
    descriptors: {
      A1: 'Can understand words and short sentences in a simple conversation.',
      A2: 'Can follow in outline short, simple social exchanges.',
      B1: 'Can generally follow the main points of extended discussion around them.',
      B2: 'Can catch much of what is said around them in discussion.',
      C1: 'Can easily follow complex interactions in group discussion and debate.',
    },
  },
  {
    id: 'announcements-instructions',
    title: 'Understanding Announcements & Instructions',
    skill: 'listening',
    descriptors: {
      A1: 'Can understand instructions addressed carefully and slowly.',
      A2: 'Can catch the main point in short, clear, simple messages.',
      B1: 'Can understand simple technical information for everyday equipment.',
      B2: 'Can understand announcements on concrete and abstract topics at normal speed.',
      C1: 'Can extract specific information from poor quality public announcements.',
    },
  },
  {
    id: 'overall-reading',
    title: 'Overall Reading Comprehension',
    skill: 'reading',
    descriptors: {
      A1: 'Can understand very short, simple texts picking up familiar names, words and basic phrases.',
      A2: 'Can understand short, simple texts containing the highest frequency vocabulary.',
      B1: 'Can read straightforward factual texts on subjects related to their field of interest.',
      B2: 'Can read with a large degree of independence, adapting style and speed.',
      C1: 'Can understand in detail lengthy, complex texts.',
    },
  },
  {
    id: 'reading-correspondence',
    title: 'Reading Correspondence',
    skill: 'reading',
    descriptors: {
      A1: 'Can understand short, simple messages on postcards and via social media.',
      A2: 'Can understand short, simple personal letters.',
      B1: 'Can understand description of events and feelings in personal letters.',
      B2: 'Can read correspondence relating to their field of interest.',
      C1: 'Can understand any correspondence given occasional use of a dictionary.',
    },
  },
  {
    id: 'reading-information',
    title: 'Reading for Information & Argument',
    skill: 'reading',
    descriptors: {
      A1: 'Can get an idea of the content of simpler informational material.',
      A2: 'Can understand texts describing people, places, everyday life and culture.',
      B1: 'Can recognise significant points in straightforward news articles.',
      B2: 'Can understand articles with particular stances or viewpoints.',
      C1: 'Can understand in detail lengthy, complex texts in social, professional or academic life.',
    },
  },
  {
    id: 'reading-instructions',
    title: 'Reading Instructions',
    skill: 'reading',
    descriptors: {
      A1: 'Can follow short, simple written directions.',
      A2: 'Can understand regulations expressed in simple language.',
      B1: 'Can understand clearly written instructions for a piece of equipment.',
      B2: 'Can understand lengthy, complex instructions in their field.',
      C1: 'Can understand in detail lengthy, complex instructions on a new machine or procedure.',
    },
  },
  {
    id: 'overall-oral-production',
    title: 'Overall Oral Production',
    skill: 'speaking',
    descriptors: {
      A1: 'Can produce simple, mainly isolated phrases about people and places.',
      A2: 'Can give a simple description of people, living conditions, daily routines.',
      B1: 'Can reasonably fluently sustain a straightforward description within their field of interest.',
      B2: 'Can give clear, detailed descriptions on a wide range of subjects.',
      C1: 'Can give clear, detailed descriptions on complex subjects, integrating sub-themes.',
    },
  },
  {
    id: 'describing-experience',
    title: 'Describing Experience',
    skill: 'speaking',
    descriptors: {
      A1: 'Can describe themselves, what they do and where they live.',
      A2: 'Can describe their family, living conditions, educational background.',
      B1: 'Can give straightforward descriptions on familiar subjects.',
      B2: 'Can give clear, detailed descriptions on subjects related to their field.',
      C1: 'Can give clear, detailed descriptions of complex subjects.',
    },
  },
  {
    id: 'overall-written-production',
    title: 'Overall Written Production',
    skill: 'writing',
    descriptors: {
      A1: 'Can write simple isolated phrases and sentences.',
      A2: 'Can write a series of simple phrases linked with simple connectors.',
      B1: 'Can write straightforward connected texts on familiar subjects.',
      B2: 'Can write clear, detailed texts on a variety of subjects.',
      C1: 'Can write clear, well-structured texts of complex subjects.',
    },
  },
  {
    id: 'creative-writing',
    title: 'Creative Writing',
    skill: 'writing',
    descriptors: {
      A1: 'Can write simple phrases about themselves and imaginary people.',
      A2: 'Can write about everyday aspects of their environment in linked sentences.',
      B1: 'Can write straightforward, detailed descriptions on familiar subjects.',
      B2: 'Can write clear, detailed descriptions of real or imaginary events.',
      C1: 'Can write clear, detailed, well-structured descriptions and imaginative texts.',
    },
  },
  {
    id: 'overall-oral-interaction',
    title: 'Overall Oral Interaction',
    skill: 'speaking',
    descriptors: {
      A1: 'Can interact in a simple way, dependent on repetition and rephrasing.',
      A2: 'Can communicate in simple and routine tasks requiring a direct exchange.',
      B1: 'Can exploit simple language to deal with most situations whilst travelling.',
      B2: 'Can interact with a degree of fluency and spontaneity.',
      C1: 'Can express themselves fluently and spontaneously, almost effortlessly.',
    },
  },
  {
    id: 'conversation',
    title: 'Conversation Skills',
    skill: 'speaking',
    descriptors: {
      A1: 'Can take part in a simple conversation on a predictable topic.',
      A2: 'Can handle very short social exchanges.',
      B1: 'Can enter unprepared into conversations on familiar topics.',
      B2: 'Can engage in extended conversation on most general topics.',
      C1: 'Can use language flexibly and effectively for social purposes.',
    },
  },
  {
    id: 'informal-discussion',
    title: 'Informal Discussion',
    skill: 'speaking',
    descriptors: {
      A2: 'Can discuss what to do, where to go and make arrangements.',
      B1: 'Can generally follow the main points in an informal discussion.',
      B2: 'Can take an active part in informal discussion in familiar contexts.',
      C1: 'Can easily follow and contribute to complex group discussions.',
    },
  },
  {
    id: 'transactions',
    title: 'Transactions & Services',
    skill: 'speaking',
    descriptors: {
      A1: 'Can ask people for things and give people things.',
      A2: 'Can ask for and provide everyday goods and services.',
      B1: 'Can deal with most transactions whilst travelling.',
      B2: 'Can cope linguistically to negotiate solutions to disputes.',
      C1: 'Can express themselves with clarity and precision, using language flexibly.',
    },
  },
  {
    id: 'vocabulary-range',
    title: 'Vocabulary Range',
    skill: 'vocabulary',
    descriptors: {
      A1: 'Has a very basic range of simple expressions about personal details.',
      A2: 'Has sufficient vocabulary for basic communicative needs.',
      B1: 'Has sufficient vocabulary to express themselves with some circumlocutions.',
      B2: 'Has a good range of vocabulary for matters connected to their field.',
      C1: 'Has a good command of a broad lexical repertoire.',
    },
  },
  {
    id: 'vocabulary-control',
    title: 'Vocabulary Control',
    skill: 'vocabulary',
    descriptors: {
      A2: 'Can control a narrow repertoire dealing with concrete everyday needs.',
      B1: 'Shows good control of elementary vocabulary.',
      B2: 'Lexical accuracy is generally high.',
      C1: 'Occasional minor slips, but no significant vocabulary errors.',
    },
  },
  {
    id: 'grammatical-accuracy',
    title: 'Grammatical Accuracy',
    skill: 'grammar',
    descriptors: {
      A1: 'Shows only limited control of a few simple grammatical structures.',
      A2: 'Uses some simple structures correctly, but still makes basic mistakes.',
      B1: 'Communicates with reasonable accuracy in familiar contexts.',
      B2: 'Shows a relatively high degree of grammatical control.',
      C1: 'Consistently maintains a high degree of grammatical accuracy.',
    },
  },
  {
    id: 'phonological-control',
    title: 'Phonological Control & Pronunciation',
    skill: 'speaking',
    descriptors: {
      A1: 'Pronunciation of a very limited repertoire can be understood with some effort.',
      A2: 'Pronunciation is generally clear enough to be understood.',
      B1: 'Pronunciation is clearly intelligible even if a foreign accent is sometimes evident.',
      B2: 'Has acquired a clear, natural pronunciation and intonation.',
      C1: 'Can vary intonation and place sentence stress correctly.',
    },
  },
  {
    id: 'orthographic-control',
    title: 'Orthographic Control & Spelling',
    skill: 'writing',
    descriptors: {
      A1: 'Can copy familiar words and short phrases.',
      A2: 'Can copy short sentences. Can write short words with reasonable accuracy.',
      B1: 'Can produce writing which is generally intelligible. Spelling and punctuation are mostly accurate.',
      B2: 'Can produce clearly intelligible writing following standard conventions.',
      C1: 'Layout and punctuation are consistent and helpful. Spelling is accurate.',
    },
  },
  {
    id: 'sociolinguistic-appropriateness',
    title: 'Sociolinguistic Appropriateness',
    skill: 'speaking',
    descriptors: {
      A1: 'Can use simplest everyday polite forms of greetings and farewells.',
      A2: 'Can handle very short social exchanges using everyday polite forms.',
      B1: 'Can perform and respond to a wide range of language functions in a neutral register.',
      B2: 'Can express themselves confidently in a formal or informal register.',
      C1: 'Can recognise a wide range of idiomatic expressions and colloquialisms.',
    },
  },
  {
    id: 'coherence-cohesion',
    title: 'Coherence & Cohesion',
    skill: 'writing',
    descriptors: {
      A1: 'Can link words with very basic connectors like "and" or "then".',
      A2: 'Can link groups of words with simple connectors.',
      B1: 'Can link shorter elements into a connected sequence of points.',
      B2: 'Can use a variety of linking words efficiently.',
      C1: 'Can produce clear, smoothly flowing, well-structured text with controlled use of cohesive devices.',
    },
  },
  {
    id: 'information-exchange',
    title: 'Information Exchange',
    skill: 'speaking',
    descriptors: {
      A1: 'Can understand simple questions and follow short directions.',
      A2: 'Can communicate in simple tasks using simple phrases.',
      B1: 'Can exchange, check and confirm factual information on familiar matters.',
      B2: 'Can understand and exchange complex information related to their role.',
      C1: 'Can easily follow and contribute to complex interactions.',
    },
  },
  {
    id: 'written-interaction',
    title: 'Written Interaction',
    skill: 'writing',
    descriptors: {
      A1: 'Can ask for or pass on personal details in written form.',
      A2: 'Can write short, simple notes relating to matters of immediate need.',
      B1: 'Can convey information and ideas on abstract and concrete topics.',
      B2: 'Can express news and views effectively in writing.',
      C1: 'Can express themselves with clarity and precision in writing.',
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetLangCode = body.languageCode || null;
    const scaleOffset = body.scaleOffset || 0; // which batch of scales to process
    const scaleBatchSize = body.scaleBatchSize || 5; // how many scales per call

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

    const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    let totalCreated = 0;
    let totalSkipped = 0;

    // Slice scales for batching
    const scaleBatch = DESCRIPTOR_SCALES.slice(scaleOffset, scaleOffset + scaleBatchSize);
    if (scaleBatch.length === 0) {
      return new Response(JSON.stringify({ message: 'No more scales to process', totalCreated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const lang of langsToSeed) {
      console.log(`[seed-descriptor-lessons] Processing ${lang.name} (${lang.code}), scales ${scaleOffset}-${scaleOffset + scaleBatch.length}`);

      const lessonsToInsert: any[] = [];

      for (const scale of scaleBatch) {
        for (const level of cefrLevels) {
          const descriptor = (scale.descriptors as Record<string, string>)[level];
          if (!descriptor || descriptor.includes('No descriptors')) continue;

          // Generate exercises via AI
          const prompt = `Generate 4 exercises for learning ${lang.name} (code: ${lang.code}) at CEFR level ${level}.
Topic: "${scale.title}"
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
${level === 'A1' ? 'Very basic: greetings, numbers, colors, simple nouns, present tense' : ''}
${level === 'A2' ? 'Elementary: daily routines, shopping, past tense, common adjectives' : ''}
${level === 'B1' ? 'Intermediate: opinions, plans, conditionals, connectors' : ''}
${level === 'B2' ? 'Upper intermediate: abstract topics, passive voice, idioms, formal register' : ''}
${level === 'C1' ? 'Advanced: complex grammar, nuanced expressions, academic vocabulary' : ''}

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
              console.warn(`[seed-descriptor-lessons] AI error for ${scale.id}/${level}: ${aiResponse.status}`);
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
              console.warn(`[seed-descriptor-lessons] Parse error for ${scale.id}/${level}`);
              continue;
            }

            if (!Array.isArray(exercises)) continue;

            // Validate exercises
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
              tags: [scale.skill, scale.id],
              exercises: validExercises,
            });
          } catch (err) {
            console.warn(`[seed-descriptor-lessons] Error for ${scale.id}/${level}:`, err);
            continue;
          }
        }
      }

      // Batch insert lessons
      if (lessonsToInsert.length > 0) {
        const { error, data } = await supabaseAdmin
          .from('lessons')
          .insert(lessonsToInsert)
          .select('id');
        
        if (error) {
          console.error(`[seed-descriptor-lessons] Insert error for ${lang.name}:`, error);
        } else {
          totalCreated += data?.length ?? lessonsToInsert.length;
          console.log(`[seed-descriptor-lessons] Created ${data?.length ?? lessonsToInsert.length} lessons for ${lang.name}`);
        }
      }
    }

    return new Response(JSON.stringify({
      totalCreated,
      totalSkipped,
      languages: langsToSeed.map(l => l.name),
      scales: DESCRIPTOR_SCALES.length,
      message: `Seeded ${totalCreated} descriptor-based lessons`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[seed-descriptor-lessons] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
