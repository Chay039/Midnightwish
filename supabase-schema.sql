-- Supabase Schema for Midnightwish
-- Run this in the Supabase SQL Editor

-- 1. Create Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  user_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile." on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Trigger to automatically create a profile for every new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Create Circles table
create table public.circles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color_gradient text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.circles enable row level security;
create policy "Users can manage own circles" on public.circles for all using (auth.uid() = user_id);

-- 3. Create Wishes table (the core events)
create table public.wishes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  circle_id uuid references public.circles(id) on delete set null,
  name text not null,
  event text not null, -- 'Birthday', 'Anniversary', etc.
  date text not null, -- Expected format "MM-DD" or "YYYY-MM-DD"
  recurs_yearly boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wishes enable row level security;
create policy "Users can manage own wishes" on public.wishes for all using (auth.uid() = user_id);
