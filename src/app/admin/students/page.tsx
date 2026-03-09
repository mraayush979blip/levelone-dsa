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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Student Management</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        View and manage student access and progress.
                    </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 shadow-sm">
                    <UsersIcon className="h-4 w-4" />
                    <span>{students.length} Total Students</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-zinc-900/50 backdrop-blur-md p-4 rounded-lg shadow-sm border border-zinc-800">
                <div className="relative w-full lg:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md leading-5 bg-zinc-800/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
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
                            className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                        >
                            <Shield className="h-4 w-4 mr-2" /> Restore All
                        </button>
                        <button
                            onClick={handleBulkRevoke}
                            disabled={actionLoading || loading}
                            className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-rose-100 rounded-md shadow-sm text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
                        >
                            <ShieldOff className="h-4 w-4 mr-2" /> Revoke All
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 sm:border-l sm:border-zinc-700 sm:pl-3 sm:border-t-0 border-t border-zinc-700 pt-3 sm:pt-0 w-full sm:w-auto">
                        <Filter className="h-5 w-5 text-zinc-500 shrink-0" />
                        <select
                            className="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-zinc-700 bg-zinc-800/50 text-white focus:outline-none focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm rounded-md border"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all" className="bg-zinc-900">All Students</option>
                            <option value="active" className="bg-zinc-900">Active Only</option>
                            <option value="revoked" className="bg-zinc-900">Revoked Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 backdrop-blur-md rounded-lg border border-zinc-800 shadow-sm">
                    <UsersIcon className="mx-auto h-12 w-12 text-zinc-600" />
                    <h3 className="mt-2 text-sm font-medium text-white">No students found</h3>
                    <p className="mt-1 text-sm text-zinc-400">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="bg-zinc-900/50 backdrop-blur-md shadow overflow-x-auto sm:rounded-lg border border-zinc-800 text-white">
                    <table className="min-w-full divide-y divide-zinc-800">
                        <thead className="bg-zinc-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    Name / Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    Roll Number
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    Joined Date
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-zinc-800">
                            {filteredStudents.map((student) => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-bold text-white">{student.name}</div>
                                                <div className="text-sm text-zinc-400">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-zinc-200 font-medium">{student.roll_number || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-zinc-400">{student.phone || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                        {new Date(student.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <Link
                                            href={`/admin/students/${student.id}`}
                                            className="text-white hover:text-zinc-300 inline-flex items-center"
                                            title="View Details"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={() => toggleStudentStatus(student)}
                                            className={`${student.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                                } inline-flex items-center`}
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
