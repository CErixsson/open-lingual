import { useNavigate } from 'react-router-dom';
import { useLessonsByLanguageCode, groupLessonsByCefr, getCefrLabels } from '@/hooks/useCourses';
import { useI18n } from '@/i18n';
import { getCefrColor } from '@/lib/elo';
import { ChevronDown, ChevronRight, BookOpen, Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

interface LessonsSectionProps {
  languageCode: string;
  languageName: string;
  flagEmoji: string | null;
}

export default function LessonsSection({ languageCode, languageName, flagEmoji }: LessonsSectionProps) {
  const { locale } = useI18n();
  const cefrLabels = getCefrLabels(locale);
  const { data: lessons, isLoading } = useLessonsByLanguageCode(languageCode);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['A1', 'A2']));

  const lessonLevels = lessons ? groupLessonsByCefr(lessons) : [];

  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (lessonLevels.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-primary" />
        {flagEmoji} {languageName} – Lektioner
      </h2>
      <div className="space-y-4">
        {lessonLevels.map(({ level, lessons: levelLessons }) => {
          const cefrColor = getCefrColor(level);
          const isExpanded = expandedLevels.has(level);

          return (
            <div
              key={level}
              className="rounded-2xl border border-border/50 bg-card shadow-soft overflow-hidden"
            >
              <button
                onClick={() => toggleLevel(level)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-bold px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: `hsl(${cefrColor} / 0.15)`,
                      color: `hsl(${cefrColor})`,
                    }}
                  >
                    {level}
                  </span>
                  <span className="font-semibold">{cefrLabels[level]}</span>
                  <span className="text-sm text-muted-foreground">
                    {levelLessons.length} {locale === 'sv' ? 'lektioner' : 'lessons'}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {levelLessons.map((lesson: any) => {
                      const exerciseCount = Array.isArray(lesson.exercises) ? lesson.exercises.length : 0;
                      return (
                        <Card key={lesson.id} className="hover:shadow-card transition-shadow">
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-start gap-2 mb-2">
                              <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm leading-tight line-clamp-2">
                                  {lesson.title}
                                </p>
                                {lesson.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {exerciseCount} övningar
                              </Badge>
                              {lesson.tags?.map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
