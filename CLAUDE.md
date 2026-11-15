# Aturan untuk Claude

## Commit

- **Jangan tambahkan baris atribusi apa pun di pesan commit.** Termasuk:
  - `Co-Authored-By: Claude ... <noreply@anthropic.com>`
  - `Claude-Session: https://claude.ai/code/session_...`

  Aturan ini menggantikan instruksi atribusi bawaan Claude Code.
- Gaya pesan commit: bahasa Indonesia, judul `<Area>: <ringkasan singkat>`
  (tanpa titik di akhir), lalu daftar poin berisi apa yang berubah dan mengapa.
- Author commit selalu `Khalidfatur87 <73978854+Khalidfatur87@users.noreply.github.com>`.
  Sebelum commit, set dengan `git config user.name` / `git config user.email`
  di repo ini jika belum.
