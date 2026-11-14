-- JeniusAcademy: skema database Supabase
-- Cara pakai: Supabase Dashboard → SQL Editor → New query → tempel seluruh isi → Run.
-- Aman dijalankan ulang (idempotent).

-- ---------------------------------------------------------------
-- 1) Tabel
-- ---------------------------------------------------------------

-- Profil pengguna (1 baris per akun)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

-- Progres belajar: pelajaran yang sudah selesai
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users on delete cascade,
  course_slug text not null,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_slug, lesson_id)
);

-- Ulasan (tampil publik hanya setelah disetujui)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  level_id text not null check (level_id in ('sd', 'smp', 'sma', 'utbk')),
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 1000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reviews_approved_created_idx
  on public.reviews (approved, created_at desc);

-- ---------------------------------------------------------------
-- 2) Row Level Security (WAJIB: kunci publishable terlihat di browser)
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "profil milik sendiri" on public.profiles;
create policy "profil milik sendiri" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "progres milik sendiri" on public.lesson_progress;
create policy "progres milik sendiri" on public.lesson_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Siapa pun (termasuk tamu) boleh membaca ulasan yang sudah disetujui.
drop policy if exists "ulasan disetujui dibaca semua" on public.reviews;
create policy "ulasan disetujui dibaca semua" on public.reviews
  for select to anon, authenticated
  using (approved = true);

-- Pengguna login boleh mengirim ulasan, tetapi selalu belum disetujui.
drop policy if exists "user login boleh kirim ulasan" on public.reviews;
create policy "user login boleh kirim ulasan" on public.reviews
  for insert to authenticated
  with check ((select auth.uid()) = user_id and approved = false);

-- Pengguna boleh melihat ulasannya sendiri (termasuk yang menunggu persetujuan).
drop policy if exists "lihat ulasan sendiri" on public.reviews;
create policy "lihat ulasan sendiri" on public.reviews
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------
-- 3) Buat profil otomatis saat ada akun baru
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- 4) Riwayat kuis
-- ---------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  course_slug text not null,
  score int not null check (score >= 0),
  total int not null check (total > 0),
  created_at timestamptz not null default now(),
  check (score <= total)
);

create index if not exists quiz_attempts_user_course_idx
  on public.quiz_attempts (user_id, course_slug, created_at desc);

alter table public.quiz_attempts enable row level security;

drop policy if exists "baca percobaan kuis sendiri" on public.quiz_attempts;
create policy "baca percobaan kuis sendiri" on public.quiz_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "simpan percobaan kuis sendiri" on public.quiz_attempts;
create policy "simpan percobaan kuis sendiri" on public.quiz_attempts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Menyetujui ulasan (jalankan manual dari SQL Editor / Table Editor):
--   update public.reviews set approved = true where id = '<id-ulasan>';
