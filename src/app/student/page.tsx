'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Phase } from '@/types/database';
import {
    BookOpen,
    Video,
    Clock,
    ChevronRight,
    Trophy,
    Zap,
    Lock,
    Star,
    Gift,
    Calendar,
    Sparkles,
    Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getPhaseStatus, cn } from '@/lib/utils';
import AnimatedBackground from '@/components/ui/animated-background';
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from '@/components/ui/motion-wrapper';
import GlassCard from '@/components/ui/glass-card';
import GiftUnboxing from '@/components/gamification/GiftUnboxing';

export default function StudentDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ completedCount: 0, totalTimeSeconds: 0, points: 0 });
    const [submissions, setSubmissions] = useState<Set<string>>(new Set());
    const [showGift, setShowGift] = useState(false);

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            if (phases.length === 0) setLoading(true);
            try {
                const { data: isRevoked, error: revokeError } = await supabase.rpc('check_and_revoke_self');
                if (!revokeError && isRevoked) {
                    window.location.href = '/revoked';
                    return;
                }

                const [, phasesResult, userResult, submissionsResult, activityResult] = await Promise.all([
                    supabase.rpc('update_student_streak', { student_uuid: user.id }),
                    supabase.from('phases').select('*').eq('is_active', true).order('phase_number', { ascending: true }),
                    supabase.from('users').select('total_time_spent_seconds, points').eq('id', user.id).single(),
                    supabase.from('submissions').select('phase_id').eq('student_id', user.id),
                    supabase.from('student_phase_activity').select('total_time_spent_seconds').eq('student_id', user.id)
                ]);

                if (phasesResult.error) throw phasesResult.error;

                setPhases(phasesResult.data || []);
                const submissionIds = new Set((submissionsResult.data || []).map((s: any) => s.phase_id));
                setSubmissions(submissionIds);
                const totalLearningTime = (activityResult.data || []).reduce((acc: number, curr: any) => acc + (curr.total_time_spent_seconds || 0), 0);

                setStats({
                    completedCount: submissionsResult.data?.length || 0,
                    totalTimeSeconds: totalLearningTime,
                    points: userResult.data?.points || 0
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) fetchDashboardData();
    }, [user, phases.length]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const isEligibleForGift = stats.completedCount >= 2 && user?.equipped_theme !== 'theme-neon';
    const isNeon = user?.equipped_theme === 'theme-neon';

    const DashboardSkeleton = () => (
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 animate-pulse">
            <div className="h-48 bg-gray-100 dark:bg-gray-800/50 rounded-3xl w-full" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-50 dark:bg-gray-900/30 rounded-2xl" />)}
            </div>
            <div className="space-y-6">
                <div className="h-8 bg-gray-100 dark:bg-gray-800/50 rounded w-48" />
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 dark:bg-gray-900/30 rounded-2xl w-full" />)}
            </div>
        </div>
    );

    if (loading || authLoading) return <DashboardSkeleton />;

    const livePhasesCount = phases.filter((p: Phase) => getPhaseStatus(p.start_date, p.end_date, p.is_paused) === 'live').length;

    return (
        <div className={cn("relative min-h-screen transition-colors duration-500", isNeon ? "bg-gray-950 text-white" : "bg-white text-slate-900")}>
            <AnimatedBackground theme={user?.equipped_theme} />

            {/* Gift Icon Button - Minimalist */}
            {isEligibleForGift && (
                <button
                    onClick={() => setShowGift(true)}
                    className="fixed bottom-28 right-6 sm:bottom-8 sm:right-8 z-[60] group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 hide-scrollbar will-change-transform"
                >
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs sm:text-sm font-bold tracking-tight">Open Gift</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                </button>
            )}

            {showGift && user && (
                <GiftUnboxing
                    userId={user.id}
                    userName={user.name}
                    onUnlock={() => window.location.reload()}
                    onClose={() => setShowGift(false)}
                />
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16 relative z-10">

                {/* Profile Header - Minimalist */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 pb-6 sm:pb-8 border-b border-gray-100 dark:border-white/5">
                    <SlideUp>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{getGreeting()}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{user?.name?.split(' ')[0] || 'Student'}</span>
                            </h1>
                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">Ready to continue your learning journey?</p>
                        </div>
                    </SlideUp>

                    <SlideUp delay={0.1}>
                        <div className="flex items-center gap-5 sm:gap-6 text-slate-400 dark:text-slate-500">
                            <div className="text-right">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Current Points</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
                                    <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{(stats as any).points || 0}</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-gray-100 dark:bg-white/5" />
                            <div className="text-right">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Time Spent</p>
                                <div className="flex items-center gap-2 justify-end text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                                    <span>{formatDuration(stats.totalTimeSeconds)}</span>
                                </div>
                            </div>
                        </div>
                    </SlideUp>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 sm:gap-12">
                    {/* Main Content - Phases */}
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                        <SlideUp delay={0.2} className="flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-3">
                                <Video className="w-5 h-5 text-indigo-500" />
                                Active Phases
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{phases.length} Total</span>
                        </SlideUp>

                        <StaggerContainer className="grid grid-cols-1 gap-4">
                            {phases.map((phase: Phase) => {
                                const status = getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused);
                                const isLive = status === 'live';
                                const isPaused = status === 'paused';
                                const isUpcoming = status === 'upcoming';
                                const isLocked = isPaused || isUpcoming;
                                const isCompleted = submissions.has(phase.id);

                                return (
                                    <StaggerItem key={phase.id}>
                                        <Link
                                            href={isLocked ? '#' : `/student/phase/${phase.id}`}
                                            className={cn(
                                                "group block relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 will-change-transform",
                                                isLocked
                                                    ? "bg-slate-50 dark:bg-white/5 border-gray-100 dark:border-white/5 grayscale opacity-60 cursor-not-allowed"
                                                    : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                                            )}
                                        >
                                            <div className="p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
                                                <div className="flex items-center gap-4 sm:gap-6">
                                                    <div className={cn(
                                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black transition-transform group-hover:scale-110 shadow-sm",
                                                        isLocked ? "bg-slate-200 text-slate-400" :
                                                            isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                                                    )}>
                                                        {isLocked ? <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> : isCompleted ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : phase.phase_number}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-base sm:text-lg font-bold tracking-tight mb-0.5 sm:mb-1 group-hover:text-indigo-500 transition-colors truncate">
                                                            {phase.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn(
                                                                "text-[9px] sm:text-[10px] font-black uppercase tracking-widest",
                                                                isLive ? "text-indigo-500" : isCompleted ? "text-emerald-500" : "text-slate-400"
                                                            )}>
                                                                {isPaused ? 'Paused' : isUpcoming ? 'Locked' : isCompleted ? 'Phase Completed' : 'In Progress'}
                                                            </span>
                                                            {!phase.is_mandatory && <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">Optional</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">
                                                    {!isLocked && (
                                                        <>
                                                            <span className="text-xs font-semibold hidden sm:block">View Phase</span>
                                                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </StaggerItem>
                                );
                            })}
                        </StaggerContainer>
                    </div>

                    {/* Sidebar - Stats & Info */}
                    <div className="space-y-6 sm:space-y-8">
                        <SlideUp delay={0.4} className="space-y-6">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-3">
                                <Trophy className="w-5 h-5 text-indigo-500" />
                                Your Stats
                            </h2>

                            <GlassCard className="!bg-indigo-600 text-white border-0 shadow-2xl shadow-indigo-500/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl overflow-hidden group will-change-transform">
                                <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Trophy className="w-24 sm:w-32 h-24 sm:h-32" />
                                </div>
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Completion</p>
                                <h3 className="text-3xl sm:text-4xl font-black mb-4">{Math.round((stats.completedCount / (phases.length || 1)) * 100)}%</h3>
                                <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stats.completedCount / (phases.length || 1)) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    />
                                </div>
                                <div className="mt-4 sm:mt-6 flex justify-between text-[10px] sm:text-xs font-bold">
                                    <span>{stats.completedCount} Done</span>
                                    <span>{phases.length} Total</span>
                                </div>
                            </GlassCard>

                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                <GlassCard className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center gap-4 sm:gap-6">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center text-indigo-500">
                                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Active</p>
                                        <p className="text-lg sm:text-xl font-black">{livePhasesCount}</p>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center gap-4 sm:gap-6">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center text-purple-500">
                                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Upcoming</p>
                                        <p className="text-lg sm:text-xl font-black">{phases.filter(p => getPhaseStatus(p.start_date, p.end_date, p.is_paused) === 'upcoming').length}</p>
                                    </div>
                                </GlassCard>
                            </div>
                        </SlideUp>
                    </div>
                </div>
            </div>
        </div>
    );
}
