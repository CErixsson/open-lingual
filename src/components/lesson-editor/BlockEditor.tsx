import { useI18n } from '@/i18n';
import ExerciseBlock from './ExerciseBlock';
import type { ExerciseBlock as ExerciseBlockType } from '@/pages/LessonEditor';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface BlockEditorProps {
  exercises: ExerciseBlockType[];
  onChange: (exercises: ExerciseBlockType[]) => void;
}

const BLOCK_TYPES = [
  { type: 'multiple_choice', labelKey: 'lesson.types.multiple_choice' },
  { type: 'cloze', labelKey: 'lesson.types.cloze' },
  { type: 'match', labelKey: 'lesson.types.match' },
  { type: 'order_words', labelKey: 'lesson.types.order_words' },
  { type: 'translate', labelKey: 'lesson.types.translate' },
  { type: 'text', labelKey: 'lesson.editor.text' },
  { type: 'vocabulary', labelKey: 'lesson.editor.vocabulary' },
] as const;

function generateId() {
  return crypto.randomUUID();
}

function createEmptyBlock(type: string): ExerciseBlockType {
  const base = { id: generateId(), type: type as any, prompt: '', items: [] };

  switch (type) {
    case 'multiple_choice':
      return { ...base, items: [{ text: '', correct: true }, { text: '', correct: false }] };
    case 'cloze':
      return { ...base, items: [{ answer: '', alternatives: [] }] };
    case 'match':
      return { ...base, items: [{ left: '', right: '' }] };
    case 'order_words':
      return { ...base, items: [] };
    case 'translate':
      return { ...base, items: [{ sourceText: '', expectedTranslation: '' }] };
    case 'vocabulary':
      return { ...base, items: [{ word: '', translation: '', example: '' }] };
    default:
      return base;
  }
}

export default function BlockEditor({ exercises, onChange }: BlockEditorProps) {
  const { t } = useI18n();

  const addBlock = (type: string) => {
    onChange([...exercises, createEmptyBlock(type)]);
  };

  const removeBlock = (id: string) => {
    onChange(exercises.filter(e => e.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<ExerciseBlockType>) => {
    onChange(exercises.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Blocks ({exercises.length})
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label={t('lesson.editor.addBlock')}>
              <Plus className="w-4 h-4 mr-1" /> {t('lesson.editor.addBlock')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {BLOCK_TYPES.map(({ type, labelKey }) => (
              <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
                {t(labelKey)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {exercises.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border/50 p-8 text-center text-muted-foreground">
          <p className="text-sm">No blocks yet. Click "{t('lesson.editor.addBlock')}" to start building your lesson.</p>
        </div>
      )}

      {exercises.map((block, index) => (
        <div
          key={block.id}
          className="rounded-xl border border-border/50 bg-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/30">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">
                #{index + 1} · {t(`lesson.types.${block.type}`) || block.type}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeBlock(block.id)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              aria-label={t('lesson.editor.removeBlock')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="p-4">
            <ExerciseBlock block={block} onChange={(updates) => updateBlock(block.id, updates)} />
          </div>
        </div>
      ))}
    </div>
  );
}
