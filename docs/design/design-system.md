# Design-System Governance & UI/UX Specifications

This document is the authoritative source of truth for UI/UX design decisions in the Panduan Solat Sunat project. Gemini acts as the advisory UI/UX Design Director; Codex approves and implements changes.

---

## 1. Core Design Principles

1. **Ketenangan & Keheningan (Calm & Serenity)**:
   - The interface must evoke spiritual peace, reverence, and clarity.
   - Avoid aggressive high-saturation colors, flashing animations, or intrusive popups.
   - Motion is strictly subtle (`opacity` and small `transform` only) and respects `prefers-reduced-motion`.

2. **Keterbacaan Utama (Readability First)**:
   - The primary objective is reading and following prayer guidance effortlessly.
   - Arabic typography is paramount: Unicode Arabic must be large, legible, and unclipped at any zoom level up to 200%.
   - Clear visual separation between Arabic (original recitation), Rumi (transliteration), and Terjemahan (Malay translation).

3. **Akses Pantas Luar Talian (Sub-10s Offline Access)**:
   - A user in a surau or mosque with zero connectivity must be able to open any guide and start reading in under 10 seconds.
   - Mobile-first layouts ensure core content and search are accessible above the fold without unnecessary introductory fluff.

4. **Integriti & Ketelusan Fiqh (Governance & Clarity)**:
   - Religious content status must be unmistakably labeled (`needs-review` vs `approved`).
   - Time suggestions are purely discovery heuristics, never authoritative fiqh decrees.
   - Interactive aids (tasbih, takbir) are clearly labeled as preparation/learning aids, not prayer counters.

---

## 2. Color System & Elevation Tokens

### 2.1 Palette Tokens

| Token | Light Theme | Dark Theme | Purpose & Semantic Role |
| :--- | :--- | :--- | :--- |
| `--canvas` | `#f7f7f2` | `#10201c` | App background canvas (warm parchment / deep forest night) |
| `--surface` | `#ffffff` | `#182b25` | Standard card and container surface |
| `--surface-elevated` | `#ffffff` | `#213831` | Floating controls, toolbars, modal drawers |
| `--surface-subtle` | `#f0f3f0` | `#142520` | Secondary backings, inactive chips, step backgrounds |
| `--ink` | `#13231f` | `#f1f7f2` | Primary high-contrast text |
| `--muted` | `#52655f` | `#c1d0c7` | Secondary text, metadata, Rumi transliteration |
| `--brand` | `#0f3d36` | `#88c9b9` | Brand identity, primary active states, headers |
| `--brand-subtle` | `#e7efe9` | `#1d3d34` | Brand highlight backgrounds, active chip surfaces |
| `--accent` | `#b7791f` | `#efbf69` | Warm ochre accent for highlights, bookmarks, and notices |
| `--line` | `#d8e0d9` | `#365148` | Dividers, card borders, inactive outlines |
| `--focus` | `#005fcc` | `#8fc7ff` | High-visibility keyboard focus outline (min 3px solid) |
| `--danger` | `#b91c1c` | `#f87171` | Unapproved warnings, destructive reset actions |

### 2.2 Contrast & Accessibility Rules
- All text against `--canvas` or `--surface` must meet or exceed **WCAG 2.2 AA (4.5:1 for body, 3:1 for large text)**.
- **Never rely on color alone** to convey status or meaning. Notices and status badges must always pair color with text or recognizable iconography.
- Keyboard focus must use `outline: 3px solid var(--focus)` with `outline-offset: 2px`.

---

## 3. Typography & Typesetting Standards

### 3.1 Font Families
- **Latin / Bahasa Melayu**: Neutral, readable system stack or modern sans-serif:
  `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`
- **Arabic (`.arabic`)**: Bundled self-hosted Arabic font (`Amiri` or `Noto Naskh Arabic`):
  `font-family: "Amiri", "Noto Naskh Arabic", serif;`
  - Must be self-hosted in `public/fonts` for guaranteed offline fidelity across all iOS and Android devices.

### 3.2 Arabic Typesetting Requirements
- **Direction**: Mandatory `dir="rtl"` and `lang="ar"` attributes on all Arabic elements.
- **Font Size Scale**:
  - Kecil: `1.5rem` (24px)
  - Biasa (Default): `1.85rem` to `2.2rem` (clamp(1.8rem, 5vw, 2.5rem))
  - Besar: `2.6rem` to `3.0rem`
- **Line Height**: Strict `2.0` to `2.2` to eliminate diacritic clipping (tasykil/harakat/shaddah).
- **Spacing**: Container must provide minimum `0.75rem` vertical padding above and below Arabic blocks to protect high/low vocalization marks during scaling and zoom.

### 3.3 Three-Layer Recitation Layout
Every prayer recitation (Niat, Surah, Ruku', Sujud, Doa) follows a standardized vertical trio:
1. **Arabic Block**: High-contrast, RTL, Amiri font, generous line-height.
2. **Rumi Transliteration**: Medium font size (`1.0rem`), italicized, `--muted` color, with clear pronunciation hyphens.
3. **Malay Translation**: Clear body font (`1.0rem`), normal weight, `--ink` color.

---

## 4. Layout, Breakpoints & Spacing

### 4.1 Breakpoints
- **Mobile**: `< 640px` (standard test viewport: 375×812px)
- **Tablet**: `640px - 1024px` (standard test viewport: 768×1024px)
- **Desktop**: `> 1024px` (standard test viewport: 1280×800px)
- **Shell Max Width**: `68rem` (1088px) centered with `margin-inline: auto`.

### 4.2 Touch Targets & Ergonomics
- All interactive controls (buttons, links, chips, toggles) must provide a minimum touch target of **44×44px** on touchscreens.
- Tasbih/Takbir counter tap targets must be **>= 64×64px** with clear visual and progressive vibration feedback.

---

## 5. Component Patterns & Specifications

### 5.1 App Navigation
- **Mobile (< 640px)**:
  - Top Bar: Brand title + Quick Search button + Dark Mode / Theme toggle.
  - Bottom Bar: Fixed bottom navigation with 4 semantic tabs:
    1. **Utama** (Home / Discovery)
    2. **Simpanan** (Bookmarks)
    3. **Alatan** (Tasbih & Takbir aids)
    4. **Tetapan** (Preferences, Methodology, Sources)
- **Desktop / Tablet (>= 640px)**:
  - Sticky header with brand logo, inline search bar, and primary navigation links.

### 5.2 Home & Discovery Screen
- **Search & Filter Bar**:
  - Instant client-side search filtering by prayer title, alias, or purpose.
  - Horizontal scrollable category chips: `Semua`, `Waktu`, `Hajat/Doa`, `Rawatib`, `Khusus`.
- **"Cadangan untuk diterokai" Card**:
  - Compact discovery card based on device local time (e.g. Dhuha in morning, Tahajjud/Witir at night).
  - Explicit label: *"Cadangan berdasarkan waktu peranti; bukan penentu waktu ibadah tepat."*
- **Guide Card Grid**:
  - Mobile: 1 column.
  - Tablet: 2 columns (`grid-template-columns: repeat(2, 1fr)`).
  - Desktop: 3 columns (`grid-template-columns: repeat(3, 1fr)`).
  - Card anatomy:
    - Top row: Category Chip (e.g. `Solat Khusus`) + Rakaat Badge (`2 Rakaat`).
    - Title: Semibold H3 (`--ink`).
    - Summary: 2-line clamped lede (`--muted`).
    - Bottom row: Review status badge (`Disemak` / `Belum Disemak`) + Bookmark button.

### 5.3 Reader Screen (`/solat/[slug]`)
- **Sticky Reader Toolbar**:
  - Back button (← Kembali)
  - Quick action controls:
    - Font size toggle (`A-` / `A+`)
    - Display toggles: `Rumi` (on/off), `Terjemahan` (on/off)
    - Bookmark toggle (star icon)
    - Mod Khusyuk toggle (focus view)
- **Prayer Metadata Card**:
  - Hukm (Sunat Muakkad / Ghairu Muakkad), Waktu yang dianjurkan, Bilangan rakaat, Keutamaan ringkas.
  - Source attribution badge with link to full source details.
- **Niat Section**:
  - Segmented control to switch variation: `Sendirian`, `Imam`, `Makmum`.
  - Full three-layer recitation (Arabic, Rumi, Translation).
- **Sequential Step Flow**:
  - Clear numbered indicators (`Rakaat 1`, `Rakaat 2`).
  - Essential steps (Rukun) vs Sunat Hai'ah / Ab'adh clearly distinguished visually.
- **Doa & Wirid Drawer/Accordion**:
  - Native accessible `<details>` / `<summary>` accordions with smooth disclosure.

### 5.4 Mod Khusyuk (Focus Mode)
- Single-column, edge-to-edge serene reading view.
- Conceals top header, navigation, and settings chrome.
- Maximizes Arabic contrast and line spacing.
- Includes a discreet floating "Keluar Mod Khusyuk" button in the corner.

---

## 6. Review & Acceptance Checklist for Codex

Before marking any UI task complete, Codex must verify:
- [ ] Responsive behavior verified at 375px (mobile), 768px (tablet), and 1280px (desktop).
- [ ] No horizontal overflow (`scrollWidth <= clientWidth`).
- [ ] Arabic text renders with bundled font and no clipped diacritics at 100%, 150%, and 200% zoom.
- [ ] All interactive touch targets meet minimum 44×44px.
- [ ] Color contrast meets WCAG 2.2 AA standards in both Light and Dark modes.
- [ ] Service worker caches all fonts, styles, and guide routes for offline functionality.
- [ ] Playwright visual screenshots captured for Gemini UI/UX Director review.
