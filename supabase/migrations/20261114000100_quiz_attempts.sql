-- Riwayat kuis: tabel quiz_attempts + RLS
-- Idempoten (aman dijalankan ulang). Jangan ubah file ini setelah diterapkan:
-- perubahan berikutnya ditulis sebagai migration baru.

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
