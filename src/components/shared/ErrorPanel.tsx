import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

interface ErrorPanelProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  const { t } = useI18n();

  return (
    <div
      className="flex flex-col items-center justify-center py-8 px-6 text-center rounded-2xl border border-destructive/30 bg-destructive/5"
      role="alert"
    >
      <AlertTriangle className="w-8 h-8 text-destructive mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-destructive mb-3">
        {message || t('common.error')}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
