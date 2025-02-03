create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_status as enum ('todo', 'in_progress', 'in_review', 'done');

create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  due_date date,
  project_id uuid references projects(id) on delete cascade,
  assignee_id uuid references auth.users(id) on delete set null,
  creator_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table tasks enable row level security;

-- Create policies
create policy "Users can view tasks they created or are assigned to"
  on tasks for select
  using (
    auth.uid() = creator_id or 
    auth.uid() = assignee_id or
    exists (
      select 1 from projects 
      where projects.id = tasks.project_id 
      and projects.manager_id = auth.uid()
    )
  );

create policy "Users can insert tasks for their projects"
  on tasks for insert
  with check (
    auth.uid() = creator_id and (
      project_id is null or
      exists (
        select 1 from projects 
        where projects.id = tasks.project_id 
        and projects.manager_id = auth.uid()
      )
    )
  );

create policy "Users can update tasks they created or are assigned to"
  on tasks for update
  using (
    auth.uid() = creator_id or 
    auth.uid() = assignee_id or
    exists (
      select 1 from projects 
      where projects.id = tasks.project_id 
      and projects.manager_id = auth.uid()
    )
  )
  with check (
    auth.uid() = creator_id or 
    auth.uid() = assignee_id or
    exists (
      select 1 from projects 
      where projects.id = tasks.project_id 
      and projects.manager_id = auth.uid()
    )
  );

create policy "Users can delete tasks they created or manage"
  on tasks for delete
  using (
    auth.uid() = creator_id or
    exists (
      select 1 from projects 
      where projects.id = tasks.project_id 
      and projects.manager_id = auth.uid()
    )
  );

-- Create updated_at trigger
create trigger handle_tasks_updated_at
  before update on tasks
  for each row
  execute function handle_updated_at(); 