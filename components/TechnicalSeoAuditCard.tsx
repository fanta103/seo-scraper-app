"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  Sparkles,
} from "lucide-react";
import { SpiderLoader } from "@/components/SpiderLoader";
import { cn } from "@/lib/utils";

export type TechnicalSeoAuditPayload = {
  websiteUrl?: string;
  overallScore: number;
  summary: string;
  scopeNote?: string;
  categories?: Array<{
    id: string;
    label: string;
    score: number;
    maxPoints?: number;
    summary: string;
    checks?: Array<{
      name: string;
      status: "pass" | "warn" | "fail";
      detail: string;
    }>;
  }>;
  geoHighlights?: string[];
  strengths?: string[];
  issues?: Array<{
    severity: string;
    area: string;
    finding: string;
    recommendation: string;
  }>;
  quickWins?: string[];
};

function scoreColor(score: number) {
  return score >= 75
    ? "text-emerald-600 dark:text-emerald-400"
    : score >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";
}

function checkStatusStyle(status: string) {
  if (status === "pass")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (status === "warn")
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

export function TechnicalSeoAuditCard({
  url,
  audit,
  auditError,
  isDone,
  fetchMeta,
}: {
  url: string;
  audit?: TechnicalSeoAuditPayload;
  auditError?: unknown;
  isDone: boolean;
  fetchMeta?: { status?: number; htmlLength?: number };
}) {
  const displayUrl = String(url).replace(/^https?:\/\//, "");

  return (
    <div className="my-4 overflow-hidden">
      <AnimatePresence mode="wait">
        {!isDone && (
          <motion.div
            key="seo-auditing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-4 p-5 bg-cyan-50/40 dark:bg-cyan-900/10 border border-cyan-100/50 dark:border-cyan-800/30 rounded-[2rem] shadow-sm ring-1 ring-cyan-500/5"
          >
            <div className="shrink-0">
              <SpiderLoader size={54} speed={1.2} variant="left" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-600 bg-white/80 dark:bg-cyan-900/40 uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-cyan-100/50 dark:border-cyan-700/30 shadow-sm">
                  Technical SEO
                </span>
                <span className="w-1 h-1 bg-cyan-300 dark:bg-cyan-700 rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold text-cyan-500 uppercase tracking-widest">
                  Fetching &amp; analyzing HTML
                </span>
              </div>
              <div className="mt-2.5 text-[13px] font-medium text-cyan-900/80 dark:text-cyan-100/80 truncate">
                Auditing{" "}
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                  {displayUrl}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {isDone && (
          <motion.div
            key="seo-audit-done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {auditError && !audit && (
              <div className="flex items-center gap-4 p-5 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-[2rem]">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">
                    Technical SEO Audit Failed
                  </div>
                  <div className="text-[12px] text-red-700 dark:text-red-300">
                    {typeof auditError === "string"
                      ? auditError
                      : JSON.stringify(auditError)}
                  </div>
                </div>
              </div>
            )}

            {audit && (
              <div className="rounded-[1.5rem] border border-cyan-100 dark:border-cyan-800/40 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                <div className="px-4 py-3 bg-cyan-50 dark:bg-cyan-900/20 border-b border-cyan-100 dark:border-cyan-800/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span className="text-sm font-bold text-cyan-900 dark:text-cyan-100 truncate">
                      Technical SEO / GEO
                    </span>
                    <a
                      href={audit.websiteUrl ?? url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-800/40 shrink-0"
                      title="Open page"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                    </a>
                  </div>
                  <span
                    className={cn(
                      "text-2xl font-black tabular-nums shrink-0",
                      scoreColor(audit.overallScore),
                    )}
                  >
                    {audit.overallScore}
                    <span className="text-xs font-semibold text-gray-400 ml-0.5">
                      /100
                    </span>
                  </span>
                </div>

                {fetchMeta && (
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                    {fetchMeta.status != null && (
                      <span className="flex items-center gap-1">
                        <Code2 className="w-3 h-3" />
                        HTTP {fetchMeta.status}
                      </span>
                    )}
                    {fetchMeta.htmlLength != null && (
                      <span>
                        Refined HTML analyzed:{" "}
                        {(fetchMeta.htmlLength / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                )}

                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {audit.summary}
                  </p>
                  {audit.scopeNote && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 italic leading-relaxed">
                      {audit.scopeNote}
                    </p>
                  )}
                </div>

                {audit.geoHighlights && audit.geoHighlights.length > 0 && (
                  <div className="px-4 py-3 border-b border-cyan-100/80 dark:border-cyan-800/30 bg-cyan-50/30 dark:bg-cyan-950/20">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-widest mb-2">
                      <Sparkles className="w-3 h-3" />
                      GEO highlights
                    </div>
                    <ul className="space-y-1">
                      {audit.geoHighlights.map((line, j) => (
                        <li
                          key={j}
                          className="text-xs text-cyan-900/90 dark:text-cyan-100/80 flex gap-1.5"
                        >
                          <span className="text-cyan-500 shrink-0">•</span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Category scores
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {audit.categories?.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 truncate">
                            {cat.label}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-bold shrink-0",
                              scoreColor(cat.score),
                            )}
                          >
                            {cat.score}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {cat.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {(() => {
                  const actionableChecks = audit.categories?.flatMap((cat) =>
                    (cat.checks ?? [])
                      .filter((c) => c.status !== "pass")
                      .map((check) => ({ ...check, categoryLabel: cat.label })),
                  );
                  if (!actionableChecks?.length) return null;
                  return (
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Needs attention
                      </div>
                      <ul className="space-y-1.5">
                        {actionableChecks.map((check, j) => (
                          <li
                            key={`${check.name}-${j}`}
                            className="flex items-start gap-2 text-xs"
                          >
                            <span
                              className={cn(
                                "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                                checkStatusStyle(check.status),
                              )}
                            >
                              {check.status}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 min-w-0">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {check.categoryLabel} ·{" "}
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {check.name}
                              </span>
                              {" — "}
                              {check.detail}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {audit.strengths && audit.strengths.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">
                      <CheckCircle2 className="w-3 h-3" />
                      Strengths
                    </div>
                    <ul className="space-y-1">
                      {audit.strengths.map((s, j) => (
                        <li
                          key={j}
                          className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5"
                        >
                          <span className="text-emerald-500">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {audit.issues && audit.issues.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">
                      <AlertTriangle className="w-3 h-3" />
                      Issues
                    </div>
                    <ul className="space-y-2">
                      {audit.issues.map((issue, j) => (
                        <li
                          key={j}
                          className="text-xs rounded-lg p-2 bg-gray-50 dark:bg-gray-800/60"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={cn(
                                "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                                issue.severity === "critical"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  : issue.severity === "major"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                              )}
                            >
                              {issue.severity}
                            </span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {issue.area}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {issue.finding}
                          </p>
                          <p className="text-cyan-600 dark:text-cyan-400 mt-1">
                            → {issue.recommendation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {audit.quickWins && audit.quickWins.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-2">
                      Quick wins
                    </div>
                    <ul className="space-y-1">
                      {audit.quickWins.map((q, j) => (
                        <li
                          key={j}
                          className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5"
                        >
                          <span className="text-cyan-500">⚡</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
