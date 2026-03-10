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
            className="group block bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200"
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                            Phase {phase.phase_number}
                        </div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {phase.title}
                        </h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        <span>Ends {new Date(phase.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                        <div className={cn(
                            "flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'live' ? "bg-green-100 text-green-800" :
                                getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'ended' ? "bg-red-100 text-red-800" :
                                    "bg-gray-100 text-gray-800"
                        )}>
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'live' ? "bg-green-500 animate-pulse" :
                                    getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused) === 'ended' ? "bg-red-500" :
                                        "bg-gray-500"
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
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Assignment Management</h1>
                    <p className="mt-1 text-muted-foreground font-medium">
                        Track student submissions and analyze phase performance.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="Search phases by title or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-card rounded-xl border border-border animate-pulse" />
                    ))}
                </div>
            ) : filteredPhases.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed border-border">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-bold text-foreground">No phases matching your search</h3>
                    <p className="mt-2 text-muted-foreground">Try adjusting your search terms.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Live Phases */}
                    {livePhases.length > 0 && (
                        <section>
                            <div className="flex items-center space-x-2 mb-6">
                                <Clock className="h-5 w-5 text-emerald-500" />
                                <h2 className="text-xl font-bold text-foreground">Live Phases</h2>
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
                                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                                <h2 className="text-xl font-bold text-foreground">Past Phases</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-85">
                                {pastPhases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
                            </div>
                        </section>
                    )}

                    {/* Other Phases (Upcoming/Paused) */}
                    {otherPhases.length > 0 && (
                        <section>
                            <div className="flex items-center space-x-2 mb-6 text-gray-500">
                                <Calendar className="h-5 w-5" />
                                <h2 className="text-xl font-bold">Upcoming & Other</h2>
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
