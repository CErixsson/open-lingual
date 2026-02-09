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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('Starting seed...');

    // 1. Create demo users
    const users = [
      { email: 'admin@demo.com', password: 'Demo1234!', name: 'Demo Admin', roles: ['admin', 'learner'] },
      { email: 'reviewer@demo.com', password: 'Demo1234!', name: 'Demo Reviewer', roles: ['reviewer', 'learner'] },
      { email: 'author@demo.com', password: 'Demo1234!', name: 'Demo Author', roles: ['author', 'learner'] },
      { email: 'learner@demo.com', password: 'Demo1234!', name: 'Demo Learner', roles: ['learner'] },
    ];

    const createdUsers: Record<string, string> = {};

    for (const u of users) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

      let userId: string;
      if (existing) {
        userId = existing.id;
        console.log(`User ${u.email} already exists: ${userId}`);
      } else {
        const { data: created, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.name },
        });
        if (error) {
          console.error(`Failed to create user ${u.email}:`, error.message);
          continue;
        }
        userId = created.user.id;
        console.log(`Created user ${u.email}: ${userId}`);
      }
      createdUsers[u.email] = userId;

      // Assign roles
      for (const role of u.roles) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert(
            { user_id: userId, role: role as any },
            { onConflict: 'user_id,role' }
          );
        if (roleError) {
          console.error(`Failed to assign role ${role} to ${u.email}:`, roleError.message);
        }
      }
    }

    const authorId = createdUsers['author@demo.com'];
    const learnerId = createdUsers['learner@demo.com'];

    if (!authorId) {
      return new Response(JSON.stringify({ ok: false, code: 'NO_AUTHOR', message: 'Author user not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Create demo lessons
    const demoLessons = [
      {
        language: 'es',
        level: 'A1',
        title: 'Spanish Basics: Greetings',
        description: 'Learn essential Spanish greetings and introductions.',
        tags: ['greetings', 'basics', 'conversation'],
        objectives: ['Greet people in Spanish', 'Introduce yourself', 'Ask simple questions'],
        status: 'published',
        exercises: [
          {
            id: crypto.randomUUID(),
            type: 'multiple_choice',
            prompt: 'What does "Hola" mean in English?',
            items: [
              { text: 'Hello', correct: true },
              { text: 'Goodbye', correct: false },
              { text: 'Thank you', correct: false },
              { text: 'Please', correct: false },
            ],
          },
          {
            id: crypto.randomUUID(),
            type: 'match',
            prompt: 'Match the Spanish greetings with their English translations:',
            items: [
              { left: 'Buenos días', right: 'Good morning' },
              { left: 'Buenas tardes', right: 'Good afternoon' },
              { left: 'Buenas noches', right: 'Good evening' },
            ],
          },
        ],
        author_id: authorId,
        license: 'CC-BY-SA-4.0',
      },
      {
        language: 'fr',
        level: 'A2',
        title: 'French: At the Market',
        description: 'Vocabulary and phrases for shopping at a French market.',
        tags: ['shopping', 'vocabulary', 'food'],
        objectives: ['Name common fruits and vegetables in French', 'Ask for prices', 'Make purchases'],
        status: 'published',
        exercises: [
          {
            id: crypto.randomUUID(),
            type: 'vocabulary',
            prompt: 'Learn these market vocabulary words:',
            items: [
              { word: 'pomme', translation: 'apple', example: 'Je voudrais trois pommes.' },
              { word: 'fromage', translation: 'cheese', example: 'Ce fromage est délicieux.' },
              { word: 'pain', translation: 'bread', example: 'Une baguette de pain, s\'il vous plaît.' },
            ],
          },
          {
            id: crypto.randomUUID(),
            type: 'translate',
            prompt: 'Translate to French:',
            items: [{ sourceText: 'How much does it cost?', expectedTranslation: 'Combien ça coûte ?' }],
          },
        ],
        author_id: authorId,
        license: 'CC-BY-SA-4.0',
      },
      {
        language: 'en',
        level: 'B1',
        title: 'English: Past Tenses',
        description: 'Master the use of simple past, past continuous, and past perfect.',
        tags: ['grammar', 'tenses', 'past'],
        objectives: ['Distinguish between past tenses', 'Use correct tense in context', 'Identify time markers'],
        status: 'published',
        exercises: [
          {
            id: crypto.randomUUID(),
            type: 'cloze',
            prompt: 'Fill in the correct past tense: I ___ (walk) to school when it ___ (start) to rain.',
            items: [
              { answer: 'was walking', alternatives: [] },
              { answer: 'started', alternatives: [] },
            ],
          },
          {
            id: crypto.randomUUID(),
            type: 'multiple_choice',
            prompt: 'Which sentence uses the past perfect correctly?',
            items: [
              { text: 'She had finished dinner before he arrived.', correct: true },
              { text: 'She has finished dinner before he arrived.', correct: false },
              { text: 'She finished dinner before he had arrived.', correct: false },
            ],
          },
        ],
        author_id: authorId,
        license: 'CC-BY-SA-4.0',
      },
      {
        language: 'de',
        level: 'B2',
        title: 'German: Business Communication',
        description: 'Professional vocabulary and email writing in German.',
        tags: ['business', 'writing', 'formal'],
        objectives: ['Write formal emails in German', 'Use professional vocabulary', 'Understand business etiquette'],
        status: 'draft',
        exercises: [
          {
            id: crypto.randomUUID(),
            type: 'order_words',
            prompt: 'Arrange the words to form a formal email opening:',
            items: [{
              correctOrder: ['Sehr', 'geehrte', 'Damen', 'und', 'Herren'],
              shuffled: ['und', 'geehrte', 'Herren', 'Sehr', 'Damen'],
            }],
          },
          {
            id: crypto.randomUUID(),
            type: 'translate',
            prompt: 'Translate to German:',
            items: [{
              sourceText: 'I look forward to hearing from you.',
              expectedTranslation: 'Ich freue mich auf Ihre Antwort.',
            }],
          },
        ],
        author_id: authorId,
        license: 'CC-BY-SA-4.0',
      },
    ];

    // Insert lessons (upsert to avoid duplicates on re-run)
    const insertedLessonIds: string[] = [];
    for (const lesson of demoLessons) {
      // Check if lesson already exists
      const { data: existing } = await supabase
        .from('lessons')
        .select('id')
        .eq('title', lesson.title)
        .eq('author_id', authorId)
        .maybeSingle();

      if (existing) {
        insertedLessonIds.push(existing.id);
        console.log(`Lesson "${lesson.title}" already exists: ${existing.id}`);
        continue;
      }

      const { data, error } = await supabase
        .from('lessons')
        .insert(lesson)
        .select('id')
        .single();

      if (error) {
        console.error(`Failed to create lesson "${lesson.title}":`, error.message);
        continue;
      }
      insertedLessonIds.push(data.id);
      console.log(`Created lesson "${lesson.title}": ${data.id}`);
    }

    // 3. Create learner progress (for published lessons)
    if (learnerId && insertedLessonIds.length > 0) {
      const progressData = insertedLessonIds.slice(0, 3).map((lessonId, i) => ({
        user_id: learnerId,
        lesson_id: lessonId,
        completion_percent: [65, 100, 30][i] ?? 0,
        xp: [120, 200, 45][i] ?? 0,
        streak_days: 5,
        last_activity_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      }));

      for (const p of progressData) {
        const { error } = await supabase
          .from('learner_progress')
          .upsert(p, { onConflict: 'user_id,lesson_id' });
        if (error) {
          console.error('Failed to create progress:', error.message);
        }
      }
      console.log('Learner progress created');
    }

    // 4. Create a submission in "submitted" state for the draft lesson
    const draftLesson = demoLessons.find(l => l.status === 'draft');
    if (draftLesson && authorId) {
      const { data: draftLessonData } = await supabase
        .from('lessons')
        .select('id')
        .eq('title', draftLesson.title)
        .eq('author_id', authorId)
        .maybeSingle();

      if (draftLessonData) {
        // Update to in_review
        await supabase.from('lessons').update({ status: 'in_review' }).eq('id', draftLessonData.id);

        const { data: existingSub } = await supabase
          .from('submissions')
          .select('id')
          .eq('lesson_id', draftLessonData.id)
          .maybeSingle();

        if (!existingSub) {
          const { error } = await supabase.from('submissions').insert({
            lesson_id: draftLessonData.id,
            author_id: authorId,
            state: 'submitted',
            notes: 'Ready for review - please check the business vocabulary and formal email examples.',
          });
          if (error) {
            console.error('Failed to create submission:', error.message);
          } else {
            console.log('Submission created for reviewer queue');
          }
        }
      }
    }

    console.log('Seed completed!');

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Demo data seeded successfully!',
        users: Object.keys(createdUsers),
        lessons: insertedLessonIds.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ ok: false, code: 'SEED_ERROR', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
