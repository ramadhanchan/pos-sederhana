# Urutan Skill Superpowers

Alur umum pakai skill Superpowers dari `obra/superpowers` (terinstall di `.commandcode/skills/`).

## 1. `using-superpowers` (entry point)
Selalu dipanggil di awal percakapan. Meta skill yang nentuin skill mana yang relevan.

## 2. `brainstorming`
Dipakai sebelum bikin sesuatu yang baru ("let's build X").

## 3. `writing-plans`
Setelah ada spec/kebutuhan jelas, bikin plan implementasi.

## 4. `using-git-worktrees`
Kerja terisolasi di branch terpisah (opsional, kalo perlu).

## 5. `executing-plans` / `subagent-driven-development`
Eksekusi plan. Pakai `subagent-driven-development` kalo task bisa dipecah ke subagent.

## 6. `dispatching-parallel-agents`
Kalo ada 2+ task independen yang bisa jalan paralel.

## 7. `test-driven-development`
Pas nulis kode: test dulu, baru implement.

## 8. `systematic-debugging`
Kalo ada bug/error. Entry point alternatif kedua (setelah `brainstorming`).

## 9. `requesting-code-review`
Setelah implement selesai, minta review.

## 10. `receiving-code-review`
Waktu nerima feedback review.

## 11. `verification-before-completion`
Sebelum klaim kerjaan selesai.

## 12. `finishing-a-development-branch`
Pas bener-bener kelar (merge, PR, dll).

## 13. `writing-skills`
Kalo mau bikin skill baru.

## 14. `diagnosing-superpowers`
Kalo sesi-nya berantakan dan perlu diagnose ulang.

---

## Cheat sheet alur

- "Let's build X" → `using-superpowers` → `brainstorming` → `writing-plans` → `executing-plans`/`subagent-driven-development` (+ `dispatching-parallel-agents` kalo bisa paralel) → `test-driven-development` → `verification-before-completion` → `requesting-code-review` → `receiving-code-review` → `finishing-a-development-branch`
- "Fix this bug" → `using-superpowers` → `systematic-debugging`
- "Bikin skill baru" → `using-superpowers` → `brainstorming` → `writing-skills`
