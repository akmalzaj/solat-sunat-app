import type { SolatGuide } from "@/lib/content-schema";

export type TimeSlot = "subuh" | "pagi" | "siang" | "petang" | "malam";

export interface RecommendationResult {
  slot: TimeSlot;
  title: string;
  description: string;
  disclaimer: string;
  guides: SolatGuide[];
}

export const RECOMMENDATION_DISCLAIMER =
  "Cadangan berdasarkan waktu peranti; bukan penentu waktu ibadah tepat.";

/**
 * Maps hour (0-23) to a local time-of-day discovery slot.
 */
export function getTimeSlotFromHour(hour: number): TimeSlot {
  if (hour >= 4 && hour < 6) return "subuh";
  if (hour >= 6 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 19) return "petang";
  return "malam";
}

/**
 * Deterministic recommendation matching Shafi'i context without asserting precise prayer windows.
 */
export function getRecommendationForSlot(
  slot: TimeSlot,
  guides: readonly SolatGuide[]
): RecommendationResult {
  const guideMap = new Map(guides.map((g) => [g.slug, g]));

  switch (slot) {
    case "subuh": {
      const candidates = ["tahajjud", "witir", "rawatib"]
        .map((s) => guideMap.get(s))
        .filter((g): g is SolatGuide => Boolean(g));
      return {
        slot: "subuh",
        title: "Waktu Subuh / Sahur",
        description: "Panduan ibadah sunat sebelum fajar dan mengiringi fardu.",
        disclaimer: RECOMMENDATION_DISCLAIMER,
        guides: candidates,
      };
    }
    case "pagi": {
      const candidates = ["dhuha", "isyraq", "wuduk"]
        .map((s) => guideMap.get(s))
        .filter((g): g is SolatGuide => Boolean(g));
      return {
        slot: "pagi",
        title: "Pagi & Awal Siang",
        description: "Panduan solat sunat Dhuha dan Isyraq selepas terbit matahari.",
        disclaimer: RECOMMENDATION_DISCLAIMER,
        guides: candidates,
      };
    }
    case "siang": {
      const candidates = ["rawatib", "tahiyatul-masjid", "hajat"]
        .map((s) => guideMap.get(s))
        .filter((g): g is SolatGuide => Boolean(g));
      return {
        slot: "siang",
        title: "Pertengahan Hari (Zohor)",
        description: "Solat sunat Rawatib mengiringi Zohor dan solat sunat Hajat.",
        disclaimer: RECOMMENDATION_DISCLAIMER,
        guides: candidates,
      };
    }
    case "petang": {
      const candidates = ["rawatib", "tahiyatul-masjid", "wuduk"]
        .map((s) => guideMap.get(s))
        .filter((g): g is SolatGuide => Boolean(g));
      return {
        slot: "petang",
        title: "Petang & Menjelang Maghrib",
        description: "Sunat Rawatib Asar serta persediaan sebelum waktu Maghrib.",
        disclaimer: RECOMMENDATION_DISCLAIMER,
        guides: candidates,
      };
    }
    case "malam":
    default: {
      const candidates = ["tahajjud", "witir", "taubat", "awwabin"]
        .map((s) => guideMap.get(s))
        .filter((g): g is SolatGuide => Boolean(g));
      return {
        slot: "malam",
        title: "Malam & Qiamullail",
        description: "Amalan qiamullail seperti Tahajjud, Witir, Taubat, dan Awwabin.",
        disclaimer: RECOMMENDATION_DISCLAIMER,
        guides: candidates,
      };
    }
  }
}
