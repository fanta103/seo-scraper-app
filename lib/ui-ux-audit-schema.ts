import { z } from "zod";

export const uiUxCategorySchema = z.object({
  name: z.enum([
    "layout",
    "typography",
    "color_contrast",
    "navigation",
    "cta",
    "accessibility",
    "trust",
    "mobile_responsiveness",
  ]),
  score: z.number().min(0).max(100),
  summary: z.string(),
});

export const uiUxIssueSchema = z.object({
  severity: z.enum(["critical", "major", "minor"]),
  area: z.string(),
  finding: z.string(),
  recommendation: z.string(),
});

export const uiUxAuditSchema = z.object({
  websiteUrl: z.string(),
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  categories: z.array(uiUxCategorySchema).min(4).max(8),
  strengths: z.array(z.string()).min(2).max(6),
  issues: z.array(uiUxIssueSchema).min(3).max(12),
  quickWins: z.array(z.string()).min(2).max(6),
});

export type UiUxAudit = z.infer<typeof uiUxAuditSchema>;

export const UI_UX_AUDIT_VISION_PROMPT = `You are a senior UI/UX designer auditing a website from a single viewport screenshot.

Analyze ONLY what is visible in the image. Do not invent elements that are not shown.

Evaluate:
- Visual hierarchy and layout (spacing, alignment, grid)
- Typography (readability, scale, pairing, line length)
- Color and contrast (brand consistency, WCAG-like contrast concerns you can infer visually)
- Navigation clarity (menus, labels, wayfinding)
- Calls to action (visibility, copy, placement)
- Accessibility signals visible in the UI (touch targets, focus cues if visible, text size)
- Trust and credibility (social proof, polish, consistency)
- Mobile/responsive feel if the viewport suggests mobile width

Be specific and actionable. Reference visible UI elements (hero, header, buttons, forms).
Score each category 0–100. Overall score should reflect the weighted impression of the page.
Prioritize issues by user impact. Quick wins must be low-effort, high-impact changes.`;
