import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const HabitCardSkeleton = () => {
  return (
    <Card className="p-6 dark:bg-gray-900 dark:border-gray-700">
      <div className="space-y-4">
        {/* Header with emoji and name */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full max-w-[200px]" />
            </div>
          </div>
          <Skeleton className="w-12 h-6 rounded-full" />
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};

export const HabitCardSkeletonGrid = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <HabitCardSkeleton key={i} />
      ))}
    </div>
  );
};
