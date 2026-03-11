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
        <div className="space-y-6 font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-black tracking-tight uppercase">Learning Phases</h1>
                    <p className="mt-1 text-sm text-zinc-500 font-medium">
                        Manage your curriculum phases and student deadlines.
                    </p>
                </div>
                <Link
                    href="/admin/phases/new"
                    className="inline-flex items-center px-6 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 focus:outline-none transition-all active:scale-95 shadow-lg shadow-black/10"
                >
                    <Plus className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                    Create Phase
                </Link>
            </div>

            {/* Search and Filter */}
            {/* Search and Filter */}
            <div className="flex items-center px-4 py-1.5 bg-white rounded-2xl shadow-sm border border-zinc-200">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border-0 rounded-md leading-5 bg-transparent placeholder-zinc-400 text-black focus:outline-none focus:ring-0 sm:text-sm"
                        placeholder="Search phases by title or number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Phase Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                </div>
            ) : filteredPhases.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm">
                    <Layers className="mx-auto h-12 w-12 text-zinc-100" />
                    <h3 className="mt-6 text-lg font-black text-black uppercase tracking-widest">No phases initialized</h3>
                    <p className="mt-1 text-sm text-zinc-400 font-medium">Get started by initializing a new learning phase.</p>
                    <div className="mt-10">
                        <Link
                            href="/admin/phases/new"
                            className="inline-flex items-center px-8 py-3 bg-black text-white text-[10px] font-black rounded-2xl uppercase tracking-widest transition-all hover:scale-105"
                        >
                            <Plus className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                            Initialize Phase
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow-sm overflow-hidden rounded-[2rem] border border-zinc-200">
                    <ul className="divide-y divide-zinc-50">
                        {filteredPhases.map((phase) => (
                            <li key={phase.id}>
                                <div className="px-8 py-6 flex items-center hover:bg-zinc-50 transition-colors group">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="truncate">
                                            <div className="flex items-center text-sm font-medium truncate">
                                                <span className="bg-zinc-50 text-black border border-zinc-100 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mr-4">
                                                    NODE_P_{phase.phase_number}
                                                </span>
                                                <span className="text-lg font-black text-black group-hover:text-black transition-colors">{phase.title}</span>
                                            </div>
                                            <div className="mt-4 flex">
                                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-8">
                                                    <span>
                                                        {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    {phase.is_paused ? (
                                                        <span className="px-3 py-1 inline-flex text-[9px] font-black uppercase tracking-widest rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                                                            Protocol_Paused
                                                        </span>
                                                    ) : (
                                                        <span className={cn(
                                                            "px-3 py-1 inline-flex text-[9px] font-black uppercase tracking-widest rounded-full border",
                                                            getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'live' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'upcoming' ? "bg-zinc-50 text-zinc-600 border-zinc-100" :
                                                                    getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'ended' ? "bg-red-50 text-red-600 border-red-100" :
                                                                        "bg-zinc-50 text-zinc-400 border-zinc-100"
                                                        )}>
                                                            {getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex space-x-3">
                                        <button
                                            onClick={() => togglePause(phase)}
                                            title={phase.is_paused ? "Resume Phase" : "Pause Phase"}
                                            className="p-3 bg-zinc-50 hover:bg-black text-zinc-400 hover:text-white rounded-xl transition-all active:scale-95 border border-zinc-100 hover:border-black"
                                        >
                                            {phase.is_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        </button>
                                        <Link
                                            href={`/admin/phases/${phase.id}/edit`}
                                            className="p-3 bg-zinc-50 hover:bg-black text-zinc-400 hover:text-white rounded-xl transition-all active:scale-95 border border-zinc-100 hover:border-black inline-flex"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => deletePhase(phase.id)}
                                            className="p-3 bg-zinc-50 hover:bg-red-600 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-95 border border-zinc-100 hover:border-red-600"
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
