-- Token perangkat untuk push notification aplikasi mobile (Firebase Cloud Messaging).
-- Kompatibel ke belakang: hanya menambah tabel & fungsi; push_subscriptions (Web Push) tetap.
-- Idempoten (aman dijalankan ulang).

create table if not exists public.device_tokens (
  -- Token FCM unik per pemasangan aplikasi.
  token text primary key check (char_length(token) between 20 and 4096),
  user_id uuid not null references auth.users on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now()
);
create index if not exists device_tokens_user_idx on public.device_tokens (user_id);

-- Tidak ada akses tabel langsung: klien hanya lewat fungsi di bawah, sehingga
-- satu HP yang berganti akun memindahkan tokennya ke akun yang sedang login.
alter table public.device_tokens enable row level security;
revoke all on public.device_tokens from anon, authenticated;

create or replace function public.register_device_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  insert into public.device_tokens (token, user_id, platform, updated_at)
  values (p_token, v_uid, p_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

-- Dipanggil saat keluar: hanya menghapus token milik sendiri.
create or replace function public.unregister_device_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.device_tokens where token = p_token and user_id = (select auth.uid());
$$;

-- Target pengingat harian untuk aplikasi: aturan sama dengan push_reminder_targets
-- (belum belajar, kuis, atau latihan hari ini, WIB). Hanya service_role.
create or replace function public.device_reminder_targets()
returns table (token text, streak_active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select d.token,
    exists (
      select 1 from public.lesson_progress lp where lp.user_id = d.user_id
        and (lp.completed_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date - 1
    )
  from public.device_tokens d
  where not exists (
      select 1 from public.lesson_progress lp where lp.user_id = d.user_id
        and (lp.completed_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date)
    and not exists (
      select 1 from public.quiz_attempts q where q.user_id = d.user_id
        and (q.created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date)
    and not exists (
      select 1 from public.practice_log pl where pl.user_id = d.user_id
        and (pl.created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date);
$$;

revoke execute on function public.register_device_token(text, text) from public, anon;
grant execute on function public.register_device_token(text, text) to authenticated;
revoke execute on function public.unregister_device_token(text) from public, anon;
grant execute on function public.unregister_device_token(text) to authenticated;
revoke execute on function public.device_reminder_targets() from public, anon, authenticated;
grant execute on function public.device_reminder_targets() to service_role;
