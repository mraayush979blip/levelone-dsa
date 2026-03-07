'use client';

import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsDisplayProps {
    points: number;
    className?: string;
}

export default function PointsDisplay({ points, className = '' }: PointsDisplayProps) {
    return (
        <div className={cn(
            "flex items-center gap-3 bg-card px-5 py-2.5 rounded-2xl border border-card-border shadow-sm",
            className
        )}>
            <div className="bg-amber-500/10 p-1.5 rounded-lg">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="flex flex-col -space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Total Balance</span>
                <div className="flex items-baseline gap-1">
                    <span className="font-black text-xl tracking-tight text-foreground">
                        {points.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest ml-0.5">
                        PTS
                    </span>
                </div>
            </div>
        </div>
    );
}
