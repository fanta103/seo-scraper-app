import { z } from "zod";

export const technicalSeoCheckStatusSchema = z.enum(["pass", "warn", "fail"]);

export const technicalSeoCheckSchema = z.object({
  name: z.string(),
  status: technicalSeoCheckStatusSchema,
  detail: z.string(),
});

export const technicalSeoCategoryIdSchema = z.enum([
  "metadata",
  "headings",
  "indexability",
  "structured_data",
  "geo_ssr",
  "mobile",
  "media",
  "performance_hints",
]);

export const technicalSeoCategorySchema = z.object({
  id: technicalSeoCategoryIdSchema,
  label: z.string(),
  score: z.number().min(0).max(100),
  maxPoints: z.number(),
  summary: z.string(),
  checks: z.array(technicalSeoCheckSchema).min(1).max(8),
});

export const technicalSeoIssueSchema = z.object({
  severity: z.enum(["critical", "major", "minor"]),
  area: z.string(),
  finding: z.string(),
  recommendation: z.string(),
});

export const technicalSeoAuditSchema = z.object({
  websiteUrl: z.string(),
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  scopeNote: z.string(),
  categories: z.array(technicalSeoCategorySchema).length(8),
  geoHighlights: z.array(z.string()).min(1).max(5),
  strengths: z.array(z.string()).min(1).max(6),
  issues: z.array(technicalSeoIssueSchema).min(1).max(12),
  quickWins: z.array(z.string()).min(2).max(6),
});

export type TechnicalSeoAudit = z.infer<typeof technicalSeoAuditSchema>;
export type TechnicalSeoCategory = z.infer<typeof technicalSeoCategorySchema>;
export type TechnicalSeoCheck = z.infer<typeof technicalSeoCheckSchema>;

export const TECHNICAL_SEO_SCOPE_NOTE =
  "Scores are based on the fetched HTML snapshot only. robots.txt, AI crawler rules, HTTP headers, Core Web Vitals, TTFB, and redirect chains need separate server checks.";
