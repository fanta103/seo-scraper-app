import {
  TECHNICAL_SEO_SCOPE_NOTE,
  type TechnicalSeoAudit,
  type TechnicalSeoCategory,
  type TechnicalSeoCheck,
  type TechnicalSeoIssue,
} from "@/lib/technical-seo-audit-schema";

type CheckInput = { name: string; status: "pass" | "warn" | "fail"; detail: string };

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function matchAll(html: string, re: RegExp): RegExpMatchArray[] {
  return [...html.matchAll(re)];
}

function firstMatch(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? decodeHtml(m[1].trim()) : null;
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function scoreFromChecks(checks: CheckInput[], maxPoints: number): number {
  if (checks.length === 0) return 0;
  let earned = 0;
  const each = maxPoints / checks.length;
  for (const c of checks) {
    if (c.status === "pass") earned += each;
    else if (c.status === "warn") earned += each * 0.5;
  }
  return Math.round(Math.min(maxPoints, earned) * (100 / maxPoints));
}

function buildCategory(
  id: TechnicalSeoCategory["id"],
  label: string,
  maxPoints: number,
  checks: CheckInput[],
): TechnicalSeoCategory {
  const score = scoreFromChecks(checks, maxPoints);
  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  let summary = "All HTML checks passed.";
  if (fails > 0) summary = `${fails} issue${fails > 1 ? "s" : ""} need attention.`;
  else if (warns > 0) summary = `${warns} item${warns > 1 ? "s" : ""} could be improved.`;

  return {
    id,
    label,
    score,
    maxPoints,
    summary,
    checks,
  };
}

function analyzeMetadata(html: string, pageUrl: string): TechnicalSeoCategory {
  const checks: CheckInput[] = [];
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = firstMatch(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
  ) ?? firstMatch(
    html,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i,
  );
  const robots = firstMatch(
    html,
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i,
  ) ?? firstMatch(
    html,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["'][^>]*>/i,
  );
  const ogTitle =
    firstMatch(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["'][^>]*>/i) ??
    firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["'][^>]*>/i);
  const htmlLang = firstMatch(html, /<html[^>]+lang=["']([^"']+)["']/i);

  checks.push({
    name: "Document title",
    status: title && title.length >= 10 && title.length <= 70 ? "pass" : title ? "warn" : "fail",
    detail: title
      ? `"${title.slice(0, 80)}${title.length > 80 ? "…" : ""}" (${title.length} chars)`
      : "Missing <title> — critical for SEO and AI snippets.",
  });

  checks.push({
    name: "Meta description",
    status:
      description && description.length >= 50 && description.length <= 160
        ? "pass"
        : description
          ? "warn"
          : "fail",
    detail: description
      ? `${description.length} characters`
      : "Missing meta description — hurts CTR and AI summarization.",
  });

  const robotsLower = (robots ?? "").toLowerCase();
  checks.push({
    name: "Robots meta",
    status: robotsLower.includes("noindex") ? "fail" : robots ? "pass" : "warn",
    detail: robots
      ? `content="${robots}"`
      : "No robots meta (usually fine unless you need noindex on this page).",
  });

  checks.push({
    name: "HTML lang",
    status: htmlLang ? "pass" : "warn",
    detail: htmlLang ? `lang="${htmlLang}"` : "Missing lang on <html> for language targeting.",
  });

  checks.push({
    name: "Open Graph title",
    status: ogTitle ? "pass" : "warn",
    detail: ogTitle ? "og:title present" : "No og:title — weaker social and AI preview signals.",
  });

  void pageUrl;
  return buildCategory("metadata", "Metadata & social", 15, checks);
}

function analyzeHeadings(html: string): TechnicalSeoCategory {
  const checks: CheckInput[] = [];
  const h1s = matchAll(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/gi);
  const h2s = matchAll(html, /<h2\b[^>]*>[\s\S]*?<\/h2>/gi);
  const h3plus = matchAll(html, /<h[3-6]\b[^>]*>[\s\S]*?<\/h[3-6]>/gi);

  checks.push({
    name: "Single H1",
    status: h1s.length === 1 ? "pass" : h1s.length === 0 ? "fail" : "warn",
    detail:
      h1s.length === 1
        ? "Exactly one H1 found."
        : h1s.length === 0
          ? "No H1 — page topic is unclear to crawlers and AI."
          : `${h1s.length} H1 tags — use one primary H1 per page.`,
  });

  checks.push({
    name: "Subheadings",
    status: h2s.length > 0 ? "pass" : "warn",
    detail:
      h2s.length > 0
        ? `${h2s.length} H2 element(s) for section structure.`
        : "No H2s — add section headings for scannable content.",
  });

  checks.push({
    name: "Deep heading usage",
    status: h3plus.length > 0 || h2s.length === 0 ? "pass" : "warn",
    detail:
      h3plus.length > 0
        ? `${h3plus.length} H3–H6 heading(s).`
        : "Only H1/H2 — consider H3+ for long-form pages.",
  });

  return buildCategory("headings", "Headings", 12, checks);
}

function analyzeIndexability(html: string, pageUrl: string): TechnicalSeoCategory {
  const checks: CheckInput[] = [];
  const canonical =
    firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i) ??
    firstMatch(html, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i);
  const hreflangs = matchAll(
    html,
    /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]*>/gi,
  );
  const relNext = /<link[^>]+rel=["']next["'][^>]*>/i.test(html);
  const relPrev = /<link[^>]+rel=["']prev["'][^>]*>/i.test(html);
  const robots = (
    firstMatch(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i) ?? ""
  ).toLowerCase();

  checks.push({
    name: "Canonical URL",
    status: canonical ? "pass" : "fail",
    detail: canonical
      ? canonical
      : "Missing rel=canonical — duplicate URL risk for indexation.",
  });

  if (canonical && pageUrl) {
    try {
      const canon = new URL(canonical, pageUrl).href.replace(/\/$/, "");
      const self = new URL(pageUrl).href.replace(/\/$/, "");
      checks.push({
        name: "Self-referencing canonical",
        status: canon === self ? "pass" : "warn",
        detail: canon === self ? "Canonical matches this URL." : `Canonical points to ${canon}`,
      });
    } catch {
      checks.push({
        name: "Self-referencing canonical",
        status: "warn",
        detail: "Could not compare canonical to page URL.",
      });
    }
  }

  checks.push({
    name: "Hreflang",
    status: hreflangs.length > 0 ? "pass" : "pass",
    detail:
      hreflangs.length > 0
        ? `${hreflangs.length} hreflang alternate(s) declared.`
        : "No hreflang (OK for single-locale sites).",
  });

  checks.push({
    name: "Pagination hints",
    status: relNext || relPrev ? "pass" : "pass",
    detail:
      relNext || relPrev
        ? `rel=${relPrev ? "prev " : ""}${relNext ? "next" : ""}`.trim()
        : "No rel=next/prev (optional; use canonical strategy for paginated series).",
  });

  checks.push({
    name: "Noindex directive",
    status: robots.includes("noindex") ? "fail" : "pass",
    detail: robots.includes("noindex")
      ? "Page is noindex — it will not be indexed or cited by search/AI."
      : "Page is not blocked by noindex in HTML.",
  });

  return buildCategory("indexability", "Indexability", 12, checks);
}

function analyzeStructuredData(html: string): TechnicalSeoCategory {
  const checks: CheckInput[] = [];
  const ldJsonBlocks = matchAll(
    html,
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  checks.push({
    name: "JSON-LD present",
    status: ldJsonBlocks.length > 0 ? "pass" : "fail",
    detail:
      ldJsonBlocks.length > 0
        ? `${ldJsonBlocks.length} JSON-LD block(s) in HTML.`
        : "No JSON-LD — AI systems and rich results lose entity context.",
  });

  let validTypes: string[] = [];
  for (const block of ldJsonBlocks) {
    const raw = block[1]?.trim();
    if (!raw) continue;
    try {
      const data = JSON.parse(raw) as { "@type"?: string | string[] };
      const t = data["@type"];
      if (typeof t === "string") validTypes.push(t);
      else if (Array.isArray(t)) validTypes.push(...t.filter((x) => typeof x === "string"));
    } catch {
      /* invalid json */
    }
  }

  checks.push({
    name: "Schema @type",
    status: validTypes.length > 0 ? "pass" : ldJsonBlocks.length > 0 ? "warn" : "fail",
    detail:
      validTypes.length > 0
        ? `Types: ${[...new Set(validTypes)].slice(0, 5).join(", ")}`
        : ldJsonBlocks.length > 0
          ? "JSON-LD found but @type missing or invalid JSON."
          : "Add WebPage, Organization, or Article schema as relevant.",
  });

  return buildCategory("structured_data", "Structured data", 13, checks);
}

function analyzeGeoSsr(html: string): TechnicalSeoCategory {
  const checks: CheckInput[] = [];
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch?.[1] ?? html;
  const bodyText = stripTags(bodyHtml);
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  const internalLinks = matchAll(bodyHtml, /<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>/gi);
  const h1InBody = /<h1\b/i.test(bodyHtml);
  const mainLandmarks = /<(?:main|article)\b/i.test(bodyHtml);

  checks.push({
    name: "Main content in HTML",
    status: wordCount >= 80 ? "pass" : wordCount >= 25 ? "warn" : "fail",
    detail:
      wordCount >= 80
        ? `~${wordCount} words of visible text in HTML (good for AI crawlers that skip JS).`
        : wordCount >= 25
          ? `Only ~${wordCount} words — thin or possibly JS-rendered body.`
          : "Almost no body text — likely client-side rendered; GEO visibility at risk.",
  });

  checks.push({
    name: "H1 in document",
    status: h1InBody ? "pass" : "fail",
    detail: h1InBody
      ? "H1 present in page HTML."
      : "No H1 in HTML — AI crawlers may not detect page topic.",
  });

  checks.push({
    name: "Semantic main/article",
    status: mainLandmarks ? "pass" : "warn",
    detail: mainLandmarks
      ? "<main> or <article> landmark found."
      : "No <main>/<article> — add semantic wrapper for primary content.",
  });

  checks.push({
    name: "Internal links in HTML",
    status: internalLinks.length >= 3 ? "pass" : internalLinks.length >= 1 ? "warn" : "fail",
    detail:
      internalLinks.length >= 3
        ? `${internalLinks.length} internal links in HTML for crawl paths.`
        : internalLinks.length >= 1
          ? `${internalLinks.length} internal link(s) — weak internal linking signal.`
          : "No internal links in HTML — hurts crawlability for AI bots.",
  });

  const metaInHead = /<title/i.test(html) && /<meta[^>]+name=["']description/i.test(html);
  checks.push({
    name: "Meta tags in HTML",
    status: metaInHead ? "pass" : "fail",
    detail: metaInHead
      ? "Title and meta description are server-delivered in HTML."
      : "Missing title or description in raw HTML.",
  });

  return buildCategory("geo_ssr", "GEO / SSR content", 20, checks);
}

function analyzeMobile(html: string): TechnicalSeoCategory {
  const viewport =
    firstMatch(html, /<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["'][^>]*>/i) ??
    firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["'][^>]*>/i);
  const vp = (viewport ?? "").toLowerCase();

  const checks: CheckInput[] = [
    {
      name: "Viewport meta",
      status:
        vp.includes("width=device-width") && vp.includes("initial-scale")
          ? "pass"
          : viewport
            ? "warn"
            : "fail",
      detail: viewport
        ? `content="${viewport}"`
        : "Missing viewport — Google uses mobile-only crawling since 2024.",
    },
  ];

  return buildCategory("mobile", "Mobile signals", 10, checks);
}

function analyzeMedia(html: string): TechnicalSeoCategory {
  const imgs = matchAll(html, /<img\b[^>]*>/gi);
  let missingAlt = 0;
  let emptyAlt = 0;
  for (const m of imgs) {
    const tag = m[0];
    if (!/\balt\s*=/i.test(tag)) missingAlt++;
    else if (/\balt\s*=\s*["']\s*["']/i.test(tag)) emptyAlt++;
  }
  const total = imgs.length;
  const problems = missingAlt + emptyAlt;

  const checks: CheckInput[] = [
    {
      name: "Image alt coverage",
      status:
        total === 0
          ? "pass"
          : problems === 0
            ? "pass"
            : problems <= Math.ceil(total * 0.2)
              ? "warn"
              : "fail",
      detail:
        total === 0
          ? "No <img> tags in refined HTML."
          : problems === 0
            ? `All ${total} image(s) have alt text.`
            : `${missingAlt} missing alt, ${emptyAlt} empty alt (of ${total} images).`,
    },
  ];

  return buildCategory("media", "Images & alt", 8, checks);
}

function analyzePerformanceHints(html: string): TechnicalSeoCategory {
  const imgs = matchAll(html, /<img\b[^>]*>/gi);
  let withDimensions = 0;
  let withLazy = 0;
  for (const m of imgs) {
    const tag = m[0];
    if (/\b(width|height)\s*=/i.test(tag)) withDimensions++;
    if (/\bloading\s*=\s*["']lazy["']/i.test(tag)) withLazy++;
  }
  const preloads = matchAll(html, /<link[^>]+rel=["']preload["'][^>]*>/gi).length;

  const checks: CheckInput[] = [];

  checks.push({
    name: "Image dimensions",
    status:
      imgs.length === 0
        ? "pass"
        : withDimensions >= imgs.length * 0.5
          ? "pass"
          : withDimensions > 0
            ? "warn"
            : "fail",
    detail:
      imgs.length === 0
        ? "No images to assess."
        : `${withDimensions}/${imgs.length} images have width/height (reduces CLS risk).`,
  });

  checks.push({
    name: "Lazy-loaded images",
    status: "pass",
    detail:
      withLazy > 0
        ? `${withLazy} image(s) use loading="lazy".`
        : "No lazy loading detected in HTML (fine for above-fold heroes).",
  });

  checks.push({
    name: "Resource preload hints",
    status: preloads > 0 ? "pass" : "warn",
    detail:
      preloads > 0
        ? `${preloads} preload link(s) in HTML.`
        : "No preload hints — consider preloading LCP image or critical assets.",
  });

  return buildCategory("performance_hints", "Performance hints", 10, checks);
}

function checksToIssues(categories: TechnicalSeoCategory[]): TechnicalSeoIssue[] {
  const issues: TechnicalSeoIssue[] = [];
  for (const cat of categories) {
    for (const check of cat.checks) {
      if (check.status === "pass") continue;
      issues.push({
        severity:
          check.status === "fail" &&
          (cat.id === "geo_ssr" || cat.id === "metadata" || cat.id === "indexability")
            ? "critical"
            : check.status === "fail"
              ? "major"
              : "minor",
        area: cat.label,
        finding: `${check.name}: ${check.detail}`,
        recommendation: recommendationForCheck(cat.id, check.name),
      });
    }
  }
  return issues.slice(0, 12);
}

function recommendationForCheck(
  categoryId: TechnicalSeoCategory["id"],
  checkName: string,
): string {
  const map: Record<string, string> = {
    "Document title": "Add a unique 10–70 character title with primary keyword.",
    "Meta description": "Write a 50–160 character description that summarizes the page.",
    "Robots meta": "Remove noindex unless this page should stay out of search and AI indexes.",
    "Single H1": "Use one descriptive H1; demote extras to H2.",
    "Canonical URL": "Add <link rel=\"canonical\" href=\"...\"> to the preferred URL.",
    "JSON-LD present": "Add WebPage/Organization/Article JSON-LD in the HTML.",
    "Main content in HTML": "Server-render key copy (Next.js SSR, Nuxt, etc.) — AI crawlers do not run JS.",
    "Internal links in HTML": "Include crawlable <a href> links to important pages in the HTML.",
    "Viewport meta": "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
    "Image alt coverage": "Add meaningful alt text to every content image.",
    "Image dimensions": "Set width and height on images to prevent layout shift.",
  };
  if (map[checkName]) return map[checkName];
  if (categoryId === "geo_ssr") {
    return "Ensure titles, body copy, links, and JSON-LD are in the initial HTML response.";
  }
  return "Fix this HTML signal to improve technical SEO and GEO citability.";
}

function buildSummary(score: number): string {
  if (score >= 90) {
    return "Strong HTML foundation for traditional SEO and AI visibility.";
  }
  if (score >= 70) {
    return "Solid page markup with a few HTML-level gaps to close.";
  }
  if (score >= 50) {
    return "Several HTML issues may limit indexing and AI citation.";
  }
  return "Critical HTML gaps — likely hurting crawlability and GEO visibility.";
}

export function analyzeHtmlForTechnicalSeo(
  html: string,
  websiteUrl: string,
): TechnicalSeoAudit {
  const categories = [
    analyzeMetadata(html, websiteUrl),
    analyzeHeadings(html),
    analyzeIndexability(html, websiteUrl),
    analyzeStructuredData(html),
    analyzeGeoSsr(html),
    analyzeMobile(html),
    analyzeMedia(html),
    analyzePerformanceHints(html),
  ];

  const totalMax = categories.reduce((s, c) => s + c.maxPoints, 0);
  const weighted = categories.reduce((s, c) => s + (c.score * c.maxPoints) / 100, 0);
  const overallScore = Math.round((weighted / totalMax) * 100);

  const issues = checksToIssues(categories);
  const strengths = categories
    .flatMap((c) =>
      c.checks
        .filter((ch) => ch.status === "pass")
        .slice(0, 1)
        .map((ch) => `${c.label}: ${ch.name}`),
    )
    .slice(0, 6);

  const geoHighlights = categories
    .find((c) => c.id === "geo_ssr")
    ?.checks.map((c) => `${c.name} — ${c.detail}`)
    .slice(0, 4) ?? ["GEO / SSR checks unavailable."];

  const quickWins = issues
    .filter((i) => i.severity !== "critical")
    .slice(0, 4)
    .map((i) => i.recommendation);
  while (quickWins.length < 2) {
    quickWins.push("Re-fetch after fixes to validate HTML signals.");
  }

  return {
    websiteUrl,
    overallScore,
    summary: buildSummary(overallScore),
    scopeNote: TECHNICAL_SEO_SCOPE_NOTE,
    categories,
    geoHighlights,
    strengths: strengths.length > 0 ? strengths : ["Page HTML was successfully analyzed."],
    issues: issues.length > 0 ? issues : [
      {
        severity: "minor",
        area: "General",
        finding: "No failing HTML checks detected.",
        recommendation: "Run robots.txt and Core Web Vitals checks for a full technical audit.",
      },
    ],
    quickWins,
  };
}
