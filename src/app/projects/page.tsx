'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/ui/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusIcon } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  manager_id: string;
  created_at: string;
}

const statusColors = {
  planning: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-gray-100 text-gray-800',
};

const statusText = {
  planning: '規劃中',
  in_progress: '進行中',
  completed: '已完成',
  on_hold: '暫停中',
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setProjects(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">專案列表</h1>
          <Button onClick={() => router.push('/projects/create')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            新增專案
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {project.description || '無描述'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[project.status]
                    }`}
                  >
                    {statusText[project.status]}
                  </span>
                  {project.budget && (
                    <span className="text-sm text-gray-600">
                      預算: ${project.budget.toLocaleString()}
                    </span>
                  )}
                </div>

                {(project.start_date || project.end_date) && (
                  <div className="text-sm text-gray-500">
                    {project.start_date && (
                      <span>開始: {new Date(project.start_date).toLocaleDateString()}</span>
                    )}
                    {project.start_date && project.end_date && ' - '}
                    {project.end_date && (
                      <span>結束: {new Date(project.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">目前還沒有任何專案</p>
              <Button
                variant="link"
                onClick={() => router.push('/projects/create')}
                className="mt-2"
              >
                立即創建第一個專案
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}