"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "lucide-react";
import { SeoReport } from "@/lib/seo-schema";

interface SourceDistributionChartProps {
  seoReport: SeoReport;
}

export function SourceDistributionChart({ seoReport }: SourceDistributionChartProps) {
  const sourceTypes = seoReport?.inventory?.source_types ?? {};
  const rows = Object.entries(sourceTypes)
    .map(([type, list]) => ({
      type,
      count: Array.isArray(list) ? list.length : 0,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  const colors = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#a855f7", // purple
    "#06b6d4", // cyan
    "#f97316", // orange
    "#14b8a6", // teal
  ];

  const donut = (() => {
    const radius = 54;
    const strokeWidth = 16;
    const circumference = 2 * Math.PI * radius;
    const gap = 2.5; // visual separation between segments (in px of stroke length)

    let offset = 0;
    const segments = rows.map((r, idx) => {
      const frac = total > 0 ? r.count / total : 0;
      const rawLen = Math.max(0, frac * circumference);
      const len = Math.max(0, rawLen - gap);
      const seg = {
        key: r.type,
        color: colors[idx % colors.length],
        dasharray: `${len} ${Math.max(0, circumference - len)}`,
        dashoffset: -offset,
      };
      offset += rawLen;
      return seg;
    });

    return { radius, strokeWidth, circumference, segments };
  })();

  return (
    <Card className="border bg-gradient-to-br from-card to-card/95 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <PieChart className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <CardTitle className="text-xl">Source Types Distribution</CardTitle>
              <CardDescription className="text-base">
                Breakdown of data sources by type and volume
              </CardDescription>
            </div>
          </div>

          <Badge variant="secondary" className="shrink-0">
            {total} sources
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No sources available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center justify-center">
              <div className="relative w-[240px] h-[240px]">
                <svg
                  viewBox="0 0 140 140"
                  className="w-full h-full -rotate-90 drop-shadow-[0_10px_25px_rgba(0,0,0,0.18)]"
                  role="img"
                  aria-label="Source breakdown donut chart"
                >
                  <defs>
                    {donut.segments.map((s) => (
                      <linearGradient
                        key={`g-${s.key}`}
                        id={`sdg-${encodeURIComponent(s.key)}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={s.color} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={s.color} stopOpacity="0.65" />
                      </linearGradient>
                    ))}
                    <filter id="sd-softGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <circle
                    cx="70"
                    cy="70"
                    r={donut.radius}
                    fill="transparent"
                    stroke="hsl(var(--muted))"
                    strokeWidth={donut.strokeWidth}
                  />
                  {donut.segments.map((s) => (
                    <circle
                      key={s.key}
                      cx="70"
                      cy="70"
                      r={donut.radius}
                      fill="transparent"
                      stroke={`url(#sdg-${encodeURIComponent(s.key)})`}
                      strokeWidth={donut.strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={s.dasharray}
                      strokeDashoffset={s.dashoffset}
                      filter="url(#sd-softGlow)"
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-xs text-muted-foreground">Source Breakdown</div>
                  <div className="text-4xl font-bold tracking-tight">{total}</div>
                  <div className="text-xs text-muted-foreground">total</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((r, idx) => {
                const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                const color = colors[idx % colors.length];
                return (
                  <div
                    key={r.type}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-[0_0_0_3px_rgba(0,0,0,0.10)]"
                        style={{ backgroundColor: color }}
                      />
                      <div className="text-sm font-medium truncate capitalize">
                        {r.type.replace(/_/g, " ")}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground tabular-nums shrink-0">
                      {r.count}{" "}
                      <span className="text-muted-foreground/70">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}