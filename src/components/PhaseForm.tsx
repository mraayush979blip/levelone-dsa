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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {id ? 'Edit Phase' : 'Create New Phase'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-2 text-blue-600">
                        <label htmlFor="phase_number" className="block text-sm font-bold">
                            Phase Number
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="phase_number"
                                id="phase_number"
                                required
                                min="1"
                                step="any"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                value={isNaN(formData.phase_number as number) ? '' : formData.phase_number}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                                    setFormData({ ...formData, phase_number: val });
                                }}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-4">
                        <label htmlFor="title" className="block text-sm font-bold text-gray-700">
                            Phase Title
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                placeholder="e.g. Fundamental Concepts"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-sm font-bold text-gray-700">
                            Description
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                placeholder="What will students learn in this phase?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6 border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                            <Video className="mr-2 h-5 w-5 text-red-500" /> Resources
                        </h3>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="youtube_url" className="block text-sm font-bold text-gray-700">
                            YouTube Video URL
                        </label>
                        <div className="mt-1">
                            <input
                                type="url"
                                name="youtube_url"
                                id="youtube_url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                value={formData.youtube_url || ''}
                                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="allowed_submission_type" className="block text-sm font-bold text-gray-700">
                            Allowed Submission Type
                        </label>
                        <div className="mt-1">
                            <select
                                id="allowed_submission_type"
                                name="allowed_submission_type"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                value={formData.allowed_submission_type || 'both'}
                                onChange={(e) => setFormData({ ...formData, allowed_submission_type: e.target.value as 'github' | 'file' | 'both' })}
                            >
                                <option value="both">Both (GitHub Link & File Upload)</option>
                                <option value="github">GitHub Link Only</option>
                                <option value="file">File Upload Only</option>
                                <option value="leetcode">LeetCode Verification</option>
                            </select>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Choose how students are allowed to submit their work for this phase.</p>
                    </div>

                    <div className="sm:col-span-6">
                        <label className="block text-sm font-bold text-gray-700">
                            Assignment Document (PDF or Image)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors bg-gray-50">
                            <div className="space-y-1 text-center">
                                {formData.assignment_file_url || selectedFile ? (
                                    <div className="flex flex-col items-center">
                                        <FileText className="mx-auto h-12 w-12 text-blue-500" />
                                        <div className="mt-4 flex text-sm text-gray-600">
                                            <p className="font-medium text-blue-600 truncate max-w-xs">
                                                {selectedFile ? selectedFile.name : formData.assignment_file_url?.split('/').pop()}
                                            </p>
                                        </div>
                                        {selectedFile && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatFileSize(selectedFile.size)} (Pending Upload)
                                            </p>
                                        )}
                                        <div className="mt-4 flex space-x-4">
                                            {formData.assignment_file_url && !selectedFile && (
                                                <a
                                                    href={formData.assignment_file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <Download className="mr-1.5 h-4 w-4 text-gray-400" />
                                                    View Current
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <X className="mr-1.5 h-4 w-4" />
                                                Remove/Replace
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                            >
                                                <span>Upload a file</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept=".pdf,image/png,image/jpeg,image/jpg"
                                                    onChange={handleFileSelect}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PDF, PNG, JPG up to 2MB
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-6 border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center text-orange-600">
                                <Target className="mr-2 h-5 w-5" /> Detailed Tasks / LeetCode Problems
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddTask}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Problem
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Assign specific problems for students to solve. They will be verified individually.</p>

                        <div className="space-y-4">
                            {tasks.map((task, idx) => (
                                <div key={idx} className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex gap-4 items-start relative pb-6">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTask(idx)}
                                        className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 flex-1 mt-2">
                                        <div className="sm:col-span-5">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Problem Title</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Two Sum"
                                                className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2.5 border"
                                                value={task.title || ''}
                                                onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-5">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">LeetCode URL</label>
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://leetcode.com/problems/..."
                                                className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2.5 border"
                                                value={task.url || ''}
                                                onChange={(e) => handleTaskChange(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Points</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2.5 border text-center"
                                                value={task.points || 10}
                                                onChange={(e) => handleTaskChange(idx, 'points', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-500">
                                    No problems added yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="assignment_resource_url" className="block text-sm font-bold text-gray-700">
                            Additional Resource URL (Optional)
                        </label>
                        <div className="mt-1">
                            <input
                                type="url"
                                name="assignment_resource_url"
                                id="assignment_resource_url"
                                placeholder="Link to project boilerplate or instructions"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                value={formData.assignment_resource_url || ''}
                                onChange={(e) => setFormData({ ...formData, assignment_resource_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="min_seconds_required" className="block text-sm font-bold text-gray-700">
                            Minimum Time Spent (Minutes) to Unlock Assignment
                        </label>
                        <div className="mt-1 flex items-center">
                            <input
                                type="number"
                                name="min_seconds_required"
                                id="min_seconds_required"
                                min="0"
                                step="0.1"
                                placeholder="e.g. 0.5 for 30 seconds"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                value={isNaN(formData.min_seconds_required as number) ? '' : (formData.min_seconds_required ? formData.min_seconds_required / 60 : 0)}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? NaN : parseFloat(e.target.value) * 60;
                                    setFormData({ ...formData, min_seconds_required: val });
                                }}
                            />
                            <span className="ml-3 text-sm text-gray-500">minutes</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400 italic">Students must spend at least this much time on the phase page before they can submit (0 = Requires Video Completion).</p>
                    </div>

                    <div className="sm:col-span-6">
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="bypass_time_requirement"
                                    name="bypass_time_requirement"
                                    type="checkbox"
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    checked={formData.bypass_time_requirement || false}
                                    onChange={(e) => setFormData({ ...formData, bypass_time_requirement: e.target.checked })}
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="bypass_time_requirement" className="font-medium text-gray-700">Allow Immediate Submission (Bypass Time Requirement)</label>
                                <p className="text-gray-500">If checked, students can submit assignments immediately without waiting for the minimum time or watching the video.</p>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="total_assignments" className="block text-sm font-bold text-gray-700">
                            Total Assignments Required
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="total_assignments"
                                id="total_assignments"
                                min="1"
                                max="10"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                value={isNaN(formData.total_assignments as number) ? '' : (formData.total_assignments || 1)}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? NaN : parseInt(e.target.value);
                                    setFormData({ ...formData, total_assignments: val });
                                }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-400 italic">How many separate assignments must the student submit for this phase?</p>
                    </div>

                    <div className="sm:col-span-6 border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Mandatory Phase</h3>
                                <p className="text-xs text-gray-500">If disabled, students won't be revoked for missing this deadline.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_mandatory: !formData.is_mandatory })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-transparent ring-offset-2 ${formData.is_mandatory ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_mandatory ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="sm:col-span-6 border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                            <Calendar className="mr-2 h-5 w-5 text-green-500" /> Timeline
                        </h3>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="start_date" className="block text-sm font-bold text-gray-700">
                            Start Date
                        </label>
                        <div className="mt-1">
                            <input
                                type="datetime-local"
                                name="start_date"
                                id="start_date"
                                required
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="end_date" className="block text-sm font-bold text-gray-700">
                            End Date (Deadline)
                        </label>
                        <div className="mt-1">
                            <input
                                type="datetime-local"
                                name="end_date"
                                id="end_date"
                                required
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center text-bold font-bold">
                                <Save className="-ml-1 mr-2 h-4 w-4" /> Save Phase
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
