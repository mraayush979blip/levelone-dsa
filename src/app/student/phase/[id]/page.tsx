'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Video,
    FileText,
    Github,
    Send,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    Upload,
    X,
    Trophy,
    Target,
    Zap,
    Shield,
    MessageSquare,
    ChevronDown,
    Lock,
    ListTodo
} from 'lucide-react';
import Link from 'next/link';
import { getPhaseStatus, cn } from '@/lib/utils';
import { isValidGitHubUrl, isValidFileSize, formatFileSize, isValidAssignmentFileType } from '@/utils/validation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PremiumPlayer from '@/components/PremiumPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface PhasePageProps {
    params: Promise<{ id: string }>;
}

export default function PhaseDetailPage({ params }: PhasePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- State Variables ---
    const [timeSpent, setTimeSpent] = useState(0);
    const timeSpentRef = useRef(0);
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);
    const [submissions, setSubmissions] = useState<Record<number, any>>({});
    const [formData, setFormData] = useState<Record<number, {
        submissionType: 'github' | 'file' | 'leetcode';
        githubUrl: string;
        notes: string;
        selectedFile: File | null;
        existingFileUrl: string | null;
        success?: string | null;
        error?: string | null;
    }>>({});
    const [success, setSuccess] = useState<string | null>(null);
    const [leetcodeUsername, setLeetcodeUsername] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [isVideoStarted, setIsVideoStarted] = useState(false);

    // --- Data Fetching (React Query) ---

    // 1. Fetch Phase Data
    const { data: phase, isLoading: phaseLoading } = useQuery({
        queryKey: ['phase', id],
        queryFn: async () => {
            const { data: isRevoked } = await supabase.rpc('check_and_revoke_self');
            if (isRevoked) {
                window.location.href = '/revoked';
                return null;
            }

            const { data, error } = await supabase
                .from('phases')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            const status = getPhaseStatus(data.start_date, data.end_date, data.is_paused);
            if (status === 'upcoming' || status === 'paused') {
                router.push('/student');
                return null;
            }
            return data;
        },
        enabled: !!id && !!user,
        staleTime: 5 * 60 * 1000,
    });

    // 2. Fetch Submissions
    const { data: submissionsData } = useQuery({
        queryKey: ['submissions', id, user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('submissions')
                .select('*')
                .eq('phase_id', id)
                .eq('student_id', user?.id);
            return data || [];
        },
        enabled: !!id && !!user,
    });

    // 3. Fetch Activity Stats
    const { data: activityData } = useQuery({
        queryKey: ['activity', id, user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('student_phase_activity')
                .select('total_time_spent_seconds, video_completed')
                .eq('phase_id', id)
                .eq('student_id', user?.id)
                .maybeSingle();
            return data;
        },
        enabled: !!id && !!user,
    });

    // 4. Fetch Phase Tasks
    const { data: tasksData, isLoading: tasksLoading } = useQuery({
        queryKey: ['phase_tasks', id],
        queryFn: async () => {
            const { data } = await supabase
                .from('phase_tasks')
                .select('*')
                .eq('phase_id', id)
                .order('created_at', { ascending: true });
            return data || [];
        },
        enabled: !!id,
    });

    // 5. Fetch Task Submissions
    const { data: taskSubmissionsData } = useQuery({
        queryKey: ['task_submissions', id, user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('task_submissions')
                .select('*')
                .eq('phase_id', id)
                .eq('student_id', user?.id);
            return data || [];
        },
        enabled: !!id && !!user,
    });

    // --- Sync Query Data to State ---
    useEffect(() => {
        if (activityData) {
            setTimeSpent(activityData.total_time_spent_seconds || 0);
            timeSpentRef.current = activityData.total_time_spent_seconds || 0;
            setVideoCompleted(activityData.video_completed || false);
        }
        if (user?.leetcode_username) {
            setLeetcodeUsername(user.leetcode_username);
        }
    }, [activityData, user]);

    useEffect(() => {
        if (phase && submissionsData) {
            const submissionsMap: Record<number, any> = {};
            const initialFormData: any = {};

            const totalAssignments = phase.total_assignments || 1;

            submissionsData.forEach((sub: any) => {
                const idx = sub.assignment_index || 1;
                submissionsMap[idx] = sub;
                initialFormData[idx] = {
                    submissionType: sub.submission_type,
                    githubUrl: sub.github_url || '',
                    notes: sub.notes || '',
                    selectedFile: null,
                    existingFileUrl: sub.file_url || null
                };
            });

            for (let i = 1; i <= totalAssignments; i++) {
                if (!initialFormData[i]) {
                    initialFormData[i] = {
                        submissionType: phase.allowed_submission_type === 'both' ? 'github' : (phase.allowed_submission_type || 'github'),
                        githubUrl: '',
                        notes: '',
                        selectedFile: null,
                        existingFileUrl: null
                    };
                }
            }

            // Sync LeetCode URL to initial form data if needed
            for (let i = 1; i <= totalAssignments; i++) {
                if (phase.allowed_submission_type === 'leetcode' && !initialFormData[i].notes) {
                    initialFormData[i].notes = 'Verified via LeetCode';
                }
            }

            setSubmissions(submissionsMap);
            setFormData(initialFormData);
        }
    }, [phase, submissionsData]);

    // --- Core Logic Hooks ---

    // Timer logic
    useEffect(() => {
        if (!phase || !user) return;
        const timer = setInterval(() => {
            setTimeSpent(prev => {
                const next = prev + 1;
                timeSpentRef.current = next;
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, user]);

    // Unlock logic
    useEffect(() => {
        if (!phase) return;
        const req = phase.min_seconds_required || 0;
        let shouldUnlock = false;

        if (phase.bypass_time_requirement || req <= 0) {
            shouldUnlock = true;
        } else {
            shouldUnlock = timeSpent >= req;
        }

        setIsUnlocked(shouldUnlock);
    }, [timeSpent, phase, videoCompleted]);

    // Heartbeat sync
    useEffect(() => {
        if (!phase || !user) return;

        const heartbeatInterval = setInterval(async () => {
            try {
                const currentSeconds = timeSpentRef.current;
                const { data: existing } = await supabase
                    .from('student_phase_activity')
                    .select('id')
                    .eq('phase_id', id)
                    .eq('student_id', user.id)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('student_phase_activity')
                        .update({
                            total_time_spent_seconds: currentSeconds,
                            last_activity_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('student_phase_activity')
                        .insert({
                            phase_id: id,
                            student_id: user.id,
                            total_time_spent_seconds: currentSeconds,
                            last_activity_at: new Date().toISOString()
                        });
                }

                // Award points logic (try every 30s, the DB will safely throttle to 1 point per 50sec ~ 1min)
                await supabase.rpc('award_activity_point');

            } catch (err) {
                console.error('Heartbeat error:', err);
            }
        }, 30000);

        return () => clearInterval(heartbeatInterval);
    }, [phase, user, id]);

    // --- Derived State ---
    const isPastDeadline = phase ? (() => {
        const now = new Date();
        const endDate = new Date(phase.end_date);
        endDate.setHours(23, 59, 59, 999);
        return now > endDate;
    })() : false;

    // --- Handlers ---

    const handleDownloadAssignment = async (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Download failed with status: ${response.status}`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const filename = url.split('/').pop() || 'assignment.pdf';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download error:', err);
            window.open(url, '_blank');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isValidAssignmentFileType(file)) {
            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], error: 'Invalid file type. Please upload PDF, JPG, or PNG files only.' }
            }));
            return;
        }

        if (!isValidFileSize(file, 2)) {
            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], error: `File size must be less than 2MB.` }
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [index]: { ...prev[index], selectedFile: file, error: null }
        }));
    };

    const handleRemoveFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            [index]: { ...prev[index], selectedFile: null, existingFileUrl: null }
        }));
    };

    const handleFileUpload = async (index: number) => {
        const data = formData[index];
        if (!data?.selectedFile || !user) return null;

        try {
            const fileExt = data.selectedFile.name.split('.').pop();
            const fileName = `${user.id}/${id}/submission_${index}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('student-submissions')
                .upload(filePath, data.selectedFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('student-submissions')
                .getPublicUrl(filePath);

            return `${publicUrl}?t=${Date.now()}`;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], error: 'Failed to upload file: ' + error.message }
            }));
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent, index: number) => {
        e.preventDefault();
        if (!user || !isUnlocked || isPastDeadline) return;

        const data = formData[index];
        setFormData(prev => ({ ...prev, [index]: { ...prev[index], error: null, success: null } }));

        let finalFileUrl = data.existingFileUrl;

        if (data.submissionType === 'github') {
            if (!data.githubUrl || !isValidGitHubUrl(data.githubUrl)) {
                setFormData(prev => ({
                    ...prev,
                    [index]: { ...prev[index], error: 'Please enter a valid GitHub repository URL' }
                }));
                return;
            }
            if (!data.selectedFile && !data.existingFileUrl) {
                setFormData(prev => ({ ...prev, [index]: { ...prev[index], error: 'Please select a file' } }));
                return;
            }
        } else if (data.submissionType === 'leetcode') {
            if (!leetcodeUsername) {
                setShowUsernameModal(true);
                return;
            }

            setIsVerifying(true);
            try {
                const response = await fetch('/api/leetcode/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: leetcodeUsername,
                        problemSlug: phase?.leetcode_problem_slug
                    })
                });

                const verifyData = await response.json();

                if (!verifyData.success) {
                    setFormData(prev => ({
                        ...prev,
                        [index]: { ...prev[index], error: verifyData.error || 'Verification failed. Make sure you solved the problem!' }
                    }));
                    setIsVerifying(false);
                    return;
                }

                // If username was changed during the process, update it in DB
                if (leetcodeUsername !== user?.leetcode_username) {
                    await supabase.from('users').update({ leetcode_username: leetcodeUsername }).eq('id', user?.id);
                }

            } catch (err) {
                setFormData(prev => ({
                    ...prev,
                    [index]: { ...prev[index], error: 'Error connecting to verification service' }
                }));
                setIsVerifying(false);
                return;
            }
            setIsVerifying(false);
        }

        setSubmittingIndex(index);

        try {
            if (data.submissionType === 'file' && data.selectedFile) {
                const uploadedUrl = await handleFileUpload(index);
                if (!uploadedUrl) {
                    setSubmittingIndex(null);
                    return;
                }
                finalFileUrl = uploadedUrl;
            }

            // OPTIMISTIC UPDATE: Update UI immediately
            const previousSubmissions = { ...submissions };
            const previousFormData = { ...formData };
            const optimisticTimestamp = new Date().toISOString();

            setSubmissions(prev => ({
                ...prev,
                [index]: {
                    submitted_at: optimisticTimestamp,
                    status: 'valid' // Assume valid for now
                }
            }));

            setFormData(prev => ({
                ...prev,
                [index]: {
                    ...prev[index],
                    success: 'Syncing...', // Better than 'Success' immediately
                    existingFileUrl: finalFileUrl || prev[index].existingFileUrl,
                    selectedFile: null
                }
            }));

            const { error: subError } = await supabase
                .from('submissions')
                .upsert({
                    student_id: user.id,
                    phase_id: id,
                    assignment_index: index,
                    submission_type: data.submissionType,
                    github_url: data.submissionType === 'github' ? data.githubUrl : null,
                    file_url: data.submissionType === 'file' ? finalFileUrl : null,
                    notes: data.notes,
                    submitted_at: optimisticTimestamp,
                    status: 'valid'
                }, {
                    onConflict: 'student_id,phase_id,assignment_index'
                });

            if (subError) {
                // REVERT on error
                setSubmissions(previousSubmissions);
                setFormData(previousFormData);
                throw subError;
            }

            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], success: 'Verified & Committed!' }
            }));

            // Silent refresh in background
            queryClient.invalidateQueries({ queryKey: ['submissions', id] });

        } catch (err: any) {
            console.error('Submission error:', err);
            setFormData(prev => ({ ...prev, [index]: { ...prev[index], error: err.message } }));
        } finally {
            setSubmittingIndex(null);
        }
    };

    const handleVerifyTask = async (task: any) => {
        if (!user || !isUnlocked || isPastDeadline) return;

        if (!leetcodeUsername) {
            setShowUsernameModal(true);
            return;
        }

        setVerifyingTaskId(task.id);

        // Extract slug from URL
        let problemSlug = '';
        if (task.url.includes('leetcode.com/problems/')) {
            const match = task.url.match(/problems\/([^/]+)/);
            if (match && match[1]) problemSlug = match[1];
        }

        if (!problemSlug) {
            toast.error("Could not extract problem slug from LeetCode URL");
            setVerifyingTaskId(null);
            return;
        }

        try {
            const response = await fetch('/api/leetcode/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: leetcodeUsername,
                    problemSlug: problemSlug
                })
            });

            const verifyData = await response.json();

            if (!verifyData.success) {
                toast.error(verifyData.error || 'Verification failed. Make sure you solved the problem!');
                setVerifyingTaskId(null);
                return;
            }

            // Call the secure RPC to insert submission AND award points
            const { error: insertError } = await supabase.rpc('verify_and_award_task', {
                p_task_id: task.id,
                p_phase_id: id
            });

            if (insertError) {
                if (insertError.message && insertError.message.includes('unique constraint')) {
                    toast.success('Task already verified!');
                } else {
                    toast.error('Failed to save completion: ' + insertError.message);
                }
            } else {
                toast.success(`Verified! ${task.points} Points Awarded 🎉`);
            }

            queryClient.invalidateQueries({ queryKey: ['task_submissions', id, user?.id] });

            // If username was changed during the process, update it in DB
            if (leetcodeUsername !== user?.leetcode_username) {
                await supabase.from('users').update({ leetcode_username: leetcodeUsername }).eq('id', user?.id);
            }

        } catch (err) {
            toast.error('Error connecting to verification service');
        } finally {
            setVerifyingTaskId(null);
        }
    };

    const extractVideoId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // --- Render Helpers ---

    if (phaseLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[80vh]">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                </div>
                <p className="mt-6 text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Specialized Content...</p>
            </div>
        );
    }

    if (!phase) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                <div className="bg-red-50 dark:bg-red-950/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-4">Module Unavailable</h1>
                <p className="text-slate-500 mb-8">The requested learning phase could not be found or access has been restricted.</p>
                <Link href="/student" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to Command Center
                </Link>
            </div>
        );
    }

    const videoId = extractVideoId(phase.youtube_url);

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-10 font-sans text-foreground">
            {/* Action Bar */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-card-border">
                <Link href="/student" className="inline-flex items-center gap-2 group text-muted hover:text-primary transition-colors">
                    <div className="p-2 bg-card rounded-xl border border-card-border shadow-sm group-hover:border-primary/20 transition-all">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Return to Dashboard</span>
                </Link>
                <div className="flex items-center gap-4">
                    <AnimatePresence>
                        {isUnlocked && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Submissions Unlocked
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-card-border shadow-sm font-bold text-xs text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="tabular-nums">
                            {Math.floor(timeSpent / 3600)}h {Math.floor((timeSpent % 3600) / 60)}m {timeSpent % 60}s
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Content Stream */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-card rounded-[2.5rem] shadow-sm border border-card-border overflow-hidden">
                        <div className="p-8 md:p-10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-primary/20">Phase {phase.phase_number}</span>
                                <div className="h-1 w-1 rounded-full bg-card-border" />
                                <span className="text-xs font-bold text-muted">Deadline: {new Date(phase.end_date).toLocaleDateString()}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-foreground">{phase.title}</h1>
                            <p className="text-muted leading-relaxed text-lg">{phase.description}</p>
                        </div>

                        {videoId ? (
                            <div className="p-2 md:p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                                <PremiumPlayer videoId={videoId} />
                            </div>
                        ) : (
                            <div className="aspect-video bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 border-t border-slate-200 dark:border-slate-800">
                                <Video className="h-12 w-12 mb-4 opacity-20" />
                                <p className="font-bold text-sm uppercase tracking-widest">No Stream Available</p>
                            </div>
                        )}
                    </div>

                    {/* Resources */}
                    <div className="bg-card p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-card-border">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                                <FileText className="w-5 h-5 text-primary" />
                                Engineering Resources
                            </h2>
                        </div>
                        {phase.assignment_file_url || phase.assignment_resource_url ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(phase.assignment_file_url || phase.assignment_resource_url) && (
                                    <button
                                        onClick={(e) => handleDownloadAssignment(e, (phase.assignment_file_url || phase.assignment_resource_url) as string)}
                                        className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                                <FileText className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold">Assignment Specification</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF Document</p>
                                            </div>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No additional resources found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submission Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <aside className="bg-card p-8 rounded-[2.5rem] shadow-sm border border-card-border sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                                <Send className="h-4 w-4 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Submission Portal</h2>
                        </div>

                        {!isUnlocked && !isPastDeadline && (
                            <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                    <Lock className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-bold mb-2">Submissions Locked</h3>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">
                                    Please complete the required viewing time to enable assignment submission.
                                </p>
                            </div>
                        )}

                        {isPastDeadline && (
                            <div className="mb-10 p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-500/10 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-4 text-red-500">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <h3 className="text-sm font-bold text-red-600 mb-2">Deadline Passed</h3>
                                <p className="text-[11px] font-medium text-red-500 uppercase tracking-wider leading-relaxed">
                                    The submission window for this phase has closed.
                                </p>
                            </div>
                        )}

                        <div className="space-y-12">
                            {tasksData && tasksData.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                                        <ListTodo className="h-4 w-4" /> Assigned Tasks
                                    </h3>
                                    {tasksData.map((task: any, idx: number) => {
                                        const isCompleted = taskSubmissionsData?.some((ts: any) => ts.task_id === task.id);
                                        return (
                                            <div key={task.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Problem {idx + 1}</span>
                                                        <h4 className="text-sm font-bold">{task.title}</h4>
                                                    </div>
                                                    {isCompleted ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">Verified</span>
                                                            <span className="text-[10px] font-bold text-slate-400">+{task.points} PTS</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">+{task.points} PTS</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href={task.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 h-10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Zap className="h-3 w-3" /> Let's Code
                                                    </a>
                                                    <button
                                                        onClick={() => handleVerifyTask(task)}
                                                        disabled={verifyingTaskId === task.id || isCompleted || !isUnlocked || isPastDeadline}
                                                        className={cn(
                                                            "flex-1 h-10 font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2",
                                                            isCompleted
                                                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                                                : "bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600"
                                                        )}
                                                    >
                                                        {verifyingTaskId === task.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : isCompleted ? (
                                                            <><CheckCircle2 className="h-3.5 w-3.5" /> Solved</>
                                                        ) : (
                                                            "Verify"
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                Array.from({ length: phase.total_assignments || 1 }, (_, i) => i + 1).map((idx) => {
                                    const data = formData[idx] || {
                                        submissionType: 'github',
                                        githubUrl: '',
                                        notes: '',
                                        selectedFile: null,
                                        existingFileUrl: null
                                    };
                                    const isSubmitted = !!submissions[idx];

                                    return (
                                        <div key={idx} className={cn(
                                            "space-y-6 pb-10",
                                            idx < (phase.total_assignments || 1) ? 'border-b border-slate-100 dark:border-slate-800' : ''
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                                                    Assignment Unit {idx.toString().padStart(2, '0')}
                                                    {isSubmitted && (
                                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    )}
                                                </h3>
                                                {isSubmitted && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">Verified</span>
                                                )}
                                            </div>

                                            <form onSubmit={(e) => handleSubmit(e, idx)} className="space-y-6">
                                                {phase.allowed_submission_type === 'both' && (
                                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(p => ({ ...p, [idx]: { ...p[idx], submissionType: 'github' } }))}
                                                            className={cn(
                                                                "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                                data.submissionType === 'github' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'
                                                            )}
                                                        >
                                                            Source Link
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(p => ({ ...p, [idx]: { ...p[idx], submissionType: 'file' } }))}
                                                            className={cn(
                                                                "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                                data.submissionType === 'file' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'
                                                            )}
                                                        >
                                                            Local File
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(p => ({ ...p, [idx]: { ...p[idx], submissionType: 'leetcode' } }))}
                                                            className={cn(
                                                                "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                                data.submissionType === 'leetcode' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'
                                                            )}
                                                        >
                                                            LeetCode
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="space-y-4">
                                                    {data.submissionType === 'github' ? (
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                                                                <Github className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                            </div>
                                                            <input
                                                                type="url"
                                                                placeholder="GitHub Repository URL"
                                                                value={data.githubUrl}
                                                                onChange={(e) => setFormData(p => ({ ...p, [idx]: { ...p[idx], githubUrl: e.target.value } }))}
                                                                className="w-full !pl-10 text-sm font-medium"
                                                                disabled={!isUnlocked || isPastDeadline}
                                                            />
                                                        </div>
                                                    ) : data.submissionType === 'file' ? (
                                                        <div className={cn(
                                                            "group relative border-2 border-dashed rounded-2xl p-6 transition-all text-center",
                                                            (!isUnlocked || isPastDeadline) ? 'opacity-50 grayscale bg-slate-50' : 'hover:border-indigo-600/30 hover:bg-indigo-600/[0.02]',
                                                            data.selectedFile || data.existingFileUrl ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-slate-200 dark:border-slate-800'
                                                        )}>
                                                            {data.selectedFile ? (
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                                                                        <span className="text-sm font-bold truncate">{data.selectedFile.name}</span>
                                                                    </div>
                                                                    <button type="button" onClick={() => handleRemoveFile(idx)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"><X className="h-4 w-4" /></button>
                                                                </div>
                                                            ) : (
                                                                <label className={cn("cursor-pointer block", (!isUnlocked || isPastDeadline) && 'pointer-events-none')}>
                                                                    <input type="file" className="hidden" disabled={!isUnlocked || isPastDeadline} onChange={(e) => handleFileSelect(e, idx)} />
                                                                    <Upload className="mx-auto h-8 w-8 text-slate-300 mb-3 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Project File</p>
                                                                </label>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="p-6 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-500/10 text-center">
                                                                <div className="w-12 h-12 bg-white dark:bg-orange-900 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-4">
                                                                    <Zap className="h-6 w-6 text-orange-500" />
                                                                </div>
                                                                <h4 className="text-sm font-bold text-orange-900 dark:text-orange-100 mb-1">Solved on LeetCode?</h4>

                                                                {!user?.leetcode_username ? (
                                                                    <div className="text-left mt-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-900/50">
                                                                        <div className="flex items-center gap-2 text-red-600 mb-3">
                                                                            <Lock className="w-4 h-4" />
                                                                            <span className="font-bold text-sm">LeetCode Profile Required</span>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-start gap-3">
                                                                                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                                                                <p className="text-xs text-slate-600 dark:text-slate-300">Create a <a href="https://leetcode.com" target="_blank" className="text-orange-500 hover:underline">LeetCode Account</a> if you haven't.</p>
                                                                            </div>
                                                                            <div className="flex items-start gap-3">
                                                                                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                                                                <p className="text-xs text-slate-600 dark:text-slate-300">Copy your exactly matching username.</p>
                                                                            </div>
                                                                            <div className="flex items-start gap-3">
                                                                                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                                                                <p className="text-xs text-slate-600 dark:text-slate-300">Open the <strong>Top Right Menu (Three Bars)</strong>.</p>
                                                                            </div>
                                                                            <div className="flex items-start gap-3">
                                                                                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">4</div>
                                                                                <p className="text-xs text-slate-600 dark:text-slate-300">Paste your username under <strong>LeetCode Profile</strong> and click <strong>Save</strong>.</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-orange-700 dark:text-orange-400 mb-4 opacity-80">Make sure your profile is public and you have solved the problem.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <textarea
                                                        placeholder="Implementation notes (optional)..."
                                                        value={data.notes}
                                                        onChange={(e) => setFormData(p => ({ ...p, [idx]: { ...p[idx], notes: e.target.value } }))}
                                                        className="w-full h-24 text-sm font-medium resize-none pb-safe"
                                                        disabled={!isUnlocked || isPastDeadline}
                                                    />
                                                </div>

                                                <AnimatePresence>
                                                    {data.error && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-100 dark:border-red-500/10">
                                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                            <p className="text-[11px] font-bold uppercase tracking-tight leading-relaxed">{data.error}</p>
                                                        </motion.div>
                                                    )}
                                                    {data.success && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                                                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                                            <p className="text-[11px] font-bold uppercase tracking-tight leading-relaxed">{data.success}</p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <button
                                                    type="submit"
                                                    disabled={submittingIndex === idx || !isUnlocked || isPastDeadline || (data.submissionType === 'leetcode' && !user?.leetcode_username)}
                                                    className="w-full h-14 bg-indigo-600 text-white font-black uppercase tracking-[0.15em] text-[11px] rounded-2xl hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center relative overflow-hidden group"
                                                >
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                                                    {submittingIndex === idx || isVerifying ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <span>
                                                            {data.submissionType === 'leetcode'
                                                                ? (isSubmitted ? 'Re-Verify Master Submission' : 'Verify My Solution')
                                                                : (isSubmitted ? 'Update Engineering Submission' : 'Commit Final Assignment')}
                                                        </span>
                                                    )}
                                                </button>
                                            </form>
                                        </div>
                                    );
                                }))}
                        </div>
                    </aside>
                </div>
            </div>

            {/* Username Modal */}
            <AnimatePresence>
                {showUsernameModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-card w-full max-w-md rounded-[2.5rem] border border-card-border shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 space-y-6">
                                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mx-auto">
                                    <Zap className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight text-center">LeetCode Profile Required</h2>
                                <p className="text-muted text-sm leading-relaxed text-center mb-6">
                                    We need your LeetCode username to automatically verify your solutions. Please follow these steps to link your account:
                                </p>

                                <div className="space-y-4 bg-background p-5 rounded-2xl border border-card-border mb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                                        <p className="text-sm font-medium">Create a <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 underline decoration-orange-500/30 underline-offset-2">LeetCode Account</a> if you don't have one.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                                        <p className="text-sm font-medium">Copy your exact LeetCode username from your profile.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                                        <p className="text-sm font-medium">Click your Avatar at the top right of this screen, enter your username under "LeetCode Profile", and click Save.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                                        <p className="text-sm font-medium text-muted">Make sure your LeetCode "Solved Problems" are set to public in your LeetCode settings.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowUsernameModal(false)}
                                    className="w-full h-14 bg-card border border-card-border text-foreground hover:bg-background font-black uppercase tracking-[0.15em] text-[11px] rounded-2xl transition-colors shadow-sm"
                                >
                                    I Understand
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
