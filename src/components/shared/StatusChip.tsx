import { useI18n } from '@/i18n';

type LessonStatus = 'draft' | 'in_review' | 'approved' | 'published';

const statusStyles: Record<LessonStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_review: 'bg-secondary/20 text-secondary-foreground',
  approved: 'bg-primary/15 text-primary',
  published: 'bg-primary/25 text-primary font-semibold',
};

interface StatusChipProps {
  status: string;
  className?: string;
}

export default function StatusChip({ status, className = '' }: StatusChipProps) {
  const { t } = useI18n();
  const style = statusStyles[status as LessonStatus] || statusStyles.draft;
  const label = t(`lesson.status.${status}`) || status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
