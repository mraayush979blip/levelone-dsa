'use client';

import { supabase } from '@/lib/supabase';
import { Phase } from '@/types/database';
import {
    Clock,
    Trophy,
    Zap,
    Lock,
    Sparkles,
    CheckCircle2,
    Target,
    LayoutDashboard,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getPhaseStatus, cn } from '@/lib/utils';
import AnimatedBackground from '@/components/ui/animated-background';
import { StaggerContainer, StaggerItem, SlideUp } from '@/components/ui/motion-wrapper';
import GlassCard from '@/components/ui/glass-card';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function StudentDashboard() {
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();

    const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
        queryKey: ['student-dashboard', user?.id],
        queryFn: async () => {
            const { data: isRevoked } = await supabase.rpc('check_and_revoke_self');
            if (isRevoked) {
                window.location.href = '/revoked';
                return null;
            }

            const [streakResult, phasesResult, userResult, submissionsResult, activityResult] = await Promise.all([
                supabase.rpc('update_student_streak', { student_uuid: user?.id }),
                supabase.from('phases').select('*').eq('is_active', true).order('phase_number', { ascending: true }),
                supabase.from('users').select('total_time_spent_seconds, points, equipped_theme').eq('id', user?.id).single(),
                supabase.from('submissions').select('phase_id').eq('student_id', user?.id),
                supabase.from('student_phase_activity').select('total_time_spent_seconds').eq('student_id', user?.id)
            ]);

            const phases = phasesResult.data || [];
            const submissionIds = new Set((submissionsResult.data || []).map((s: any) => s.phase_id));
            const totalLearningTime = (activityResult.data || []).reduce((acc: number, curr: any) => acc + (curr.total_time_spent_seconds || 0), 0);

            return {
                phases,
                submissions: submissionIds,
                stats: {
                    completedCount: submissionsResult.data?.length || 0,
                    totalTimeSeconds: totalLearningTime,
                    points: userResult.data?.points || 0
                },
                userMetadata: userResult.data
            };
        },
        enabled: !!user?.id,
        staleTime: 60 * 1000,
    });

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const loading = authLoading || dashboardLoading;
    const phases = dashboardData?.phases || [];
    const submissions = dashboardData?.submissions || new Set<string>();
    const stats = dashboardData?.stats || { completedCount: 0, totalTimeSeconds: 0, points: 0 };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-pulse overflow-hidden">
                <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-[2rem]" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-900 rounded-[2rem]" />)}
                    </div>
                    <div className="space-y-8">
                        <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-[2rem]" />
                    </div>
                </div>
            </div>
        );
    }

    const livePhasesCount = phases.filter((p: Phase) => getPhaseStatus(p.start_date, p.end_date, p.is_paused) === 'live').length;

    return (
        <div className="relative min-h-[calc(100vh-80px)] font-sans">
            <AnimatedBackground theme={user?.equipped_theme} />

            <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 space-y-12 relative z-10">
                {/* Clean Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-card-border">
                    <SlideUp>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 text-primary">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">{getGreeting()}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-[-0.03em] leading-tight text-foreground">
                                Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.name?.split(' ')[0] || 'Student'}</span>
                            </h1>
                            <p className="text-lg text-muted font-medium">Ready to continue your specialization today?</p>
                        </div>
                    </SlideUp>

                    <SlideUp delay={0.1}>
                        <div className="flex items-center gap-10">
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Academic Points</p>
                                <div className="flex items-center gap-2 justify-end text-foreground">
                                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="text-2xl font-black">{stats.points || 0}</span>
                                </div>
                            </div>
                            <div className="h-12 w-px bg-card-border" />
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Time Dedicated</p>
                                <div className="flex items-center gap-2 justify-end text-2xl font-black text-foreground">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>{formatDuration(stats.totalTimeSeconds)}</span>
                                </div>
                            </div>
                        </div>
                    </SlideUp>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Timeline */}
                    <div className="lg:col-span-2 space-y-8">
                        <SlideUp delay={0.2} className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                                <LayoutDashboard className="w-5 h-5 text-primary" />
                                Your Specialization Path
                            </h2>
                            <span className="text-[11px] font-bold uppercase tracking-widest bg-card border border-card-border px-3 py-1 rounded-full text-muted">{phases.length} Phases Available</span>
                        </SlideUp>

                        <StaggerContainer className="grid grid-cols-1 gap-6">
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
                                            onMouseEnter={() => {
                                                if (!isLocked) {
                                                    queryClient.prefetchQuery({
                                                        queryKey: ['phase', phase.id],
                                                        queryFn: async () => {
                                                            const { data } = await supabase.from('phases').select('*').eq('id', phase.id).single();
                                                            return data;
                                                        }
                                                    });
                                                }
                                            }}
                                            className={cn(
                                                "group block relative overflow-hidden rounded-[2rem] border transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 gpu-accelerated bg-card",
                                                isLocked
                                                    ? "border-card-border opacity-60 grayscale cursor-not-allowed"
                                                    : "border-card-border hover:border-primary/30 hover:shadow-glow hover:-translate-y-1.5"
                                            )}
                                        >
                                            <div className="flex items-center gap-8 min-w-0">
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-500",
                                                    isLocked ? "bg-card border border-card-border text-muted" :
                                                        isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-primary text-white shadow-xl shadow-primary/20 group-hover:scale-110"
                                                )}>
                                                    {isLocked ? <Lock className="w-6 h-6" /> : isCompleted ? <CheckCircle2 className="w-7 h-7" /> : phase.phase_number}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-xl font-bold tracking-tight mb-1.5 group-hover:text-primary transition-colors truncate text-foreground">
                                                        {phase.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                                                            isLive ? "text-primary" : isCompleted ? "text-emerald-500" : "text-muted"
                                                        )}>
                                                            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                                                            {isPaused ? 'Paused' : isUpcoming ? 'Locked' : isCompleted ? 'Completed' : 'Enrolled'}
                                                        </span>
                                                        <span className="h-1 w-1 rounded-full bg-card-border" />
                                                        <span className="text-[10px] font-bold text-muted">Deadline: {new Date(phase.end_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {!isLocked && (
                                                    <div className="bg-card border border-card-border p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </StaggerItem>
                                );
                            })}
                        </StaggerContainer>
                    </div>

                    {/* Pro Sidebar */}
                    <div className="space-y-10">
                        <SlideUp delay={0.4} className="space-y-8">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                                <Trophy className="w-5 h-5 text-primary" />
                                Performance Metrics
                            </h2>

                            <GlassCard className="!bg-primary border-0 shadow-2xl shadow-primary/20 p-8 rounded-[2rem] overflow-hidden relative group gpu-accelerated">
                                <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:rotate-12 group-hover:scale-125 transition-all duration-700">
                                    <Trophy className="w-40 h-40 text-black/20 dark:text-white/20" />
                                </div>
                                <div className="relative z-10 text-white">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90 mb-2">Overall Completion</p>
                                    <h3 className="text-4xl font-black mb-6">{Math.round((stats.completedCount / (phases.length || 1)) * 100)}%</h3>

                                    <div className="h-2.5 bg-white/30 rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stats.completedCount / (phases.length || 1)) * 100}%` }}
                                            transition={{ duration: 1.2, ease: "circOut", delay: 0.5 }}
                                            className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                                        />
                                    </div>

                                    <div className="mt-6 flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5 opacity-90">
                                            <span className="h-1 w-1 rounded-full bg-white" />
                                            {stats.completedCount} Resolved
                                        </div>
                                        <span className="opacity-90">{phases.length} Total</span>
                                    </div>
                                </div>
                            </GlassCard>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 rounded-[2rem] border border-card-border bg-card flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Target className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Active Phases</p>
                                        <p className="text-2xl font-black text-foreground">{livePhasesCount}</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-[2rem] border border-card-border bg-card flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                                        <Zap className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Upcoming Content</p>
                                        <p className="text-2xl font-black text-foreground">{phases.filter(p => getPhaseStatus(p.start_date, p.end_date, p.is_paused) === 'upcoming').length}</p>
                                    </div>
                                </div>
                            </div>
                        </SlideUp>
                    </div>
                </div>
            </div>
        </div>
    );
}
