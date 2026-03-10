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
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-2xl transition-all active:scale-95"
                >
                    <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">{student.name}</h1>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Node ID: {student.roll_number || 'STU-NULL'}</p>
                </div>
                <div className="ml-auto flex items-center space-x-3">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${student.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                        {student.status.toUpperCase()}
                    </span>
                    <button
                        onClick={toggleStatus}
                        className={`p-3 rounded-2xl border transition-all active:scale-95 ${student.status === 'active'
                            ? 'bg-zinc-900 border-zinc-800 text-red-500 hover:bg-red-500/10'
                            : 'bg-zinc-900 border-zinc-800 text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                    >
                        {student.status === 'active' ? <ShieldOff className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center">
                            <User className="mr-3 h-4 w-4 text-white opacity-40" />
                            General Information
                        </h3>
                        <div className="space-y-5">
                            <div className="flex items-center text-sm group">
                                <Mail className="mr-3 h-4 w-4 text-zinc-700 group-hover:text-white transition-colors" />
                                <span className="text-zinc-300 font-medium">{student.email}</span>
                            </div>
                            <div className="flex items-center text-sm group">
                                <Phone className="mr-3 h-4 w-4 text-zinc-700 group-hover:text-white transition-colors" />
                                <span className="text-zinc-300 font-medium">{student.phone || 'No phone number'}</span>
                            </div>
                            <div className="flex items-center text-sm group">
                                <Calendar className="mr-3 h-4 w-4 text-zinc-700 group-hover:text-white transition-colors" />
                                <span className="text-zinc-300 font-medium">Joined Node on {new Date(student.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center">
                            <Activity className="mr-3 h-4 w-4 text-white opacity-40" />
                            Progress Metrics
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1.5">Phases</p>
                                <p className="text-3xl font-black text-white">
                                    {submissions.filter(s => s.status === 'valid').length}
                                </p>
                            </div>
                            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1.5">Watchtime</p>
                                <p className="text-3xl font-black text-white">
                                    {Math.round((student.total_time_spent_seconds || 0) / 3600)}h
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center">
                            <Layers className="mr-3 h-4 w-4 text-white opacity-40" />
                            Node Submission History
                        </h3>

                        {submissions.length === 0 ? (
                            <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                                <Clock className="mx-auto h-12 w-12 text-zinc-800 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No data transmitted yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {submissions.map((sub) => (
                                    <div key={sub.id} className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-white/20">
                                                        Phase {sub.phase.phase_number}
                                                    </span>
                                                    <span className="text-base font-black text-white">{sub.phase.title}</span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-4">
                                                    {sub.github_url && (
                                                        <a
                                                            href={sub.github_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                                                        >
                                                            <Github className="mr-2 h-3.5 w-3.5" /> Repository
                                                        </a>
                                                    )}
                                                    {sub.file_url && (
                                                        <a
                                                            href={sub.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                                                        >
                                                            <LinkIcon className="mr-2 h-3.5 w-3.5" /> Build Files
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 order-2 sm:order-1">
                                                    {new Date(sub.updated_at).toLocaleDateString()}
                                                </span>
                                                <div className="order-1 sm:order-2">
                                                    {sub.status === 'valid' ? (
                                                        <span className="inline-flex items-center px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                            <CheckCircle2 className="mr-2 h-3 w-3" /> Valid Node
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                            Pending Verification
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
