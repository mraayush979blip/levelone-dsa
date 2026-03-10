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
    ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function CSVImportPage() {
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

                // If checking for optional fields, ensure we don't return undefined if column missing
                const rollVal = rollNumberIdx !== -1 ? row[rollNumberIdx] : '';
                const phoneVal = phoneIdx !== -1 ? row[phoneIdx] : '';

                return {
                    name: row[nameIdx],
                    email: row[emailIdx],
                    roll_number: rollVal, // Pass whatever is found or empty string
                    phone: phoneVal,
                    password: row[passwordIdx]
                };
            }).filter((s): s is any => s !== null);

            if (studentsToImport.length === 0) {
                throw new Error('No valid student data found in CSV.');
            }

            const response = await fetch('/api/students/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ students: studentsToImport }),
            });

            const actionResult = await response.json();

            if (!actionResult.success) {
                throw new Error(actionResult.errors?.join(', ') || 'Failed to import students');
            }

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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">Bulk Registration</h1>
                    <p className="mt-1 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                        Initialize multiple student nodes via CSV synchronization.
                    </p>
                </div>
                <Link
                    href="/admin/students"
                    className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-2xl transition-all active:scale-95 text-white"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
            </div>

            <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl space-y-8">
                <div className="bg-zinc-900/50 border-l-4 border-white p-6 rounded-2xl">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Info className="h-5 w-5 text-white opacity-40" aria-hidden="true" />
                        </div>
                        <div className="ml-4">
                            <p className="text-[10px] text-white font-black uppercase tracking-widest">
                                Transmission Requirements:
                            </p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                                Headers Required:
                                <code className="mx-2 text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded font-black tracking-widest">name</code>,
                                <code className="mx-2 text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded font-black tracking-widest">email</code>,
                                <code className="mx-2 text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded font-black tracking-widest">roll_no</code>,
                                <code className="mx-2 text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded font-black tracking-widest">phone</code>,
                                and <code className="mx-2 text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded font-black tracking-widest">password</code>.
                            </p>
                            <button
                                onClick={downloadSample}
                                className="mt-4 inline-flex items-center text-[10px] font-black text-white hover:text-zinc-300 uppercase tracking-[0.2em] transition-colors"
                            >
                                <Download className="mr-2 h-4 w-4" /> Get Blueprint (.CSV)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-[2rem] p-12 transition-all hover:border-zinc-700 bg-zinc-900/30 group">
                    <Upload className="h-12 w-12 text-zinc-800 mb-6 group-hover:text-white transition-colors" />
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">Select or Drag Transmission Manifest</p>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="block w-full text-[10px] text-zinc-500 font-black uppercase tracking-widest file:mr-6 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-white file:text-black hover:file:bg-zinc-200 transition-all cursor-pointer"
                    />
                    {file && (
                        <div className="mt-6 flex items-center text-[10px] font-black text-white uppercase tracking-widest bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800">
                            <FileText className="mr-3 h-4 w-4 text-white opacity-40" />
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-md flex items-center text-red-700">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        {error}
                    </div>
                )}

                {result && (
                    <div className="bg-transparent p-8 rounded-3xl border border-zinc-900 space-y-8">
                        <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-white">
                            <CheckCircle2 className="mr-3 h-5 w-5 text-emerald-500" />
                            Synchronization Complete
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Total</p>
                                <p className="text-2xl font-black text-white">{result.total}</p>
                            </div>
                            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
                                <p className="text-[8px] text-emerald-500/60 uppercase font-black tracking-widest mb-1">Success</p>
                                <p className="text-2xl font-black text-emerald-500">{result.success}</p>
                            </div>
                            <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                                <p className="text-[8px] text-red-500/60 uppercase font-black tracking-widest mb-1">Failed</p>
                                <p className="text-2xl font-black text-red-500">{result.failed}</p>
                            </div>
                        </div>
                        {result.errors.length > 0 && (
                            <div className="mt-4">
                                <p className="text-[10px] font-black text-red-500 mb-4 uppercase tracking-widest">Error Log:</p>
                                <ul className="text-[9px] text-red-400 bg-red-500/5 border border-red-500/10 p-4 rounded-xl list-none space-y-2 max-h-40 overflow-y-auto font-bold uppercase tracking-wider">
                                    {result.errors.map((err, i) => <li key={i} className="flex items-start"><span className="mr-2 opacity-40">→</span>{err}</li>)}
                                </ul>
                            </div>
                        )}
                        <button
                            onClick={() => router.push('/admin/students')}
                            className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-95"
                        >
                            Explore Student Nodes
                        </button>
                    </div>
                )}

                {!result && (
                    <button
                        onClick={processCSV}
                        disabled={!file || loading}
                        className="w-full flex justify-center items-center py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <Loader2 className="animate-spin mr-3 h-4 w-4" />
                                Processing Node Transmission...
                            </div>
                        ) : (
                            'Initialize Node Sync'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
