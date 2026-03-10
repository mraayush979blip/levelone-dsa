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
                <Loader2 className="h-12 w-12 text-white animate-spin" />
                <p className="text-zinc-500 font-mono text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Syncing Core Analytics...</p>
            </div>
        );
    }

    const { stats, retentionData } = dashboardData!;

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-white">Dashboard Overview</h2>
                <div className="text-xs md:text-sm font-medium text-zinc-400 bg-zinc-900 px-2 py-1 md:px-3 rounded-full border border-zinc-800">
                    Last sync: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-zinc-900/50 backdrop-blur-md rounded-xl shadow-sm border border-zinc-800 p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-semibold text-zinc-400 uppercase">Total Students</p>
                            <p className="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">
                                {stats.totalStudents}
                            </p>
                        </div>
                        <div className="bg-zinc-800 rounded-lg p-2 md:p-3 shrink-0">
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-zinc-300" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md rounded-xl shadow-sm border border-zinc-800 p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-semibold text-zinc-400 uppercase">Active Students</p>
                            <p className="text-2xl md:text-3xl font-bold text-emerald-400 mt-1 md:mt-2">
                                {stats.activeStudents}
                            </p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-lg p-2 md:p-3 shrink-0">
                            <Shield className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md rounded-xl shadow-sm border border-zinc-800 p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-semibold text-zinc-400 uppercase">Revoked Students</p>
                            <p className="text-2xl md:text-3xl font-bold text-rose-400 mt-1 md:mt-2">
                                {stats.revokedStudents}
                            </p>
                        </div>
                        <div className="bg-rose-500/10 rounded-lg p-2 md:p-3 shrink-0">
                            <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md rounded-xl shadow-sm border border-zinc-800 p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-semibold text-zinc-400 uppercase">Live Phases</p>
                            <p className="text-2xl md:text-3xl font-bold text-zinc-100 mt-1 md:mt-2">
                                {stats.livePhases}
                            </p>
                        </div>
                        <div className="bg-zinc-800 rounded-lg p-2 md:p-3 shrink-0">
                            <Layers className="w-5 h-5 md:w-6 md:h-6 text-zinc-300" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Retention Stats */}
                <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-md rounded-xl shadow-sm border border-zinc-800 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h3 className="text-base md:text-lg font-bold text-white flex items-center">
                            <BarChart3 className="mr-2 h-4 w-4 md:h-5 md:w-5 text-zinc-400" />
                            Student Retention Analysis
                        </h3>
                    </div>

                    {retentionData && (
                        <div className="space-y-6">
                            <div className="flex items-end justify-between">
                                <div className="space-y-4 flex-1">
                                    <div className="relative pt-1 max-w-sm">
                                        <div className="flex mb-2 items-center justify-between">
                                            <div>
                                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-zinc-300 bg-zinc-800">
                                                    Retention Rate
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold inline-block text-zinc-300 font-bold">
                                                    {retentionData.retention_percent}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-zinc-800">
                                            <div style={{ width: `${retentionData.retention_percent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-zinc-900 justify-center bg-zinc-400"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-800/50 rounded-lg p-4 font-bold">
                                            <p className="text-xs text-zinc-500 uppercase">Retained</p>
                                            <p className="text-xl font-bold text-white">{retentionData.retained_count}</p>
                                        </div>
                                        <div className="bg-zinc-800/50 rounded-lg p-4 font-bold">
                                            <p className="text-xs text-zinc-500 uppercase">Dropped/Revoked</p>
                                            <p className="text-xl font-bold text-white">{retentionData.revoked_count}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden sm:flex flex-col items-center justify-center p-8 bg-zinc-800/50 border border-zinc-700 rounded-2xl">
                                    <TrendingUp className="h-12 w-12 text-zinc-400 mb-2" />
                                    <span className="text-2xl font-black text-white">{retentionData.retention_percent}%</span>
                                    <span className="text-xs text-zinc-500 font-medium">Efficiency</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-zinc-900/50 backdrop-blur-md rounded-xl shadow-sm border border-zinc-800 p-4 md:p-6 font-bold">
                    <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link href="/admin/phases/new" className="w-full flex items-center justify-between p-3 md:p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group border border-zinc-700/50 hover:border-zinc-600">
                            <div className="flex items-center">
                                <Plus className="h-4 w-4 md:h-5 md:w-5 text-white mr-2 md:mr-3 shrink-0" />
                                <span className="text-xs md:text-sm font-bold text-zinc-200">Create New Phase</span>
                            </div>
                            <span className="text-zinc-500 group-hover:text-white transition-colors">→</span>
                        </Link>

                        <Link href="/admin/student-import" className="w-full flex items-center justify-between p-3 md:p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group border border-zinc-700/50 hover:border-zinc-600">
                            <div className="flex items-center">
                                <Upload className="h-4 w-4 md:h-5 md:w-5 text-white mr-2 md:mr-3 shrink-0" />
                                <span className="text-xs md:text-sm font-bold text-zinc-200">Import Students</span>
                            </div>
                            <span className="text-zinc-500 group-hover:text-white transition-colors">→</span>
                        </Link>

                        <Link href="/admin/students" className="w-full flex items-center justify-between p-3 md:p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group border border-zinc-700/50 hover:border-zinc-600">
                            <div className="flex items-center">
                                <Users className="h-4 w-4 md:h-5 md:w-5 text-white mr-2 md:mr-3 shrink-0" />
                                <span className="text-xs md:text-sm font-bold text-zinc-200">View All Students</span>
                            </div>
                            <span className="text-zinc-500 group-hover:text-white transition-colors">→</span>
                        </Link>

                        <button
                            onClick={handleSyncRevocation}
                            disabled={isSyncing}
                            className="w-full flex items-center justify-between p-3 md:p-4 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all group mt-2 md:mt-4 border border-rose-500/20 disabled:opacity-50"
                        >
                            <div className="flex items-center">
                                {isSyncing ? (
                                    <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-rose-400 mr-2 md:mr-3 animate-spin shrink-0" />
                                ) : (
                                    <ShieldAlert className="h-4 w-4 md:h-5 md:w-5 text-rose-400 mr-2 md:mr-3 shrink-0" />
                                )}
                                <span className="text-xs md:text-sm font-bold text-rose-400">
                                    {isSyncing ? 'Syncing...' : 'Sync Revocations'}
                                </span>
                            </div>
                            {!isSyncing && <span className="text-rose-500/50 group-hover:text-rose-400 transition-colors">↻</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
