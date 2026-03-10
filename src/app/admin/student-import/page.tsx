'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Download,
    Loader2,
    Info,
    ArrowLeft,
    UserPlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function StudentImportPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Single student state
    const [activeTab, setActiveTab] = useState<'csv' | 'single'>('csv');
    const [singleStudent, setSingleStudent] = useState({
        name: '', email: '', roll_number: '', phone: '', password: ''
    });
    const [singleResult, setSingleResult] = useState<{ success: boolean; message: string } | null>(null);
    const [singleLoading, setSingleLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const processCSV = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const text = await file.text();

            // Robust line splitting: handles \r\n, \r, and \n
            const lines = text.split(/\r\n|\r|\n/).map(line => line.trim()).filter(line => line.length > 0);

            if (lines.length < 2) {
                const contentSnippet = text.substring(0, 100).replace(/\r/g, '\\r').replace(/\n/g, '\\n');
                throw new Error(`CSV file is too short. Found ${lines.length} non-empty line(s). Need at least a header and one data row. File start: "${contentSnippet}..."`);
            }

            const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
            const headers = rows[0].map(h => h.toLowerCase());

            const nameIdx = headers.indexOf('name');
            const emailIdx = headers.indexOf('email');

            // Allow flexibility in header names
            const rollNumberIdx = headers.findIndex(h => ['roll_number', 'roll_no', 'rollno', 'roll'].includes(h));
            const phoneIdx = headers.findIndex(h => ['phone', 'mobile', 'contact', 'number'].includes(h));
            const passwordIdx = headers.indexOf('password');

            if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1) {
                throw new Error('CSV must contain at least "name", "email", and "password" columns.');
            }

            const studentsToImport = rows.slice(1).map((row) => {
                if (row.length < headers.length) return null;

                const rollVal = rollNumberIdx !== -1 ? row[rollNumberIdx] : '';
                const phoneVal = phoneIdx !== -1 ? row[phoneIdx] : '';

                return {
                    name: row[nameIdx],
                    email: row[emailIdx],
                    roll_number: rollVal,
                    phone: phoneVal,
                    password: row[passwordIdx]
                };
            }).filter((s): s is any => s !== null);

            if (studentsToImport.length === 0) {
                throw new Error('No valid student data found in CSV.');
            }

            // Call API instead of Server Action to avoid 405 on some Edge platforms
            const response = await fetch('/api/students/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ students: studentsToImport }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with status: ${response.status}`);
            }

            const actionResult = await response.json();

            setResult({
                total: studentsToImport.length,
                success: actionResult.successCount || 0,
                failed: actionResult.failedCount || 0,
                errors: actionResult.errors || []
            });

            // Record the import in database
            await supabase.from('csv_imports').insert({
                admin_id: user?.id,
                file_name: file.name,
                total_rows: studentsToImport.length,
                successful_count: actionResult.successCount,
                failed_count: actionResult.failedCount,
                error_details: actionResult.errors
            });

        } catch (err: any) {
            console.error('CSV Import error:', err);
            if (err.name === 'NotReadableError') {
                setError('The file could not be read. Please make sure it is not open in another program (like Excel) and try selecting it again.');
            } else {
                setError(err.message || 'An unexpected error occurred during import.');
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadSample = () => {
        const csvContent = "name,email,roll_no,phone,password\nJohn Doe,john@example.com,STU001,9876543210,Student@123\nJane Smith,jane@example.com,STU002,9123456780,Student@456";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'sample_students.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const processSingleStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSingleLoading(true);
        setSingleResult(null);
        setError(null);

        try {
            if (!singleStudent.name || !singleStudent.email || !singleStudent.password) {
                throw new Error("Name, Email, and Password are required.");
            }

            const response = await fetch('/api/students/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students: [singleStudent] })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with status: ${response.status}`);
            }

            const actionResult = await response.json();

            if (actionResult.failedCount > 0) {
                throw new Error(actionResult.errors[0] || "Failed to add student.");
            }

            setSingleResult({ success: true, message: "Student added successfully!" });
            setSingleStudent({ name: '', email: '', roll_number: '', phone: '', password: '' });

        } catch (err: any) {
            setSingleResult({ success: false, message: err.message || 'An unexpected error occurred.' });
        } finally {
            setSingleLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Import Students</h1>
                    <p className="mt-1 text-sm text-zinc-400 font-medium">
                        Bulk register students and create Auth accounts automatically.
                    </p>
                </div>
                <Link
                    href="/admin/students"
                    className="flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Students
                </Link>
            </div>

            <div className="bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-zinc-800 text-white shadow-2xl relative overflow-hidden">
                <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('csv')}
                        className={`flex items-center py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'csv' ? 'border-white text-white bg-zinc-900/50' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Upload className="w-4 h-4 mr-2" /> Bulk CSV Import
                    </button>
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`flex items-center py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'single' ? 'border-white text-white bg-zinc-900/50' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Add Single Student
                    </button>
                </div>

                {activeTab === 'csv' ? (
                    <div className="space-y-8">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Info className="h-5 w-5 text-white opacity-40" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-white font-black uppercase tracking-widest opacity-40">
                                        CSV Requirement:
                                    </p>
                                    <p className="text-sm text-zinc-300 mt-2 font-medium">
                                        Your file must include headers:
                                        <code className="mx-1 font-mono bg-white/10 text-white px-2 py-0.5 rounded-lg font-bold">name</code>,
                                        <code className="mx-1 font-mono bg-white/10 text-white px-2 py-0.5 rounded-lg font-bold">email</code>,
                                        <code className="mx-1 font-mono bg-white/10 text-white px-2 py-0.5 rounded-lg font-bold">roll_no</code>,
                                        <code className="mx-1 font-mono bg-white/10 text-white px-2 py-0.5 rounded-lg font-bold">phone</code>,
                                        and <code className="mx-1 font-mono bg-white/10 text-white px-2 py-0.5 rounded-lg font-bold">password</code>.
                                    </p>
                                    <button
                                        onClick={downloadSample}
                                        className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-widest text-white hover:opacity-70 transition-opacity"
                                    >
                                        <Download className="mr-2 h-4 w-4" /> Download Sample CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-[2rem] p-12 transition-all hover:border-zinc-500 group bg-zinc-950">
                            <Upload className="h-12 w-12 text-zinc-700 mb-4 group-hover:text-white transition-colors" />
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6 group-hover:text-zinc-300 transition-colors">Select or drag CSV file</p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-white file:text-black hover:file:bg-zinc-200 cursor-pointer"
                            />
                            {file && (
                                <div className="mt-6 flex items-center text-xs font-bold text-white bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl">
                                    <FileText className="mr-2 h-4 w-4 text-emerald-500" />
                                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-md flex items-center text-red-700 font-medium">
                                <AlertCircle className="mr-2 h-5 w-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {result && (
                            <div className="bg-green-50 border border-green-200 p-6 rounded-lg space-y-4">
                                <div className="flex items-center text-green-800 font-bold text-lg">
                                    <CheckCircle2 className="mr-2 h-6 w-6 text-green-500" />
                                    Import Complete
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total</p>
                                        <p className="text-2xl font-black text-gray-800">{result.total}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                        <p className="text-xs text-green-500 uppercase font-bold tracking-wider">Success</p>
                                        <p className="text-2xl font-black text-green-600">{result.success}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                        <p className="text-xs text-red-500 uppercase font-bold tracking-wider">Failed</p>
                                        <p className="text-2xl font-black text-red-600">{result.failed}</p>
                                    </div>
                                </div>
                                {result.errors.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-bold text-red-800 mb-2">Error Details:</p>
                                        <ul className="text-xs text-red-700 bg-red-100 p-4 rounded-lg list-disc list-inside space-y-1 max-h-40 overflow-y-auto font-medium border border-red-200">
                                            {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <button
                                    onClick={() => router.push('/admin/students')}
                                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                                >
                                    View Database
                                </button>
                            </div>
                        )}

                        {!result && (
                            <button
                                onClick={processCSV}
                                disabled={!file || loading}
                                className="w-full flex justify-center items-center py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-3 h-5 w-5" />
                                        Processing CSV Engine...
                                    </>
                                ) : (
                                    'Start Secure Import'
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <form onSubmit={processSingleStudent} className="space-y-6 max-w-2xl mx-auto py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-12 px-5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all text-sm font-medium"
                                    placeholder="John Doe"
                                    value={singleStudent.name}
                                    onChange={e => setSingleStudent(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full h-12 px-5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all text-sm font-medium"
                                    placeholder="john@example.com"
                                    value={singleStudent.email}
                                    onChange={e => setSingleStudent(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Password *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-12 px-5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all text-sm font-mono"
                                    placeholder="Student@123"
                                    value={singleStudent.password}
                                    onChange={e => setSingleStudent(p => ({ ...p, password: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Roll / ID Number</label>
                                <input
                                    type="text"
                                    className="w-full h-12 px-5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all text-sm font-medium uppercase"
                                    placeholder="Optional"
                                    value={singleStudent.roll_number}
                                    onChange={e => setSingleStudent(p => ({ ...p, roll_number: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full h-12 px-5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-all text-sm font-medium"
                                    placeholder="Optional"
                                    value={singleStudent.phone}
                                    onChange={e => setSingleStudent(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                        </div>

                        {singleResult && (
                            <div className={`p-4 rounded-xl flex items-center font-bold text-xs uppercase tracking-widest ${singleResult.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {singleResult.success ? <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 shrink-0" />}
                                {singleResult.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={singleLoading}
                            className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center"
                        >
                            {singleLoading ? (
                                <>
                                    <Loader2 className="animate-spin mr-3 h-5 w-5" />
                                    Creating Node...
                                </>
                            ) : (
                                'Register Student'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
