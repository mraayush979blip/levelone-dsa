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
        <div className="space-y-4 md:space-y-8 font-sans">
            <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight">Dashboard Overview</h2>
                <div className="text-[10px] font-black text-zinc-400 bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-sm uppercase tracking-widest">
                    Last sync: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 p-6 md:p-8 hover:shadow-xl hover:shadow-black/5 transition-all active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Total Students</p>
                            <p className="text-3xl md:text-4xl font-black text-black mt-2">
                                {stats.totalStudents}
                            </p>
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-4 shrink-0 transition-colors">
                            <Users className="w-6 h-6 text-black" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 p-6 md:p-8 hover:shadow-xl hover:shadow-black/5 transition-all active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Active Students</p>
                            <p className="text-3xl md:text-4xl font-black text-emerald-600 mt-2">
                                {stats.activeStudents}
                            </p>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-4 shrink-0 border border-emerald-100">
                            <Shield className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-black rounded-[2rem] shadow-xl shadow-black/10 p-6 md:p-8 hover:scale-[1.02] transition-all active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Revoked Students</p>
                            <p className="text-3xl md:text-4xl font-black text-white mt-2">
                                {stats.revokedStudents}
                            </p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 shrink-0 border border-white/10">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 p-6 md:p-8 hover:shadow-xl hover:shadow-black/5 transition-all active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Live Phases</p>
                            <p className="text-3xl md:text-4xl font-black text-black mt-2">
                                {stats.livePhases}
                            </p>
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-4 shrink-0">
                            <Layers className="w-6 h-6 text-black" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Retention Stats */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 p-8 md:p-10">
                    <div className="flex items-center justify-between mb-8 md:mb-10">
                        <h3 className="text-lg md:text-xl font-black text-black uppercase tracking-widest flex items-center">
                            <BarChart3 className="mr-3 h-5 w-5 text-zinc-400" />
                            Retention Analysis
                        </h3>
                    </div>

                    {retentionData && (
                        <div className="space-y-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                                <div className="space-y-8 flex-1">
                                    <div className="relative pt-1 max-w-sm">
                                        <div className="flex mb-3 items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-black inline-block py-1.5 px-3 uppercase rounded-full text-black bg-zinc-50 tracking-widest border border-zinc-100">
                                                    Retention Rate
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-black tracking-widest">
                                                    {retentionData.retention_percent}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-zinc-50 border border-zinc-100 p-1">
                                            <div style={{ width: `${retentionData.retention_percent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black rounded-full transition-all duration-1000"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 transition-all hover:border-black/5">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Retained Nodes</p>
                                            <p className="text-2xl font-black text-black">{retentionData.retained_count}</p>
                                        </div>
                                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 transition-all hover:border-black/5">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Dropped/Revoked</p>
                                            <p className="text-2xl font-black text-black">{retentionData.revoked_count}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col items-center justify-center p-10 bg-zinc-50 border border-zinc-100 rounded-[2rem] min-w-[180px] shadow-inner">
                                    <TrendingUp className="h-10 w-10 text-zinc-300 mb-3" />
                                    <span className="text-4xl font-black text-black tracking-tighter">{retentionData.retention_percent}%</span>
                                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1">Efficiency</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-200 p-8 md:p-10 font-sans">
                    <h3 className="text-lg md:text-xl font-black text-black uppercase tracking-widest mb-8 md:mb-10">Quick Actions</h3>
                    <div className="space-y-4">
                        <Link href="/admin/phases/new" className="w-full flex items-center justify-between p-5 bg-zinc-50 hover:bg-black rounded-2xl transition-all group border border-zinc-100 hover:border-black active:scale-95 shadow-sm">
                            <div className="flex items-center">
                                <Plus className="h-5 w-5 text-black group-hover:text-white mr-4 shrink-0 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">Create New Phase</span>
                            </div>
                            <span className="text-zinc-300 group-hover:text-white transition-colors">→</span>
                        </Link>

                        <Link href="/admin/student-import" className="w-full flex items-center justify-between p-5 bg-zinc-50 hover:bg-black rounded-2xl transition-all group border border-zinc-100 hover:border-black active:scale-95 shadow-sm">
                            <div className="flex items-center">
                                <Upload className="h-5 w-5 text-black group-hover:text-white mr-4 shrink-0 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">Import Students</span>
                            </div>
                            <span className="text-zinc-300 group-hover:text-white transition-colors">→</span>
                        </Link>

                        <Link href="/admin/students" className="w-full flex items-center justify-between p-5 bg-zinc-50 hover:bg-black rounded-2xl transition-all group border border-zinc-100 hover:border-black active:scale-95 shadow-sm">
                            <div className="flex items-center">
                                <Users className="h-5 w-5 text-black group-hover:text-white mr-4 shrink-0 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">View All Students</span>
                            </div>
                            <span className="text-zinc-300 group-hover:text-white transition-colors">→</span>
                        </Link>

                        <button
                            onClick={handleSyncRevocation}
                            disabled={isSyncing}
                            className="w-full flex items-center justify-between p-5 bg-red-50 hover:bg-red-600 rounded-2xl transition-all group mt-6 border border-red-100 hover:border-red-600 active:scale-95 shadow-lg shadow-red-500/5 disabled:opacity-50"
                        >
                            <div className="flex items-center">
                                {isSyncing ? (
                                    <RefreshCw className="h-5 w-5 text-red-600 group-hover:text-white mr-4 animate-spin shrink-0 transition-colors" />
                                ) : (
                                    <ShieldAlert className="h-5 w-5 text-red-600 group-hover:text-white mr-4 shrink-0 transition-colors" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 group-hover:text-white transition-colors">
                                    {isSyncing ? 'Syncing...' : 'Sync Revocations'}
                                </span>
                            </div>
                            {!isSyncing && <span className="text-red-300 group-hover:text-white transition-colors">↻</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
