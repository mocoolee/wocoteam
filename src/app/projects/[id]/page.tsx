'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/ui/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  updated_at: string;
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

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (projectError) throw projectError;
        if (!data) throw new Error('專案不存在');
        
        setProject(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, router]);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      router.push('/projects');
    } catch (error: any) {
      setError(error.message);
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">專案不存在</h2>
          <p className="mt-2 text-gray-600">該專案可能已被刪除或您沒有訪問權限</p>
          <Button
            variant="link"
            onClick={() => router.push('/projects')}
            className="mt-4"
          >
            返回專案列表
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span
              className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[project.status]
              }`}
            >
              {statusText[project.status]}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${project.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              編輯
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確定要刪除此專案嗎？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作無法撤銷。這將永久刪除該專案及其所有相關數據。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteLoading ? '刪除中...' : '確定刪除'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg divide-y">
          <div className="p-6">
            <h3 className="text-lg font-medium">專案描述</h3>
            <p className="mt-2 text-gray-600">
              {project.description || '無描述'}
            </p>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium">時間信息</h3>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">開始日期</dt>
                <dd className="mt-1 text-gray-900">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString()
                    : '未設置'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">結束日期</dt>
                <dd className="mt-1 text-gray-900">
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString()
                    : '未設置'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium">預算信息</h3>
            <p className="mt-2 text-gray-900">
              {project.budget
                ? `$${project.budget.toLocaleString()}`
                : '未設置預算'}
            </p>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium">其他信息</h3>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">創建時間</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(project.created_at).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">最後更新</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(project.updated_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 