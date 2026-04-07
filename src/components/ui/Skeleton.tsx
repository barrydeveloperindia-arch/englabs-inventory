import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={cn("animate-pulse bg-neutral-200 dark:bg-white/5 rounded", className)} />
    );
};

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm">
                        <Skeleton className="w-10 h-10 rounded-xl mb-4" />
                        <Skeleton className="w-24 h-3 mb-2" />
                        <Skeleton className="w-32 h-8" />
                    </div>
                ))}
            </div>

            {/* Charts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <Skeleton className="w-48 h-6" />
                        <Skeleton className="w-24 h-4" />
                    </div>
                    <Skeleton className="w-full h-full rounded-xl" />
                </div>
                <div className="lg:col-span-1 bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm h-[400px]">
                    <Skeleton className="w-32 h-6 mb-6" />
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="w-3/4 h-3" />
                                    <Skeleton className="w-1/2 h-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
