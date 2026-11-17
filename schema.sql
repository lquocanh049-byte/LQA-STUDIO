-- LQA STUDIO: chạy toàn bộ file này trong Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.layouts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  category text not null check (category in ('tinh-diem', 'tao-qr', 'lineup', 'profile')),
  description text not null default '',
  image_path text not null,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists layouts_category_idx on public.layouts(category);
create index if not exists layouts_published_idx on public.layouts(is_published);

create or replace function public.is_lqa_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.layouts enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_lqa_admin());

-- Không tạo policy UPDATE/INSERT cho profiles: thành viên không thể tự nâng quyền Admin.

drop policy if exists "Published layouts are public" on public.layouts;
create policy "Published layouts are public" on public.layouts
for select to anon, authenticated
using (is_published = true or public.is_lqa_admin());

drop policy if exists "Admins can add layouts" on public.layouts;
create policy "Admins can add layouts" on public.layouts
for insert to authenticated
with check (public.is_lqa_admin() and created_by = auth.uid());

drop policy if exists "Admins can edit layouts" on public.layouts;
create policy "Admins can edit layouts" on public.layouts
for update to authenticated
using (public.is_lqa_admin())
with check (public.is_lqa_admin());

drop policy if exists "Admins can delete layouts" on public.layouts;
create policy "Admins can delete layouts" on public.layouts
for delete to authenticated
using (public.is_lqa_admin());

-- Public bucket để khách xem ảnh; chỉ Admin mới được upload, sửa hoặc xóa.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('layouts', 'layouts', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

drop policy if exists "Anyone can view LQA layout images" on storage.objects;
create policy "Anyone can view LQA layout images" on storage.objects
for select to anon, authenticated
using (bucket_id = 'layouts');

drop policy if exists "Admins can upload LQA layout images" on storage.objects;
create policy "Admins can upload LQA layout images" on storage.objects
for insert to authenticated
with check (bucket_id = 'layouts' and public.is_lqa_admin());

drop policy if exists "Admins can update LQA layout images" on storage.objects;
create policy "Admins can update LQA layout images" on storage.objects
for update to authenticated
using (bucket_id = 'layouts' and public.is_lqa_admin())
with check (bucket_id = 'layouts' and public.is_lqa_admin());

drop policy if exists "Admins can delete LQA layout images" on storage.objects;
create policy "Admins can delete LQA layout images" on storage.objects
for delete to authenticated
using (bucket_id = 'layouts' and public.is_lqa_admin());

-- Sau khi tạo tài khoản đầu tiên, thay EMAIL_CUA_BAN bằng email đó và chạy câu lệnh:
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'EMAIL_CUA_BAN');
