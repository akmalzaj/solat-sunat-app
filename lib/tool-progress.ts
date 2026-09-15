export interface TasbihPosition {
  positionIndex: number;
  name: string;
  count: number;
}

export interface TasbihToolConfig {
  totalTasbih: number;
  rakaatCount: number;
  tasbihPerRakaat: number;
  positions: readonly TasbihPosition[];
}

export interface TasbihProgress {
  completed: number;
}

export function createTasbihProgress(_config: TasbihToolConfig): TasbihProgress {
  return { completed: 0 };
}

export function advanceTasbihProgress(progress: TasbihProgress, config: TasbihToolConfig): TasbihProgress {
  return { completed: Math.min(Math.max(progress.completed, 0) + 1, config.totalTasbih) };
}

export function retreatTasbihProgress(progress: TasbihProgress): TasbihProgress {
  return { completed: Math.max(progress.completed - 1, 0) };
}

export function resetTasbihProgress(): TasbihProgress {
  return { completed: 0 };
}

export function getTasbihProgressLabel(progress: TasbihProgress, config: TasbihToolConfig): string {
  const completed = Math.min(Math.max(progress.completed, 0), config.totalTasbih);
  if (completed === config.totalTasbih) return `Selesai · ${config.totalTasbih} daripada ${config.totalTasbih}`;

  const completedInRakaat = completed % config.tasbihPerRakaat;
  let positionStart = 0;
  const position = config.positions.find((item) => {
    const positionEnd = positionStart + item.count;
    if (completedInRakaat < positionEnd) return true;
    positionStart = positionEnd;
    return false;
  }) ?? config.positions.at(-1);

  if (!position) return `Rakaat 1 daripada ${config.rakaatCount}`;
  return `Rakaat ${Math.floor(completed / config.tasbihPerRakaat) + 1} daripada ${config.rakaatCount} · ${position.name} · ${completedInRakaat - positionStart} daripada ${position.count}`;
}

export function getActiveTasbihPositionIndex(progress: TasbihProgress, config: TasbihToolConfig): number {
  const completed = Math.min(Math.max(progress.completed, 0), config.totalTasbih);
  if (completed >= config.totalTasbih) return config.positions.at(-1)?.positionIndex ?? 1;

  const completedInRakaat = completed % config.tasbihPerRakaat;
  let positionStart = 0;
  for (const item of config.positions) {
    const positionEnd = positionStart + item.count;
    if (completedInRakaat < positionEnd) {
      return item.positionIndex;
    }
    positionStart = positionEnd;
  }
  return config.positions[0]?.positionIndex ?? 1;
}

export function getTakbirProgressLabel(
  completed: number,
  config: { rakaat1Takbir: number; rakaat2Takbir: number }
): string {
  const total = config.rakaat1Takbir + config.rakaat2Takbir;
  const count = Math.min(Math.max(completed, 0), total);

  if (count === 0) {
    return `Persediaan · Belum memulakan takbir tambahan (0 daripada ${total})`;
  }
  if (count <= config.rakaat1Takbir) {
    return `Rakaat 1 · Takbir tambahan ke-${count} daripada ${config.rakaat1Takbir}`;
  }
  const rakaat2Count = count - config.rakaat1Takbir;
  if (count === total) {
    return `Selesai · ${total} daripada ${total} takbir disemak`;
  }
  return `Rakaat 2 · Takbir tambahan ke-${rakaat2Count} daripada ${config.rakaat2Takbir}`;
}
