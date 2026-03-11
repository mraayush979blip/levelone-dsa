'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute requireRole="admin">
            <div className="flex flex-col md:flex-row h-screen bg-background font-sans transition-colors duration-500" data-theme="theme-dark">
                <AdminSidebar />
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Subtle Background Glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/3 blur-[100px] rounded-full -z-10 pointer-events-none" />
                    
                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative z-10">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>

    );
}
