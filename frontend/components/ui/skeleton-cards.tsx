'use client';

/**
 * Skeleton Card Components for Loading States
 * Premium shimmer effect for professional loading experience
 */
import { cn } from '@/lib/utils';

// Base skeleton with shimmer effect
function SkeletonShimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-white/5",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// Video card skeleton
export function VideoCardSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden border border-white/10">
      {/* Thumbnail */}
      <SkeletonShimmer className="aspect-video w-full" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <SkeletonShimmer className="h-5 w-3/4 rounded" />
        
        {/* Description */}
        <SkeletonShimmer className="h-4 w-full rounded" />
        <SkeletonShimmer className="h-4 w-2/3 rounded" />
        
        {/* Meta */}
        <div className="flex items-center justify-between pt-2">
          <SkeletonShimmer className="h-4 w-20 rounded" />
          <SkeletonShimmer className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonShimmer className="h-4 w-24 rounded" />
          <SkeletonShimmer className="h-8 w-16 rounded" />
        </div>
        <SkeletonShimmer className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}

// Credit balance skeleton
export function CreditBalanceSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <SkeletonShimmer className="h-5 w-5 rounded-full" />
      <SkeletonShimmer className="h-5 w-12 rounded" />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/5">
      <SkeletonShimmer className="h-10 w-10 rounded" />
      <div className="flex-1 space-y-2">
        <SkeletonShimmer className="h-4 w-1/3 rounded" />
        <SkeletonShimmer className="h-3 w-1/4 rounded" />
      </div>
      <SkeletonShimmer className="h-6 w-20 rounded-full" />
      <SkeletonShimmer className="h-8 w-8 rounded" />
    </div>
  );
}

// Dashboard stats skeleton grid
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  );
}

// Video list skeleton
export function VideoListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonShimmer className="h-4 w-20 rounded" />
        <SkeletonShimmer className="h-10 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <SkeletonShimmer className="h-4 w-24 rounded" />
        <SkeletonShimmer className="h-10 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <SkeletonShimmer className="h-4 w-28 rounded" />
        <SkeletonShimmer className="h-24 w-full rounded-md" />
      </div>
      <SkeletonShimmer className="h-10 w-32 rounded-md" />
    </div>
  );
}

// User card skeleton
export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 glass rounded-xl">
      <SkeletonShimmer className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonShimmer className="h-5 w-32 rounded" />
        <SkeletonShimmer className="h-4 w-48 rounded" />
      </div>
    </div>
  );
}

export { SkeletonShimmer };
