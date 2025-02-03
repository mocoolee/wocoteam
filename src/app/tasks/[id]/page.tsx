'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/ui/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { use } from 'react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  project_id: string | null;
  organization_id: string;
  department_id: string | null;
  assignee_id: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
  // 關聯數據
  projects: {
    name: string;
  } | null;
  departments: {
    name: string;
  } | null;
  assignee: {
    email: string;
  } | null;
  creator: {
    email: string;
  };
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800',
};

const priorityText = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急',
};

const statusText = {
  todo: '待處理',
  in_progress: '進行中',
  in_review: '審核中',
  done: '已完成',
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
};

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data, error: taskError } = await supabase
          .from('tasks')
          .select(`
            *,
            projects:project_id (name),
            departments:department_id (name),
            assignee:assignee_id (email),
            creator:creator_id (email)
          `)
          .eq('id', id)
          .single();

        if (taskError) throw taskError;
        setTask(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, router]);

  const handleDelete = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      router.push('/tasks');
    } catch (error: any) {
      setError(error.message);
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

  if (!task) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">找不到任務</h2>
          <Button onClick={() => router.push('/tasks')}>返回任務列表</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/tasks/${id}/edit`)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              編輯
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <TrashIcon className="h-4 w-4 mr-2" />
                  刪除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認刪除</AlertDialogTitle>
                  <AlertDialogDescription>
                    您確定要刪除這個任務嗎？此操作無法撤銷。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    確認刪除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">任務描述</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || '無描述'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">任務詳情</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">狀態</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                      {statusText[task.status]}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">優先級</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                      {priorityText[task.priority]}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">截止日期</dt>
                  <dd className="text-gray-900">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '無'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">所屬專案</dt>
                  <dd className="text-gray-900">{task.projects?.name || '無'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">所屬部門</dt>
                  <dd className="text-gray-900">{task.departments?.name || '無'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">負責人</dt>
                  <dd className="text-gray-900">{task.assignee?.email || '未分配'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">創建者</dt>
                  <dd className="text-gray-900">{task.creator.email}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">創建時間</dt>
                  <dd className="text-gray-900">
                    {new Date(task.created_at).toLocaleString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">最後更新</dt>
                  <dd className="text-gray-900">
                    {new Date(task.updated_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 