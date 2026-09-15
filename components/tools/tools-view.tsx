"use client";

import { useMemo, useState } from "react";
import { allGuides, findGuide } from "@/content/registry";
import type { InteractiveToolConfig } from "@/lib/content-schema";
import { STORAGE_KEYS } from "@/lib/preferences";
import { useStorageState } from "@/lib/storage";
import {
  advanceTasbihProgress,
  createTasbihProgress,
  getActiveTasbihPositionIndex,
  getTakbirProgressLabel,
  getTasbihProgressLabel,
  resetTasbihProgress,
  retreatTasbihProgress,
  type TasbihProgress,
  type TasbihToolConfig,
} from "@/lib/tool-progress";

type ToolProgressStore = { tasbih?: TasbihProgress; takbir?: Record<string, number> };

function getTool<T extends InteractiveToolConfig["toolType"]>(slug: string, type: T): Extract<InteractiveToolConfig, { toolType: T }> {
  const tool = findGuide(slug)?.interactiveTool;
  if (!tool || tool.toolType !== type) throw new Error(`Missing reviewed ${type} configuration for ${slug}.`);
  return tool as Extract<InteractiveToolConfig, { toolType: T }>;
}

export function ToolsView() {
  const [progress, setProgress] = useStorageState<ToolProgressStore>(STORAGE_KEYS.TOOL_PROGRESS, {});
  const [hapticsEnabled] = useStorageState<boolean>("solat_sunat_haptics_enabled", true);
  const tasbih = useMemo(() => getTool("tasbih", "tasbih-counter"), []);
  const rawatib = useMemo(() => getTool("rawatib", "rawatib-grid"), []);
  const kusuf = useMemo(() => getTool("gerhana-matahari", "kusuf-visualizer"), []);
  const takbirGuides = useMemo(() => allGuides.filter((guide) => guide.interactiveTool?.toolType === "takbir-tracker"), []);
  const [selectedTakbirSlug, setSelectedTakbirSlug] = useState("aidilfitri");
  const selectedTakbir = getTool(selectedTakbirSlug, "takbir-tracker");
  const tasbihProgress = progress.tasbih ?? createTasbihProgress(tasbih as TasbihToolConfig);
  const takbirCompleted = Math.min(Math.max(progress.takbir?.[selectedTakbirSlug] ?? 0, 0), 12);
  const updateTasbih = (next: TasbihProgress) => setProgress({ ...progress, tasbih: next });
  const updateTakbir = (next: number) => setProgress({ ...progress, takbir: { ...progress.takbir, [selectedTakbirSlug]: Math.min(Math.max(next, 0), 12) } });
  const giveFeedback = () => {
    if (hapticsEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
  };

  const activeTasbihPosition = getActiveTasbihPositionIndex(tasbihProgress, tasbih as TasbihToolConfig);

  return (
    <div className="tools-container">
      <aside className="notice" aria-label="Had penggunaan alatan">
        <span className="notice-badge">UNTUK PERSEDIAAN</span>
        <p>Alatan ini untuk pembelajaran dan persediaan sahaja, bukan untuk dikendalikan semasa menunaikan solat. Semua urutan dan kiraan dipaparkan daripada konfigurasi yang telah disemak.</p>
      </aside>

      <nav className="tool-links" aria-label="Pilih alatan pembelajaran">
        <a href="#tasbih">Pelan Tasbih</a>
        <a href="#takbir">Takbir</a>
        <a href="#rawatib">Rawatib</a>
        <a href="#kusuf">Kusuf</a>
      </nav>

      {/* 1. Pelan Solat Tasbih */}
      <section id="tasbih" className="tool-section" aria-labelledby="tasbih-title">
        <p className="eyebrow">Pelan langkah demi langkah</p>
        <h2 id="tasbih-title">Pelan Solat Tasbih</h2>
        <p className="meta">{tasbih.totalTasbih} tasbih dalam {tasbih.rakaatCount} rakaat; {tasbih.tasbihPerRakaat} tasbih bagi setiap rakaat.</p>
        <p className="tool-progress-label" aria-live="polite">{getTasbihProgressLabel(tasbihProgress, tasbih)}</p>
        <progress aria-label="Kemajuan tasbih" value={tasbihProgress.completed} max={tasbih.totalTasbih} />
        <p className="meta">{tasbihProgress.completed} daripada {tasbih.totalTasbih} tasbih disemak.</p>
        <div className="tool-controls">
          <button type="button" className="tool-secondary-button" onClick={() => updateTasbih(retreatTasbihProgress(tasbihProgress))} aria-label="Kurang satu tasbih">−1</button>
          <button type="button" className="tool-primary-button" onClick={() => { updateTasbih(advanceTasbihProgress(tasbihProgress, tasbih)); giveFeedback(); }} aria-label="Tambah satu tasbih">+1</button>
          <button type="button" className="tool-secondary-button" onClick={() => updateTasbih(resetTasbihProgress())} aria-label="Set semula kemajuan tasbih">Set semula</button>
        </div>
        <ol className="tool-sequence" aria-label="Urutan pergerakan Solat Tasbih">
          {tasbih.positions.map((position) => {
            const isActive = position.positionIndex === activeTasbihPosition && tasbihProgress.completed < tasbih.totalTasbih;
            return (
              <li
                key={position.positionIndex}
                className={`tool-sequence-item ${isActive ? "active" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                <div className="tool-sequence-header">
                  <strong>{position.name}</strong>
                  {isActive && <span className="tool-active-badge">Semasa</span>}
                </div>
                <span>{position.count} kali</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 2. Takbir Hari Raya & Istisqa' */}
      <section id="takbir" className="tool-section" aria-labelledby="takbir-title">
        <p className="eyebrow">Semakan urutan</p>
        <h2 id="takbir-title">Takbir Hari Raya &amp; Istisqa</h2>
        <fieldset className="tool-choice-group">
          <legend>Pilih panduan takbir</legend>
          {takbirGuides.map((guide) => {
            const isSelected = selectedTakbirSlug === guide.slug;
            return (
              <label key={guide.slug} className={`tool-choice-pill ${isSelected ? "active" : ""}`}>
                <input
                  type="radio"
                  name="takbir-guide"
                  value={guide.slug}
                  checked={isSelected}
                  onChange={() => setSelectedTakbirSlug(guide.slug)}
                />
                <span>{guide.title}</span>
              </label>
            );
          })}
        </fieldset>
        <p className="meta"><strong>{selectedTakbir.rakaat1Takbir} kali takbir tambahan</strong> pada rakaat pertama dan <strong>{selectedTakbir.rakaat2Takbir} kali</strong> pada rakaat kedua.</p>
        <p className="arabic tool-arabic" lang="ar" dir="rtl">{selectedTakbir.intermediateTasbih}</p>
        <p className="meta">Tasbih dibaca antara takbir seperti dirujuk dalam panduan terpilih.</p>
        <p className="tool-progress-label" aria-live="polite">{getTakbirProgressLabel(takbirCompleted, selectedTakbir)}</p>
        <progress aria-label="Kemajuan takbir" value={takbirCompleted} max={12} />
        <p className="meta">{takbirCompleted} daripada 12 takbir disemak.</p>
        <div className="tool-controls">
          <button type="button" className="tool-secondary-button" onClick={() => updateTakbir(takbirCompleted - 1)} aria-label="Kurang satu takbir">−1</button>
          <button type="button" className="tool-primary-button" onClick={() => { updateTakbir(takbirCompleted + 1); giveFeedback(); }} aria-label="Tambah satu takbir">+1</button>
          <button type="button" className="tool-secondary-button" onClick={() => updateTakbir(0)} aria-label="Set semula kemajuan takbir">Set semula</button>
        </div>
      </section>

      {/* 3. Jadual Rawatib (Responsive Cards on mobile, Table on desktop/tablet) */}
      <section id="rawatib" className="tool-section" aria-labelledby="rawatib-title">
        <p className="eyebrow">Rujukan ringkas</p>
        <h2 id="rawatib-title">Jadual Rawatib</h2>
        <p className="meta">Jumlah rujukan: {rawatib.muakkadRakaat} rakaat muakkad dan {rawatib.ghairuMuakkadRakaat} rakaat ghairu muakkad.</p>

        {/* Mobile card presentation (< 640px) */}
        <div className="tool-rawatib-cards" aria-label="Senarai solat sunat rawatib mudah alih">
          {rawatib.schedule.map((item) => (
            <article key={`card-${item.prayer}`} className="tool-rawatib-card">
              <div className="tool-rawatib-card-header">
                <h3 className="tool-rawatib-name">{item.prayer}</h3>
                {item.isMuakkad && <span className="tool-rawatib-badge">Muakkad</span>}
              </div>
              <div className="tool-rawatib-card-body">
                <div className="tool-rawatib-row">
                  <span className="tool-rawatib-label">Sebelum (Qabliyyah):</span>
                  <span className="tool-rawatib-val">{item.qabliyyah}</span>
                </div>
                <div className="tool-rawatib-row">
                  <span className="tool-rawatib-label">Selepas (Ba&apos;diyyah):</span>
                  <span className="tool-rawatib-val">{item["ba'diyyah"]}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Desktop / Tablet Table View (>= 640px) */}
        <div className="tool-table-wrap">
          <table aria-label="Jadual solat sunat rawatib">
            <thead>
              <tr>
                <th scope="col">Solat</th>
                <th scope="col">Sebelum</th>
                <th scope="col">Selepas</th>
              </tr>
            </thead>
            <tbody>
              {rawatib.schedule.map((item) => (
                <tr key={item.prayer}>
                  <th scope="row">{item.prayer}{item.isMuakkad ? " (Muakkad)" : ""}</th>
                  <td>{item.qabliyyah}</td>
                  <td>{item["ba'diyyah"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Urutan Solat Kusuf */}
      <section id="kusuf" className="tool-section" aria-labelledby="kusuf-title">
        <p className="eyebrow">Gambaran urutan</p>
        <h2 id="kusuf-title">Urutan Solat Kusuf</h2>
        <p className="meta">{kusuf.sequenceDescription}</p>
        <div className="kusuf-flow" aria-label="Struktur urutan rakaat Solat Kusuf">
          {Array.from({ length: kusuf.rakaatCount }, (_, index) => (
            <div key={index} className="kusuf-rakaat-card">
              <div className="kusuf-rakaat-header">
                <strong>Rakaat {index + 1}</strong>
                <span className="meta">{kusuf.qiyamPerRakaat} kali Qiyam, {kusuf.rukukPerRakaat} kali Rukuk, kemudian dua kali sujud.</span>
              </div>
              <ol className="kusuf-substeps">
                <li>
                  <span className="kusuf-step-num">1</span>
                  <div>
                    <strong>Qiyam &amp; Rukuk Pertama</strong>
                    <p className="meta">Membaca Surah Al-Fatihah dan surah panjang (cth: Al-Baqarah), disusuli rukuk pertama yang panjang bersama tasbih.</p>
                  </div>
                </li>
                <li>
                  <span className="kusuf-step-num">2</span>
                  <div>
                    <strong>Iktidal &amp; Qiyam Kedua</strong>
                    <p className="meta">Bangkit iktidal, membaca Al-Fatihah dan surah kedua yang lebih ringkas, disusuli rukuk kedua yang panjang.</p>
                  </div>
                </li>
                <li>
                  <span className="kusuf-step-num">3</span>
                  <div>
                    <strong>Dua Sujud{index === 1 ? " & Tahiyat Akhir" : ""}</strong>
                    <p className="meta">Iktidal semula, kemudian turun sujud dua kali yang panjang diselangi duduk antara dua sujud{index === 1 ? ", diakhiri tahiyat akhir dan salam." : "."}</p>
                  </div>
                </li>
              </ol>
            </div>
          ))}
        </div>
      </section>

      <aside className="notice" aria-label="Status audio luar talian">
        <span className="notice-badge">AUDIO BELUM TERSEDIA</span>
        <p>Tiada audio dimuat turun secara automatik. Pek audio hanya akan disediakan selepas rakaman yang disemak, dilesenkan dan mempunyai pilihan muat turun luar talian tersedia.</p>
      </aside>
    </div>
  );
}
