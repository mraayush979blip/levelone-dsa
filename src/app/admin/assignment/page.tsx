'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    ChevronRight,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Phase } from '@/types/database';
import { cn, getPhaseStatus } from '@/lib/utils';

export default function AssignmentPhasesPage() {
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
                .order('phase_number', { ascending: false });

            if (error) throw error;
            setPhases(data || []);
        } catch (error) {
            console.error('Error fetching phases:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPhases = phases.filter(phase =>
        phase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phase.phase_number.toString().includes(searchQuery)
    );

    const livePhases = filteredPhases.filter(p => getPhaseStatus(p.start_date, p.end_date, p.is_paused) === 'live');
    const pastPhases = filteredPhases.filter(p => getPhaseStatus(p.start_date, p.end_date, p.is_paused) === 'ended');
    const otherPhases = filteredPhases.filter(p => {
        const status = getPhaseStatus(p.start_date, p.end_date, p.is_paused);
        return status !== 'live' && status !== 'ended';
    });

    const PhaseCard = ({ phase }: { phase: Phase }) => (
        <Link
            href={`/admin/assignment/${phase.id}`}
            key={phase.id}
            className="group block bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:border-zinc-300 transition-all duration-300 active:scale-[0.98]"
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mr-3">
                            Phase {phase.phase_number}
                        </div>
                        <h3 className="text-lg font-black text-black group-hover:text-zinc-600 transition-colors line-clamp-1">
                            {phase.title}
                        </h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-black transform group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                    <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-zinc-500" />
                        <span>Ends {new Date(phase.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                        <div className={cn(
                            "flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'live' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'ended' ? "bg-red-50 text-red-700 border-red-100" :
                                    "bg-zinc-100 text-zinc-500 border-zinc-200"
                        )}>
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'live' ? "bg-emerald-500 animate-pulse" :
                                    getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'ended' ? "bg-red-500" :
                                        "bg-zinc-500"
                            )} />
                            {getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-black tracking-tight">Assignment Management</h1>
                    <p className="mt-1 text-zinc-500 font-medium tracking-wide">
                        Track student submissions and analyze phase performance.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-4 border border-zinc-200 bg-white rounded-2xl leading-5 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
                    placeholder="Search phases by title or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-white rounded-2xl border border-zinc-100 animate-pulse" />
                    ))}
                </div>
            ) : filteredPhases.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                    <AlertCircle className="mx-auto h-12 w-12 text-zinc-600" />
                    <h3 className="mt-4 text-lg font-bold text-white uppercase tracking-wider">No phases matching your search</h3>
                    <p className="mt-2 text-zinc-400">Try adjusting your search terms.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Live Phases */}
                    {livePhases.length > 0 && (
                        <section>
                            <div className="flex items-center space-x-2 mb-6">
                                <Clock className="h-5 w-5 text-emerald-500" />
                                <h2 className="text-xl font-black text-black uppercase tracking-widest">Live Phases</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {livePhases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
                            </div>
                        </section>
                    )}

                    {/* Past Phases */}
                    {pastPhases.length > 0 && (
                        <section>
                            <div className="flex items-center space-x-2 mb-6">
                                <CheckCircle2 className="h-5 w-5 text-zinc-500" />
                                <h2 className="text-xl font-black text-zinc-400 uppercase tracking-widest">Past Phases</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-85">
                                {pastPhases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
                            </div>
                        </section>
                    )}

                    {/* Other Phases (Upcoming/Paused) */}
                    {otherPhases.length > 0 && (
                        <section>
                            <div className="flex items-center space-x-2 mb-6 text-zinc-500">
                                <Calendar className="h-5 w-5" />
                                <h2 className="text-xl font-black uppercase tracking-widest">Upcoming & Other</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                                {otherPhases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
