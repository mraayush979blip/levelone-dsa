'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    Layers,
    CheckCircle2,
    Clock,
    Shield,
    ShieldOff,
    Activity,
    Github,
    Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as UserType, Submission, Phase } from '@/types/database';
import { cn } from '@/lib/utils';


export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [student, setStudent] = useState<UserType | null>(null);
    const [submissions, setSubmissions] = useState<(Submission & { phase: Phase })[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStudentData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch student info
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (userError) throw userError;
            setStudent(userData);

            // Fetch submissions with phase info
            const { data: subData, error: subError } = await supabase
                .from('submissions')
                .select(`
          *,
          phase:phases(*)
        `)
                .eq('student_id', id)
                .order('created_at', { ascending: false });

            if (subError) throw subError;
            setSubmissions(subData as any);

            // Fetch activity stats
            const { data: activityData } = await supabase
                .from('student_phase_activity')
                .select('total_time_spent_seconds')
                .eq('student_id', id);

            if (activityData) {
                const totalSeconds = activityData.reduce((acc, curr) => acc + (curr.total_time_spent_seconds || 0), 0);
                setStudent(prev => prev ? { ...prev, total_time_spent_seconds: totalSeconds } : null);
            }

        } catch (error) {
            console.error('Error fetching student details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStudentData();
    }, [fetchStudentData]);

    const toggleStatus = async () => {
        if (!student) return;
        const newStatus = student.status === 'active' ? 'revoked' : 'active';
        if (!confirm(`Are you sure you want to ${newStatus === 'revoked' ? 'revoke access' : 'restore access'} for ${student.name}?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ status: newStatus })
                .eq('id', student.id);

            if (error) throw error;
            fetchStudentData();
        } catch (error) {
            console.error('Error updating student status:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Student not found in Node.</p>
                <button onClick={() => router.back()} className="mt-4 text-white hover:underline transition-all">Go Back</button>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => router.back()}
                        className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all active:scale-90 group"
                    >
                        <ArrowLeft className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                    </button>
                    <div>
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mb-2 drop-shadow-[0_0_8px_rgba(var(--theme-primary-rgb),0.5)]">Student Node Profile</p>
                        <h1 className="text-4xl font-black text-white tracking-tighter text-glow">{student.name}</h1>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1 opacity-60">Access Code: {student.roll_number || 'NULL_NODE'}</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    <div className={cn(
                        "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500",
                        student.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                    )}>
                        Node {student.status.toUpperCase()}
                    </div>
                    <button
                        onClick={toggleStatus}
                        className={cn(
                            "p-4 rounded-2xl border transition-all active:scale-95 group",
                            student.status === 'active'
                                ? 'bg-white/5 border-white/5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20'
                                : 'bg-white/5 border-white/10 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/20'
                        )}
                    >
                        {student.status === 'active' ? <ShieldOff className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Stats & Info */}
                <div className="lg:col-span-4 space-y-8">
                    {/* General Information Card */}
                    <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <User className="h-24 w-24 text-white" />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 flex items-center">
                            <Activity className="mr-3 h-4 w-4 text-primary" />
                            Node Identity
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center group/item transition-all hover:translate-x-1">
                                <div className="p-3 bg-white/5 rounded-xl mr-4 group-hover/item:bg-white/10 transition-colors">
                                    <Mail className="h-4 w-4 text-zinc-400 group-hover/item:text-white" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Satellite Address</p>
                                    <span className="text-zinc-200 text-sm font-bold">{student.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center group/item transition-all hover:translate-x-1">
                                <div className="p-3 bg-white/5 rounded-xl mr-4 group-hover/item:bg-white/10 transition-colors">
                                    <Phone className="h-4 w-4 text-zinc-400 group-hover/item:text-white" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Signal Line</p>
                                    <span className="text-zinc-200 text-sm font-bold">{student.phone || 'DISCONNECTED'}</span>
                                </div>
                            </div>
                            <div className="flex items-center group/item transition-all hover:translate-x-1">
                                <div className="p-3 bg-white/5 rounded-xl mr-4 group-hover/item:bg-white/10 transition-colors">
                                    <Calendar className="h-4 w-4 text-zinc-400 group-hover/item:text-white" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Installation Date</p>
                                    <span className="text-zinc-200 text-sm font-bold">{new Date(student.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Metrics Card */}
                    <div className="glass-card p-8 rounded-[2.5rem]">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 flex items-center">
                            <Activity className="mr-3 h-4 w-4 text-primary" />
                            Performance Metrics
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group/stat">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Completed Nodes</p>
                                    <Layers className="h-3.5 w-3.5 text-primary opacity-50 group-hover/stat:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-baseline space-x-2">
                                    <p className="text-4xl font-black text-white">{submissions.filter(s => s.status === 'valid').length}</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Phases</p>
                                </div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group/stat">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Temporal Exposure</p>
                                    <Clock className="h-3.5 w-3.5 text-primary opacity-50 group-hover/stat:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-baseline space-x-2">
                                    <p className="text-4xl font-black text-white">{Math.floor((student.total_time_spent_seconds || 0) / 3600)}</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Hours</p>
                                    <p className="text-2xl font-black text-white ml-2">{Math.floor(((student.total_time_spent_seconds || 0) % 3600) / 60)}</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Min</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - History */}
                <div className="lg:col-span-8">
                    <div className="glass-card p-8 rounded-[2.5rem] h-full flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center">
                                <Layers className="mr-3 h-4 w-4 text-primary" />
                                Transmission History
                            </h3>
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                {submissions.length} Total Signals
                            </span>
                        </div>

                        {submissions.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-24 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                                <Clock className="h-16 w-16 text-zinc-800 mb-6 animate-pulse" />
                                <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-600">No signals detected in node</p>
                                <p className="text-[10px] text-zinc-700 mt-2 uppercase tracking-widest">Waiting for student transmission...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {submissions.map((sub, idx) => (
                                    <div 
                                        key={sub.id} 
                                        className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/[0.08] hover:border-white/10 transition-all group/item hover:glow-card animate-fade-in"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-4 mb-4">
                                                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-primary/20">
                                                        V{sub.phase.phase_number} Protocol
                                                    </span>
                                                    <span className="text-lg font-black text-white group-hover/item:text-primary transition-colors">{sub.phase.title}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    {sub.github_url && (
                                                        <a
                                                            href={sub.github_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                                        >
                                                            <Github className="mr-2.5 h-3.5 w-3.5" /> Repository
                                                        </a>
                                                    )}
                                                    {sub.file_url && (
                                                        <a
                                                            href={sub.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                                        >
                                                            <LinkIcon className="mr-2.5 h-3.5 w-3.5" /> Build File
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                                                <div className="order-2 sm:order-1 text-right">
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Authenticated On</p>
                                                    <p className="text-[10px] font-bold text-zinc-400">{new Date(sub.updated_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</p>
                                                </div>
                                                <div className="order-1 sm:order-2">
                                                    {sub.status === 'valid' ? (
                                                        <span className="inline-flex items-center px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                                            <CheckCircle2 className="mr-2.5 h-3.5 w-3.5" /> Verified Node
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                            Pending Protocol
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

}
