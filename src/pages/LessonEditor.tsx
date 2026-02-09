import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { useLesson, useCreateLesson, useUpdateLesson } from '@/hooks/useLessons';
import { useCreateSubmission } from '@/hooks/useSubmissions';
import Header from '@/components/Header';
import BlockEditor from '@/components/lesson-editor/BlockEditor';
import LessonPreview from '@/components/lesson-editor/LessonPreview';
import ValidationPanel from '@/components/lesson-editor/ValidationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Send, Download, Upload, Loader2, ArrowLeft, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface ExerciseBlock {
  id: string;
  type: 'multiple_choice' | 'cloze' | 'match' | 'order_words' | 'translate' | 'listen_repeat' | 'text' | 'vocabulary' | 'audio' | 'image';
  prompt: string;
  items: any[];
  media?: { image?: string; audio?: string };
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru', 'hi', 'sv', 'nl', 'pl', 'tr'];

export default function LessonEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const { t } = useI18n();

  const isNew = !id || id === 'new';
  const { data: existing } = useLesson(isNew ? null : id);
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const createSubmission = useCreateSubmission();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [tags, setTags] = useState('');
  const [objectives, setObjectives] = useState('');
  const [exercises, setExercises] = useState<ExerciseBlock[]>([]);
  const [version, setVersion] = useState('1.0.0');
  const [rightPanel, setRightPanel] = useState<'preview' | 'validation'>('preview');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') navigate('/auth');
  }, [status, navigate]);

  // Load existing lesson data
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description || '');
      setLanguage(existing.language);
      setLevel(existing.level);
      setTags(existing.tags?.join(', ') || '');
      setObjectives(existing.objectives?.join('\n') || '');
      setExercises(Array.isArray(existing.exercises) ? (existing.exercises as unknown as ExerciseBlock[]) : []);
      setVersion(existing.version);
    }
  }, [existing]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const lessonData = {
        title: title.trim(),
        description: description.trim() || null,
        language,
        level,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        objectives: objectives.split('\n').map(o => o.trim()).filter(Boolean),
        exercises: exercises as any,
        version,
        author_id: user.id,
      };

      if (isNew) {
        const created = await createLesson.mutateAsync(lessonData);
        toast.success('Lesson created!');
        navigate(`/lessons/${created.id}/edit`, { replace: true });
      } else {
        await updateLesson.mutateAsync({ id: id!, ...lessonData });
        toast.success('Lesson saved!');
      }
    } catch (e: any) {
      console.error('Save failed:', e);
      toast.error(e.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || isNew || !id) return;
    try {
      await handleSave();
      await createSubmission.mutateAsync({ lessonId: id, authorId: user.id });
      toast.success('Submitted for review!');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to submit.');
    }
  };

  const handleExportJson = () => {
    const data = {
      title, description, language, level,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      objectives: objectives.split('\n').map(o => o.trim()).filter(Boolean),
      exercises, version, license: 'CC-BY-SA-4.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-${title.toLowerCase().replace(/\s+/g, '-') || 'untitled'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.language) setLanguage(data.language);
        if (data.level) setLevel(data.level);
        if (data.tags) setTags(Array.isArray(data.tags) ? data.tags.join(', ') : '');
        if (data.objectives) setObjectives(Array.isArray(data.objectives) ? data.objectives.join('\n') : '');
        if (data.exercises) setExercises(data.exercises);
        if (data.version) setVersion(data.version);
        toast.success('Lesson imported!');
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    input.click();
  };

  const lessonForPreview = {
    title, description, language, level,
    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    objectives: objectives.split('\n').map(o => o.trim()).filter(Boolean),
    exercises, version, license: 'CC-BY-SA-4.0',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} aria-label={t('common.back')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold">
              {isNew ? t('lesson.editor.newLesson') : t('lesson.editor.editLesson')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleImportJson} aria-label={t('lesson.editor.importJson')}>
              <Upload className="w-4 h-4 mr-1" /> {t('lesson.editor.importJson')}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportJson} aria-label={t('lesson.editor.exportJson')}>
              <Download className="w-4 h-4 mr-1" /> {t('lesson.editor.exportJson')}
            </Button>
            <Button onClick={handleSave} disabled={saving} aria-label={t('lesson.editor.saveDraft')}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              {t('lesson.editor.saveDraft')}
            </Button>
            {!isNew && (
              <Button variant="hero" onClick={handleSubmit} disabled={saving} aria-label={t('lesson.editor.submit')}>
                <Send className="w-4 h-4 mr-1" /> {t('lesson.editor.submit')}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Editor */}
          <div className="space-y-4">
            {/* Metadata */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
              <Input
                placeholder={t('lesson.editor.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
                aria-label="Lesson title"
              />
              <Textarea
                placeholder={t('lesson.editor.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px]"
                aria-label="Lesson description"
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger aria-label={t('lesson.editor.selectLanguage')}>
                    <SelectValue placeholder={t('lesson.editor.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => (
                      <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger aria-label={t('lesson.editor.selectLevel')}>
                    <SelectValue placeholder={t('lesson.editor.selectLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => (
                      <SelectItem key={l} value={l}>{t(`lesson.levels.${l}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder={t('lesson.editor.tags')}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                aria-label="Tags"
              />
              <Textarea
                placeholder={t('lesson.editor.objectives')}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                className="min-h-[60px]"
                aria-label="Objectives"
              />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t('lesson.editor.version')}: {version}</span>
                <span>{t('lesson.editor.license')}: CC-BY-SA-4.0</span>
              </div>
            </div>

            {/* Block editor */}
            <BlockEditor exercises={exercises} onChange={setExercises} />
          </div>

          {/* Right: Preview / Validation */}
          <div className="space-y-4">
            <Tabs value={rightPanel} onValueChange={(v) => setRightPanel(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="preview" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" /> {t('lesson.editor.preview')}
                </TabsTrigger>
                <TabsTrigger value="validation" className="flex-1">
                  <AlertCircle className="w-4 h-4 mr-1" /> {t('lesson.editor.validation')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <LessonPreview lesson={lessonForPreview} />
              </TabsContent>
              <TabsContent value="validation">
                <ValidationPanel lesson={lessonForPreview} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
