'use client';

import React from 'react';
import { Flame, Zap, Trophy, Crown, Mountain, Footprints, Award, Lock, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Map string icon names to Lucide components
const IconMap: { [key: string]: any } = {
    Flame,
    Zap,
    Fire: Flame, // Fallback if Fire not imported or same as Flame
    Trophy,
    Crown,
    Mountain,
    Footprints,
    Award,
    Star
};

interface Badge {
    id: string;
    code: string;
    name: string;
    description: string;
    icon_name: string;
    category: string;
}

interface UserBadge {
    badge_id: string;
    earned_at: string;
}

interface BadgeListProps {
    badges: Badge[];
    userBadges: UserBadge[];
}

export default function BadgeList({ badges, userBadges }: BadgeListProps) {
    const { user } = useAuth();
    const isNeon = user?.equipped_theme === 'theme-neon';
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

    // Group by category if needed, or just list
    const sortedBadges = [...badges].sort((a, b) => {
        const aEarned = earnedBadgeIds.has(a.id);
        const bEarned = earnedBadgeIds.has(b.id);
        // Show earned first
        if (aEarned && !bEarned) return -1;
        if (!aEarned && bEarned) return 1;
        return 0;
    });

    return (
        <div className={cn(
            "rounded-3xl p-6 sm:p-8 border shadow-sm space-y-8",
            isNeon ? "bg-white/5 border-white/5" : "bg-white border-slate-100"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Achievements</span>
                </div>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                    {userBadges.length} / {badges.length}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {sortedBadges.map((badge) => {
                    const isEarned = earnedBadgeIds.has(badge.id);
                    const Icon = IconMap[badge.icon_name] || Star;

                    return (
                        <div
                            key={badge.id}
                            className={cn(
                                "relative p-4 rounded-2xl border transition-all duration-300 group min-w-0",
                                isEarned
                                    ? (isNeon ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50/30 border-indigo-100/50 hover:shadow-md")
                                    : (isNeon ? "bg-white/[0.02] border-white/5 opacity-40 grayscale" : "bg-slate-50 border-slate-100 opacity-60 grayscale")
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-inner",
                                isEarned
                                    ? (isNeon ? "bg-indigo-600/20 text-indigo-400" : "bg-white text-indigo-600")
                                    : (isNeon ? "bg-black/20 text-slate-600" : "bg-slate-200 text-slate-400")
                            )}>
                                {isEarned ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                            </div>

                            <h3 className={cn(
                                "font-bold text-[11px] sm:text-xs mb-1 truncate",
                                isEarned ? (isNeon ? "text-white" : "text-slate-900") : "text-slate-500"
                            )}>
                                {badge.name}
                            </h3>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 leading-tight line-clamp-2">
                                {badge.description}
                            </p>

                            {isEarned && (
                                <div className="absolute top-2 right-2">
                                    <div className="bg-amber-400 rounded-full p-0.5 shadow-sm overflow-hidden">
                                        <div className="bg-white/40 rounded-full p-px" />
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
