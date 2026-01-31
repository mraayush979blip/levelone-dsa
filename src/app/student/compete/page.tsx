'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Flame, Users, CheckCircle2, Loader2, ArrowLeft, Medal, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';
import BadgeList from '@/components/gamification/BadgeList';
import { SlideUp, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
    id: string;
    name: string;
    avatar: string;
    completed_phases: number;
    current_streak: number;
    activity_points: number;
}

interface PhaseStats {
    phase_number: number;
    title: string;
    completed_count: number;
}

interface RankContext {
    rank: number;
    neighbors: {
        id: string;
        name: string;
        avatar: string;
        rank_position: number;
        completed_phases: number;
        current_streak: number;
    }[];
}

export default function CompetePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [phaseStats, setPhaseStats] = useState<PhaseStats[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [badges, setBadges] = useState<any[]>([]);
    const [userBadges, setUserBadges] = useState<any[]>([]);
    const [rankContext, setRankContext] = useState<RankContext | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (user) {
                    await supabase.rpc('update_student_streak', { student_uuid: user.id });
                    const { data: ubData } = await supabase.from('user_badges').select('*').eq('user_id', user.id);
                    setUserBadges(ubData || []);
                    const { data: rankData } = await supabase.rpc('get_student_rank_context', { current_student_id: user.id });
                    setRankContext(rankData);
                }

                const { data: bData } = await supabase.from('badges').select('*');
                setBadges(bData || []);

                const { data: lbData, error: lbError } = await supabase.rpc('get_leaderboard_v2');
                if (lbError) throw lbError;

                const processedLB = (lbData || []).map((entry: any) => ({
                    id: entry.user_id,
                    name: entry.user_name,
                    avatar: entry.user_avatar || '👤',
                    current_streak: entry.current_streak || 0,
                    completed_phases: Number(entry.completed_phases) || 0,
                    activity_points: entry.activity_points || 0
                }));
                setLeaderboard(processedLB);

                const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student');
                setTotalStudents(count || 0);

                const { data: phases } = await supabase.from('phases').select('phase_number, title, id').eq('is_active', true).order('phase_number', { ascending: true });

                if (phases) {
                    const stats = await Promise.all(phases.map(async (p) => {
                        const { count: completedCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('phase_id', p.id).eq('status', 'valid');
                        return { phase_number: p.phase_number, title: p.title, completed_count: completedCount || 0 };
                    }));
                    setPhaseStats(stats);
                }
            } catch (error: any) {
                console.error('❌ [Compete] Global Fetch Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching Standings...</p>
            </div>
        );
    }

    const isNeon = user?.equipped_theme === 'theme-neon';

    return (
        <div className={cn("max-w-6xl mx-auto px-6 py-12 space-y-16 pb-24 relative z-10", isNeon ? "text-white" : "text-slate-900")}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-white/5">
                <SlideUp>
                    <div className="space-y-4">
                        <Link href="/student" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Dashboard
                        </Link>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-500">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Community</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Rankings</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">Challenge yourself and fellow students. Every submission counts towards your journey.</p>
                        </div>
                    </div>
                </SlideUp>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left: Stats & Badges */}
                <div className="lg:col-span-4 space-y-12">
                    <StaggerContainer>
                        {/* Streak Card - Minimalist */}
                        <StaggerItem>
                            <div className="relative group bg-slate-900 rounded-3xl p-8 text-white overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Flame className="h-32 w-32" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-orange-500 rounded-lg">
                                            <Flame className="h-4 w-4 fill-white text-white" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-200">Current Streak</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl font-black tabular-nums tracking-tighter">{user?.current_streak || 0}</span>
                                        <span className="text-sm font-black uppercase tracking-widest text-slate-400">Days Active</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                        Consistent progress beats intensity. Your all-time best is <span className="text-white">{user?.max_streak || 0} days</span>.
                                    </p>
                                </div>
                            </div>
                        </StaggerItem>

                        {/* Community Progress */}
                        <StaggerItem>
                            <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Community Progress</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {phaseStats.map((stat) => (
                                        <div key={stat.phase_number} className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">Phase {stat.phase_number}</span>
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                                    {stat.completed_count} SUCCESSFUL
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-50 dark:bg-black/20 rounded-full h-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(stat.completed_count / (totalStudents || 1)) * 100}%` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    className="bg-indigo-600 h-full rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </StaggerItem>

                        <StaggerItem>
                            <BadgeList badges={badges} userBadges={userBadges} />
                        </StaggerItem>
                    </StaggerContainer>
                </div>

                {/* Right: Leaderboard */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-10 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Global Leaderboard</span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-50 dark:divide-white/5">
                            {leaderboard.map((entry, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={entry.id}
                                    className={cn(
                                        "p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group",
                                        entry.id === user?.id && "bg-indigo-50/50 dark:bg-indigo-500/5 ring-1 ring-inset ring-indigo-100 dark:ring-indigo-500/20"
                                    )}
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="w-8 text-center">
                                            {index < 3 ? (
                                                <div className="relative flex justify-center">
                                                    <Medal className={cn(
                                                        "h-8 w-8 transition-transform group-hover:scale-110",
                                                        index === 0 ? "text-amber-400" : index === 1 ? "text-slate-400" : "text-orange-500"
                                                    )} />
                                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white pb-0.5">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-black text-slate-300 dark:text-slate-700">{index + 1}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-black/40 flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-white/5">
                                                {entry.avatar}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 dark:text-white capitalize leading-none">{entry.name}</p>
                                                    {entry.id === user?.id && (
                                                        <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">YOU</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center mt-2 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                        {entry.completed_phases} Phases
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                        {(entry as any).activity_points || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-black/40 rounded-full border border-slate-100 dark:border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Level</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{Math.floor(entry.completed_phases / 1) + 1}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {rankContext && rankContext.rank > 10 && rankContext.neighbors && (
                                <div className="bg-slate-50 dark:bg-black/20">
                                    <div className="px-10 py-4 bg-slate-100/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">
                                        Your Current Standing
                                    </div>
                                    {rankContext.neighbors.map((neighbor) => (
                                        <div
                                            key={neighbor.id}
                                            className={cn(
                                                "p-8 flex items-center justify-between",
                                                neighbor.id === user?.id ? "bg-indigo-50/50 dark:bg-indigo-500/10" : "opacity-60"
                                            )}
                                        >
                                            <div className="flex items-center gap-8">
                                                <div className="w-8 text-center">
                                                    <span className="text-sm font-black text-slate-400">{neighbor.rank_position}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-xl border border-slate-100 dark:border-white/5">
                                                        {neighbor.avatar || '👤'}
                                                    </div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{neighbor.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {neighbor.completed_phases} Phases
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {leaderboard.length === 0 && (
                                <div className="py-32 text-center space-y-4">
                                    <div className="bg-slate-50 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                        <Users className="h-6 w-6 text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">The arena is empty. Start the movement.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
