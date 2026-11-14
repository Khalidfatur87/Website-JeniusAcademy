-- CMS + role pengguna (siswa / guru / super admin)
-- - Role di profiles; hanya super admin yang boleh mengubahnya (lewat set_user_role).
-- - Konten (jenjang, kelas, pelajaran, soal kuis) pindah dari src/config ke database.
-- - Guru mengelola kelas miliknya sendiri; super admin mengelola semuanya.
-- - Super admin memoderasi ulasan.
-- Idempoten (aman dijalankan ulang). Jangan ubah file ini setelah diterapkan.

-- ---------------------------------------------------------------
-- 1) Role
-- ---------------------------------------------------------------
do $$
begin
  create type public.user_role as enum ('student', 'teacher', 'super_admin');
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists role public.user_role not null default 'student';

-- Sebelumnya pengguna boleh menulis seluruh baris profilnya ("for all").
-- Dengan adanya kolom role, itu berarti siswa bisa mengangkat dirinya sendiri
-- menjadi super admin. Sekarang: baca profil sendiri, ubah HANYA kolom name.
drop policy if exists "profil milik sendiri" on public.profiles;

drop policy if exists "baca profil sendiri" on public.profiles;
create policy "baca profil sendiri" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "ubah nama sendiri" on public.profiles;
create policy "ubah nama sendiri" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;

-- Fungsi bantu. SECURITY DEFINER supaya bisa dipakai di dalam policy tanpa
-- terhalang RLS profiles; search_path kosong mencegah pembajakan nama objek.
create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = (select auth.uid())),
    'student'::public.user_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.my_role() = 'super_admin'::public.user_role;
$$;

-- ---------------------------------------------------------------
-- 2) Tabel konten
-- Teks multibahasa disimpan sebagai jsonb {"id": "...", "en": "..."}.
-- ---------------------------------------------------------------
create table if not exists public.levels (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 30),
  name jsonb not null,
  tagline jsonb not null default '{}'::jsonb,
  price int not null default 0 check (price >= 0),
  original_price int check (original_price is null or original_price >= 0),
  featured boolean not null default false,
  subjects jsonb not null default '[]'::jsonb check (jsonb_typeof(subjects) = 'array'),
  color text not null default '#0085FF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  -- slug dipakai di URL dan di lesson_progress / quiz_attempts: jangan diubah.
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  level_id text not null references public.levels on update cascade on delete restrict,
  title jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  -- Pemilik kelas (akun guru). null = dikelola super admin.
  teacher_id uuid references public.profiles (id) on delete set null,
  -- Nama pengajar yang tampil di situs.
  teacher_name text not null default '' check (char_length(teacher_name) <= 80),
  published boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists courses_teacher_idx on public.courses (teacher_id);

create table if not exists public.lessons (
  course_slug text not null references public.courses on update cascade on delete cascade,
  id text not null check (id ~ '^[a-z0-9-]{1,40}$'),
  title jsonb not null,
  minutes int not null default 10 check (minutes between 1 and 600),
  youtube_id text not null default '' check (youtube_id ~ '^[A-Za-z0-9_-]{0,20}$'),
  position int not null default 0,
  primary key (course_slug, id)
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null references public.courses on update cascade on delete cascade,
  position int not null default 0,
  prompt jsonb not null,
  options jsonb not null check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6
  ),
  answer int not null check (answer >= 0),
  explanation jsonb not null default '{}'::jsonb,
  check (answer < jsonb_array_length(options))
);

create index if not exists quiz_questions_course_idx
  on public.quiz_questions (course_slug, position);

-- Boleh mengedit kelas: super admin, atau guru pemilik kelas.
create or replace function public.can_edit_course(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin()
    or (
      public.my_role() = 'teacher'::public.user_role
      and exists (
        select 1 from public.courses c
        where c.slug = p_slug and c.teacher_id = (select auth.uid())
      )
    );
$$;

-- Boleh melihat isi kelas: kelas sudah terbit, atau boleh mengeditnya.
create or replace function public.can_view_course(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.courses c where c.slug = p_slug and c.published)
    or public.can_edit_course(p_slug);
$$;

-- ---------------------------------------------------------------
-- 3) RLS konten
-- ---------------------------------------------------------------
alter table public.levels enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.quiz_questions enable row level security;

grant select on public.levels, public.courses, public.lessons, public.quiz_questions
  to anon, authenticated;
grant insert, update, delete on public.levels, public.courses, public.lessons, public.quiz_questions
  to authenticated;

-- Jenjang: dibaca semua orang, dikelola super admin.
drop policy if exists "jenjang dibaca semua" on public.levels;
create policy "jenjang dibaca semua" on public.levels
  for select to anon, authenticated
  using (true);

drop policy if exists "super admin kelola jenjang" on public.levels;
create policy "super admin kelola jenjang" on public.levels
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Kelas
drop policy if exists "kelas terbit atau milik sendiri" on public.courses;
create policy "kelas terbit atau milik sendiri" on public.courses
  for select to anon, authenticated
  using (published or public.can_edit_course(slug));

-- Guru hanya bisa membuat / menyimpan kelas atas namanya sendiri.
drop policy if exists "buat kelas" on public.courses;
create policy "buat kelas" on public.courses
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (public.my_role() = 'teacher'::public.user_role and teacher_id = (select auth.uid()))
  );

drop policy if exists "ubah kelas" on public.courses;
create policy "ubah kelas" on public.courses
  for update to authenticated
  using (public.can_edit_course(slug))
  with check (
    public.is_super_admin()
    or (public.my_role() = 'teacher'::public.user_role and teacher_id = (select auth.uid()))
  );

drop policy if exists "hapus kelas" on public.courses;
create policy "hapus kelas" on public.courses
  for delete to authenticated
  using (public.can_edit_course(slug));

-- Pelajaran
drop policy if exists "pelajaran dibaca" on public.lessons;
create policy "pelajaran dibaca" on public.lessons
  for select to anon, authenticated
  using (public.can_view_course(course_slug));

drop policy if exists "pelajaran dikelola" on public.lessons;
create policy "pelajaran dikelola" on public.lessons
  for all to authenticated
  using (public.can_edit_course(course_slug))
  with check (public.can_edit_course(course_slug));

-- Soal kuis
drop policy if exists "soal dibaca" on public.quiz_questions;
create policy "soal dibaca" on public.quiz_questions
  for select to anon, authenticated
  using (public.can_view_course(course_slug));

drop policy if exists "soal dikelola" on public.quiz_questions;
create policy "soal dikelola" on public.quiz_questions
  for all to authenticated
  using (public.can_edit_course(course_slug))
  with check (public.can_edit_course(course_slug));

-- ---------------------------------------------------------------
-- 4) Ulasan: jenjang mengikuti tabel levels + moderasi super admin
-- ---------------------------------------------------------------
alter table public.reviews drop constraint if exists reviews_level_id_check;

grant select, insert, update, delete on public.reviews to authenticated;

drop policy if exists "super admin kelola ulasan" on public.reviews;
create policy "super admin kelola ulasan" on public.reviews
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------
-- 5) Fungsi admin (RPC)
-- ---------------------------------------------------------------

-- Daftar pengguna + email (email ada di auth.users, tidak bisa dibaca langsung).
-- Selain super admin: hasil kosong.
create or replace function public.admin_list_users()
returns table (id uuid, name text, email text, role public.user_role, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(p.name, ''), coalesce(u.email, '')::text, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_super_admin()
  order by p.created_at desc;
$$;

-- Mengubah role. Super admin tidak bisa menurunkan dirinya sendiri, sehingga
-- selalu tersisa minimal satu super admin.
create or replace function public.set_user_role(target uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if target = (select auth.uid()) and new_role <> 'super_admin'::public.user_role then
    raise exception 'cannot_demote_self' using errcode = 'P0001';
  end if;
  update public.profiles set role = new_role where id = target;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end;
$$;

-- Laporan siswa satu kelas (progres + nilai kuis), untuk guru pemilik / super admin.
-- Lewat RPC, bukan policy SELECT, supaya kueri progres milik guru sendiri
-- (yang mengandalkan RLS) tidak ikut memuat data siswa.
create or replace function public.course_student_report(p_slug text)
returns table (
  user_id uuid,
  name text,
  lessons_done int,
  attempts int,
  best_score int,
  best_total int,
  last_activity timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with prog as (
    select lp.user_id, count(*)::int as n, max(lp.completed_at) as last_at
    from public.lesson_progress lp
    join public.lessons l on l.course_slug = lp.course_slug and l.id = lp.lesson_id
    where lp.course_slug = p_slug
    group by lp.user_id
  ),
  qa as (
    select q.user_id, count(*)::int as n, max(q.created_at) as last_at
    from public.quiz_attempts q
    where q.course_slug = p_slug
    group by q.user_id
  ),
  best as (
    select distinct on (q.user_id) q.user_id, q.score, q.total
    from public.quiz_attempts q
    where q.course_slug = p_slug
    order by q.user_id, (q.score::numeric / q.total) desc, q.created_at desc
  ),
  ids as (
    select prog.user_id from prog
    union
    select qa.user_id from qa
  )
  select
    ids.user_id,
    coalesce(p.name, ''),
    coalesce(prog.n, 0),
    coalesce(qa.n, 0),
    best.score,
    best.total,
    greatest(prog.last_at, qa.last_at)
  from ids
  left join prog on prog.user_id = ids.user_id
  left join qa on qa.user_id = ids.user_id
  left join best on best.user_id = ids.user_id
  left join public.profiles p on p.id = ids.user_id
  where public.can_edit_course(p_slug)
  order by greatest(prog.last_at, qa.last_at) desc nulls last;
$$;

revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.set_user_role(uuid, public.user_role) from public, anon;
revoke execute on function public.course_student_report(text) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.course_student_report(text) to authenticated;

-- ---------------------------------------------------------------
-- 6) Konten awal (dipindahkan dari src/config/courses.ts & quizzes.ts)
-- Semua isi adalah CONTOH (placeholder); ganti lewat CMS.
-- ---------------------------------------------------------------
insert into public.levels (id, name, tagline, price, original_price, featured, subjects, color, position) values
  ('sd', '{"id":"Sekolah Dasar","en":"Elementary School"}'::jsonb, '{"id":"Fondasi belajar yang menyenangkan","en":"A joyful foundation for learning"}'::jsonb, 0, null, false, '[{"id":"Matematika","en":"Mathematics"},{"id":"Bahasa Indonesia","en":"Indonesian"},{"id":"IPA","en":"Natural Science"},{"id":"IPS","en":"Social Science"}]'::jsonb, '#22C55E', 0),
  ('smp', '{"id":"Sekolah Menengah Pertama","en":"Junior High School"}'::jsonb, '{"id":"Perkuat konsep sebelum melangkah lebih jauh","en":"Strengthen concepts before moving on"}'::jsonb, 0, null, false, '[{"id":"Matematika","en":"Mathematics"},{"id":"Bahasa Indonesia","en":"Indonesian"},{"id":"IPA","en":"Natural Science"},{"id":"IPS","en":"Social Science"},{"id":"Bahasa Inggris","en":"English"}]'::jsonb, '#0085FF', 1),
  ('sma', '{"id":"Sekolah Menengah Atas","en":"Senior High School"}'::jsonb, '{"id":"Siap menghadapi ujian dan kuliah","en":"Ready for exams and university"}'::jsonb, 499000, null, false, '[{"id":"Matematika","en":"Mathematics"},{"id":"Fisika","en":"Physics"},{"id":"Kimia","en":"Chemistry"},{"id":"Biologi","en":"Biology"},{"id":"Bahasa Inggris","en":"English"}]'::jsonb, '#8B5CF6', 2),
  ('utbk', '{"id":"Persiapan UTBK","en":"University Entrance (UTBK)"}'::jsonb, '{"id":"Strategi dan latihan untuk lolos PTN impian","en":"Strategy and practice to get into your dream university"}'::jsonb, 249000, 499000, true, '[{"id":"Penalaran Umum","en":"General Reasoning"},{"id":"Pengetahuan Kuantitatif","en":"Quantitative Knowledge"},{"id":"Literasi Bahasa","en":"Language Literacy"},{"id":"Saintek & Soshum","en":"Science & Humanities"}]'::jsonb, '#F97316', 3)
on conflict (id) do nothing;

insert into public.courses (slug, level_id, title, summary, teacher_name, published, position) values
  ('sd-pecahan', 'sd', '{"id":"Perkalian Pecahan","en":"Multiplying Fractions"}'::jsonb, '{"id":"Memahami pecahan lewat contoh sehari-hari dan latihan bertahap.","en":"Understand fractions through everyday examples and gradual practice."}'::jsonb, 'Pengajar Contoh A', true, 0),
  ('smp-aljabar', 'smp', '{"id":"Dasar Aljabar","en":"Algebra Basics"}'::jsonb, '{"id":"Dari variabel hingga persamaan linear, dijelaskan langkah demi langkah.","en":"From variables to linear equations, explained step by step."}'::jsonb, 'Pengajar Contoh B', true, 1),
  ('sma-fisika', 'sma', '{"id":"Fisika Dasar","en":"Foundations of Physics"}'::jsonb, '{"id":"Gerak, gaya, dan energi dengan visualisasi yang mudah dipahami.","en":"Motion, force, and energy with easy-to-follow visuals."}'::jsonb, 'Pengajar Contoh C', true, 2),
  ('sma-trigonometri', 'sma', '{"id":"Trigonometri","en":"Trigonometry"}'::jsonb, '{"id":"Sinus, cosinus, tangen, dan penerapannya pada soal ujian.","en":"Sine, cosine, tangent and how they appear in exam questions."}'::jsonb, 'Pengajar Contoh C', true, 3),
  ('utbk-saintek', 'utbk', '{"id":"Strategi UTBK Saintek","en":"UTBK Science Strategy"}'::jsonb, '{"id":"Ringkasan materi, trik pengerjaan, dan latihan soal bertema Saintek.","en":"Concept recaps, solving techniques and Science-track practice sets."}'::jsonb, 'Pengajar Contoh D', true, 4),
  ('utbk-soshum', 'utbk', '{"id":"Strategi UTBK Soshum","en":"UTBK Humanities Strategy"}'::jsonb, '{"id":"Pahami pola soal Soshum dan kelola waktu pengerjaan dengan efektif.","en":"Learn Humanities question patterns and manage your exam time well."}'::jsonb, 'Pengajar Contoh D', true, 5)
on conflict (slug) do nothing;

insert into public.lessons (course_slug, id, title, minutes, youtube_id, position) values
  ('sd-pecahan', 'l1', '{"id":"Operasi hitung bilangan bulat","en":"Integer arithmetic"}'::jsonb, 12, 'y1BZBU5YXcM', 0),
  ('sd-pecahan', 'l2', '{"id":"Pengenalan pecahan","en":"Introducing fractions"}'::jsonb, 15, 'y1BZBU5YXcM', 1),
  ('sd-pecahan', 'l3', '{"id":"Mengalikan pecahan","en":"Multiplying fractions"}'::jsonb, 18, 'y1BZBU5YXcM', 2),
  ('sd-pecahan', 'l4', '{"id":"Latihan soal cerita","en":"Word problem practice"}'::jsonb, 20, 'y1BZBU5YXcM', 3),
  ('smp-aljabar', 'l1', '{"id":"Bilangan pecahan","en":"Fractional numbers"}'::jsonb, 14, 'y1BZBU5YXcM', 0),
  ('smp-aljabar', 'l2', '{"id":"Operasi bentuk aljabar","en":"Algebraic operations"}'::jsonb, 18, 'y1BZBU5YXcM', 1),
  ('smp-aljabar', 'l3', '{"id":"Persamaan linear","en":"Linear equations"}'::jsonb, 20, 'y1BZBU5YXcM', 2),
  ('smp-aljabar', 'l4', '{"id":"Pertidaksamaan linear","en":"Linear inequalities"}'::jsonb, 20, 'y1BZBU5YXcM', 3),
  ('sma-fisika', 'l1', '{"id":"Besaran dan satuan","en":"Quantities and units"}'::jsonb, 16, 'y1BZBU5YXcM', 0),
  ('sma-fisika', 'l2', '{"id":"Gerak lurus","en":"Linear motion"}'::jsonb, 22, 'y1BZBU5YXcM', 1),
  ('sma-fisika', 'l3', '{"id":"Hukum Newton","en":"Newton''s laws"}'::jsonb, 24, 'y1BZBU5YXcM', 2),
  ('sma-fisika', 'l4', '{"id":"Usaha dan energi","en":"Work and energy"}'::jsonb, 22, 'y1BZBU5YXcM', 3),
  ('sma-fisika', 'l5', '{"id":"Latihan campuran","en":"Mixed practice"}'::jsonb, 30, 'y1BZBU5YXcM', 4),
  ('sma-trigonometri', 'l1', '{"id":"Perbandingan trigonometri","en":"Trigonometric ratios"}'::jsonb, 18, 'y1BZBU5YXcM', 0),
  ('sma-trigonometri', 'l2', '{"id":"Sudut istimewa","en":"Special angles"}'::jsonb, 16, 'y1BZBU5YXcM', 1),
  ('sma-trigonometri', 'l3', '{"id":"Identitas trigonometri","en":"Trigonometric identities"}'::jsonb, 22, 'y1BZBU5YXcM', 2),
  ('utbk-saintek', 'l1', '{"id":"Peta materi Saintek","en":"Science-track roadmap"}'::jsonb, 25, 'y1BZBU5YXcM', 0),
  ('utbk-saintek', 'l2', '{"id":"Penalaran kuantitatif","en":"Quantitative reasoning"}'::jsonb, 35, 'y1BZBU5YXcM', 1),
  ('utbk-soshum', 'l1', '{"id":"Peta materi Soshum","en":"Humanities-track roadmap"}'::jsonb, 25, 'y1BZBU5YXcM', 0),
  ('utbk-soshum', 'l2', '{"id":"Literasi dan penalaran","en":"Literacy and reasoning"}'::jsonb, 30, 'y1BZBU5YXcM', 1)
on conflict (course_slug, id) do nothing;

insert into public.quiz_questions (course_slug, position, prompt, options, answer, explanation)
select v.* from (values
  ('sd-pecahan', 0, '{"id":"1/2 × 1/3 = …","en":"1/2 × 1/3 = …"}'::jsonb, '[{"id":"1/6","en":"1/6"},{"id":"2/5","en":"2/5"},{"id":"1/5","en":"1/5"},{"id":"2/3","en":"2/3"}]'::jsonb, 0, '{"id":"Kalikan pembilang dengan pembilang dan penyebut dengan penyebut: (1×1)/(2×3) = 1/6.","en":"Multiply numerators together and denominators together: (1×1)/(2×3) = 1/6."}'::jsonb),
  ('sd-pecahan', 1, '{"id":"2/3 × 3/4 = …","en":"2/3 × 3/4 = …"}'::jsonb, '[{"id":"5/7","en":"5/7"},{"id":"1/4","en":"1/4"},{"id":"1/2","en":"1/2"},{"id":"6/7","en":"6/7"}]'::jsonb, 2, '{"id":"(2×3)/(3×4) = 6/12, disederhanakan menjadi 1/2.","en":"(2×3)/(3×4) = 6/12, which simplifies to 1/2."}'::jsonb),
  ('sd-pecahan', 2, '{"id":"3 × 2/5 = …","en":"3 × 2/5 = …"}'::jsonb, '[{"id":"6/15","en":"6/15"},{"id":"6/5","en":"6/5"},{"id":"5/6","en":"5/6"},{"id":"2/15","en":"2/15"}]'::jsonb, 1, '{"id":"Tulis 3 sebagai 3/1. Maka 3/1 × 2/5 = 6/5 (atau 1 1/5).","en":"Write 3 as 3/1. Then 3/1 × 2/5 = 6/5 (or 1 1/5)."}'::jsonb),
  ('sd-pecahan', 3, '{"id":"Ibu punya 3/4 kg gula. Sepertiga bagian dipakai untuk membuat kue. Berapa kg gula yang dipakai?","en":"Mom has 3/4 kg of sugar. One third of it is used to bake a cake. How many kg of sugar are used?"}'::jsonb, '[{"id":"1/4 kg","en":"1/4 kg"},{"id":"4/7 kg","en":"4/7 kg"},{"id":"1/12 kg","en":"1/12 kg"},{"id":"9/4 kg","en":"9/4 kg"}]'::jsonb, 0, '{"id":"1/3 × 3/4 = 3/12 = 1/4 kg.","en":"1/3 × 3/4 = 3/12 = 1/4 kg."}'::jsonb)
) as v(course_slug, position, prompt, options, answer, explanation)
where not exists (select 1 from public.quiz_questions w where w.course_slug = 'sd-pecahan');

insert into public.quiz_questions (course_slug, position, prompt, options, answer, explanation)
select v.* from (values
  ('smp-aljabar', 0, '{"id":"Sederhanakan / Simplify: 3x + 5x − 2x","en":"Sederhanakan / Simplify: 3x + 5x − 2x"}'::jsonb, '[{"id":"10x","en":"10x"},{"id":"6x","en":"6x"},{"id":"8x","en":"8x"},{"id":"6","en":"6"}]'::jsonb, 1, '{"id":"Suku sejenis dijumlahkan: (3 + 5 − 2)x = 6x.","en":"Combine like terms: (3 + 5 − 2)x = 6x."}'::jsonb),
  ('smp-aljabar', 1, '{"id":"Nilai x yang memenuhi 2x + 6 = 14 adalah …","en":"The value of x that satisfies 2x + 6 = 14 is …"}'::jsonb, '[{"id":"5","en":"5"},{"id":"10","en":"10"},{"id":"4","en":"4"},{"id":"3","en":"3"}]'::jsonb, 2, '{"id":"2x = 14 − 6 = 8, sehingga x = 4.","en":"2x = 14 − 6 = 8, so x = 4."}'::jsonb),
  ('smp-aljabar', 2, '{"id":"Penyelesaian pertidaksamaan 3x > 12 adalah …","en":"The solution of the inequality 3x > 12 is …"}'::jsonb, '[{"id":"x > 4","en":"x > 4"},{"id":"x < 4","en":"x < 4"},{"id":"x > 9","en":"x > 9"},{"id":"x > 15","en":"x > 15"}]'::jsonb, 0, '{"id":"Bagi kedua ruas dengan 3 (positif, tanda tetap): x > 4.","en":"Divide both sides by 3 (positive, sign stays): x > 4."}'::jsonb),
  ('smp-aljabar', 3, '{"id":"2(x + 3) = …","en":"2(x + 3) = …"}'::jsonb, '[{"id":"2x + 3","en":"2x + 3"},{"id":"x + 6","en":"x + 6"},{"id":"2x + 6","en":"2x + 6"},{"id":"2x + 5","en":"2x + 5"}]'::jsonb, 2, '{"id":"Sifat distributif: 2·x + 2·3 = 2x + 6.","en":"Distributive property: 2·x + 2·3 = 2x + 6."}'::jsonb)
) as v(course_slug, position, prompt, options, answer, explanation)
where not exists (select 1 from public.quiz_questions w where w.course_slug = 'smp-aljabar');

insert into public.quiz_questions (course_slug, position, prompt, options, answer, explanation)
select v.* from (values
  ('sma-fisika', 0, '{"id":"Satuan SI untuk gaya adalah …","en":"The SI unit of force is the …"}'::jsonb, '[{"id":"Joule","en":"Joule"},{"id":"Watt","en":"Watt"},{"id":"Newton","en":"Newton"},{"id":"Pascal","en":"Pascal"}]'::jsonb, 2, '{"id":"Gaya diukur dalam newton (N), 1 N = 1 kg·m/s².","en":"Force is measured in newtons (N), 1 N = 1 kg·m/s²."}'::jsonb),
  ('sma-fisika', 1, '{"id":"Mobil bergerak lurus beraturan dengan kecepatan 20 m/s selama 5 s. Jarak yang ditempuh …","en":"A car moves at a constant 20 m/s for 5 s. The distance travelled is …"}'::jsonb, '[{"id":"4 m","en":"4 m"},{"id":"25 m","en":"25 m"},{"id":"100 m","en":"100 m"},{"id":"15 m","en":"15 m"}]'::jsonb, 2, '{"id":"s = v × t = 20 × 5 = 100 m.","en":"s = v × t = 20 × 5 = 100 m."}'::jsonb),
  ('sma-fisika', 2, '{"id":"Benda bermassa 2 kg mengalami percepatan 3 m/s². Gaya yang bekerja pada benda …","en":"A 2 kg object accelerates at 3 m/s². The force acting on it is …"}'::jsonb, '[{"id":"6 N","en":"6 N"},{"id":"5 N","en":"5 N"},{"id":"1,5 N","en":"1.5 N"},{"id":"9 N","en":"9 N"}]'::jsonb, 0, '{"id":"Hukum II Newton: F = m × a = 2 × 3 = 6 N.","en":"Newton''s second law: F = m × a = 2 × 3 = 6 N."}'::jsonb),
  ('sma-fisika', 3, '{"id":"Gaya 10 N memindahkan benda sejauh 3 m searah gaya. Usaha yang dilakukan …","en":"A 10 N force moves an object 3 m in the direction of the force. The work done is …"}'::jsonb, '[{"id":"13 J","en":"13 J"},{"id":"30 J","en":"30 J"},{"id":"3,3 J","en":"3.3 J"},{"id":"7 J","en":"7 J"}]'::jsonb, 1, '{"id":"W = F × s = 10 × 3 = 30 J.","en":"W = F × s = 10 × 3 = 30 J."}'::jsonb)
) as v(course_slug, position, prompt, options, answer, explanation)
where not exists (select 1 from public.quiz_questions w where w.course_slug = 'sma-fisika');

insert into public.quiz_questions (course_slug, position, prompt, options, answer, explanation)
select v.* from (values
  ('sma-trigonometri', 0, '{"id":"sin 30° = …","en":"sin 30° = …"}'::jsonb, '[{"id":"1/2","en":"1/2"},{"id":"½√3","en":"½√3"},{"id":"1","en":"1"},{"id":"½√2","en":"½√2"}]'::jsonb, 0, '{"id":"Sudut istimewa: sin 30° = 1/2.","en":"Special angle: sin 30° = 1/2."}'::jsonb),
  ('sma-trigonometri', 1, '{"id":"tan 45° = …","en":"tan 45° = …"}'::jsonb, '[{"id":"0","en":"0"},{"id":"√3","en":"√3"},{"id":"1","en":"1"},{"id":"1/2","en":"1/2"}]'::jsonb, 2, '{"id":"Pada 45°, sin = cos sehingga tan 45° = 1.","en":"At 45°, sin = cos so tan 45° = 1."}'::jsonb),
  ('sma-trigonometri', 2, '{"id":"sin² θ + cos² θ = …","en":"sin² θ + cos² θ = …"}'::jsonb, '[{"id":"0","en":"0"},{"id":"1","en":"1"},{"id":"2","en":"2"},{"id":"tan θ","en":"tan θ"}]'::jsonb, 1, '{"id":"Identitas Pythagoras: sin² θ + cos² θ = 1 untuk setiap θ.","en":"Pythagorean identity: sin² θ + cos² θ = 1 for every θ."}'::jsonb),
  ('sma-trigonometri', 3, '{"id":"Pada segitiga siku-siku, sisi depan sudut θ = 3 dan sisi miring = 5. Nilai sin θ = …","en":"In a right triangle, the side opposite θ is 3 and the hypotenuse is 5. sin θ = …"}'::jsonb, '[{"id":"5/3","en":"5/3"},{"id":"4/5","en":"4/5"},{"id":"3/4","en":"3/4"},{"id":"3/5","en":"3/5"}]'::jsonb, 3, '{"id":"sin θ = sisi depan / sisi miring = 3/5.","en":"sin θ = opposite / hypotenuse = 3/5."}'::jsonb)
) as v(course_slug, position, prompt, options, answer, explanation)
where not exists (select 1 from public.quiz_questions w where w.course_slug = 'sma-trigonometri');

insert into public.quiz_questions (course_slug, position, prompt, options, answer, explanation)
select v.* from (values
  ('utbk-saintek', 0, '{"id":"Suku berikutnya dari barisan 2, 4, 8, 16, … adalah …","en":"The next term of the sequence 2, 4, 8, 16, … is …"}'::jsonb, '[{"id":"24","en":"24"},{"id":"30","en":"30"},{"id":"32","en":"32"},{"id":"20","en":"20"}]'::jsonb, 2, '{"id":"Setiap suku dikali 2, sehingga 16 × 2 = 32.","en":"Each term is doubled, so 16 × 2 = 32."}'::jsonb),
  ('utbk-saintek', 1, '{"id":"Jika 3x = 12 dan y = x + 2, maka y = …","en":"If 3x = 12 and y = x + 2, then y = …"}'::jsonb, '[{"id":"6","en":"6"},{"id":"4","en":"4"},{"id":"8","en":"8"},{"id":"14","en":"14"}]'::jsonb, 0, '{"id":"x = 4, maka y = 4 + 2 = 6.","en":"x = 4, so y = 4 + 2 = 6."}'::jsonb),
  ('utbk-saintek', 2, '{"id":"Peluang muncul mata dadu genap pada pelemparan satu dadu adalah …","en":"The probability of rolling an even number on one die is …"}'::jsonb, '[{"id":"1/6","en":"1/6"},{"id":"1/3","en":"1/3"},{"id":"1/2","en":"1/2"},{"id":"2/3","en":"2/3"}]'::jsonb, 2, '{"id":"Mata genap: 2, 4, 6 → 3 dari 6 kemungkinan = 1/2.","en":"Even faces: 2, 4, 6 → 3 of 6 outcomes = 1/2."}'::jsonb),
  ('utbk-saintek', 3, '{"id":"Rata-rata dari 4, 6, 8, 10, 12 adalah …","en":"The mean of 4, 6, 8, 10, 12 is …"}'::jsonb, '[{"id":"7","en":"7"},{"id":"8","en":"8"},{"id":"9","en":"9"},{"id":"10","en":"10"}]'::jsonb, 1, '{"id":"Jumlah = 40, banyak data = 5, rata-rata = 40/5 = 8.","en":"Sum = 40, count = 5, mean = 40/5 = 8."}'::jsonb)
) as v(course_slug, position, prompt, options, answer, explanation)
where not exists (select 1 from public.quiz_questions w where w.course_slug = 'utbk-saintek');

insert into public.quiz_questions (course_slug, position, prompt, options, answer, explanation)
select v.* from (values
  ('utbk-soshum', 0, '{"id":"Semua mahasiswa wajib mengikuti ujian. Budi adalah mahasiswa. Kesimpulan yang tepat: …","en":"All students must take the exam. Budi is a student. The correct conclusion: …"}'::jsonb, '[{"id":"Budi tidak wajib mengikuti ujian","en":"Budi does not have to take the exam"},{"id":"Budi wajib mengikuti ujian","en":"Budi must take the exam"},{"id":"Budi bukan mahasiswa","en":"Budi is not a student"},{"id":"Hanya Budi yang wajib ujian","en":"Only Budi must take the exam"}]'::jsonb, 1, '{"id":"Budi termasuk kelompok mahasiswa, sehingga aturan untuk semua mahasiswa berlaku baginya.","en":"Budi belongs to the group of students, so the rule for all students applies to him."}'::jsonb),
  ('utbk-soshum', 1, '{"id":"Kalimat yang memuat gagasan pokok sebuah paragraf disebut …","en":"The sentence that carries the main idea of a paragraph is called the …"}'::jsonb, '[{"id":"kalimat utama","en":"topic sentence"},{"id":"kalimat penjelas","en":"supporting sentence"},{"id":"kalimat penutup","en":"closing sentence"},{"id":"kalimat tanya","en":"question sentence"}]'::jsonb, 0, '{"id":"Kalimat utama memuat gagasan pokok; kalimat penjelas hanya mengembangkannya.","en":"The topic sentence states the main idea; supporting sentences only develop it."}'::jsonb),
  ('utbk-soshum', 2, '{"id":"Dokter : Rumah sakit = Guru : …","en":"Doctor : Hospital = Teacher : …"}'::jsonb, '[{"id":"Buku","en":"Book"},{"id":"Sekolah","en":"School"},{"id":"Murid","en":"Student"},{"id":"Papan tulis","en":"Whiteboard"}]'::jsonb, 1, '{"id":"Hubungannya profesi dengan tempat kerjanya: dokter di rumah sakit, guru di sekolah.","en":"The relation is profession to workplace: a doctor at a hospital, a teacher at a school."}'::jsonb),
  ('utbk-soshum', 3, '{"id":"Jika hujan, maka jalan basah. Jalan tidak basah. Kesimpulannya …","en":"If it rains, the road gets wet. The road is not wet. Therefore …"}'::jsonb, '[{"id":"Hujan","en":"It rained"},{"id":"Tidak hujan","en":"It did not rain"},{"id":"Jalan kering karena panas","en":"The road is dry because of the heat"},{"id":"Tidak dapat disimpulkan","en":"Nothing can be concluded"}]'::jsonb, 1, '{"id":"Jika hujan pasti basah; karena tidak basah, berarti tidak hujan (kontraposisi).","en":"If rain always makes it wet and it is not wet, then it did not rain (contrapositive)."}'::jsonb)
) as v(course_slug, position, prompt, options, answer, explanation)
where not exists (select 1 from public.quiz_questions w where w.course_slug = 'utbk-soshum');

-- Jenjang ulasan harus jenjang yang ada (setelah levels terisi).
do $$
begin
  alter table public.reviews
    add constraint reviews_level_id_fkey foreign key (level_id)
    references public.levels (id) on update cascade on delete restrict;
exception
  when duplicate_object then null;
end
$$;
