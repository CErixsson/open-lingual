import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export default function SkeletonCard({ lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`rounded-2xl border border-border/50 bg-card p-6 space-y-3 ${className}`}>
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
