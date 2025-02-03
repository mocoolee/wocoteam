-- Drop triggers
drop trigger if exists on_organization_created on organizations;
drop trigger if exists handle_department_members_updated_at on department_members;
drop trigger if exists handle_organization_members_updated_at on organization_members;
drop trigger if exists handle_departments_updated_at on departments;
drop trigger if exists handle_organizations_updated_at on organizations;

-- Drop functions
drop function if exists public.handle_new_organization();

-- Drop columns from projects
alter table projects drop column if exists department_id;
alter table projects drop column if exists organization_id;

-- Drop tables
drop table if exists department_members;
drop table if exists organization_members;
drop table if exists departments;
drop table if exists organizations;

-- Drop types
drop type if exists member_role; 