/**
 * 4-Phase Lesson Model
 * 
 * Phase 1 – Build (Input): Vocabulary, grammar, examples
 * Phase 2 – Controlled Practice: MCQ, cloze, reordering
 * Phase 3 – Guided Production: Open response with hints
 * Phase 4 – Free Performance: Open production, evaluated
 * 
 * Descriptors are NEVER tested directly.
 * They are validated outcomes achieved through performance.
 */

export interface VocabularyItem {
  term: string;
  translation: string;
  example: string;
}

export interface VocabularyBlock {
  id: string;
  type: 'vocabulary';
  items: VocabularyItem[];
}

export interface TextBlock {
  id: string;
  type: 'text';
  content: string;
}

export interface MultipleChoiceBlock {
  id: string;
  type: 'multiple_choice';
  prompt: string;
  items: { text: string; correct: boolean }[];
}

export interface ClozeBlock {
  id: string;
  type: 'cloze';
  prompt: string;
  items: { answer: string; alternatives?: string[] }[];
}

export interface OrderWordsBlock {
  id: string;
  type: 'order_words';
  prompt: string;
  items: { text: string; order: number }[];
}

export interface OpenResponseBlock {
  id: string;
  type: 'open_response';
  prompt: string;
  hints: string[];
  required_grammar: string[];
  min_words: number;
  evaluation_criteria?: {
    grammar_weight: number;
    vocabulary_weight: number;
    structure_weight: number;
    fluency_weight: number;
  };
}

export type PhaseBlock =
  | VocabularyBlock
  | TextBlock
  | MultipleChoiceBlock
  | ClozeBlock
  | OrderWordsBlock
  | OpenResponseBlock;

export interface LessonPhase {
  phase: 1 | 2 | 3 | 4;
  type: 'build' | 'controlled_practice' | 'guided_production' | 'free_performance';
  title: string;
  blocks: PhaseBlock[];
}

export interface PhasedLesson {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
  tags: string[];
  objectives: string[];
  descriptor_ids: number[];
  phases: LessonPhase[];
  version: string;
  license: string;
}

export interface PerformanceEvaluation {
  grammar_accuracy: number;   // 0-100
  lexical_diversity: number;  // 0-100
  complexity_score: number;   // 0-100
  fluency_score: number;      // 0-100
  overall_score: number;      // 0-100
  details: {
    grammar_errors: string[];
    vocabulary_used: string[];
    sentence_count: number;
    word_count: number;
    connector_count: number;
  };
}

export interface DescriptorOutcome {
  descriptor_id: number;
  descriptor_text: string;
  achieved: boolean;
  score: number;
  thresholds_met: {
    grammar: boolean;
    vocabulary: boolean;
    complexity: boolean;
    success_count: boolean;
  };
}
