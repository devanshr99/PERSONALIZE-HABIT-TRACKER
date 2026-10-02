-- ═══════════════════════════════════════════════════
-- Streakly — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- 2. Habits table
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text not null default '✨',
  active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habits_user_order on public.habits(user_id, "order");

alter table public.habits enable row level security;

create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- 3. Habit completions table
create table if not exists public.habit_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  date date not null,
  completed boolean not null default true,
  completed_at timestamptz not null default now()
);

create index if not exists idx_completions_user_id on public.habit_completions(user_id);
create index if not exists idx_completions_habit_id on public.habit_completions(habit_id);
create index if not exists idx_completions_habit_date on public.habit_completions(habit_id, date);
create unique index if not exists idx_completions_unique on public.habit_completions(user_id, habit_id, date);

alter table public.habit_completions enable row level security;

create policy "Users can view their own completions"
  on public.habit_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own completions"
  on public.habit_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own completions"
  on public.habit_completions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own completions"
  on public.habit_completions for delete
  using (auth.uid() = user_id);

-- 4. User settings table
create table if not exists public.user_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  notifications_enabled boolean not null default false,
  notification_time text not null default '20:00',
  theme text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own settings"
  on public.user_settings for delete
  using (auth.uid() = user_id);

-- 5. Auto-create profile on user sign-up (Email or Google OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      ''
    ),
    coalesce(
      nullif(new.raw_user_meta_data->>'avatar_url', ''),
      nullif(new.raw_user_meta_data->>'picture', ''),
      null
    )
  )
  on conflict (id) do update set
    name = case
      when public.profiles.name = '' or public.profiles.name is null
      then excluded.name
      else public.profiles.name
    end,
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
