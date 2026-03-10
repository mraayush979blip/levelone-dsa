'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    Calendar,
    Video,
    FileText,
    AlertCircle,
    Upload,
    X,
    Download,
    Target,
    Plus,
    Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Phase, PhaseTask } from '@/types/database';
import { isValidFileSize, formatFileSize, isValidAssignmentFileType } from '@/utils/validation';
import { sendEmailNotification } from '@/actions/sendEmail';

interface PhaseFormProps {
    id?: string;
}

export default function PhaseForm({ id }: PhaseFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!id);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [tasks, setTasks] = useState<Partial<PhaseTask>[]>([]);

    const [formData, setFormData] = useState<Partial<Phase>>({
        phase_number: 1,
        title: '',
        description: '',
        youtube_url: '',
        assignment_resource_url: '',
        assignment_file_url: '',
        allowed_submission_type: 'both',
        start_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        end_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000 + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        is_active: true,
        is_mandatory: true,
        min_seconds_required: 900, // Default 15 minutes
        total_assignments: 1,
        assignment_leetcode_url: '',
        leetcode_problem_slug: '',
    });

    useEffect(() => {
        const fetchPhase = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('phases')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        ...data,
                        start_date: data.start_date ? new Date(new Date(data.start_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
                        end_date: data.end_date ? new Date(new Date(data.end_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
                    });
                }
                const { data: tasksData, error: tasksError } = await supabase
                    .from('phase_tasks')
                    .select('*')
                    .eq('phase_id', id)
                    .order('created_at', { ascending: true });
                if (!tasksError && tasksData) {
                    setTasks(tasksData);
                }
            } catch (error: any) {
                console.error('Error fetching phase:', error);
                setError(error.message);
            } finally {
                setFetching(false);
            }
        };

        fetchPhase();
    }, [id]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!isValidAssignmentFileType(file)) {
            setError('Invalid file type. Please upload PDF, JPG, or PNG files only.');
            return;
        }

        // Validate file size (2MB limit)
        if (!isValidFileSize(file, 2)) {
            setError('File size must be less than 2MB. Current size: ' + formatFileSize(file.size));
            return;
        }

        setSelectedFile(file);
        setError(null);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return null;

        setError(null);

        try {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from('assignment-documents')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('assignment-documents')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            setError('Failed to upload file: ' + error.message);
            return null;
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFormData({ ...formData, assignment_file_url: '' });
    };

    const handleDeleteStoredFile = async (fileUrl: string) => {
        try {
            const fileName = fileUrl.split('/').pop();
            if (!fileName) return;

            const { error } = await supabase.storage
                .from('assignment-documents')
                .remove([fileName]);

            if (error) console.error('Error deleting file:', error);
        } catch (error) {
            console.error('Error deleting stored file:', error);
        }
    };

    const handleAddTask = () => {
        setTasks([...tasks, { title: '', url: '', points: 10 }]);
    };

    const handleRemoveTask = (index: number) => {
        const newTasks = [...tasks];
        newTasks.splice(index, 1);
        setTasks(newTasks);
    };

    const handleTaskChange = (index: number, field: keyof PhaseTask, value: any) => {
        const newTasks = [...tasks];
        newTasks[index] = { ...newTasks[index], [field]: value };
        setTasks(newTasks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Upload new file if selected
            let fileUrl = formData.assignment_file_url;
            if (selectedFile) {
                const uploadedUrl = await handleFileUpload();
                if (!uploadedUrl) {
                    setLoading(false);
                    return;
                }

                // Delete old file if exists and we're updating
                if (id && formData.assignment_file_url) {
                    await handleDeleteStoredFile(formData.assignment_file_url);
                }

                fileUrl = uploadedUrl;
            }

            const dataToSave = {
                ...formData,
                assignment_file_url: fileUrl
            };


            let phaseId = id;

            if (id) {
                const { error } = await supabase
                    .from('phases')
                    .update(dataToSave)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('phases')
                    .insert([dataToSave])
                    .select();

                if (error) throw error;
                if (data && data[0]) {
                    phaseId = data[0].id;
                }

                // Create notification for new phase
                await supabase.from('notifications').insert({
                    title: 'New Phase Available',
                    message: `Phase ${dataToSave.phase_number}: ${dataToSave.title} has been uploaded. Check it out!`,
                    type: 'new_phase',
                    reference_id: null
                });

                // Fetch active students to send emails
                const { data: students, error: studentsError } = await supabase
                    .from('users')
                    .select('name, email')
                    .eq('role', 'student')
                    .eq('status', 'active');

                if (!studentsError && students && students.length > 0) {
                    console.log('Sending email notifications for students:', students);
                    // Call the Server Action directly (Bypasses Service Worker)
                    try {
                        const payload = {
                            phaseData: dataToSave,
                            students: students,
                        };
                        console.log('Invoking Server Action with payload:', payload);

                        const result = await sendEmailNotification(payload);

                        if (!result.success) {
                            console.error('Email Server Action Failed:', result.error);
                        } else {
                            console.log('Email Server Action Success:', result.sentCount, 'sent', result.failedCount, 'failed');
                        }
                    } catch (err) {
                        console.error('Failed to send email notifications via Server Action:', err);
                    }
                }
            }

            // Sync tasks
            if (phaseId) {
                // Delete existing tasks first
                await supabase.from('phase_tasks').delete().eq('phase_id', phaseId);

                // Insert new tasks
                if (tasks.length > 0) {
                    const tasksToInsert = tasks.map(t => ({
                        phase_id: phaseId,
                        title: t.title,
                        url: t.url,
                        points: t.points || 10
                    }));
                    const { error: insertError } = await supabase.from('phase_tasks').insert(tasksToInsert);
                    if (insertError) throw insertError;
                }
            }

            router.push('/admin/phases');
        } catch (error: any) {
            console.error('Error saving phase:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-2xl transition-all active:scale-95"
                >
                    <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <h1 className="text-2xl font-black text-white tracking-tight">
                    {id ? 'Modify Node Phase' : 'Initialize New Phase'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
                <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6 text-zinc-400">
                    <div className="sm:col-span-2">
                        <label htmlFor="phase_number" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Sequence ID
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="phase_number"
                                id="phase_number"
                                required
                                min="1"
                                step="any"
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                value={isNaN(formData.phase_number as number) ? '' : formData.phase_number}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                                    setFormData({ ...formData, phase_number: val });
                                }}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-4">
                        <label htmlFor="title" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Phase Title
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                placeholder="Identifier name"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Node Narrative / Objectives
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                placeholder="Specify transmission goals..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6 border-t border-zinc-900 pt-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center mb-6">
                            <Video className="mr-3 h-4 w-4 text-red-500 opacity-60" /> Core Transmission Links
                        </h3>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="youtube_url" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Satellite Transmission (YouTube URL)
                        </label>
                        <div className="mt-1">
                            <input
                                type="url"
                                name="youtube_url"
                                id="youtube_url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                value={formData.youtube_url || ''}
                                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="allowed_submission_type" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Node Verification Protocol
                        </label>
                        <div className="mt-1">
                            <select
                                id="allowed_submission_type"
                                name="allowed_submission_type"
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold appearance-none"
                                value={formData.allowed_submission_type || 'both'}
                                onChange={(e) => setFormData({ ...formData, allowed_submission_type: e.target.value as 'github' | 'file' | 'both' | 'leetcode' })}
                            >
                                <option value="both" className="bg-zinc-950">Dual Mode (GitHub & File)</option>
                                <option value="github" className="bg-zinc-950">Repository Only</option>
                                <option value="file" className="bg-zinc-950">Binary Only</option>
                                <option value="leetcode" className="bg-zinc-950">Matrix Verification (LeetCode)</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Blueprint Upload (PDF/IMG)
                        </label>
                        <div className="mt-1 flex justify-center px-8 py-10 border-2 border-zinc-900 border-dashed rounded-3xl hover:border-zinc-700 transition-all bg-zinc-900/30 group">
                            <div className="space-y-4 text-center">
                                {formData.assignment_file_url || selectedFile ? (
                                    <div className="flex flex-col items-center">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-2">
                                            <FileText className="h-10 w-10 text-white" />
                                        </div>
                                        <div className="mt-4 flex text-sm text-zinc-300">
                                            <p className="font-black uppercase tracking-widest text-[10px] truncate max-w-xs">
                                                {selectedFile ? selectedFile.name : formData.assignment_file_url?.split('/').pop()}
                                            </p>
                                        </div>
                                        {selectedFile && (
                                            <p className="text-[10px] text-zinc-600 font-bold mt-1 uppercase">
                                                {formatFileSize(selectedFile.size)} <span className="text-white ml-2">PENDING_SYNC</span>
                                            </p>
                                        )}
                                        <div className="mt-6 flex space-x-3">
                                            {formData.assignment_file_url && !selectedFile && (
                                                <a
                                                    href={formData.assignment_file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-4 py-2 bg-zinc-800 border border-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl text-white hover:bg-zinc-700 transition-all"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Preview
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="inline-flex items-center px-4 py-2 bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl text-red-500 hover:bg-red-500/20 transition-all"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Remove Node
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 inline-block mb-2 group-hover:border-zinc-700 transition-colors">
                                            <Upload className="h-10 w-10 text-zinc-700 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex text-sm text-zinc-500 justify-center">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer font-black text-white uppercase tracking-widest text-[10px] hover:text-zinc-300 transition-colors"
                                            >
                                                <span>Transmit File</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept=".pdf,image/png,image/jpeg,image/jpg"
                                                    onChange={handleFileSelect}
                                                />
                                            </label>
                                            <p className="pl-2 font-bold uppercase tracking-widest text-[10px]">or Drop binary</p>
                                        </div>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                                            LIMIT: 2.0MB
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-6 border-t border-zinc-900 pt-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center">
                                <Target className="mr-3 h-4 w-4 text-white opacity-40" /> Task Verification Nodes
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddTask}
                                className="inline-flex items-center px-4 py-2 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all border group"
                            >
                                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                                Node Entry
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-8">Specify individual problem identifiers for Matrix verification.</p>

                        <div className="space-y-4">
                            {tasks.map((task, idx) => (
                                <div key={idx} className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 flex gap-4 items-start relative pb-8 group hover:border-zinc-700 transition-colors">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTask(idx)}
                                        className="absolute top-4 right-4 p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 flex-1 mt-2">
                                        <div className="sm:col-span-5">
                                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Identifier</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Binary Search"
                                                className="block w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 px-4 text-white placeholder-zinc-800 focus:outline-none focus:border-zinc-600 transition-all text-xs font-bold"
                                                value={task.title || ''}
                                                onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-5">
                                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Matrix Endpoint (URL)</label>
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://matrix.node/..."
                                                className="block w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 px-4 text-white placeholder-zinc-800 focus:outline-none focus:border-zinc-600 transition-all text-xs font-bold"
                                                value={task.url || ''}
                                                onChange={(e) => handleTaskChange(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">XP</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                className="block w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 px-2 text-white placeholder-zinc-800 focus:outline-none focus:border-zinc-600 transition-all text-xs font-black text-center"
                                                value={task.points || 10}
                                                onChange={(e) => handleTaskChange(idx, 'points', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="text-center py-10 border border-dashed border-zinc-800 rounded-3xl text-zinc-700 font-bold uppercase tracking-widest text-[10px]">
                                    No node descriptors initialized.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="assignment_resource_url" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Remote Source URL (Optional)
                        </label>
                        <div className="mt-1">
                            <input
                                type="url"
                                name="assignment_resource_url"
                                id="assignment_resource_url"
                                placeholder="External resource link"
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                value={formData.assignment_resource_url || ''}
                                onChange={(e) => setFormData({ ...formData, assignment_resource_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="min_seconds_required" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Incubation Time (Minutes)
                        </label>
                        <div className="mt-1 flex items-center">
                            <input
                                type="number"
                                name="min_seconds_required"
                                id="min_seconds_required"
                                min="0"
                                step="0.1"
                                placeholder="Threshold"
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                value={isNaN(formData.min_seconds_required as number) ? '' : (formData.min_seconds_required ? formData.min_seconds_required / 60 : 0)}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? NaN : parseFloat(e.target.value) * 60;
                                    setFormData({ ...formData, min_seconds_required: val });
                                }}
                            />
                            <span className="ml-4 text-[10px] font-black text-zinc-700 uppercase tracking-widest">MINS</span>
                        </div>
                        <p className="mt-2 text-[9px] text-zinc-600 font-bold uppercase tracking-widest italic">Time threshold required before transmission is accepted.</p>
                    </div>

                    <div className="sm:col-span-6">
                        <div className="flex items-start">
                            <div className="flex items-center h- relative">
                                <input
                                    id="bypass_time_requirement"
                                    name="bypass_time_requirement"
                                    type="checkbox"
                                    className="h-5 w-5 bg-zinc-900 border-zinc-800 rounded-lg text-white focus:ring-offset-zinc-950 focus:ring-white/20"
                                    checked={formData.bypass_time_requirement || false}
                                    onChange={(e) => setFormData({ ...formData, bypass_time_requirement: e.target.checked })}
                                />
                            </div>
                            <div className="ml-4 text-xs">
                                <label htmlFor="bypass_time_requirement" className="font-black text-white uppercase tracking-widest">Instant Transmission</label>
                                <p className="text-zinc-600 font-bold uppercase text-[9px] mt-1 tracking-wider">Override incubation and allow immediate data push.</p>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="total_assignments" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Required Node Count
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="total_assignments"
                                id="total_assignments"
                                min="1"
                                max="10"
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                value={isNaN(formData.total_assignments as number) ? '' : (formData.total_assignments || 1)}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? NaN : parseInt(e.target.value);
                                    setFormData({ ...formData, total_assignments: val });
                                }}
                            />
                        </div>
                        <p className="mt-2 text-[9px] text-zinc-600 font-bold uppercase tracking-widest italic">Quantity of separate segments required for completion.</p>
                    </div>

                    <div className="sm:col-span-6 border-t border-zinc-900 pt-8">
                        <div className="flex items-center justify-between p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Mandatory Node</h3>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">If active, missed deadlines will trigger revocation protocols.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_mandatory: !formData.is_mandatory })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-transparent ring-offset-2 ${formData.is_mandatory ? 'bg-white' : 'bg-zinc-800'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${formData.is_mandatory ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="sm:col-span-6 border-t border-zinc-900 pt-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center mb-6">
                            <Calendar className="mr-3 h-4 w-4 text-emerald-500 opacity-60" /> Phase Timeline
                        </h3>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="start_date" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Commencement Date
                        </label>
                        <div className="mt-1">
                            <input
                                type="datetime-local"
                                name="start_date"
                                id="start_date"
                                required
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="end_date" className="block text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                            Deadline Threshold
                        </label>
                        <div className="mt-1">
                            <input
                                type="datetime-local"
                                name="end_date"
                                id="end_date"
                                required
                                className="block w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all sm:text-sm font-bold"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                            <div className="ml-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-10 border-t border-zinc-900">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-transparent py-2.5 px-6 border border-zinc-800 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all active:scale-95"
                    >
                        Abort
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-4 inline-flex justify-center py-2.5 px-8 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.15)] text-[10px] font-black uppercase tracking-widest rounded-xl text-black bg-white hover:bg-zinc-200 focus:outline-none transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Syncing...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <Save className="-ml-1 mr-2 h-4 w-4" /> Save Configuration
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
