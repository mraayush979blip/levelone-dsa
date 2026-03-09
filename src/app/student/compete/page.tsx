'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Flame, Users, CheckCircle2, Loader2, ArrowLeft, Medal, Zap, Sparkles, Crown, Star, BookOpen, Award } from 'lucide-react';
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
    earned_badges: string[];
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
                    activity_points: entry.activity_points || 0,
                    earned_badges: entry.earned_badges || []
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16 pb-24 relative z-10 text-foreground">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 pb-6 sm:pb-8 border-b border-card-border">
                <SlideUp>
                    <div className="space-y-3 sm:space-y-4">
                        <Link href="/student" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors">
                            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Dashboard
                        </Link>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Community</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                                Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Rankings</span>
                            </h1>
                            <p className="text-sm sm:text-base text-muted font-medium max-w-lg">Challenge yourself and fellow students. Every submission counts towards your journey.</p>
                        </div>
                    </div>
                </SlideUp>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
                {/* Left: Stats & Badges */}
                <div className="lg:col-span-4 space-y-8 sm:space-y-12">
                    <StaggerContainer>
                        {/* Streak Card - Minimalist */}
                        <StaggerItem>
                            <div className="relative group bg-slate-900 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-2xl will-change-transform">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Flame className="h-24 sm:h-32 w-24 sm:w-32" />
                                </div>
                                <div className="relative z-10 space-y-4 sm:space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-orange-500 rounded-lg">
                                            <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-white text-white" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-orange-200">Current Streak</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl sm:text-7xl font-black tabular-nums tracking-tighter">{user?.current_streak || 0}</span>
                                        <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400">Days Active</span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs font-medium text-slate-400 leading-relaxed">
                                        Consistent progress beats intensity. Your all-time best is <span className="text-white">{user?.max_streak || 0} days</span>.
                                    </p>
                                </div>
                            </div>
                        </StaggerItem>

                        {/* Community Progress */}
                        <StaggerItem>
                            <div className="bg-card rounded-3xl p-6 sm:p-8 border border-card-border shadow-sm space-y-6 sm:space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Community Progress</span>
                                    </div>
                                </div>

                                <div className="space-y-5 sm:space-y-6">
                                    {phaseStats.map((stat) => (
                                        <div key={stat.phase_number} className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-bold text-foreground">Phase {stat.phase_number}</span>
                                                <span className="text-[9px] sm:text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                    {stat.completed_count} SUCCESSFUL
                                                </span>
                                            </div>
                                            <div className="w-full bg-card border border-card-border rounded-full h-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(stat.completed_count / (totalStudents || 1)) * 100}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
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
                    <div className="bg-card rounded-[2rem] sm:rounded-[2.5rem] border border-card-border shadow-sm flex flex-col overflow-hidden">
                        <div className="p-6 sm:p-10 border-b border-card-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted">Global Leaderboard (Top 5)</span>
                            </div>
                        </div>

                        <div className="divide-y divide-card-border">
                            {leaderboard.slice(0, 5).map((entry, index) => (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    key={entry.id}
                                    className={cn(
                                        "p-4 sm:p-8 flex items-center justify-between hover:bg-card/50 transition-colors group will-change-transform",
                                        entry.id === user?.id && "bg-primary/5 ring-1 ring-inset ring-primary/20"
                                    )}
                                >
                                    <div className="flex items-center gap-3 sm:gap-8 min-w-0">
                                        <div className="w-6 sm:w-8 flex-shrink-0 text-center relative group-hover:scale-110 transition-transform">
                                            {index === 0 ? (
                                                <div className="relative flex justify-center">
                                                    <Crown className="h-7 w-7 sm:h-9 sm:w-9 text-amber-500 fill-amber-500 shadow-glow" />
                                                    <span className="absolute -bottom-1 text-[8px] font-black text-amber-600 bg-white/80 px-1 rounded-full border border-amber-200">#1</span>
                                                </div>
                                            ) : index < 3 ? (
                                                <div className="relative flex justify-center">
                                                    <Medal className={cn(
                                                        "h-6 w-6 sm:h-8 sm:w-8 transition-transform group-hover:scale-110",
                                                        index === 1 ? "text-slate-400" : "text-orange-500"
                                                    )} />
                                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-white pb-0.5">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs sm:text-sm font-black text-slate-300 dark:text-slate-700">{index + 1}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-card flex-shrink-0 flex items-center justify-center text-xl sm:text-2xl shadow-inner border border-card-border">
                                                {entry.avatar}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                                    <p className="font-bold text-sm sm:text-base text-foreground truncate">{entry.name}</p>
                                                    {entry.id === user?.id && (
                                                        <span className="text-[7px] sm:text-[8px] font-black bg-primary text-white px-1.5 py-0.5 rounded uppercase tracking-widest flex-shrink-0">YOU</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted">
                                                    <span className="flex items-center gap-1 sm:gap-1.5">
                                                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-500" />
                                                        <span className="truncate">{entry.completed_phases || 0}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1 sm:gap-1.5">
                                                        <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 fill-amber-500" />
                                                        <span>{entry.activity_points || 0}</span>
                                                    </span>
                                                    {entry.earned_badges && entry.earned_badges.length > 0 && (
                                                        <span className="flex items-center gap-0.5 sm:gap-1 border-l border-card-border pl-2 sm:pl-3 ml-1">
                                                            {entry.earned_badges.slice(0, 5).map((iconName, i) => {
                                                                if (iconName === 'Flame') return <Flame key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-500" />;
                                                                if (iconName === 'Star') return <Star key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500" />;
                                                                if (iconName === 'BookOpen') return <BookOpen key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500" />;
                                                                if (iconName === 'Award') return <Award key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-500" />;
                                                                return <Sparkles key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-fuchsia-500" />;
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 ml-4">
                                        <div className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 bg-card rounded-full border border-card-border">
                                            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-muted">LVL</span>
                                            <span className="text-xs sm:text-sm font-black text-foreground">{Math.floor((entry.completed_phases || 0) / 1) + 1}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* User Standing Section - Always show if not in top 5 */}
                            {(!leaderboard.slice(0, 5).some(e => e.id === user?.id)) && leaderboard.find(e => e.id === user?.id) && (
                                <div className="bg-primary/5 border-t border-card-border">
                                    <div className="px-6 sm:px-10 py-3 sm:py-4 bg-primary/10 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-primary text-center border-b border-card-border">
                                        Your Standing
                                    </div>
                                    {(() => {
                                        const userEntry = leaderboard.find(e => e.id === user?.id);
                                        const userRank = leaderboard.findIndex(e => e.id === user?.id) + 1;
                                        if (!userEntry) return null;
                                        return (
                                            <div className="p-4 sm:p-8 flex items-center justify-between bg-primary/5">
                                                <div className="flex items-center gap-3 sm:gap-8 min-w-0">
                                                    <div className="w-6 sm:w-8 flex-shrink-0 text-center">
                                                        <span className="text-xs sm:text-sm font-black text-primary">#{userRank}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-card flex-shrink-0 flex items-center justify-center text-xl sm:text-2xl border border-card-border">
                                                            {userEntry.avatar}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm sm:text-base text-foreground truncate">{userEntry.name}</p>
                                                            <div className="flex items-center gap-3 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted">
                                                                <span className="flex items-center gap-1">
                                                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                                                    {userEntry.completed_phases}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Zap className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                                                                    {userEntry.activity_points}
                                                                </span>
                                                                {userEntry.earned_badges && userEntry.earned_badges.length > 0 && (
                                                                    <span className="flex items-center gap-0.5 border-l border-card-border pl-2 ml-1">
                                                                        {userEntry.earned_badges.slice(0, 5).map((iconName, i) => {
                                                                            if (iconName === 'Flame') return <Flame key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-500" />;
                                                                            if (iconName === 'Star') return <Star key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500" />;
                                                                            if (iconName === 'BookOpen') return <BookOpen key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500" />;
                                                                            if (iconName === 'Award') return <Award key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-500" />;
                                                                            return <Sparkles key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-fuchsia-500" />;
                                                                        })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-card px-3 py-1 rounded-full border border-card-border text-[9px] font-black text-foreground">
                                                    LVL {Math.floor(userEntry.completed_phases / 1) + 1}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {leaderboard.length === 0 && (
                                <div className="py-20 sm:py-32 text-center space-y-4">
                                    <div className="bg-card w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto border border-card-border">
                                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted" />
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted">The arena is empty. Start the movement.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
