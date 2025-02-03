'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/ui/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from '@hello-pangea/dnd';

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

const columns = [
  { id: 'todo', title: '待處理', color: 'bg-gray-100' },
  { id: 'in_progress', title: '進行中', color: 'bg-blue-100' },
  { id: 'in_review', title: '審核中', color: 'bg-yellow-100' },
  { id: 'done', title: '已完成', color: 'bg-green-100' },
];

export default function TaskBoardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            projects:project_id (name),
            departments:department_id (name),
            assignee:assignee_id (email)
          `)
          .order('created_at', { ascending: false });

        if (tasksError) throw tasksError;
        setTasks(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [router]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: destination.droppableId })
        .eq('id', draggableId);

      if (updateError) throw updateError;

      setTasks(tasks.map(task => 
        task.id === draggableId
          ? { ...task, status: destination.droppableId as Task['status'] }
          : task
      ));
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">任務看板</h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/tasks')}
            >
              列表視圖
            </Button>
            <Button onClick={() => router.push('/tasks/create')}>
              <PlusIcon className="h-4 w-4 mr-2" />
              新增任務
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-4">
            {columns.map(column => (
              <div key={column.id} className="space-y-4">
                <div className={`p-3 rounded-lg ${column.color}`}>
                  <h3 className="font-medium">{column.title}</h3>
                  <div className="text-sm text-gray-600">
                    {tasks.filter(task => task.status === column.id).length} 個任務
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[500px]"
                    >
                      {tasks
                        .filter(task => task.status === column.id)
                        .map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided: DraggableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/tasks/${task.id}`)}
                              >
                                <div className="space-y-2">
                                  <h4 className="font-medium line-clamp-2">
                                    {task.title}
                                  </h4>
                                  
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        priorityColors[task.priority]
                                      }`}
                                    >
                                      {priorityText[task.priority]}
                                    </span>
                                  </div>

                                  <div className="text-sm text-gray-600">
                                    <div>
                                      {task.projects?.name || '無專案'}
                                    </div>
                                    <div>
                                      {task.assignee?.email || '未分配'}
                                    </div>
                                    {task.due_date && (
                                      <div>
                                        截止：{new Date(task.due_date).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </DashboardLayout>
  );
} 