'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RetentionStats } from '@/types/database';

import {
    Users,
    Shield,
    ShieldAlert,
    Layers,
    Plus,
    Upload,
    BarChart3,
    TrendingUp,
    Loader2,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const queryClient = useQueryClient();

    const { data: dashboardData, isLoading, refetch } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            // Fetch total students
            const { count: totalStudents } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student');

            // Fetch active students
            const { count: activeStudents } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('status', 'active');

            // Fetch revoked students
            const { count: revokedStudents } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('status', 'revoked');

            // Fetch live phases with inclusive end-of-day logic
            const now = new Date();
            const { data: phases } = await supabase
                .from('phases')
                .select('id, start_date, end_date, is_active, is_paused')
                .eq('is_active', true)
                .eq('is_paused', false);

            const livePhasesCount = phases?.filter(p => {
                const start = new Date(p.start_date);
                const end = new Date(p.end_date);
                end.setHours(23, 59, 59, 999);
                return now >= start && now <= end;
            }).length || 0;

            const total = totalStudents || 0;
            const active = activeStudents || 0;
            const revoked = revokedStudents || 0;
            const retentionPercent = total ? ((active / total) * 100).toFixed(1) : '0';

            return {
                stats: {
                    totalStudents: total,
                    activeStudents: active,
                    revokedStudents: revoked,
                    livePhases: livePhasesCount,
                },
                retentionData: {
                    total_students: total,
                    retained_count: active,
                    revoked_count: revoked,
                    retention_percent: parseFloat(retentionPercent),
                    pie_chart_data: [
                        { name: 'Active', value: active, color: '#10b981' },
                        { name: 'Revoked', value: revoked, color: '#ef4444' },
                    ],
                }
            };
        }
    });

    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncRevocation = async () => {
        if (!confirm('Are you sure you want to sync revocations? This will use the new optimized set-based logic.')) return;

        setIsSyncing(true);
        try {
            const { data, error } = await supabase.rpc('check_and_revoke_students');
            if (error) throw error;

            const { revoked_count, restored_count } = data as { revoked_count: number; restored_count: number };
            alert(`Sync complete!\n- ${revoked_count} students were revoked.\n- ${restored_count} students were restored.`);
            refetch();
        } catch (error) {
            console.error('Error syncing revocations:', error);
            alert('Error syncing revocations: Ensure the updated RPC is installed.');
        } finally {
            setIsSyncing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Loader2 className="h-12 w-12 text-black animate-spin" />
                <p className="text-zinc-400 font-black text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Syncing Core Analytics...</p>
            </div>
        );
    }

    const { stats, retentionData } = dashboardData!;

    return (
        <div className="space-y-12 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mb-2 drop-shadow-[0_0_8px_rgba(var(--theme-primary-rgb),0.5)]">System Core</p>
                    <h1 className="text-4xl font-black text-white tracking-tighter text-glow uppercase">Command Center</h1>
                    <p className="mt-2 text-sm text-zinc-500 font-medium">
                        Real-time analytics and student protocol management.
                    </p>
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span>Synchronized: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-8 group hover:glow-card transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Total Fleet</p>
                            <p className="text-4xl font-black text-white group-hover:text-primary transition-colors">
                                {stats.totalStudents}
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 group-hover:bg-white/10 transition-colors">
                            <Users className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8 group hover:glow-card transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Active Nodes</p>
                            <p className="text-4xl font-black text-emerald-400">
                                {stats.activeStudents}
                            </p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                            <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="glass-card bg-zinc-950/50 p-8 group hover:glow-card transition-all border-red-500/10 active:scale-95">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Severed Links</p>
                            <p className="text-4xl font-black text-red-500">
                                {stats.revokedStudents}
                            </p>
                        </div>
                        <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8 group hover:glow-card transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Live Protocols</p>
                            <p className="text-4xl font-black text-white group-hover:text-primary transition-colors">
                                {stats.livePhases}
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 group-hover:bg-white/10 transition-colors">
                            <Layers className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Retention Stats */}
                <div className="lg:col-span-2 glass-card p-10">
                    <div className="flex items-center justify-between mb-12">
                        <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center">
                            <BarChart3 className="mr-4 h-6 w-6 text-primary" />
                            Fleet Retention Matrix
                        </h3>
                    </div>

                    {retentionData && (
                        <div className="space-y-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                                <div className="space-y-10 flex-1">
                                    <div className="relative pt-1">
                                        <div className="flex mb-4 items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-black inline-block py-2 px-4 uppercase rounded-full text-primary bg-primary/10 tracking-[0.2em] border border-primary/20 shadow-[0_0_15px_rgba(var(--theme-primary-rgb),0.1)]">
                                                    Stability Index
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-black text-white tracking-tighter">
                                                    {retentionData.retention_percent}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-white/5 border border-white/10 p-1">
                                            <div 
                                                style={{ width: `${retentionData.retention_percent}%` }} 
                                                className="shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.4)] flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary rounded-full transition-all duration-1000 animate-pulse"
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/10 hover:border-white/10 transition-all group/stat">
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 group-hover/stat:text-emerald-400 transition-colors">Stable Nodes</p>
                                            <p className="text-4xl font-black text-white">{retentionData.retained_count}</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/10 hover:border-white/10 transition-all group/stat">
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 group-hover/stat:text-red-400 transition-colors">Anomaly Count</p>
                                            <p className="text-4xl font-black text-white">{retentionData.revoked_count}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col items-center justify-center p-12 bg-white/5 border border-white/5 rounded-[3rem] min-w-[220px] shadow-2xl relative overflow-hidden group/efficiency">
                                    <div className="absolute inset-0 bg-primary/5 blur-3xl group-hover/efficiency:bg-primary/10 transition-all" />
                                    <TrendingUp className="h-12 w-12 text-primary mb-4 relative z-10" />
                                    <span className="text-5xl font-black text-white tracking-tighter relative z-10">{retentionData.retention_percent}%</span>
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-2 relative z-10">Efficiency</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-10 flex flex-col">
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-12">Core Tasks</h3>
                    <div className="space-y-4 flex-1">
                        <Link href="/admin/phases/new" className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-primary rounded-[2rem] transition-all group border border-white/5 hover:border-primary active:scale-95 shadow-lg group">
                            <div className="flex items-center">
                                <Plus className="h-5 w-5 text-zinc-400 group-hover:text-white mr-5 shrink-0 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 group-hover:text-white transition-colors">Initialize Phase</span>
                            </div>
                            <span className="text-zinc-600 group-hover:text-white transition-colors text-xl">→</span>
                        </Link>

                        <Link href="/admin/student-import" className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-primary rounded-[2rem] transition-all group border border-white/5 hover:border-primary active:scale-95 shadow-lg group">
                            <div className="flex items-center">
                                <Upload className="h-5 w-5 text-zinc-400 group-hover:text-white mr-5 shrink-0 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 group-hover:text-white transition-colors">Import Fleet</span>
                            </div>
                            <span className="text-zinc-600 group-hover:text-white transition-colors text-xl">→</span>
                        </Link>

                        <Link href="/admin/students" className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-primary rounded-[2rem] transition-all group border border-white/5 hover:border-primary active:scale-95 shadow-lg group">
                            <div className="flex items-center">
                                <Users className="h-5 w-5 text-zinc-400 group-hover:text-white mr-5 shrink-0 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 group-hover:text-white transition-colors">Scan Network</span>
                            </div>
                            <span className="text-zinc-600 group-hover:text-white transition-colors text-xl">→</span>
                        </Link>

                        <button
                            onClick={handleSyncRevocation}
                            disabled={isSyncing}
                            className="w-full flex items-center justify-between p-6 bg-red-500/10 hover:bg-red-600 rounded-[2rem] transition-all group mt-8 border border-red-500/20 hover:border-red-600 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.1)] group disabled:opacity-50"
                        >
                            <div className="flex items-center">
                                {isSyncing ? (
                                    <RefreshCw className="h-5 w-5 text-red-500 group-hover:text-white mr-5 animate-spin shrink-0 transition-colors" />
                                ) : (
                                    <ShieldAlert className="h-5 w-5 text-red-500 group-hover:text-white mr-5 shrink-0 transition-colors" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 group-hover:text-white transition-colors">
                                    {isSyncing ? 'Syncing...' : 'Sync Protocol'}
                                </span>
                            </div>
                            {!isSyncing && <span className="text-red-500/50 group-hover:text-white transition-colors text-xl">↻</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

}
