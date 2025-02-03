'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/ui/dashboard-layout';

interface DashboardStats {
  totalTasks: number;
  totalProjects: number;
  totalReports: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    totalProjects: 0,
    totalReports: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // 獲取統計數據
        const [tasks, projects, reports] = await Promise.all([
          supabase.from('tasks').select('id', { count: 'exact' }),
          supabase.from('projects').select('id', { count: 'exact' }),
          supabase.from('reports').select('id', { count: 'exact' }),
        ]);

        setStats({
          totalTasks: tasks.count || 0,
          totalProjects: projects.count || 0,
          totalReports: reports.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">待處理任務</h3>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold">{stats.totalTasks}</p>
            <span className="text-sm text-muted-foreground">個任務</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">進行中專案</h3>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold">{stats.totalProjects}</p>
            <span className="text-sm text-muted-foreground">個專案</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">本月報表</h3>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold">{stats.totalReports}</p>
            <span className="text-sm text-muted-foreground">份報表</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 