-- Fitur lanjutan:
--   1) Try-out UTBK (ujian bertimer per subtes, peringkat, analisis)
--   2) Kuota tutor AI + soal kuis untuk penjelasan AI
--   3) Akun orang tua (kode tautan, ringkasan anak, data email mingguan)
--   4) Latihan pintar (soal yang salah diulang terjadwal / Leitner)
--   5) Gamifikasi (XP, statistik lencana, papan peringkat)
--   6) Kelas live terjadwal (link & rekaman hanya untuk yang berhak)
--   7) Mode sekolah (kelas dengan kode gabung, tugas, laporan; akses sponsor)
--   8) Langganan push notification (PWA)
-- Idempoten (aman dijalankan ulang). Jangan ubah file ini setelah diterapkan.

-- ---------------------------------------------------------------
-- 0) Kolom profil baru
-- ---------------------------------------------------------------
alter table public.profiles
  add column if not exists show_on_leaderboard boolean not null default true;
grant update (show_on_leaderboard) on public.profiles to authenticated;

-- ---------------------------------------------------------------
-- 7a) Mode sekolah: tabel lebih dulu karena dipakai fungsi akses
-- ---------------------------------------------------------------
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{6,10}$'),
  -- Akses jenjang berbayar yang dibiayai sekolah (hanya super admin yang mengisi).
  sponsor_level_id text references public.levels on update cascade on delete set null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists classrooms_teacher_idx on public.classrooms (teacher_id);

create table if not exists public.classroom_members (
  classroom_id uuid not null references public.classrooms on delete cascade,
  student_id uuid not null references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);
create index if not exists classroom_members_student_idx on public.classroom_members (student_id);

-- ---------------------------------------------------------------
-- 1) Fungsi akses (ditulis ulang: + akses sponsor sekolah)
-- ---------------------------------------------------------------
create or replace function public.has_level_access(p_level text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.levels lv where lv.id = p_level and lv.price = 0)
    or exists (
      select 1 from public.subscriptions s
      where s.user_id = (select auth.uid()) and s.level_id = p_level
        and (s.expires_at is null or s.expires_at > now())
    )
    or exists (
      select 1 from public.classroom_members m
      join public.classrooms c on c.id = m.classroom_id
      where m.student_id = (select auth.uid()) and c.sponsor_level_id = p_level and not c.archived
    )
    or public.is_super_admin();
$$;

create or replace function public.has_course_access(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    where c.slug = p_slug and c.published and public.has_level_access(c.level_id)
  ) or public.can_edit_course(p_slug);
$$;

-- ---------------------------------------------------------------
-- 2) Try-out
-- ---------------------------------------------------------------
create table if not exists public.tryouts (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  level_id text not null references public.levels on update cascade on delete restrict,
  title jsonb not null,
  description jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  -- Jadwal (opsional): di luar rentang ini try-out tidak bisa dimulai.
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  check (opens_at is null or closes_at is null or opens_at < closes_at)
);

create table if not exists public.tryout_sections (
  id uuid primary key default gen_random_uuid(),
  tryout_slug text not null references public.tryouts on update cascade on delete cascade,
  title jsonb not null,
  minutes int not null check (minutes between 1 and 300),
  position int not null default 0
);
create index if not exists tryout_sections_tryout_idx on public.tryout_sections (tryout_slug, position);

create table if not exists public.tryout_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.tryout_sections on delete cascade,
  position int not null default 0,
  prompt jsonb not null,
  options jsonb not null check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6
  ),
  answer int not null check (answer >= 0),
  explanation jsonb not null default '{}'::jsonb,
  check (answer < jsonb_array_length(options))
);
create index if not exists tryout_questions_section_idx on public.tryout_questions (section_id, position);

-- Satu percobaan resmi per siswa per try-out (dipakai untuk peringkat).
create table if not exists public.tryout_attempts (
  id uuid primary key default gen_random_uuid(),
  tryout_slug text not null references public.tryouts on update cascade on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  submitted_at timestamptz,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  score int,
  total int,
  section_scores jsonb,
  unique (tryout_slug, user_id)
);
create index if not exists tryout_attempts_rank_idx on public.tryout_attempts (tryout_slug, score desc);

-- Boleh mengelola try-out: super admin, atau guru pembuatnya.
create or replace function public.can_edit_tryout(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin()
    or (
      public.my_role() = 'teacher'::public.user_role
      and exists (select 1 from public.tryouts t where t.slug = p_slug and t.created_by = (select auth.uid()))
    );
$$;

alter table public.tryouts enable row level security;
alter table public.tryout_sections enable row level security;
alter table public.tryout_questions enable row level security;
alter table public.tryout_attempts enable row level security;

grant select on public.tryouts, public.tryout_sections to anon, authenticated;
grant insert, update, delete on public.tryouts to authenticated;
revoke insert, update, delete on public.tryout_sections from anon, authenticated;
-- Soal & kunci hanya lewat fungsi (start_tryout / submit_tryout / admin_*).
revoke all on public.tryout_questions from anon, authenticated;
revoke all on public.tryout_attempts from anon;
revoke insert, update, delete on public.tryout_attempts from authenticated;
grant select on public.tryout_attempts to authenticated;

drop policy if exists "tryout terbit atau milik sendiri" on public.tryouts;
-- Cek kolom baris langsung (bukan lewat fungsi yang membaca tabel) supaya
-- INSERT ... RETURNING oleh pembuatnya juga lolos.
create policy "tryout terbit atau milik sendiri" on public.tryouts
  for select to anon, authenticated
  using (published or created_by = (select auth.uid()) or public.is_super_admin());

drop policy if exists "buat tryout" on public.tryouts;
create policy "buat tryout" on public.tryouts
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (public.my_role() = 'teacher'::public.user_role and created_by = (select auth.uid()))
  );

drop policy if exists "ubah tryout" on public.tryouts;
create policy "ubah tryout" on public.tryouts
  for update to authenticated
  using (public.can_edit_tryout(slug))
  with check (public.is_super_admin() or created_by = (select auth.uid()));

drop policy if exists "hapus tryout" on public.tryouts;
create policy "hapus tryout" on public.tryouts
  for delete to authenticated
  using (public.can_edit_tryout(slug));

drop policy if exists "subtes dibaca" on public.tryout_sections;
create policy "subtes dibaca" on public.tryout_sections
  for select to anon, authenticated
  using (exists (
    select 1 from public.tryouts t
    where t.slug = tryout_slug
      and (t.published or t.created_by = (select auth.uid()) or public.is_super_admin())
  ));

drop policy if exists "baca percobaan tryout sendiri" on public.tryout_attempts;
create policy "baca percobaan tryout sendiri" on public.tryout_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- CMS: isi try-out lengkap (subtes + soal + kunci).
create or replace function public.admin_tryout_content(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.can_edit_tryout(p_slug) then coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id, 'title', s.title, 'minutes', s.minutes,
      'questions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', q.id, 'prompt', q.prompt, 'options', q.options,
          'answer', q.answer, 'explanation', q.explanation
        ) order by q.position)
        from public.tryout_questions q where q.section_id = s.id
      ), '[]'::jsonb)
    ) order by s.position)
    from public.tryout_sections s where s.tryout_slug = p_slug
  ), '[]'::jsonb) end;
$$;

-- CMS: simpan seluruh subtes & soal sekaligus (atomik). Tidak boleh setelah ada peserta.
create or replace function public.save_tryout_content(p_slug text, p_sections jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s jsonb;
  q jsonb;
  v_sid uuid;
  s_pos int := 0;
  q_pos int;
begin
  if not public.can_edit_tryout(p_slug) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_sections) <> 'array' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if exists (select 1 from public.tryout_attempts a where a.tryout_slug = p_slug) then
    raise exception 'has_attempts' using errcode = 'P0001';
  end if;

  delete from public.tryout_sections where tryout_slug = p_slug;
  for s in select * from jsonb_array_elements(p_sections) loop
    insert into public.tryout_sections (tryout_slug, title, minutes, position)
    values (p_slug, s -> 'title', (s ->> 'minutes')::int, s_pos)
    returning id into v_sid;
    s_pos := s_pos + 1;
    q_pos := 0;
    for q in select * from jsonb_array_elements(coalesce(s -> 'questions', '[]'::jsonb)) loop
      insert into public.tryout_questions (section_id, position, prompt, options, answer, explanation)
      values (v_sid, q_pos, q -> 'prompt', q -> 'options', (q ->> 'answer')::int,
              coalesce(q -> 'explanation', '{}'::jsonb));
      q_pos := q_pos + 1;
    end loop;
  end loop;
end;
$$;

-- Isi try-out untuk peserta: subtes + soal TANPA kunci.
create or replace function public.tryout_paper(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id, 'title', s.title, 'minutes', s.minutes,
      'questions', coalesce((
        select jsonb_agg(jsonb_build_object('id', q.id, 'prompt', q.prompt, 'options', q.options)
                         order by q.position)
        from public.tryout_questions q where q.section_id = s.id
      ), '[]'::jsonb)
    ) order by s.position)
    from public.tryout_sections s where s.tryout_slug = p_slug
  ), '[]'::jsonb);
$$;

-- Mulai (atau lanjutkan) try-out. Mengembalikan soal + batas waktu dari server.
create or replace function public.start_tryout(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  t record;
  a record;
  v_minutes int;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  select * into t from public.tryouts where slug = p_slug and published;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not public.has_level_access(t.level_id) then
    raise exception 'no_access' using errcode = '42501';
  end if;

  select * into a from public.tryout_attempts where tryout_slug = p_slug and user_id = v_uid;
  if not found then
    if (t.opens_at is not null and now() < t.opens_at) or (t.closes_at is not null and now() > t.closes_at) then
      raise exception 'closed' using errcode = 'P0001';
    end if;
    select coalesce(sum(minutes), 0) into v_minutes from public.tryout_sections where tryout_slug = p_slug;
    if v_minutes = 0 then
      raise exception 'empty' using errcode = 'P0001';
    end if;
    insert into public.tryout_attempts (tryout_slug, user_id, deadline)
    values (p_slug, v_uid, now() + make_interval(mins => v_minutes))
    returning * into a;
  end if;

  return jsonb_build_object(
    'started_at', a.started_at,
    'deadline', a.deadline,
    'submitted', a.submitted_at is not null,
    'answers', a.answers,
    'sections', public.tryout_paper(p_slug)
  );
end;
$$;

-- Simpan jawaban sementara (autosave) selama waktu masih berjalan.
create or replace function public.save_tryout_answers(p_slug text, p_answers jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  update public.tryout_attempts
  set answers = p_answers
  where tryout_slug = p_slug and user_id = (select auth.uid())
    and submitted_at is null and now() <= deadline;
  return found;
end;
$$;

-- Batas toleransi setelah waktu habis (detik) untuk jaringan lambat.
create or replace function public.tryout_grace_seconds()
returns int language sql immutable as $$ select 120 $$;

-- Serahkan & nilai. Lewat batas waktu: yang dinilai jawaban terakhir yang sempat tersimpan.
create or replace function public.submit_tryout(p_slug text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  a record;
  v_answers jsonb;
  v_sections jsonb;
  v_score int;
  v_total int;
begin
  select * into a from public.tryout_attempts where tryout_slug = p_slug and user_id = v_uid;
  if not found then
    raise exception 'not_started' using errcode = 'P0002';
  end if;

  if a.submitted_at is null then
    v_answers := case
      when now() <= a.deadline + make_interval(secs => public.tryout_grace_seconds())
        and jsonb_typeof(p_answers) = 'object' then p_answers
      else a.answers
    end;

    select
      coalesce(jsonb_agg(jsonb_build_object('id', x.sid, 'score', x.score, 'total', x.total) order by x.pos), '[]'::jsonb),
      coalesce(sum(x.score), 0)::int,
      coalesce(sum(x.total), 0)::int
    into v_sections, v_score, v_total
    from (
      select s.id as sid, s.position as pos,
        count(q.id)::int as total,
        (count(q.id) filter (where v_answers ->> q.id::text = q.answer::text))::int as score
      from public.tryout_sections s
      left join public.tryout_questions q on q.section_id = s.id
      where s.tryout_slug = p_slug
      group by s.id, s.position
    ) x;

    update public.tryout_attempts
    set answers = v_answers, submitted_at = now(), score = v_score,
        total = greatest(v_total, 1), section_scores = v_sections
    where id = a.id
    returning * into a;
  end if;

  return public.tryout_result(p_slug);
end;
$$;

-- Hasil milik sendiri setelah diserahkan: skor, per subtes, kunci & pembahasan, peringkat.
create or replace function public.tryout_result(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when a.id is null or a.submitted_at is null then null else jsonb_build_object(
    'score', a.score,
    'total', a.total,
    'submitted_at', a.submitted_at,
    'answers', a.answers,
    'section_scores', a.section_scores,
    'rank', (select count(*) + 1 from public.tryout_attempts b
             where b.tryout_slug = p_slug and b.submitted_at is not null and b.score > a.score),
    'participants', (select count(*) from public.tryout_attempts b
                     where b.tryout_slug = p_slug and b.submitted_at is not null),
    -- Pembahasan: soal, pilihan, kunci, dan penjelasan (urut subtes lalu nomor).
    'key', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'section_id', s.id, 'prompt', q.prompt, 'options', q.options,
        'answer', q.answer, 'explanation', q.explanation
      ) order by s.position, q.position)
      from public.tryout_questions q
      join public.tryout_sections s on s.id = q.section_id
      where s.tryout_slug = p_slug
    ), '[]'::jsonb),
    'section_avg', coalesce((
      select jsonb_object_agg(e.sid, e.avg_pct) from (
        select (sc ->> 'id') as sid,
               round(avg(case when (sc ->> 'total')::int > 0
                         then (sc ->> 'score')::numeric * 100 / (sc ->> 'total')::int end))::int as avg_pct
        from public.tryout_attempts b, jsonb_array_elements(b.section_scores) sc
        where b.tryout_slug = p_slug and b.submitted_at is not null
        group by sc ->> 'id'
      ) e
    ), '{}'::jsonb)
  ) end
  from (select 1) one
  left join public.tryout_attempts a
    on a.tryout_slug = p_slug and a.user_id = (select auth.uid());
$$;

-- Peringkat (100 teratas) — nama hanya untuk yang mengizinkan tampil di papan peringkat.
create or replace function public.tryout_leaderboard(p_slug text)
returns table (rank bigint, name text, avatar_path text, score int, total int, is_me boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select rank() over (order by a.score desc, a.submitted_at),
         case when coalesce(p.show_on_leaderboard, true) or a.user_id = (select auth.uid())
              then coalesce(nullif(btrim(p.name), ''), '-') else null end,
         case when coalesce(p.show_on_leaderboard, true) then p.avatar_path end,
         a.score, a.total, a.user_id = (select auth.uid())
  from public.tryout_attempts a
  left join public.profiles p on p.id = a.user_id
  where a.tryout_slug = p_slug and a.submitted_at is not null
    and exists (select 1 from public.tryouts t where t.slug = p_slug and t.published)
  order by a.score desc, a.submitted_at
  limit 100;
$$;

-- ---------------------------------------------------------------
-- 3) Tutor AI: kuota harian + soal kuis untuk penjelasan
-- ---------------------------------------------------------------
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Menambah pemakaian hari ini (zona WIB) dan mengembalikan totalnya.
create or replace function public.ai_take_quota()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count int;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  insert into public.ai_usage (user_id, day, count)
  values (v_uid, (now() at time zone 'Asia/Jakarta')::date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

-- Soal kuis + kunci untuk dijelaskan AI: hanya bila berhak DAN sudah pernah mengerjakan kuisnya.
create or replace function public.quiz_question_for_ai(p_question uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'course_slug', q.course_slug, 'prompt', q.prompt, 'options', q.options,
    'answer', q.answer, 'explanation', q.explanation
  )
  from public.quiz_questions q
  where q.id = p_question
    and public.has_course_access(q.course_slug)
    and exists (
      select 1 from public.quiz_attempts a
      where a.user_id = (select auth.uid()) and a.course_slug = q.course_slug
    );
$$;

-- ---------------------------------------------------------------
-- 4) Orang tua
-- ---------------------------------------------------------------
create table if not exists public.parent_links (
  parent_id uuid not null references auth.users on delete cascade,
  student_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id),
  check (parent_id <> student_id)
);
create index if not exists parent_links_student_idx on public.parent_links (student_id);

create table if not exists public.parent_link_codes (
  code text primary key check (code ~ '^[A-Z0-9]{8}$'),
  student_id uuid not null unique references auth.users on delete cascade,
  expires_at timestamptz not null
);

alter table public.parent_links enable row level security;
alter table public.parent_link_codes enable row level security;
revoke all on public.parent_links, public.parent_link_codes from anon;
revoke insert, update on public.parent_links from authenticated;
grant select, delete on public.parent_links to authenticated;
revoke all on public.parent_link_codes from authenticated;

drop policy if exists "tautan orang tua dibaca pihak terkait" on public.parent_links;
create policy "tautan orang tua dibaca pihak terkait" on public.parent_links
  for select to authenticated
  using ((select auth.uid()) in (parent_id, student_id));

drop policy if exists "tautan orang tua dihapus pihak terkait" on public.parent_links;
create policy "tautan orang tua dihapus pihak terkait" on public.parent_links
  for delete to authenticated
  using ((select auth.uid()) in (parent_id, student_id));

-- Siswa membuat kode (berlaku 7 hari) untuk diberikan ke orang tua.
create or replace function public.create_parent_code()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_code text;
  v_exp timestamptz := now() + interval '7 days';
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when char_length(v_code) = 8
      and not exists (select 1 from public.parent_link_codes where code = v_code);
  end loop;
  insert into public.parent_link_codes (code, student_id, expires_at)
  values (v_code, v_uid, v_exp)
  on conflict (student_id) do update set code = excluded.code, expires_at = excluded.expires_at;
  return jsonb_build_object('code', v_code, 'expires_at', v_exp);
end;
$$;

-- Orang tua memasukkan kode → tertaut ke anak.
create or replace function public.redeem_parent_code(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_student uuid;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  select student_id into v_student from public.parent_link_codes
  where code = upper(btrim(p_code)) and expires_at > now();
  if v_student is null then
    raise exception 'invalid_code' using errcode = 'P0002';
  end if;
  if v_student = v_uid then
    raise exception 'own_code' using errcode = 'P0001';
  end if;
  insert into public.parent_links (parent_id, student_id) values (v_uid, v_student)
  on conflict do nothing;
  delete from public.parent_link_codes where student_id = v_student;
  return (select coalesce(nullif(btrim(name), ''), '-') from public.profiles where id = v_student);
end;
$$;

-- Ringkasan setiap anak yang tertaut (untuk dasbor orang tua).
create or replace function public.parent_children()
returns table (
  student_id uuid, name text, avatar_path text,
  lessons_total int, lessons_week int, quizzes_week int, avg_quiz_percent int,
  last_active timestamptz, active_days date[], courses jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.student_id,
    coalesce(nullif(btrim(p.name), ''), '-'),
    p.avatar_path,
    (select count(*)::int from public.lesson_progress lp where lp.user_id = l.student_id),
    (select count(*)::int from public.lesson_progress lp
     where lp.user_id = l.student_id and lp.completed_at > now() - interval '7 days'),
    (select count(*)::int from public.quiz_attempts q
     where q.user_id = l.student_id and q.created_at > now() - interval '7 days'),
    (select round(avg(q.score::numeric * 100 / q.total))::int from public.quiz_attempts q
     where q.user_id = l.student_id and q.created_at > now() - interval '30 days'),
    greatest(
      (select max(completed_at) from public.lesson_progress lp where lp.user_id = l.student_id),
      (select max(created_at) from public.quiz_attempts q where q.user_id = l.student_id)
    ),
    array(
      select distinct d from (
        select (lp.completed_at at time zone 'Asia/Jakarta')::date d from public.lesson_progress lp
        where lp.user_id = l.student_id and lp.completed_at > now() - interval '60 days'
        union
        select (q.created_at at time zone 'Asia/Jakarta')::date from public.quiz_attempts q
        where q.user_id = l.student_id and q.created_at > now() - interval '60 days'
      ) days order by d desc
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object('slug', c.slug, 'title', c.title, 'done', x.done, 'total', x.total)
                       order by x.last desc)
      from (
        select lp.course_slug, count(*)::int done, max(lp.completed_at) last,
               (select count(*)::int from public.lessons ls where ls.course_slug = lp.course_slug) total
        from public.lesson_progress lp
        join public.lessons ls2 on ls2.course_slug = lp.course_slug and ls2.id = lp.lesson_id
        where lp.user_id = l.student_id
        group by lp.course_slug
      ) x join public.courses c on c.slug = x.course_slug
    ), '[]'::jsonb)
  from public.parent_links l
  left join public.profiles p on p.id = l.student_id
  where l.parent_id = (select auth.uid())
  order by p.name;
$$;

-- Daftar orang tua yang tertaut ke akun siswa (untuk halaman profil).
create or replace function public.my_parents()
returns table (parent_id uuid, name text, linked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select l.parent_id, coalesce(nullif(btrim(p.name), ''), '-'), l.created_at
  from public.parent_links l left join public.profiles p on p.id = l.parent_id
  where l.student_id = (select auth.uid())
  order by l.created_at;
$$;

-- Data email mingguan (hanya service_role / cron).
create or replace function public.weekly_parent_digest()
returns table (
  parent_email text, parent_name text, child_name text,
  lessons_week int, quizzes_week int, avg_quiz_percent int, active_days_week int
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text, coalesce(nullif(btrim(pp.name), ''), ''), coalesce(nullif(btrim(sp.name), ''), '-'),
    (select count(*)::int from public.lesson_progress lp
     where lp.user_id = l.student_id and lp.completed_at > now() - interval '7 days'),
    (select count(*)::int from public.quiz_attempts q
     where q.user_id = l.student_id and q.created_at > now() - interval '7 days'),
    (select round(avg(q.score::numeric * 100 / q.total))::int from public.quiz_attempts q
     where q.user_id = l.student_id and q.created_at > now() - interval '7 days'),
    (select count(distinct d)::int from (
       select (lp.completed_at at time zone 'Asia/Jakarta')::date d from public.lesson_progress lp
       where lp.user_id = l.student_id and lp.completed_at > now() - interval '7 days'
       union
       select (q.created_at at time zone 'Asia/Jakarta')::date from public.quiz_attempts q
       where q.user_id = l.student_id and q.created_at > now() - interval '7 days'
     ) days)
  from public.parent_links l
  join auth.users u on u.id = l.parent_id
  left join public.profiles pp on pp.id = l.parent_id
  left join public.profiles sp on sp.id = l.student_id
  where u.email is not null;
$$;

-- ---------------------------------------------------------------
-- 5) Latihan pintar (Leitner: kotak 0..4, kotak 5 = dikuasai → dihapus)
-- ---------------------------------------------------------------
create table if not exists public.question_reviews (
  user_id uuid not null references auth.users on delete cascade,
  question_id uuid not null references public.quiz_questions on delete cascade,
  box int not null default 0 check (box between 0 and 4),
  due_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index if not exists question_reviews_due_idx on public.question_reviews (user_id, due_at);

create table if not exists public.practice_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  question_id uuid references public.quiz_questions on delete set null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists practice_log_user_idx on public.practice_log (user_id, created_at);

alter table public.question_reviews enable row level security;
alter table public.practice_log enable row level security;
revoke all on public.question_reviews, public.practice_log from anon;
revoke insert, update, delete on public.question_reviews, public.practice_log from authenticated;
grant select on public.question_reviews, public.practice_log to authenticated;

drop policy if exists "baca ulasan soal sendiri" on public.question_reviews;
create policy "baca ulasan soal sendiri" on public.question_reviews
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "baca log latihan sendiri" on public.practice_log;
create policy "baca log latihan sendiri" on public.practice_log
  for select to authenticated using ((select auth.uid()) = user_id);

-- Jarak ulang per kotak (hari).
create or replace function public.leitner_days(p_box int)
returns int language sql immutable as $$
  select (array[1, 2, 4, 7, 14])[least(greatest(p_box, 0), 4) + 1]
$$;

-- Kuis ditulis ulang: setelah dinilai, soal yang salah masuk antrean latihan.
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

    -- Salah → kotak 0, muncul di latihan hari ini.
    insert into public.question_reviews (user_id, question_id, box, due_at, updated_at)
    select v_uid, q.id, 0, now(), now()
    from public.quiz_questions q
    where q.course_slug = p_slug and (p_answers ->> q.id::text) is distinct from q.answer::text
    on conflict (user_id, question_id) do update set box = 0, due_at = now(), updated_at = now();
  end if;

  return jsonb_build_object(
    'score', v_score, 'total', v_total, 'recorded', v_uid is not null, 'results', v_results
  );
end;
$$;

-- Soal yang jatuh tempo (tanpa kunci), hanya dari kelas yang masih berhak.
create or replace function public.practice_queue(p_limit int default 10)
returns table (id uuid, course_slug text, course_title jsonb, prompt jsonb, options jsonb, box int)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.course_slug, c.title, q.prompt, q.options, r.box
  from public.question_reviews r
  join public.quiz_questions q on q.id = r.question_id
  join public.courses c on c.slug = q.course_slug
  where r.user_id = (select auth.uid()) and r.due_at <= now()
    and public.has_course_access(q.course_slug)
  order by r.due_at, r.box
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.practice_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'due', (select count(*) from public.question_reviews r
            where r.user_id = (select auth.uid()) and r.due_at <= now()),
    'tracked', (select count(*) from public.question_reviews r where r.user_id = (select auth.uid())),
    'next_due', (select min(due_at) from public.question_reviews r
                 where r.user_id = (select auth.uid()) and r.due_at > now())
  );
$$;

-- Jawab satu soal latihan: naik kotak bila benar (kotak 4 + benar = dikuasai), kembali ke 0 bila salah.
create or replace function public.answer_practice(p_question uuid, p_choice int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  r record;
  q record;
  v_correct boolean;
  v_mastered boolean := false;
begin
  select * into r from public.question_reviews where user_id = v_uid and question_id = p_question;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  select * into q from public.quiz_questions where id = p_question;
  if not public.has_course_access(q.course_slug) then
    raise exception 'no_access' using errcode = '42501';
  end if;
  v_correct := p_choice = q.answer;

  if v_correct and r.box >= 4 then
    delete from public.question_reviews where user_id = v_uid and question_id = p_question;
    v_mastered := true;
  elsif v_correct then
    update public.question_reviews
    set box = r.box + 1, due_at = now() + make_interval(days => public.leitner_days(r.box + 1)), updated_at = now()
    where user_id = v_uid and question_id = p_question;
  else
    update public.question_reviews
    set box = 0, due_at = now() + make_interval(days => public.leitner_days(0)), updated_at = now()
    where user_id = v_uid and question_id = p_question;
  end if;

  insert into public.practice_log (user_id, question_id, correct) values (v_uid, p_question, v_correct);

  return jsonb_build_object(
    'correct', v_correct, 'answer', q.answer, 'explanation', q.explanation, 'mastered', v_mastered
  );
end;
$$;

-- ---------------------------------------------------------------
-- 6) Gamifikasi
-- XP: pelajaran selesai 10, tiap jawaban kuis benar 2, latihan benar 3,
--     sertifikat 50, try-out diserahkan 30. Samakan dengan src/lib/gamification.ts.
-- ---------------------------------------------------------------
create or replace function public.xp_table(p_since timestamptz, p_level text)
returns table (user_id uuid, xp bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select e.user_id, sum(e.points)::bigint
  from (
    select lp.user_id, 10 as points
    from public.lesson_progress lp join public.courses c on c.slug = lp.course_slug
    where lp.completed_at >= p_since and (p_level is null or c.level_id = p_level)
    union all
    select qa.user_id, 2 * qa.score
    from public.quiz_attempts qa join public.courses c on c.slug = qa.course_slug
    where qa.created_at >= p_since and (p_level is null or c.level_id = p_level)
    union all
    select pl.user_id, 3
    from public.practice_log pl
    left join public.quiz_questions q on q.id = pl.question_id
    left join public.courses c on c.slug = q.course_slug
    where pl.correct and pl.created_at >= p_since and (p_level is null or c.level_id = p_level)
    union all
    select ce.user_id, 50
    from public.certificates ce left join public.courses c on c.slug = ce.course_slug
    where ce.issued_at >= p_since and (p_level is null or c.level_id = p_level)
    union all
    select ta.user_id, 30
    from public.tryout_attempts ta join public.tryouts t on t.slug = ta.tryout_slug
    where ta.submitted_at >= p_since and (p_level is null or t.level_id = p_level)
  ) e
  group by e.user_id;
$$;
revoke execute on function public.xp_table(timestamptz, text) from public, anon, authenticated;

-- Awal minggu (Senin 00:00 WIB).
create or replace function public.week_start()
returns timestamptz language sql stable as $$
  select (date_trunc('week', now() at time zone 'Asia/Jakarta')) at time zone 'Asia/Jakarta'
$$;

create or replace function public.xp_leaderboard(p_period text default 'week', p_level text default null)
returns table (rank bigint, name text, avatar_path text, xp bigint, is_me boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select rank() over (order by x.xp desc),
         coalesce(nullif(btrim(p.name), ''), '-'), p.avatar_path, x.xp,
         x.user_id = (select auth.uid())
  from public.xp_table(
         case when p_period = 'all' then '-infinity'::timestamptz else public.week_start() end,
         nullif(p_level, '')
       ) x
  join public.profiles p on p.id = x.user_id
  where x.xp > 0 and (p.show_on_leaderboard or x.user_id = (select auth.uid()))
    and (select auth.uid()) is not null
  order by x.xp desc
  limit 50;
$$;

-- Angka untuk XP & lencana milik sendiri.
create or replace function public.my_achievements()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'xp_total', coalesce((select xp from public.xp_table('-infinity', null) where user_id = (select auth.uid())), 0),
    'xp_week', coalesce((select xp from public.xp_table(public.week_start(), null) where user_id = (select auth.uid())), 0),
    'lessons', (select count(*) from public.lesson_progress where user_id = (select auth.uid())),
    'perfect_quizzes', (select count(*) from public.quiz_attempts
                        where user_id = (select auth.uid()) and score = total),
    'certificates', (select count(*) from public.certificates where user_id = (select auth.uid())),
    'tryouts', (select count(*) from public.tryout_attempts
                where user_id = (select auth.uid()) and submitted_at is not null),
    'practice_correct', (select count(*) from public.practice_log
                         where user_id = (select auth.uid()) and correct),
    'active_days', coalesce((
      select jsonb_agg(d order by d) from (
        select distinct (completed_at at time zone 'Asia/Jakarta')::date d from public.lesson_progress
        where user_id = (select auth.uid())
        union
        select distinct (created_at at time zone 'Asia/Jakarta')::date from public.quiz_attempts
        where user_id = (select auth.uid())
        union
        select distinct (created_at at time zone 'Asia/Jakarta')::date from public.practice_log
        where user_id = (select auth.uid())
      ) days
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------
-- 7) Kelas live
-- ---------------------------------------------------------------
create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  level_id text not null references public.levels on update cascade on delete cascade,
  course_slug text references public.courses on update cascade on delete set null,
  title jsonb not null,
  description jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null,
  minutes int not null default 60 check (minutes between 10 and 480),
  host_name text not null default '' check (char_length(host_name) <= 80),
  join_url text not null default '' check (join_url = '' or join_url ~ '^https://'),
  recording_youtube_id text not null default '' check (recording_youtube_id ~ '^[A-Za-z0-9_-]{0,20}$'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists live_sessions_start_idx on public.live_sessions (starts_at);

create or replace function public.can_edit_live(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin()
    or (
      public.my_role() = 'teacher'::public.user_role
      and exists (select 1 from public.live_sessions s where s.id = p_id and s.created_by = (select auth.uid()))
    );
$$;

alter table public.live_sessions enable row level security;
revoke all on public.live_sessions from anon, authenticated;
-- Jadwal publik; link masuk & rekaman lewat fungsi.
grant select (id, level_id, course_slug, title, description, starts_at, minutes, host_name, created_by, created_at)
  on public.live_sessions to anon, authenticated;
grant insert, update, delete on public.live_sessions to authenticated;

drop policy if exists "jadwal live dibaca semua" on public.live_sessions;
create policy "jadwal live dibaca semua" on public.live_sessions
  for select to anon, authenticated using (true);

drop policy if exists "buat live" on public.live_sessions;
create policy "buat live" on public.live_sessions
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (public.my_role() = 'teacher'::public.user_role and created_by = (select auth.uid()))
  );

drop policy if exists "ubah live" on public.live_sessions;
create policy "ubah live" on public.live_sessions
  for update to authenticated
  using (public.can_edit_live(id))
  with check (public.is_super_admin() or created_by = (select auth.uid()));

drop policy if exists "hapus live" on public.live_sessions;
create policy "hapus live" on public.live_sessions
  for delete to authenticated using (public.can_edit_live(id));

-- Link masuk (15 menit sebelum mulai s.d. selesai) dan rekaman, hanya bila berhak.
create or replace function public.live_access(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when s.id is null then null
    when not (public.has_level_access(s.level_id) or public.can_edit_live(s.id)) then jsonb_build_object('access', false)
    else jsonb_build_object(
      'access', true,
      'join_url', case
        when public.can_edit_live(s.id)
          or now() between s.starts_at - interval '15 minutes' and s.starts_at + make_interval(mins => s.minutes)
        then nullif(s.join_url, '') end,
      'recording_youtube_id', nullif(s.recording_youtube_id, '')
    )
  end
  from (select 1) one left join public.live_sessions s on s.id = p_id;
$$;

-- CMS: data lengkap sesi milik sendiri (super admin: semua).
create or replace function public.admin_live_sessions()
returns setof public.live_sessions
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.live_sessions s
  where public.is_super_admin() or s.created_by = (select auth.uid())
  order by s.starts_at desc;
$$;

-- Tambahkan rekaman sebagai pelajaran baru di akhir kelas terkait.
create or replace function public.live_to_lesson(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  v_id text;
  v_pos int;
  n int := 1;
begin
  select * into s from public.live_sessions where id = p_id;
  if not found or not public.can_edit_live(p_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if s.course_slug is null or s.recording_youtube_id = '' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if not public.can_edit_course(s.course_slug) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  loop
    v_id := 'live-' || n;
    exit when not exists (select 1 from public.lessons where course_slug = s.course_slug and id = v_id);
    n := n + 1;
  end loop;
  select coalesce(max(position), -1) + 1 into v_pos from public.lessons where course_slug = s.course_slug;
  insert into public.lessons (course_slug, id, title, minutes, youtube_id, notes, free_preview, position)
  values (s.course_slug, v_id, s.title, s.minutes, s.recording_youtube_id, s.description, false, v_pos);
  return v_id;
end;
$$;

-- ---------------------------------------------------------------
-- 8) Mode sekolah: RLS, tugas, laporan
-- ---------------------------------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  instructions text not null default '' check (char_length(instructions) <= 2000),
  kind text not null check (kind in ('lesson', 'quiz', 'course')),
  course_slug text not null,
  lesson_id text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (course_slug) references public.courses (slug) on update cascade on delete cascade,
  check ((kind = 'lesson') = (lesson_id is not null))
);
create index if not exists assignments_classroom_idx on public.assignments (classroom_id, due_at);

create or replace function public.owns_classroom(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin()
    or exists (select 1 from public.classrooms c where c.id = p_id and c.teacher_id = (select auth.uid()));
$$;

create or replace function public.in_classroom(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.classroom_members m where m.classroom_id = p_id and m.student_id = (select auth.uid())
  );
$$;

alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.assignments enable row level security;
revoke all on public.classrooms, public.classroom_members, public.assignments from anon;
grant select, insert, update, delete on public.classrooms, public.assignments to authenticated;
grant select, delete on public.classroom_members to authenticated;
revoke insert, update on public.classroom_members from authenticated;
-- Guru tidak boleh memberi akses berbayar sendiri: kolom sponsor hanya lewat set_classroom_sponsor.
revoke update on public.classrooms from authenticated;
grant update (name, archived) on public.classrooms to authenticated;

drop policy if exists "kelas sekolah dibaca" on public.classrooms;
create policy "kelas sekolah dibaca" on public.classrooms
  for select to authenticated
  using (teacher_id = (select auth.uid()) or public.is_super_admin() or public.in_classroom(id));
drop policy if exists "kelas sekolah dibuat guru" on public.classrooms;
create policy "kelas sekolah dibuat guru" on public.classrooms
  for insert to authenticated
  with check (
    teacher_id = (select auth.uid())
    and public.my_role() in ('teacher'::public.user_role, 'super_admin'::public.user_role)
    and sponsor_level_id is null
  );
drop policy if exists "kelas sekolah diubah pemilik" on public.classrooms;
create policy "kelas sekolah diubah pemilik" on public.classrooms
  for update to authenticated
  using (teacher_id = (select auth.uid()) or public.is_super_admin())
  with check (teacher_id = (select auth.uid()) or public.is_super_admin());
drop policy if exists "kelas sekolah dihapus pemilik" on public.classrooms;
create policy "kelas sekolah dihapus pemilik" on public.classrooms
  for delete to authenticated using (public.owns_classroom(id));

drop policy if exists "anggota dibaca" on public.classroom_members;
create policy "anggota dibaca" on public.classroom_members
  for select to authenticated using (student_id = (select auth.uid()) or public.owns_classroom(classroom_id));
drop policy if exists "anggota keluar / dikeluarkan" on public.classroom_members;
create policy "anggota keluar / dikeluarkan" on public.classroom_members
  for delete to authenticated using (student_id = (select auth.uid()) or public.owns_classroom(classroom_id));

drop policy if exists "tugas dibaca" on public.assignments;
create policy "tugas dibaca" on public.assignments
  for select to authenticated using (public.owns_classroom(classroom_id) or public.in_classroom(classroom_id));
drop policy if exists "tugas dikelola" on public.assignments;
create policy "tugas dikelola" on public.assignments
  for all to authenticated
  using (public.owns_classroom(classroom_id)) with check (public.owns_classroom(classroom_id));

create or replace function public.join_classroom(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  c record;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  select * into c from public.classrooms where join_code = upper(btrim(p_code)) and not archived;
  if not found then
    raise exception 'invalid_code' using errcode = 'P0002';
  end if;
  if c.teacher_id = v_uid then
    raise exception 'own_class' using errcode = 'P0001';
  end if;
  insert into public.classroom_members (classroom_id, student_id) values (c.id, v_uid) on conflict do nothing;
  return jsonb_build_object('id', c.id, 'name', c.name);
end;
$$;

create or replace function public.set_classroom_sponsor(p_id uuid, p_level text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.classrooms set sponsor_level_id = nullif(p_level, '') where id = p_id;
end;
$$;

-- Status satu tugas untuk satu siswa: selesai?, nilai (persen), progres.
create or replace function public.assignment_status(p_assignment uuid, p_student uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case a.kind
    when 'lesson' then jsonb_build_object('done', exists (
      select 1 from public.lesson_progress lp
      where lp.user_id = p_student and lp.course_slug = a.course_slug and lp.lesson_id = a.lesson_id))
    when 'quiz' then (
      select jsonb_build_object('done', count(*) > 0,
        'percent', round(max(q.score::numeric * 100 / q.total))::int)
      from public.quiz_attempts q where q.user_id = p_student and q.course_slug = a.course_slug)
    else (
      select jsonb_build_object('done', x.done >= x.total and x.total > 0, 'done_count', x.done, 'total', x.total)
      from (select
        (select count(*) from public.lesson_progress lp
         join public.lessons l on l.course_slug = lp.course_slug and l.id = lp.lesson_id
         where lp.user_id = p_student and lp.course_slug = a.course_slug) done,
        (select count(*) from public.lessons l where l.course_slug = a.course_slug) total) x)
  end
  from public.assignments a where a.id = p_assignment;
$$;
revoke execute on function public.assignment_status(uuid, uuid) from public, anon, authenticated;

-- Tugas milik siswa dari semua kelas sekolahnya.
create or replace function public.my_assignments()
returns table (
  id uuid, classroom_name text, title text, instructions text, kind text,
  course_slug text, course_title jsonb, lesson_id text, due_at timestamptz, status jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, c.name, a.title, a.instructions, a.kind, a.course_slug, co.title, a.lesson_id, a.due_at,
         public.assignment_status(a.id, (select auth.uid()))
  from public.assignments a
  join public.classrooms c on c.id = a.classroom_id and not c.archived
  join public.classroom_members m on m.classroom_id = c.id and m.student_id = (select auth.uid())
  join public.courses co on co.slug = a.course_slug
  order by a.due_at nulls last, a.created_at desc;
$$;

-- Laporan guru: setiap siswa × setiap tugas.
create or replace function public.classroom_report(p_id uuid)
returns table (student_id uuid, name text, assignment_id uuid, status jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select m.student_id, coalesce(nullif(btrim(p.name), ''), '-'), a.id,
         public.assignment_status(a.id, m.student_id)
  from public.classroom_members m
  left join public.profiles p on p.id = m.student_id
  cross join public.assignments a
  where m.classroom_id = p_id and a.classroom_id = p_id and public.owns_classroom(p_id)
  order by p.name, a.due_at nulls last;
$$;

-- Daftar anggota dengan nama (untuk guru).
create or replace function public.classroom_roster(p_id uuid)
returns table (student_id uuid, name text, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.student_id, coalesce(nullif(btrim(p.name), ''), '-'), m.joined_at
  from public.classroom_members m left join public.profiles p on p.id = m.student_id
  where m.classroom_id = p_id and public.owns_classroom(p_id)
  order by p.name;
$$;

-- ---------------------------------------------------------------
-- 9) Push notification (PWA)
-- ---------------------------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint text primary key check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  user_id uuid not null references auth.users on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

drop policy if exists "langganan push sendiri" on public.push_subscriptions;
create policy "langganan push sendiri" on public.push_subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Target pengingat harian: pengguna yang belum belajar hari ini (WIB). Hanya service_role.
create or replace function public.push_reminder_targets()
returns table (endpoint text, p256dh text, auth text, streak_active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.endpoint, s.p256dh, s.auth,
    exists (
      select 1 from public.lesson_progress lp where lp.user_id = s.user_id
        and (lp.completed_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date - 1
    )
  from public.push_subscriptions s
  where not exists (
      select 1 from public.lesson_progress lp where lp.user_id = s.user_id
        and (lp.completed_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date)
    and not exists (
      select 1 from public.quiz_attempts q where q.user_id = s.user_id
        and (q.created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date)
    and not exists (
      select 1 from public.practice_log pl where pl.user_id = s.user_id
        and (pl.created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date);
$$;

-- ---------------------------------------------------------------
-- 10) Hak eksekusi fungsi
-- ---------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.has_level_access(text)',
    'public.tryout_leaderboard(text)',
    'public.live_access(uuid)',
    'public.leitner_days(int)',
    'public.tryout_grace_seconds()',
    'public.week_start()'
  ] loop
    execute format('revoke execute on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;

  foreach f in array array[
    'public.can_edit_tryout(text)',
    'public.admin_tryout_content(text)',
    'public.save_tryout_content(text, jsonb)',
    'public.tryout_paper(text)',
    'public.start_tryout(text)',
    'public.save_tryout_answers(text, jsonb)',
    'public.submit_tryout(text, jsonb)',
    'public.tryout_result(text)',
    'public.ai_take_quota()',
    'public.quiz_question_for_ai(uuid)',
    'public.create_parent_code()',
    'public.redeem_parent_code(text)',
    'public.parent_children()',
    'public.my_parents()',
    'public.practice_queue(int)',
    'public.practice_summary()',
    'public.answer_practice(uuid, int)',
    'public.xp_leaderboard(text, text)',
    'public.my_achievements()',
    'public.can_edit_live(uuid)',
    'public.admin_live_sessions()',
    'public.live_to_lesson(uuid)',
    'public.owns_classroom(uuid)',
    'public.in_classroom(uuid)',
    'public.join_classroom(text)',
    'public.set_classroom_sponsor(uuid, text)',
    'public.my_assignments()',
    'public.classroom_report(uuid)',
    'public.classroom_roster(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;

  -- tryout_paper hanya dipanggil dari start_tryout (bukan langsung oleh klien).
  execute 'revoke execute on function public.tryout_paper(text) from authenticated';

  foreach f in array array[
    'public.weekly_parent_digest()',
    'public.push_reminder_targets()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end
$$;
