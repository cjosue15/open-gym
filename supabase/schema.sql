-- Ejecuta este archivo una vez en Supabase SQL Editor.
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Atleta', avatar_url text,
  created_at timestamptz not null default now()
);
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Atleta'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, weekday smallint check (weekday between 0 and 6),
  created_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  name text not null, position smallint not null, notes text,
  target_sets smallint not null default 3 check (target_sets > 0),
  target_reps smallint not null default 10 check (target_reps > 0)
);
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete set null,
  started_at timestamptz not null default now(), finished_at timestamptz, notes text
);
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  routine_exercise_id uuid references public.routine_exercises(id) on delete set null,
  name text not null, position smallint not null, notes text
);
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number smallint not null, reps smallint not null check (reps > 0),
  weight numeric(7,2), weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  assisted_reps smallint not null default 0, notes text
);

alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

create policy "profile read own" on public.profiles for select using (id = auth.uid());
create policy "profile update own" on public.profiles for update using (id = auth.uid());
create policy "owner manages routines" on public.routines for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner manages routine exercises" on public.routine_exercises for all using (exists(select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())) with check (exists(select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));
create policy "owner manages workouts" on public.workouts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner manages workout exercises" on public.workout_exercises for all using (exists(select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())) with check (exists(select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "owner manages workout sets" on public.workout_sets for all using (exists(select 1 from public.workout_exercises we join public.workouts w on w.id = we.workout_id where we.id = workout_exercise_id and w.user_id = auth.uid())) with check (exists(select 1 from public.workout_exercises we join public.workouts w on w.id = we.workout_id where we.id = workout_exercise_id and w.user_id = auth.uid()));

-- Mejor racha de días consecutivos con entrenamiento, sobre todo el historial del usuario (no limitado a una ventana de fechas).
-- tz recibe la zona horaria del cliente (ej. 'America/Lima') para truncar el día en hora local, no UTC.
drop function if exists public.best_workout_streak();

create or replace function public.best_workout_streak(tz text default 'UTC')
returns integer
language sql
stable
set search_path = public
as $$
  with days as (
    select distinct date(started_at at time zone tz) as day
    from public.workouts
    where user_id = auth.uid() and finished_at is not null
  ),
  grouped as (
    select day, day - (row_number() over (order by day))::integer as grp
    from days
  )
  select coalesce(max(cnt), 0)::integer
  from (
    select count(*) as cnt
    from grouped
    group by grp
  ) streaks;
$$;

grant execute on function public.best_workout_streak(text) to authenticated;
