-- 創建組織表
create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 創建部門表
create table departments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  organization_id uuid not null references organizations(id) on delete cascade,
  parent_id uuid references departments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 創建成員角色枚舉
create type member_role as enum ('owner', 'admin', 'member');

-- 創建組織成員表
create table organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'member',
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

-- 創建部門成員表
create table department_members (
  id uuid default gen_random_uuid() primary key,
  department_id uuid not null references departments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'member',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(department_id, user_id)
);

-- 更新現有的 profiles 表
alter table profiles 
add column if not exists organization_id uuid references organizations(id) on delete set null,
add column if not exists department_id uuid references departments(id) on delete set null,
add column if not exists title text;

-- 更新現有的 projects 表
alter table projects 
add column if not exists organization_id uuid references organizations(id) on delete cascade,
add column if not exists department_id uuid references departments(id) on delete set null;

-- 創建任務相關的枚舉
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_status as enum ('todo', 'in_progress', 'in_review', 'done');

-- 創建任務表
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  due_date date,
  project_id uuid references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  assignee_id uuid references auth.users(id) on delete set null,
  creator_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table organizations enable row level security;
alter table departments enable row level security;
alter table organization_members enable row level security;
alter table department_members enable row level security;
alter table tasks enable row level security;

-- Create policies for organizations
create policy "Users can view organizations they are members of"
  on organizations for select
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Organization owners can insert organizations"
  on organizations for insert
  with check (true);

create policy "Organization owners and admins can update organizations"
  on organizations for update
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

create policy "Organization owners can delete organizations"
  on organizations for delete
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
      and organization_members.role = 'owner'
    )
  );

-- Create policies for departments
create policy "Users can view departments they are members of"
  on departments for select
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = departments.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Organization owners and admins can manage departments"
  on departments for all
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = departments.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- Create policies for organization_members
create policy "Users can view organization members they are members with"
  on organization_members for select
  using (
    exists (
      select 1 from organization_members as om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
    )
  );

create policy "Organization owners can manage organization members"
  on organization_members for all
  using (
    exists (
      select 1 from organization_members as om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role = 'owner'
    )
  );

-- Create policies for department_members
create policy "Users can view department members they are members with"
  on department_members for select
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = (
        select organization_id from departments
        where departments.id = department_members.department_id
      )
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Organization owners and admins can manage department members"
  on department_members for all
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = (
        select organization_id from departments
        where departments.id = department_members.department_id
      )
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- Create policies for tasks
create policy "Users can view tasks in their organization"
  on tasks for select
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = tasks.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Users can create tasks in their organization"
  on tasks for insert
  with check (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = tasks.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Users can update tasks they created or are assigned to"
  on tasks for update
  using (
    auth.uid() = creator_id or 
    auth.uid() = assignee_id or
    exists (
      select 1 from organization_members
      where organization_members.organization_id = tasks.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

create policy "Users can delete tasks they created or manage"
  on tasks for delete
  using (
    auth.uid() = creator_id or
    exists (
      select 1 from organization_members
      where organization_members.organization_id = tasks.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- Create triggers for updated_at
create trigger handle_organizations_updated_at
  before update on organizations
  for each row
  execute function handle_updated_at();

create trigger handle_departments_updated_at
  before update on departments
  for each row
  execute function handle_updated_at();

create trigger handle_organization_members_updated_at
  before update on organization_members
  for each row
  execute function handle_updated_at();

create trigger handle_department_members_updated_at
  before update on department_members
  for each row
  execute function handle_updated_at();

create trigger handle_tasks_updated_at
  before update on tasks
  for each row
  execute function handle_updated_at();

-- Function to automatically add creator as owner
create function public.handle_new_organization()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into organization_members (organization_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;

create trigger on_organization_created
  after insert on organizations
  for each row
  execute function handle_new_organization(); 