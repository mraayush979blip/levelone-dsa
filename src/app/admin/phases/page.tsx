'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Pause,
    Play,
    Edit2,
    Trash2,
    Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Phase } from '@/types/database';
import { cn, getPhaseStatus } from '@/lib/utils';

export default function PhaseListPage() {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPhases();
    }, []);

    const fetchPhases = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('phases')
                .select('*')
                .order('phase_number', { ascending: true });

            if (error) throw error;
            setPhases(data || []);
        } catch (error) {
            console.error('Error fetching phases:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePause = async (phase: Phase) => {
        try {
            const { error } = await supabase
                .from('phases')
                .update({
                    is_paused: !phase.is_paused,
                    paused_at: !phase.is_paused ? new Date().toISOString() : null
                })
                .eq('id', phase.id);

            if (error) throw error;
            fetchPhases();
        } catch (error) {
            console.error('Error toggling phase status:', error);
        }
    };

    const deletePhase = async (id: string) => {
        if (!confirm('Are you sure you want to delete this phase? This will also delete all student submissions for this phase.')) return;

        try {
            const { error } = await supabase
                .from('phases')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPhases();
        } catch (error) {
            console.error('Error deleting phase:', error);
        }
    };

    const filteredPhases = phases.filter(phase =>
        phase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phase.phase_number.toString().includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Learning Phases</h1>
                    <p className="mt-1 text-sm text-zinc-400 font-medium">
                        Manage your curriculum phases and student deadlines.
                    </p>
                </div>
                <Link
                    href="/admin/phases/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm font-bold text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all transform hover:scale-105"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Create Phase
                </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center px-4 py-3 bg-zinc-900/50 rounded-xl shadow-sm border border-zinc-800 backdrop-blur-sm">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border-0 rounded-md leading-5 bg-transparent placeholder-zinc-500 text-white focus:outline-none focus:ring-0 sm:text-sm"
                        placeholder="Search phases by title or number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Phase Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            ) : filteredPhases.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm backdrop-blur-sm">
                    <Layers className="mx-auto h-12 w-12 text-zinc-600" />
                    <h3 className="mt-2 text-sm font-bold text-white uppercase tracking-wider">No phases found</h3>
                    <p className="mt-1 text-sm text-zinc-400 font-medium">Get started by creating a new learning phase.</p>
                    <div className="mt-6">
                        <Link
                            href="/admin/phases/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm font-bold rounded-lg text-black bg-white hover:bg-zinc-200 transition-all hover:scale-105"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            New Phase
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-zinc-900/50 shadow-xl overflow-hidden rounded-2xl border border-zinc-800 backdrop-blur-sm">
                    <ul className="divide-y divide-zinc-800/50">
                        {filteredPhases.map((phase) => (
                            <li key={phase.id}>
                                <div className="px-4 py-5 flex items-center sm:px-6 hover:bg-zinc-800/50 transition-colors group">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="truncate">
                                            <div className="flex items-center text-sm font-medium truncate">
                                                <span className="bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mr-3">
                                                    Phase {phase.phase_number}
                                                </span>
                                                <span className="text-lg font-black text-white group-hover:text-zinc-200 transition-colors">{phase.title}</span>
                                            </div>
                                            <div className="mt-3 flex">
                                                <div className="flex items-center text-xs font-medium text-zinc-400 mr-6">
                                                    <span>
                                                        {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    {phase.is_paused ? (
                                                        <span className="px-2.5 inline-flex text-[10px] leading-5 font-black uppercase tracking-widest rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                            Paused
                                                        </span>
                                                    ) : (
                                                        <span className={cn(
                                                            "px-2.5 inline-flex text-[10px] leading-5 font-black uppercase tracking-widest rounded-full border",
                                                            getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'live' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'upcoming' ? "bg-white/10 text-white border-white/20" :
                                                                    getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'ended' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                                        "bg-zinc-800 text-zinc-400 border-zinc-700"
                                                        )}>
                                                            {getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex space-x-2">
                                        <button
                                            onClick={() => togglePause(phase)}
                                            title={phase.is_paused ? "Resume Phase" : "Pause Phase"}
                                            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all hover:scale-105 active:scale-95"
                                        >
                                            {phase.is_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        </button>
                                        <Link
                                            href={`/admin/phases/${phase.id}/edit`}
                                            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all hover:scale-105 active:scale-95 inline-flex"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => deletePhase(phase.id)}
                                            className="p-2.5 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 hover:border-red-900/50 rounded-xl transition-all hover:scale-105 active:scale-95 border border-transparent"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
