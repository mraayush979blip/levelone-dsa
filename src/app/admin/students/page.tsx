'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    Eye,
    Filter,
    Users as UsersIcon,
    Shield,
    ShieldOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';
import { cn } from '@/lib/utils';

export default function StudentListPage() {
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'student')
                .order('roll_number', { ascending: true });

            if (error) throw error;

            // Numeric sort for roll numbers (handling strings like '1', '10', '2')
            const sortedData = (data || []).sort((a, b) => {
                const numA = parseInt(a.roll_number || '0', 10);
                const numB = parseInt(b.roll_number || '0', 10);
                if (isNaN(numA) || isNaN(numB)) {
                    return (a.roll_number || '').localeCompare(b.roll_number || '');
                }
                return numA - numB;
            });

            setStudents(sortedData);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStudentStatus = async (student: User) => {
        const newStatus = student.status === 'active' ? 'revoked' : 'active';
        if (!confirm(`Are you sure you want to ${newStatus === 'revoked' ? 'revoke access for' : 'restore access for'} ${student.name}?`)) return;

        setActionLoading(true);
        try {
            if (newStatus === 'active') {
                const { error } = await supabase.rpc('admin_restore_student', {
                    target_student_id: student.id
                });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('users')
                    .update({ status: newStatus })
                    .eq('id', student.id);

                if (error) throw error;

                await supabase.from('activity_logs').insert({
                    student_id: student.id,
                    phase_id: '00000000-0000-0000-0000-000000000000',
                    activity_type: 'ACCESS_REVOKED',
                    payload: { admin_id: (await supabase.auth.getUser()).data.user?.id }
                });
            }

            fetchStudents();
        } catch (error) {
            console.error('Error updating student status:', error);
            alert('Failed to update student status.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkRevoke = async () => {
        const activeCount = students.filter(s => s.status === 'active').length;
        if (activeCount === 0) {
            alert('No active students to revoke.');
            return;
        }

        if (!confirm(`CAUTION: Are you sure you want to revoke access for ALL ${activeCount} active students? This will take effect immediately.`)) return;

        setActionLoading(true);
        try {
            const { data, error } = await supabase.rpc('admin_bulk_revoke_students');
            if (error) throw error;

            alert(`Success! ${data.affected_count} students were revoked.`);
            fetchStudents();
        } catch (error) {
            console.error('Error in bulk revoke:', error);
            alert('Failed to perform bulk revocation.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkRestore = async () => {
        const revokedCount = students.filter(s => s.status === 'revoked').length;
        if (revokedCount === 0) {
            alert('No revoked students to restore.');
            return;
        }

        if (!confirm(`Are you sure you want to restore access for ALL ${revokedCount} revoked students? This will also bypass any missed mandatory phases for them.`)) return;

        setActionLoading(true);
        try {
            const { data, error } = await supabase.rpc('admin_bulk_restore_students');
            if (error) throw error;

            alert(`Success! ${data.affected_count} students were restored. Total bypassed phases: ${data.total_bypassed_phases}`);
            fetchStudents();
        } catch (error) {
            console.error('Error in bulk restore:', error);
            alert('Failed to perform bulk restoration.');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFilter = filterStatus === 'all' || student.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-10 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mb-2">Fleet Management</p>
                    <h1 className="text-4xl font-black text-white tracking-tighter text-glow uppercase">Active Nodes</h1>
                    <p className="mt-2 text-sm text-zinc-500 font-medium">
                        Monitor student progress and manage protocol access.
                    </p>
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-primary bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-glow">
                    <UsersIcon className="h-4 w-4 animate-premium-float" />
                    <span>{students.length} Nodes Online</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between glass p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="relative w-full lg:max-w-xl">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 border border-white/5 rounded-2xl bg-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                        placeholder="Search by name, email, or protocol ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={handleBulkRestore}
                            disabled={actionLoading || loading}
                            className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-2xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all active:scale-95 shadow-lg shadow-emerald-500/5"
                        >
                            <Shield className="h-4 w-4 mr-2.5" /> Restore Fleet
                        </button>
                        <button
                            onClick={handleBulkRevoke}
                            disabled={actionLoading || loading}
                            className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3.5 bg-white/5 text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-95"
                        >
                            <ShieldOff className="h-4 w-4 mr-2.5" /> Revoke Fleet
                        </button>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
                        <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
                        <select
                            className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-zinc-300 focus:ring-0 cursor-pointer pr-8"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all" className="bg-zinc-950">Full Spectrum</option>
                            <option value="active" className="bg-zinc-950">Active Only</option>
                            <option value="revoked" className="bg-zinc-950">Revoked Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                    </div>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 glass rounded-[3rem] border border-white/5 text-center px-6">
                    <div className="p-8 bg-white/5 rounded-full mb-8 relative">
                        <UsersIcon className="h-16 w-16 text-zinc-800" />
                        <div className="absolute inset-0 border border-white/10 rounded-full animate-ping opacity-20" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.3em]">No nodes detected</h3>
                    <p className="mt-2 text-sm text-zinc-500 uppercase tracking-widest max-w-xs">The current scan parameters yielded no active signals in the node network.</p>
                </div>
            ) : (
                <div className="glass overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th scope="col" className="px-8 py-6 text-left text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                                        Node Designation
                                    </th>
                                    <th scope="col" className="px-8 py-6 text-left text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                                        Protocol ID
                                    </th>
                                    <th scope="col" className="px-8 py-6 text-left text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                                        Status
                                    </th>
                                    <th scope="col" className="px-8 py-6 text-left text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                                        Activation
                                    </th>
                                    <th scope="col" className="relative px-8 py-6">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {filteredStudents.map((student, idx) => (
                                    <tr 
                                        key={student.id} 
                                        className="hover:bg-white/[0.03] transition-all group animate-fade-in"
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                    >
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center mr-4 border border-white/5 group-hover:scale-110 transition-transform">
                                                    <span className="text-sm font-black text-primary">{student.name?.charAt(0) || 'N'}</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white group-hover:text-primary transition-colors">{student.name || 'ANONYMOUS_NODE'}</div>
                                                    <div className="text-[9px] font-bold text-zinc-500 tracking-wider mt-0.5">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                                {student.roll_number || 'NULL_ID'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className={cn(
                                                "px-4 py-1.5 inline-flex text-[8px] font-black uppercase tracking-[0.2em] rounded-full border transition-all duration-300",
                                                student.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                            )}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                            {new Date(student.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right space-x-2">
                                            <Link
                                                href={`/admin/students/${student.id}`}
                                                className="p-3 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all inline-flex items-center active:scale-90"
                                                title="Full Node Inspection"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => toggleStudentStatus(student)}
                                                className={cn(
                                                    "p-3 bg-white/5 border border-white/5 rounded-xl transition-all inline-flex items-center active:scale-90",
                                                    student.status === 'active' 
                                                        ? 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20' 
                                                        : 'text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/20'
                                                )}
                                                title={student.status === 'active' ? 'Revoke Protocol' : 'Restore Protocol'}
                                            >
                                                {student.status === 'active' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

}
