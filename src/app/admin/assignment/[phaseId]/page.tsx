'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Github,
    ExternalLink,
    Search,
    BarChart3,
    Users,
    CheckCircle2,
    XCircle,
    Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Phase, Submission } from '@/types/database';
import {
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';

interface ExtendedSubmission extends Submission {
    student: {
        name: string;
        roll_number: string;
        batch: string;
    };
}

export default function PhaseAssignmentDetailsPage({ params }: { params: Promise<{ phaseId: string }> }) {
    const { phaseId } = use(params);
    const [phase, setPhase] = useState<Phase | null>(null);
    const [submissions, setSubmissions] = useState<ExtendedSubmission[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch phase details
                const { data: phaseData, error: phaseError } = await supabase
                    .from('phases')
                    .select('*')
                    .eq('id', phaseId)
                    .single();

                if (phaseError) throw phaseError;
                setPhase(phaseData);

                // Fetch total active students
                const { count, error: studentsError } = await supabase
                    .from('users')
                    .select('id', { count: 'exact', head: true })
                    .eq('role', 'student')
                    .eq('status', 'active');

                if (studentsError) throw studentsError;
                setTotalStudents(count || 0);

                // Fetch submissions with student info
                const { data: subsData, error: subsError } = await supabase
                    .from('submissions')
                    .select('*, student:users(name, roll_number, batch)')
                    .eq('phase_id', phaseId)
                    .is('is_deleted', false);

                if (subsError) throw subsError;
                setSubmissions((subsData as any) || []);

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (phaseId) {
            fetchData();
        }
    }, [phaseId]);

    const filteredSubmissions = submissions.filter(sub =>
        sub.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.student.batch?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const submittedCount = submissions.length;
    const pendingCount = Math.max(0, totalStudents - submittedCount);
    const submissionRate = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;

    const chartData = [
        { name: 'Submitted', value: submittedCount, color: '#ffffff' },
        { name: 'Pending', value: pendingCount, color: '#27272a' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!phase) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">Phase not found in Node</h2>
                <Link href="/admin/assignment" className="text-white hover:underline mt-4 inline-block font-black uppercase tracking-[0.2em] text-xs">
                    Back to assignments
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <Link
                    href="/admin/assignment"
                    className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-2xl transition-all active:scale-95"
                >
                    <ArrowLeft className="h-5 w-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Phase {phase.phase_number}: {phase.title}</h1>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Transmission Status & Analytics</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-3xl font-black text-white">{totalStudents}</span>
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Students</p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <span className="text-3xl font-black text-white">{submittedCount}</span>
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Successful Nodes</p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                            <XCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <span className="text-3xl font-black text-white">{pendingCount}</span>
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pending Sync</p>
                </div>
            </div>

            {/* Graph and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submission Graph */}
                <div className="lg:col-span-1 bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-8">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center">
                            <BarChart3 className="mr-3 h-4 w-4 text-white opacity-40" />
                            Efficiency Ratio
                        </h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#0a0a0a', borderRadius: '16px', border: '1px solid #27272a', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 text-center bg-zinc-900 border border-zinc-800 px-8 py-5 rounded-[2.5rem]">
                        <span className="text-4xl font-black text-white">{submissionRate.toFixed(1)}%</span>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Global Completion</p>
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="lg:col-span-2 bg-zinc-950 rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center">
                            <Users className="mr-3 h-4 w-4 text-white opacity-40" />
                            Transmission Logs
                        </h3>
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Search nodes..."
                                className="w-full pl-11 h-11 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-900/50 border-b border-zinc-900">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Student</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Metadata</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Transmission</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                                {filteredSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-zinc-600 font-black uppercase tracking-widest text-[10px]">
                                            No data detected
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubmissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-zinc-900/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="font-black text-white group-hover:text-white transition-colors">{sub.student.name}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{sub.student.roll_number || 'STU-NULL'}</div>
                                                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{sub.student.batch || 'DEFAULT_BATCH'}</div>
                                            </td>
                                            <td className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                {new Date(sub.submitted_at).toLocaleString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {sub.submission_type === 'github' ? (
                                                    <a
                                                        href={sub.github_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
                                                    >
                                                        <Github className="h-3.5 w-3.5 mr-2" />
                                                        Explore Repo
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={sub.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-4 py-2 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-all active:scale-95"
                                                    >
                                                        <Download className="h-3.5 w-3.5 mr-2" />
                                                        Download Node
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
