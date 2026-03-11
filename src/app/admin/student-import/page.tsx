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
                    <h1 className="text-2xl font-black text-black tracking-tight uppercase">Import Students</h1>
                    <p className="mt-1 text-sm text-zinc-500 font-medium">
                        Bulk register students and create Auth accounts automatically.
                    </p>
                </div>
                <Link
                    href="/admin/students"
                    className="flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Students
                </Link>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-zinc-200 text-black shadow-sm relative overflow-hidden">
                <div className="flex border-b border-zinc-100 mb-10 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('csv')}
                        className={`flex items-center py-4 px-8 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'csv' ? 'border-black text-black bg-zinc-50/50' : 'border-transparent text-zinc-400 hover:text-black'}`}
                    >
                        <Upload className="w-4 h-4 mr-3" /> Bulk CSV Import
                    </button>
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`flex items-center py-4 px-8 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'single' ? 'border-black text-black bg-zinc-50/50' : 'border-transparent text-zinc-400 hover:text-black'}`}
                    >
                        <UserPlus className="w-4 h-4 mr-3" /> Add Single Student
                    </button>
                </div>

                {activeTab === 'csv' ? (
                    <div className="space-y-8">
                        <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Info className="h-5 w-5 text-black opacity-20" aria-hidden="true" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-[10px] text-black font-black uppercase tracking-widest opacity-40">
                                        CSV Requirement:
                                    </p>
                                    <p className="text-sm text-zinc-500 mt-2 font-medium">
                                        Your file must include headers:
                                        <code className="mx-1 font-mono bg-white text-black border border-zinc-200 px-2 py-0.5 rounded-lg font-bold">name</code>,
                                        <code className="mx-1 font-mono bg-white text-black border border-zinc-200 px-2 py-0.5 rounded-lg font-bold">email</code>,
                                        <code className="mx-1 font-mono bg-white text-black border border-zinc-200 px-2 py-0.5 rounded-lg font-bold">roll_no</code>,
                                        <code className="mx-1 font-mono bg-white text-black border border-zinc-200 px-2 py-0.5 rounded-lg font-bold">phone</code>,
                                        and <code className="mx-1 font-mono bg-white text-black border border-zinc-200 px-2 py-0.5 rounded-lg font-bold">password</code>.
                                    </p>
                                    <button
                                        onClick={downloadSample}
                                        className="mt-6 inline-flex items-center text-[10px] font-black uppercase tracking-widest text-black hover:opacity-100 opacity-60 transition-opacity"
                                    >
                                        <Download className="mr-2 h-4 w-4" /> Download Sample CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-100 rounded-[2.5rem] p-16 transition-all hover:border-zinc-300 group bg-zinc-50/30">
                            <Upload className="h-12 w-12 text-zinc-200 mb-6 group-hover:text-black transition-colors" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8 group-hover:text-black transition-colors">Select or drag CSV transmission</p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="block w-full text-xs text-zinc-400 file:mr-6 file:py-3 file:px-8 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-black file:text-white hover:file:bg-zinc-800 cursor-pointer"
                            />
                            {file && (
                                <div className="mt-8 flex items-center text-[10px] font-black uppercase tracking-widest text-black bg-white border border-zinc-100 px-6 py-4 rounded-2xl shadow-sm">
                                    <FileText className="mr-3 h-4 w-4 text-emerald-500" />
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
                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
                                        <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Total</p>
                                        <p className="text-3xl font-black text-black mt-2">{result.total}</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
                                        <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">Success</p>
                                        <p className="text-3xl font-black text-emerald-600 mt-2">{result.success}</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
                                        <p className="text-[10px] text-red-500 uppercase font-black tracking-widest">Failed</p>
                                        <p className="text-3xl font-black text-red-600 mt-2">{result.failed}</p>
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
                                    className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-zinc-800 transition shadow-lg shadow-black/10"
                                >
                                    Access Database
                                </button>
                            </div>
                        )}

                        {!result && (
                            <button
                                onClick={processCSV}
                                disabled={!file || loading}
                                className="w-full flex justify-center items-center py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-black/10 active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-4 h-5 w-5" />
                                        Processing Protocol...
                                    </>
                                ) : (
                                    'Initialize Secure Import'
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <form onSubmit={processSingleStudent} className="space-y-6 max-w-2xl mx-auto py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-14 px-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-black placeholder-zinc-300 focus:outline-none focus:border-black transition-all text-sm font-bold"
                                    placeholder="John Doe"
                                    value={singleStudent.name}
                                    onChange={e => setSingleStudent(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full h-14 px-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-black placeholder-zinc-300 focus:outline-none focus:border-black transition-all text-sm font-bold"
                                    placeholder="john@example.com"
                                    value={singleStudent.email}
                                    onChange={e => setSingleStudent(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1">Password *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-14 px-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-black placeholder-zinc-300 focus:outline-none focus:border-black transition-all text-sm font-black tracking-widest font-mono"
                                    placeholder="Student@123"
                                    value={singleStudent.password}
                                    onChange={e => setSingleStudent(p => ({ ...p, password: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1">Roll / ID Number</label>
                                <input
                                    type="text"
                                    className="w-full h-14 px-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-black placeholder-zinc-300 focus:outline-none focus:border-black transition-all text-sm font-bold uppercase"
                                    placeholder="Optional"
                                    value={singleStudent.roll_number}
                                    onChange={e => setSingleStudent(p => ({ ...p, roll_number: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full h-14 px-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-black placeholder-zinc-300 focus:outline-none focus:border-black transition-all text-sm font-bold"
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
                            className="w-full h-16 bg-black text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center active:scale-95"
                        >
                            {singleLoading ? (
                                <>
                                    <Loader2 className="animate-spin mr-4 h-5 w-5" />
                                    SYNCING_NODE...
                                </>
                            ) : (
                                'Register Student Node'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
