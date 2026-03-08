"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Search,
  Target,
  TrendingUp,
  CheckCircle,
  Award,
  BarChart3,
  PieChart,
  Layers,
} from "lucide-react";
import { SeoReport } from "@/lib/seo-schema";

interface AdditionalAnalysisGridProps {
  seoReport: SeoReport;
}

export function AdditionalAnalysisGrid({ seoReport }: AdditionalAnalysisGridProps) {
  // 1. Process Content Themes
  const contentThemes = (seoReport?.content_analysis?.content_themes || [])
    .map((t) => ({ theme: t.theme, frequency: t.frequency }))
    .filter((t) => typeof t.frequency === "number" && Number.isFinite(t.frequency));

  // 2. Process Domain Quality Distribution (Mocking logic based on source quality_score)
  const sourceTypes = seoReport?.inventory?.source_types || {};
  const allSources = Object.values(sourceTypes).flat();
  const qualityDist = {
    high: allSources.filter(s => (s?.quality_score || 0) >= 0.7).length,
    medium: allSources.filter(s => (s?.quality_score || 0) >= 0.4 && (s?.quality_score || 0) < 0.7).length,
    low: allSources.filter(s => (s?.quality_score || 0) < 0.4).length,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT COLUMN: BACKLINK SOURCES */}
      <Card className="border bg-gradient-to-br from-card to-card/95">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
              <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Backlink Sources</CardTitle>
              <CardDescription className="text-base">
                External sources linking to or mentioning the entity
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 max-h-[600px] overflow-y-auto pr-2">
            {(seoReport?.backlink_analysis?.backlink_sources || []).map((source, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border bg-white/50 dark:bg-black/10 border-indigo-100 dark:border-indigo-900/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex-shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-lg leading-tight line-clamp-2">{source.title}</h4>
                      <Badge variant="secondary" className="capitalize ml-2 whitespace-nowrap">
                        {source.source_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{source.description}</p>
                    <div className="flex items-center justify-between">
                      <a href={source.url} target="_blank" className="text-primary text-sm hover:underline truncate font-medium">
                        {source.domain}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RIGHT COLUMN: CONTENT & DOMAIN ANALYSIS */}
      <div className="space-y-8">
        <Card className="border bg-gradient-to-br from-card to-card/95">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50">
                <Search className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Content Analysis</CardTitle>
                <CardDescription className="text-base">Themes and sentiment</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Themes */}
            <div className="p-5 rounded-xl border bg-teal-50/30 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-teal-600" />
                <h4 className="font-bold text-lg">Content Themes</h4>
              </div>
              <div className="grid gap-3">
                {contentThemes.map((theme) => (
                  <div key={theme.theme} className="flex items-center justify-between p-3 bg-white/80 dark:bg-black/40 rounded-lg">
                    <span className="font-medium text-teal-900 dark:text-teal-100">{theme.theme}</span>
                    <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50">{theme.frequency}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div className="p-5 rounded-xl border bg-orange-50/30 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-orange-600" />
                <h4 className="font-bold text-lg">Sentiment Analysis</h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="capitalize font-semibold text-xl text-orange-700 dark:text-orange-400">
                  {seoReport?.content_analysis?.sentiment?.overall || "Neutral"}
                </span>
                <Badge variant="outline" className="border-orange-300 text-orange-700">Overall Sentiment</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain Quality & Inventory Breakdown */}
        <Card className="border bg-gradient-to-br from-card to-card/95">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
                <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle>Inventory & Quality</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quality Distribution Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Domain Quality Distribution</span>
              </div>
              <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted">
                <div className="bg-green-500" style={{ width: `${(qualityDist.high / allSources.length) * 100 || 0}%` }} />
                <div className="bg-amber-500" style={{ width: `${(qualityDist.medium / allSources.length) * 100 || 0}%` }} />
                <div className="bg-red-500" style={{ width: `${(qualityDist.low / allSources.length) * 100 || 0}%` }} />
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground justify-center">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"/> High</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"/> Mid</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/> Low</span>
              </div>
            </div>

            {/* Source Types List */}
            <div className="p-5 rounded-xl border bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
               <div className="flex items-center gap-2 mb-4">
                <Layers className="h-5 w-5 text-amber-600" />
                <h4 className="font-bold text-lg">Source Types</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(sourceTypes).map(([type, list]) => (
                  list && list.length > 0 && (
                    <div key={type} className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-md border border-amber-100 dark:border-amber-900">
                      <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                      <span className="text-sm font-bold">{list.length}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}