import { useI18n } from '@/i18n';
import type { ExerciseBlock as ExerciseBlockType } from '@/pages/LessonEditor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface ExerciseBlockProps {
  block: ExerciseBlockType;
  onChange: (updates: Partial<ExerciseBlockType>) => void;
}

export default function ExerciseBlock({ block, onChange }: ExerciseBlockProps) {
  const { t } = useI18n();

  const updateItem = (index: number, updates: any) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ items: newItems });
  };

  const addItem = (template: any) => {
    onChange({ items: [...block.items, template] });
  };

  const removeItem = (index: number) => {
    onChange({ items: block.items.filter((_, i) => i !== index) });
  };

  switch (block.type) {
    case 'multiple_choice':
      return (
        <div className="space-y-3">
          <Input
            placeholder={t('lesson.editor.prompt')}
            value={block.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            aria-label="Question prompt"
          />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{t('lesson.editor.options')}</label>
            {block.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <Checkbox
                  checked={item.correct}
                  onCheckedChange={(v) => updateItem(i, { correct: !!v })}
                  aria-label={`Option ${i + 1} correct`}
                />
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={item.text || ''}
                  onChange={(e) => updateItem(i, { text: e.target.value })}
                  className="flex-1"
                />
                {block.items.length > 2 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="h-8 w-8 p-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => addItem({ text: '', correct: false })}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {t('lesson.editor.addOption')}
            </Button>
          </div>
        </div>
      );

    case 'cloze':
      return (
        <div className="space-y-3">
          <Textarea
            placeholder="Enter text with ___ for blanks (e.g., I ___ to the store yesterday)"
            value={block.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            className="min-h-[80px]"
            aria-label="Cloze text"
          />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Answers (one per blank)</label>
            {block.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                <Input
                  placeholder="Answer"
                  value={item.answer || ''}
                  onChange={(e) => updateItem(i, { answer: e.target.value })}
                  className="flex-1"
                />
                <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="h-8 w-8 p-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => addItem({ answer: '', alternatives: [] })}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Blank
            </Button>
          </div>
        </div>
      );

    case 'match':
      return (
        <div className="space-y-3">
          <Input
            placeholder={t('lesson.editor.prompt')}
            value={block.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            aria-label="Match prompt"
          />
          <div className="space-y-2">
            {block.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Left"
                  value={item.left || ''}
                  onChange={(e) => updateItem(i, { left: e.target.value })}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">↔</span>
                <Input
                  placeholder="Right"
                  value={item.right || ''}
                  onChange={(e) => updateItem(i, { right: e.target.value })}
                  className="flex-1"
                />
                <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="h-8 w-8 p-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => addItem({ left: '', right: '' })}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {t('lesson.editor.addPair')}
            </Button>
          </div>
        </div>
      );

    case 'order_words':
      return (
        <div className="space-y-3">
          <Input
            placeholder={t('lesson.editor.prompt')}
            value={block.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            aria-label="Order prompt"
          />
          <Input
            placeholder={t('lesson.editor.correctSentence')}
            value={block.items[0]?.correctOrder?.join(' ') || ''}
            onChange={(e) => {
              const words = e.target.value.split(' ').filter(Boolean);
              const shuffled = [...words].sort(() => Math.random() - 0.5);
              onChange({ items: [{ correctOrder: words, shuffled }] });
            }}
            aria-label="Correct sentence"
          />
        </div>
      );

    case 'translate':
      return (
        <div className="space-y-3">
          <Input
            placeholder={t('lesson.editor.prompt')}
            value={block.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            aria-label="Translation prompt"
          />
          <Input
            placeholder={t('lesson.editor.sourceText')}
            value={block.items[0]?.sourceText || ''}
            onChange={(e) => updateItem(0, { sourceText: e.target.value })}
            aria-label="Source text"
          />
          <Input
            placeholder={t('lesson.editor.expectedTranslation')}
            value={block.items[0]?.expectedTranslation || ''}
            onChange={(e) => updateItem(0, { expectedTranslation: e.target.value })}
            aria-label="Expected translation"
          />
        </div>
      );

    case 'vocabulary':
      return (
        <div className="space-y-3">
          <Input
            placeholder={t('lesson.editor.prompt')}
            value={block.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            aria-label="Vocabulary prompt"
          />
          {block.items.map((item: any, i: number) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <Input
                placeholder={t('lesson.editor.word')}
                value={item.word || ''}
                onChange={(e) => updateItem(i, { word: e.target.value })}
              />
              <Input
                placeholder={t('lesson.editor.translation')}
                value={item.translation || ''}
                onChange={(e) => updateItem(i, { translation: e.target.value })}
              />
              <div className="flex gap-1">
                <Input
                  placeholder={t('lesson.editor.example')}
                  value={item.example || ''}
                  onChange={(e) => updateItem(i, { example: e.target.value })}
                  className="flex-1"
                />
                <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="h-9 w-8 p-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => addItem({ word: '', translation: '', example: '' })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Word
          </Button>
        </div>
      );

    case 'text':
      return (
        <Textarea
          placeholder={t('lesson.editor.textContent')}
          value={block.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          className="min-h-[100px]"
          aria-label="Text content"
        />
      );

    case 'audio':
      return (
        <div className="space-y-3">
          <Input
            placeholder={t('lesson.editor.audioUrl')}
            value={block.media?.audio || ''}
            onChange={(e) => onChange({ media: { ...block.media, audio: e.target.value } })}
            aria-label="Audio URL"
          />
          <Input
            placeholder={t('lesson.editor.prompt')}
            value={block.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            aria-label="Audio caption"
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-3">
          <Input
            placeholder={t('lesson.editor.imageUrl')}
            value={block.media?.image || ''}
            onChange={(e) => onChange({ media: { ...block.media, image: e.target.value } })}
            aria-label="Image URL"
          />
          <Input
            placeholder={t('lesson.editor.prompt')}
            value={block.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            aria-label="Image caption"
          />
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">Unknown block type: {block.type}</p>;
  }
}
