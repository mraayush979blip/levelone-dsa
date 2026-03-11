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
        <div className="space-y-6 font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-black tracking-tight uppercase">Student Management</h1>
                    <p className="mt-1 text-sm text-zinc-500 font-medium">
                        View and manage student access and progress.
                    </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-sm">
                    <UsersIcon className="h-4 w-4" />
                    <span>{students.length} Total Nodes</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-zinc-200">
                <div className="relative w-full lg:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-zinc-100 rounded-xl leading-5 bg-zinc-50 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 sm:text-sm"
                        placeholder="Search by name, email, or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleBulkRestore}
                            disabled={actionLoading || loading}
                            className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 focus:outline-none transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                        >
                            <Shield className="h-4 w-4 mr-2" /> Restore All
                        </button>
                        <button
                            onClick={handleBulkRevoke}
                            disabled={actionLoading || loading}
                            className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 focus:outline-none transition-all active:scale-95 shadow-lg shadow-black/10"
                        >
                            <ShieldOff className="h-4 w-4 mr-2" /> Revoke All
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 sm:border-l sm:border-zinc-100 sm:pl-3 sm:border-t-0 border-t border-zinc-100 pt-3 sm:pt-0 w-full sm:w-auto">
                        <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
                        <select
                            className="block w-full sm:w-44 pl-3 pr-10 py-2.5 text-[10px] font-black uppercase tracking-widest border border-zinc-100 bg-zinc-50 text-black focus:outline-none rounded-xl"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">All Students</option>
                            <option value="active">Active Only</option>
                            <option value="revoked">Revoked Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 shadow-sm font-sans">
                    <UsersIcon className="mx-auto h-12 w-12 text-zinc-200" />
                    <h3 className="mt-4 text-lg font-black text-black uppercase tracking-widest">No nodes detected</h3>
                    <p className="mt-1 text-sm text-zinc-400">Try adjusting your scan criteria or filters.</p>
                </div>
            ) : (
                <div className="bg-white shadow-sm overflow-x-auto rounded-3xl border border-zinc-200 text-black">
                    <table className="min-w-full divide-y divide-zinc-100">
                        <thead className="bg-zinc-50">
                            <tr>
                                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    Name / Email
                                </th>
                                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    Roll Number
                                </th>
                                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    Phone
                                </th>
                                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    Status
                                </th>
                                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    Joined Date
                                </th>
                                <th scope="col" className="relative px-8 py-5">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-zinc-50">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-zinc-50 transition-colors group">
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-black text-black group-hover:text-black transition-colors">{student.name || 'ANONYMOUS_NODE'}</div>
                                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{student.roll_number || 'NULL-ID'}</div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{student.phone || 'NO_PH_DATA'}</div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <span className={cn(
                                            "px-3 py-1 inline-flex text-[9px] font-black uppercase tracking-[0.2em] rounded-full border",
                                            student.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-red-50 text-red-600 border-red-100'
                                        )}>
                                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                        {new Date(student.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <Link
                                            href={`/admin/students/${student.id}`}
                                            className="text-zinc-300 hover:text-black transition-colors inline-flex items-center"
                                            title="View Details"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={() => toggleStudentStatus(student)}
                                            className={cn(
                                                "transition-colors inline-flex items-center",
                                                student.status === 'active' ? 'text-zinc-200 hover:text-red-600' : 'text-zinc-200 hover:text-emerald-600'
                                            )}
                                            title={student.status === 'active' ? 'Revoke Access' : 'Restore Access'}
                                        >
                                            {student.status === 'active' ? <ShieldOff className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
