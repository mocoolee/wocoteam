drop trigger if exists handle_projects_updated_at on projects;
drop function if exists public.handle_updated_at();
drop policy if exists "Users can delete their own projects" on projects;
drop policy if exists "Users can update their own projects" on projects;
drop policy if exists "Users can insert their own projects" on projects;
drop policy if exists "Users can view their own projects" on projects;
drop table if exists projects;
drop type if exists project_status; 