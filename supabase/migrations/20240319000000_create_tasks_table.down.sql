drop trigger if exists handle_tasks_updated_at on tasks;
drop policy if exists "Users can delete tasks they created or manage" on tasks;
drop policy if exists "Users can update tasks they created or are assigned to" on tasks;
drop policy if exists "Users can insert tasks for their projects" on tasks;
drop policy if exists "Users can view tasks they created or are assigned to" on tasks;
drop table if exists tasks;
drop type if exists task_status;
drop type if exists task_priority; 