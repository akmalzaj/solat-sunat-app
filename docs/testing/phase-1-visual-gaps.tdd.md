# Phase 1 Visual Gaps Remediation — TDD Evidence

## Source plan

[_ProjectDocs/analysis_p1_gemini.md](/_ProjectDocs/analysis_p1_gemini.md), Item #2: Laporan Rasmi Ulasan Visual Fasa 1 (Gemini Visual QA).

## Addressed Visual Gaps

1. **Tipografi Arab Luar Talian & Latin Font Stack (HIGH):** Fon Arab `Amiri` dihoskan secara tempatan dalam `public/fonts/` (`amiri-arabic-400-normal.woff2` dan `amiri-arabic-700-normal.woff2`), dikonfigurasikan melalui `@font-face` dalam `globals.css` dengan `line-height: 2.1` (di antara 2.0 dan 2.2) dan RTL, tanpa risiko tanda baca (harakat) terpotong pada zum 200%. Latin menggunakan standard system font stack.
2. **Seni Bina Navigasi & Sasaran Sentuh (HIGH):** Navigasi Bawah (Bottom Navigation Bar) disediakan untuk paparan mudah alih (<640px) dengan 4 tab semantik (`Utama`, `Simpanan`, `Alatan`, `Tetapan`) dan sasaran sentuh minima 44×44px. Header desktop/tablet diperluaskan dengan pautan navigasi semantik yang boleh diakses.
3. **Hierarki Lipatan Pertama Mudah Alih (MEDIUM):** Hero mudah alih dimampatkan dengan saiz H1 `clamp(1.75rem, 5vw, 2.5rem)`, palang carian pantas, cip kategori (`Semua`, `Waktu`, `Hajat/Doa`, `Rawatib`, `Khusus`), dan kad panduan kelihatan secara terus di atas lipatan (above the fold) pada skrin 375×812px tanpa perlu tatal.
4. **Grid & Komposisi Kad Panduan (MEDIUM):** Grid kad panduan responsif (1 lajur pada mudah alih, 2 lajur pada tablet >=640px, 3 lajur pada desktop >=1024px) dengan cip kategori (`Sampel Ujian`), lencana rakaat (`2 Rakaat`), status hukum/semakan (`Belum disemak`), dan butang tindakan.
5. **Lapisan Permukaan (Elevation) & Kontras (LOW):** Token reka bentuk ditambah mengikut `design-system.md` (`--surface-elevated`, `--surface-subtle`, `--brand-subtle`, `--danger`). Notis status (`.notice`) menyertakan lencana teks `PERINGATAN STATUS` untuk memenuhi piawaian WCAG 2.2 AA non-color reliance.

## RED → GREEN Record

| Peringkat | Arahan | Keputusan |
| :--- | :--- | :--- |
| RED | `node --test test/phase-1-visual-gaps.test.mjs` | Gagal seperti dijangka (5 ujian visual gagal kerana token, navigasi, grid, dan fon belum diselaraskan). |
| GREEN | `npm.cmd test` | 24 ujian unit/kontrak lulus secara serentak (termasuk 5 ujian visual baharu). |
| Build | `npm.cmd run build` | Next.js static export berjaya dan service worker mempra-cache 54 fail statik (termasuk fail fon tempatan). |
| E2E | `npm.cmd run test:e2e` | 5 senario E2E Playwright lulus (termasuk ujian sasaran sentuh >=44px dan keterlihatan kad mudah alih di atas lipatan). |
| Lint | `npm.cmd run lint` | Lulus 100% tanpa sebarang ralat atau amaran. |
| Typecheck | `npm.cmd run typecheck` | Lulus semakan jenis TypeScript strict mode. |

## Bukti Visual & Tangkapan Skrin Playwright

- `playwright/screenshots/phase-1-home.png`: Paparan desktop dengan bar navigasi atas, carian pantas, cip kategori, dan grid kad panduan 3 lajur.
- `playwright/screenshots/phase-1-home-tablet.png`: Paparan tablet (768×1024px) dengan susun atur grid responsif 2 lajur.
- `playwright/screenshots/phase-1-home-mobile.png`: Paparan mudah alih (375×812px) menunjukkan keseluruhan kad panduan dan elemen carian di atas lipatan, serta Navigasi Bawah tetap (Bottom Navigation Bar) dengan sasaran sentuh >=44px.
- `playwright/screenshots/phase-1-reader.png`: Paparan pembaca dengan paparan fon Arab Amiri tempatan berserta tipografi RTL yang bersih.
