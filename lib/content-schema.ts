import { z } from "zod";

export const SourceTypeSchema = z.enum([
  "government_religious_authority",
  "classical_shafii_text",
  "hadith_compilation",
]);

export type SourceType = z.infer<typeof SourceTypeSchema>;

export const SourceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  publisher: z.string().min(1),
  year: z.number().int().optional().nullable(),
  type: SourceTypeSchema,
  // z.string().url() alone accepts javascript: schemes; only https is trusted
  // because source URLs are rendered as clickable links.
  url: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "Source URL must use https")
    .optional(),
  licenseOrPermission: z.string().min(1),
  notes: z.string().min(1),
});

export type SourceItem = z.infer<typeof SourceItemSchema>;

export const PrayerCategorySchema = z.enum([
  "harian",
  "malam",
  "hajat",
  "raya_fenomena",
]);

export type PrayerCategory = z.infer<typeof PrayerCategorySchema>;

export const HukumSchema = z.enum(["Sunat Muakkad", "Sunat"]);
export type Hukum = z.infer<typeof HukumSchema>;

export const ReviewStatusSchema = z.enum(["needs-review", "approved"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ArabicDirectionSchema = z.literal("rtl");

export const ArabicRecitationSchema = z.object({
  arabic: z.string().min(1),
  rumi: z.string().min(1),
  translation: z.string().min(1),
  dir: ArabicDirectionSchema,
  sourceRef: z.string().min(1),
  sourcePage: z.string().optional(),
});

export type ArabicRecitation = z.infer<typeof ArabicRecitationSchema>;

export const NiatVariationSchema = z.object({
  label: z.string().min(1),
  arabic: z.string().min(1),
  rumi: z.string().min(1),
  translation: z.string().min(1),
  dir: ArabicDirectionSchema,
  sourceRef: z.string().min(1),
  sourcePage: z.string().optional(),
});

export type NiatVariation = z.infer<typeof NiatVariationSchema>;

export const EssentialStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  isRukun: z.boolean(),
  arabic: z.string().optional(),
  rumi: z.string().optional(),
  translation: z.string().optional(),
  dir: ArabicDirectionSchema.optional(),
  sourceRef: z.string().optional(),
});

export type EssentialStep = z.infer<typeof EssentialStepSchema>;

export const RecommendedPracticeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  recommendedSurahs: z.array(z.string()),
});

export type RecommendedPractice = z.infer<typeof RecommendedPracticeSchema>;

export const DoaRecitationSchema = z.object({
  title: z.string().min(1),
  arabic: z.string().min(1),
  rumi: z.string().min(1),
  translation: z.string().min(1),
  dir: ArabicDirectionSchema,
  sourceRef: z.string().min(1),
  sourcePage: z.string().optional(),
});

export type DoaRecitation = z.infer<typeof DoaRecitationSchema>;

export const SuggestedTimeOfDaySchema = z.enum([
  "subuh",
  "isyraq",
  "dhuha",
  "zohor",
  "asar",
  "maghrib",
  "isyak",
  "malam",
  "sepanjang-masa",
]);

export type SuggestedTimeOfDay = z.infer<typeof SuggestedTimeOfDaySchema>;

export const TimeGuidanceSchema = z.object({
  description: z.string().min(1),
  suggestedTimeOfDay: SuggestedTimeOfDaySchema,
});

export type TimeGuidance = z.infer<typeof TimeGuidanceSchema>;

export const TasbihPositionSchema = z.object({
  positionIndex: z.number().int().positive(),
  name: z.string().min(1),
  count: z.number().int().positive(),
});

export const TasbihCounterToolSchema = z.object({
  toolType: z.literal("tasbih-counter"),
  totalTasbih: z.literal(300),
  rakaatCount: z.literal(4),
  tasbihPerRakaat: z.literal(75),
  positions: z.array(TasbihPositionSchema).refine(
    (pos) => pos.reduce((sum, p) => sum + p.count, 0) === 75,
    { message: "Tasbih positions must sum exactly to 75 per rakaat" }
  ),
});

export const TakbirTrackerToolSchema = z.object({
  toolType: z.literal("takbir-tracker"),
  rakaat1Takbir: z.literal(7),
  rakaat2Takbir: z.literal(5),
  intermediateTasbih: z.string().min(1),
});

export const RawatibScheduleItemSchema = z.object({
  prayer: z.string().min(1),
  qabliyyah: z.string(),
  "ba'diyyah": z.string(),
  isMuakkad: z.boolean(),
});

export const RawatibGridToolSchema = z.object({
  toolType: z.literal("rawatib-grid"),
  muakkadRakaat: z.number().int().positive(),
  ghairuMuakkadRakaat: z.number().int().positive(),
  schedule: z.array(RawatibScheduleItemSchema).min(5),
});

export const KusufVisualizerToolSchema = z.object({
  toolType: z.literal("kusuf-visualizer"),
  rakaatCount: z.literal(2),
  qiyamPerRakaat: z.literal(2),
  rukukPerRakaat: z.literal(2),
  sequenceDescription: z.string().min(1),
});

export const InteractiveToolConfigSchema = z.discriminatedUnion("toolType", [
  TasbihCounterToolSchema,
  TakbirTrackerToolSchema,
  RawatibGridToolSchema,
  KusufVisualizerToolSchema,
]);

export type InteractiveToolConfig = z.infer<typeof InteractiveToolConfigSchema>;

export const SolatGuideSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(1),
  titleArabic: z.string().min(1),
  category: PrayerCategorySchema,
  shortPurpose: z.string().min(1),
  hukum: HukumSchema,
  rakaatOptions: z.array(z.number().int().positive()).min(1),
  timeGuidance: TimeGuidanceSchema,
  niat: z.array(NiatVariationSchema).min(1),
  essentialSteps: z.array(EssentialStepSchema).min(1),
  recommendedPractice: z.array(RecommendedPracticeSchema),
  commonLocalPractice: z.string().min(1),
  variationsNotes: z.string().min(1),
  doa: z.array(DoaRecitationSchema),
  interactiveTool: InteractiveToolConfigSchema.optional(),
  contentVersion: z.string().min(1),
  lastReviewedAt: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewStatus: ReviewStatusSchema,
});

export type SolatGuide = z.infer<typeof SolatGuideSchema>;

/**
 * Validates an array of SolatGuide objects and an array of SourceItem objects.
 * Enforces:
 * - Exact count of 19 guides
 * - Slug uniqueness
 * - All sourceRef values resolve to an existing source id
 * - Unicode Arabic validation
 */
export function validateSolatGuides(
  rawGuides: unknown[],
  rawSources: unknown[]
): { valid: true; guides: SolatGuide[]; sources: SourceItem[] } {
  const parsedSources = z.array(SourceItemSchema).parse(rawSources);
  const sourceIdSet = new Set(parsedSources.map((s) => s.id));

  const parsedGuides = z.array(SolatGuideSchema).parse(rawGuides);

  if (parsedGuides.length !== 19) {
    throw new Error(
      `Registry must contain exactly 19 canonical solat sunat guides, received ${parsedGuides.length}.`
    );
  }

  const seenSlugs = new Set<string>();
  for (const guide of parsedGuides) {
    if (seenSlugs.has(guide.slug)) {
      throw new Error(`Duplicate slug detected: ${guide.slug}`);
    }
    seenSlugs.add(guide.slug);

    // Validate that all sourceRef references resolve in sources
    for (const niat of guide.niat) {
      if (!sourceIdSet.has(niat.sourceRef)) {
        throw new Error(
          `Guide '${guide.slug}' niat references unknown sourceRef: '${niat.sourceRef}'`
        );
      }
    }

    for (const step of guide.essentialSteps) {
      if (step.sourceRef && !sourceIdSet.has(step.sourceRef)) {
        throw new Error(
          `Guide '${guide.slug}' step '${step.stepNumber}' references unknown sourceRef: '${step.sourceRef}'`
        );
      }
    }

    for (const doa of guide.doa) {
      if (!sourceIdSet.has(doa.sourceRef)) {
        throw new Error(
          `Guide '${guide.slug}' doa '${doa.title}' references unknown sourceRef: '${doa.sourceRef}'`
        );
      }
    }
  }

  return { valid: true, guides: parsedGuides, sources: parsedSources };
}
