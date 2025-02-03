create type project_status as enum ('planning', 'in_progress', 'completed', 'on_hold');

create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  status project_status not null default 'planning',
  start_date date,
  end_date date,
  budget numeric(10,2),
  manager_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table projects enable row level security;

-- Create policies
create policy "Users can view their own projects"
  on projects for select
  using (auth.uid() = manager_id);

create policy "Users can insert their own projects"
  on projects for insert
  with check (auth.uid() = manager_id);

create policy "Users can update their own projects"
  on projects for update
  using (auth.uid() = manager_id)
  with check (auth.uid() = manager_id);

create policy "Users can delete their own projects"
  on projects for delete
  using (auth.uid() = manager_id);

-- Create updated_at trigger
create function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger handle_projects_updated_at
  before update on projects
  for each row
  execute function handle_updated_at(); 