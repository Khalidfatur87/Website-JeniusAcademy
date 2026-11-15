-- Fitur belajar lanjutan:
--   1) Langganan (akses manual oleh super admin) + pratinjau gratis per pelajaran
--   2) Kunci jawaban kuis disembunyikan; penilaian di server (submit_quiz)
--   3) Profil: foto (Storage) dan target belajar mingguan
--   4) Sertifikat + halaman verifikasi publik
--   5) Catatan dan file materi per pelajaran (Storage privat)
--   6) Diskusi / tanya jawab per pelajaran
--   7) Statistik CMS
--
-- PENTING: kolom lessons.youtube_id / notes dan quiz_questions.answer / explanation
-- tidak lagi bisa dibaca langsung oleh anon/authenticated. Aplikasi versi lama
-- membaca kolom itu, jadi terapkan migration ini bersamaan dengan deploy aplikasi
-- yang menyertainya.
-- Idempoten (aman dijalankan ulang). Jangan ubah file ini setelah diterapkan.

-- ---------------------------------------------------------------
-- 1) Kolom baru
-- ---------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_path text
    check (avatar_path is null or (char_length(avatar_path) <= 200 and avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$')),
  add column if not exists weekly_goal int not null default 5 check (weekly_goal between 1 and 50);

grant update (avatar_path, weekly_goal) on public.profiles to authenticated;

-- Foto profil hanya boleh menunjuk ke folder milik sendiri di bucket avatars.
drop policy if exists "foto profil di folder sendiri" on public.profiles;
create policy "foto profil di folder sendiri" on public.profiles
  as restrictive
  for update to authenticated
  using (true)
  with check (avatar_path is null or split_part(avatar_path, '/', 1) = (select auth.uid())::text);

alter table public.lessons
  add column if not exists free_preview boolean not null default false,
  add column if not exists notes jsonb not null default '{}'::jsonb
    check (jsonb_typeof(notes) = 'object');

-- Pelajaran pertama setiap kelas menjadi pratinjau gratis (hanya kelas yang belum punya pratinjau).
update public.lessons l
set free_preview = true
where not exists (
    select 1 from public.lessons x where x.course_slug = l.course_slug and x.free_preview
  )
  and l.position = (select min(y.position) from public.lessons y where y.course_slug = l.course_slug);

-- ---------------------------------------------------------------
-- 2) Langganan & akses
-- ---------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid not null references auth.users on delete cascade,
  level_id text not null references public.levels on update cascade on delete cascade,
  -- null = tanpa batas waktu
  expires_at timestamptz,
  note text not null default '' check (char_length(note) <= 200),
  granted_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon;
grant select on public.subscriptions to authenticated;
grant insert, update, delete on public.subscriptions to authenticated;

drop policy if exists "baca langganan sendiri" on public.subscriptions;
create policy "baca langganan sendiri" on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "super admin kelola langganan" on public.subscriptions;
create policy "super admin kelola langganan" on public.subscriptions
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Akses penuh ke kelas: jenjang gratis, langganan aktif, atau boleh mengedit kelas.
create or replace function public.has_course_access(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.courses c
    join public.levels lv on lv.id = c.level_id
    where c.slug = p_slug
      and c.published
      and (
        lv.price = 0
        or exists (
          select 1 from public.subscriptions s
          where s.user_id = (select auth.uid())
            and s.level_id = c.level_id
            and (s.expires_at is null or s.expires_at > now())
        )
      )
  ) or public.can_edit_course(p_slug);
$$;

-- Akses ke satu pelajaran: akses kelas, atau pelajaran pratinjau gratis di kelas terbit.
create or replace function public.has_lesson_access(p_slug text, p_lesson text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_course_access(p_slug)
    or exists (
      select 1
      from public.lessons l
      join public.courses c on c.slug = l.course_slug
      where l.course_slug = p_slug and l.id = p_lesson and l.free_preview and c.published
    );
$$;

-- ---------------------------------------------------------------
-- 3) Sembunyikan kolom rahasia; penulisan konten lewat fungsi
-- ---------------------------------------------------------------
revoke select, insert, update, delete on public.lessons from anon, authenticated;
grant select (course_slug, id, title, minutes, position, free_preview)
  on public.lessons to anon, authenticated;

revoke select, insert, update, delete on public.quiz_questions from anon, authenticated;
grant select (id, course_slug, position, prompt, options)
  on public.quiz_questions to anon, authenticated;

-- Isi pelajaran (video, catatan, materi) bila berhak; {"access": false} bila terkunci.
create or replace function public.lesson_content(p_slug text, p_lesson text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r record;
begin
  select l.youtube_id, l.notes into r
  from public.lessons l
  where l.course_slug = p_slug and l.id = p_lesson and public.can_view_course(p_slug);
  if not found then
    return null;
  end if;
  if not public.has_lesson_access(p_slug, p_lesson) then
    return jsonb_build_object('access', false);
  end if;
  return jsonb_build_object(
    'access', true,
    'youtube_id', r.youtube_id,
    'notes', r.notes,
    'materials', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', m.id, 'title', m.title, 'path', m.path, 'size', m.size)
        order by m.position, m.created_at
      )
      from public.lesson_materials m
      where m.course_slug = p_slug and m.lesson_id = p_lesson
    ), '[]'::jsonb)
  );
end;
$$;

-- CMS: pelajaran lengkap (dengan video & catatan) untuk yang boleh mengedit.
create or replace function public.admin_course_lessons(p_slug text)
returns table (
  id text, title jsonb, minutes int, youtube_id text, notes jsonb, free_preview boolean, "position" int
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.title, l.minutes, l.youtube_id, l.notes, l.free_preview, l.position
  from public.lessons l
  where l.course_slug = p_slug and public.can_edit_course(p_slug)
  order by l.position, l.id;
$$;

-- CMS: bank soal lengkap (dengan kunci jawaban) untuk yang boleh mengedit.
create or replace function public.admin_course_questions(p_slug text)
returns table (id uuid, prompt jsonb, options jsonb, answer int, explanation jsonb, "position" int)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.prompt, q.options, q.answer, q.explanation, q.position
  from public.quiz_questions q
  where q.course_slug = p_slug and public.can_edit_course(p_slug)
  order by q.position;
$$;

-- Menyimpan seluruh daftar pelajaran sekaligus (atomik). Yang tidak ada di daftar dihapus.
create or replace function public.save_lessons(p_slug text, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_edit_course(p_slug) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'invalid' using errcode = '22023';
  end if;

  delete from public.lessons l
  where l.course_slug = p_slug
    and l.id <> all (array(select x ->> 'id' from jsonb_array_elements(p_rows) x));

  insert into public.lessons (course_slug, id, title, minutes, youtube_id, notes, free_preview, position)
  select p_slug, r.id, r.title, r.minutes, r.youtube_id, coalesce(r.notes, '{}'::jsonb),
         coalesce(r.free_preview, false), r.position
  from jsonb_to_recordset(p_rows) as r(
    id text, title jsonb, minutes int, youtube_id text, notes jsonb, free_preview boolean, "position" int
  )
  on conflict (course_slug, id) do update set
    title = excluded.title,
    minutes = excluded.minutes,
    youtube_id = excluded.youtube_id,
    notes = excluded.notes,
    free_preview = excluded.free_preview,
    position = excluded.position;
end;
$$;

-- Menyimpan seluruh bank soal sekaligus (atomik). Yang tidak ada di daftar dihapus.
create or replace function public.save_questions(p_slug text, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_edit_course(p_slug) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'invalid' using errcode = '22023';
  end if;

  delete from public.quiz_questions q
  where q.course_slug = p_slug
    and q.id::text <> all (array(select x ->> 'id' from jsonb_array_elements(p_rows) x));

  insert into public.quiz_questions (id, course_slug, position, prompt, options, answer, explanation)
  select r.id, p_slug, r.position, r.prompt, r.options, r.answer, coalesce(r.explanation, '{}'::jsonb)
  from jsonb_to_recordset(p_rows) as r(
    id uuid, "position" int, prompt jsonb, options jsonb, answer int, explanation jsonb
  )
  on conflict (id) do update set
    position = excluded.position,
    prompt = excluded.prompt,
    options = excluded.options,
    answer = excluded.answer,
    explanation = excluded.explanation
  -- Id soal milik kelas lain tidak boleh diambil alih.
  where public.quiz_questions.course_slug = p_slug;
end;
$$;

-- ---------------------------------------------------------------
-- 4) Kuis dinilai di server
-- ---------------------------------------------------------------
-- Siswa tidak lagi boleh menulis skor sendiri.
drop policy if exists "simpan percobaan kuis sendiri" on public.quiz_attempts;
revoke insert, update, delete on public.quiz_attempts from anon, authenticated;

-- p_answers: {"<id soal>": <indeks pilihan>, ...}. Tamu dinilai tanpa disimpan.
create or replace function public.submit_quiz(p_slug text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_total int;
  v_score int;
  v_results jsonb;
begin
  if jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if not public.has_course_access(p_slug) then
    raise exception 'no_access' using errcode = '42501';
  end if;

  select
    count(*)::int,
    (count(*) filter (where p_answers ->> q.id::text = q.answer::text))::int,
    coalesce(jsonb_agg(
      jsonb_build_object('id', q.id, 'answer', q.answer, 'explanation', q.explanation)
      order by q.position
    ), '[]'::jsonb)
  into v_total, v_score, v_results
  from public.quiz_questions q
  where q.course_slug = p_slug;

  if v_total = 0 then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if v_uid is not null then
    insert into public.quiz_attempts (user_id, course_slug, score, total)
    values (v_uid, p_slug, v_score, v_total);
  end if;

  return jsonb_build_object(
    'score', v_score,
    'total', v_total,
    'recorded', v_uid is not null,
    'results', v_results
  );
end;
$$;

-- ---------------------------------------------------------------
-- 5) Materi pelajaran (file di bucket privat "materials")
-- Path file: <slug kelas>/<id pelajaran>/<nama file>
-- ---------------------------------------------------------------
create table if not exists public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null,
  lesson_id text not null,
  title text not null check (char_length(title) between 1 and 120),
  path text not null unique check (char_length(path) <= 300),
  size bigint not null default 0 check (size >= 0),
  position int not null default 0,
  created_at timestamptz not null default now(),
  foreign key (course_slug, lesson_id) references public.lessons (course_slug, id)
    on update cascade on delete cascade,
  check (path like course_slug || '/' || lesson_id || '/%')
);

create index if not exists lesson_materials_lesson_idx
  on public.lesson_materials (course_slug, lesson_id, position);

alter table public.lesson_materials enable row level security;
revoke all on public.lesson_materials from anon;
grant select, insert, delete on public.lesson_materials to authenticated;

drop policy if exists "materi dibaca yang berhak" on public.lesson_materials;
create policy "materi dibaca yang berhak" on public.lesson_materials
  for select to authenticated
  using (public.has_lesson_access(course_slug, lesson_id));

drop policy if exists "materi dikelola" on public.lesson_materials;
create policy "materi dikelola" on public.lesson_materials
  for all to authenticated
  using (public.can_edit_course(course_slug))
  with check (public.can_edit_course(course_slug));

-- ---------------------------------------------------------------
-- 6) Storage: foto profil (publik) dan materi (privat)
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('materials', 'materials', false, 20971520, array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip'
  ])
on conflict (id) do nothing;

drop policy if exists "avatar baca sendiri" on storage.objects;
create policy "avatar baca sendiri" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatar unggah sendiri" on storage.objects;
create policy "avatar unggah sendiri" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatar ubah sendiri" on storage.objects;
create policy "avatar ubah sendiri" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatar hapus sendiri" on storage.objects;
create policy "avatar hapus sendiri" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "materi unduh yang berhak" on storage.objects;
-- Tamu juga boleh mengunduh materi pelajaran gratis / pratinjau.
create policy "materi unduh yang berhak" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'materials'
    and public.has_lesson_access((storage.foldername(name))[1], (storage.foldername(name))[2])
  );

drop policy if exists "materi unggah pengelola" on storage.objects;
create policy "materi unggah pengelola" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materials' and public.can_edit_course((storage.foldername(name))[1]));

drop policy if exists "materi hapus pengelola" on storage.objects;
create policy "materi hapus pengelola" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materials' and public.can_edit_course((storage.foldername(name))[1]));

-- ---------------------------------------------------------------
-- 7) Sertifikat
-- ---------------------------------------------------------------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  user_id uuid not null references auth.users on delete cascade,
  -- Salinan saat terbit: sertifikat tetap sah walau kelas diubah / dihapus.
  course_slug text not null,
  course_title jsonb not null,
  recipient_name text not null,
  score int,
  total int,
  issued_at timestamptz not null default now(),
  unique (user_id, course_slug)
);

alter table public.certificates enable row level security;
revoke all on public.certificates from anon;
revoke insert, update, delete on public.certificates from authenticated;
grant select on public.certificates to authenticated;

drop policy if exists "baca sertifikat sendiri" on public.certificates;
create policy "baca sertifikat sendiri" on public.certificates
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Batas nilai kuis untuk sertifikat (persen). Samakan dengan siteConfig.certificate.minQuizPercent.
create or replace function public.certificate_min_percent()
returns int
language sql
immutable
as $$ select 70 $$;

-- Terbitkan (atau kembalikan) sertifikat: semua pelajaran selesai dan,
-- jika kelas punya kuis, skor terbaik >= batas.
create or replace function public.claim_certificate(p_slug text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_code text;
  v_lessons int;
  v_done int;
  v_questions int;
  v_score int;
  v_total int;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;

  select c.code into v_code from public.certificates c
  where c.user_id = v_uid and c.course_slug = p_slug;
  if found then
    return v_code;
  end if;

  if not public.has_course_access(p_slug) then
    raise exception 'no_access' using errcode = '42501';
  end if;

  select count(*) into v_lessons from public.lessons where course_slug = p_slug;
  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.course_slug = lp.course_slug and l.id = lp.lesson_id
  where lp.user_id = v_uid and lp.course_slug = p_slug;
  if v_lessons = 0 or v_done < v_lessons then
    raise exception 'not_complete' using errcode = 'P0001';
  end if;

  select count(*) into v_questions from public.quiz_questions where course_slug = p_slug;
  if v_questions > 0 then
    select q.score, q.total into v_score, v_total
    from public.quiz_attempts q
    where q.user_id = v_uid and q.course_slug = p_slug
    order by (q.score::numeric / q.total) desc, q.created_at desc
    limit 1;
    if v_total is null or v_score * 100 < public.certificate_min_percent() * v_total then
      raise exception 'quiz_required' using errcode = 'P0001';
    end if;
  end if;

  insert into public.certificates (user_id, course_slug, course_title, recipient_name, score, total)
  select v_uid, c.slug, c.title,
         coalesce(nullif(btrim(p.name), ''), split_part(u.email, '@', 1), '-'),
         v_score, v_total
  from public.courses c
  join auth.users u on u.id = v_uid
  left join public.profiles p on p.id = v_uid
  where c.slug = p_slug
  returning code into v_code;

  return v_code;
end;
$$;

-- Verifikasi publik dengan kode sertifikat.
create or replace function public.get_certificate(p_code text)
returns table (
  code text, recipient_name text, course_slug text, course_title jsonb,
  score int, total int, issued_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.code, c.recipient_name, c.course_slug, c.course_title, c.score, c.total, c.issued_at
  from public.certificates c
  where c.code = upper(btrim(p_code));
$$;

-- ---------------------------------------------------------------
-- 8) Diskusi per pelajaran
-- ---------------------------------------------------------------
create table if not exists public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null,
  lesson_id text not null,
  user_id uuid not null references auth.users on delete cascade,
  -- null = pertanyaan; terisi = balasan (hanya satu tingkat)
  parent_id uuid references public.lesson_comments on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  foreign key (course_slug, lesson_id) references public.lessons (course_slug, id)
    on update cascade on delete cascade
);

create index if not exists lesson_comments_lesson_idx
  on public.lesson_comments (course_slug, lesson_id, created_at);
create index if not exists lesson_comments_parent_idx on public.lesson_comments (parent_id);

alter table public.lesson_comments enable row level security;
revoke all on public.lesson_comments from anon;
revoke update on public.lesson_comments from authenticated;
grant select, insert, delete on public.lesson_comments to authenticated;

-- Balasan harus menunjuk pertanyaan di pelajaran yang sama.
create or replace function public.valid_comment_parent(p_parent uuid, p_slug text, p_lesson text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_parent is null or exists (
    select 1 from public.lesson_comments c
    where c.id = p_parent and c.parent_id is null
      and c.course_slug = p_slug and c.lesson_id = p_lesson
  );
$$;

drop policy if exists "diskusi dibaca yang berhak" on public.lesson_comments;
create policy "diskusi dibaca yang berhak" on public.lesson_comments
  for select to authenticated
  using (public.has_lesson_access(course_slug, lesson_id));

drop policy if exists "diskusi ditulis yang berhak" on public.lesson_comments;
create policy "diskusi ditulis yang berhak" on public.lesson_comments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_lesson_access(course_slug, lesson_id)
    and public.valid_comment_parent(parent_id, course_slug, lesson_id)
  );

drop policy if exists "diskusi dihapus pemilik atau pengelola" on public.lesson_comments;
create policy "diskusi dihapus pemilik atau pengelola" on public.lesson_comments
  for delete to authenticated
  using ((select auth.uid()) = user_id or public.can_edit_course(course_slug));

-- Daftar diskusi beserta nama, foto, dan role penulis.
create or replace function public.lesson_comments_list(p_slug text, p_lesson text)
returns table (
  id uuid, parent_id uuid, body text, created_at timestamptz,
  author_name text, author_avatar text, author_role public.user_role,
  is_mine boolean, can_delete boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.parent_id, c.body, c.created_at,
         coalesce(nullif(btrim(p.name), ''), '-'), p.avatar_path, coalesce(p.role, 'student'::public.user_role),
         c.user_id = (select auth.uid()),
         c.user_id = (select auth.uid()) or public.can_edit_course(p_slug)
  from public.lesson_comments c
  left join public.profiles p on p.id = c.user_id
  where c.course_slug = p_slug and c.lesson_id = p_lesson
    and (select auth.uid()) is not null
    and public.has_lesson_access(p_slug, p_lesson)
  order by c.created_at;
$$;

-- CMS: pertanyaan yang belum dijawab guru / super admin, di kelas yang boleh dikelola.
create or replace function public.admin_open_questions()
returns table (
  id uuid, course_slug text, lesson_id text, course_title jsonb, lesson_title jsonb,
  body text, created_at timestamptz, author_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.course_slug, c.lesson_id, co.title, l.title, c.body, c.created_at,
         coalesce(nullif(btrim(p.name), ''), '-')
  from public.lesson_comments c
  join public.courses co on co.slug = c.course_slug
  join public.lessons l on l.course_slug = c.course_slug and l.id = c.lesson_id
  left join public.profiles p on p.id = c.user_id
  where c.parent_id is null
    and public.can_edit_course(c.course_slug)
    and coalesce(p.role, 'student'::public.user_role) = 'student'
    and not exists (
      select 1 from public.lesson_comments r
      join public.profiles rp on rp.id = r.user_id
      where r.parent_id = c.id and rp.role in ('teacher', 'super_admin')
    )
  order by c.created_at desc
  limit 200;
$$;

-- ---------------------------------------------------------------
-- 9) Statistik CMS
-- ---------------------------------------------------------------
create or replace function public.admin_course_stats()
returns table (
  slug text, title jsonb, published boolean, lessons int, learners int, completers int,
  quiz_takers int, avg_best_percent int, certificates int
)
language sql
stable
security definer
set search_path = ''
as $$
  with editable as (
    select c.slug, c.title, c.published, c.position
    from public.courses c
    where public.can_edit_course(c.slug)
  ),
  lesson_counts as (
    select l.course_slug, count(*)::int as n from public.lessons l group by l.course_slug
  ),
  per_user as (
    select lp.course_slug, lp.user_id, count(*)::int as done
    from public.lesson_progress lp
    join public.lessons l on l.course_slug = lp.course_slug and l.id = lp.lesson_id
    group by lp.course_slug, lp.user_id
  ),
  best as (
    select q.course_slug, q.user_id, max(q.score::numeric / q.total) as ratio
    from public.quiz_attempts q
    group by q.course_slug, q.user_id
  )
  select
    e.slug, e.title, e.published,
    coalesce(lc.n, 0),
    (select count(*)::int from per_user pu where pu.course_slug = e.slug),
    (select count(*)::int from per_user pu where pu.course_slug = e.slug and pu.done >= coalesce(lc.n, 0) and lc.n > 0),
    (select count(*)::int from best b where b.course_slug = e.slug),
    (select round(avg(b.ratio) * 100)::int from best b where b.course_slug = e.slug),
    (select count(*)::int from public.certificates ce where ce.course_slug = e.slug)
  from editable e
  left join lesson_counts lc on lc.course_slug = e.slug
  order by e.position, e.slug;
$$;

-- Berapa siswa menyelesaikan tiap pelajaran (untuk melihat di mana siswa berhenti).
create or replace function public.admin_lesson_funnel(p_slug text)
returns table (lesson_id text, title jsonb, "position" int, completed int)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.title, l.position,
         (select count(*)::int from public.lesson_progress lp
          where lp.course_slug = l.course_slug and lp.lesson_id = l.id)
  from public.lessons l
  where l.course_slug = p_slug and public.can_edit_course(p_slug)
  order by l.position, l.id;
$$;

-- Ringkasan situs (super admin).
create or replace function public.admin_overview()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_super_admin() then jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'new_users_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
    'active_learners_7d', (
      select count(distinct user_id) from (
        select user_id from public.lesson_progress where completed_at > now() - interval '7 days'
        union all
        select user_id from public.quiz_attempts where created_at > now() - interval '7 days'
      ) a
    ),
    'active_subscriptions', (
      select count(*) from public.subscriptions where expires_at is null or expires_at > now()
    ),
    'pending_reviews', (select count(*) from public.reviews where not approved),
    'certificates', (select count(*) from public.certificates)
  ) end;
$$;

-- ---------------------------------------------------------------
-- 10) Hak eksekusi fungsi
-- ---------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.has_course_access(text)',
    'public.has_lesson_access(text, text)',
    'public.lesson_content(text, text)',
    'public.submit_quiz(text, jsonb)',
    'public.get_certificate(text)',
    'public.certificate_min_percent()'
  ] loop
    execute format('revoke execute on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;

  foreach f in array array[
    'public.admin_course_lessons(text)',
    'public.admin_course_questions(text)',
    'public.save_lessons(text, jsonb)',
    'public.save_questions(text, jsonb)',
    'public.claim_certificate(text)',
    'public.valid_comment_parent(uuid, text, text)',
    'public.lesson_comments_list(text, text)',
    'public.admin_open_questions()',
    'public.admin_course_stats()',
    'public.admin_lesson_funnel(text)',
    'public.admin_overview()'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;
