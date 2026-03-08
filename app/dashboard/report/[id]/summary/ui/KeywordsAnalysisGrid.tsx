"use client";

import React from "react";
import { Search, Layers, Target, TrendingUp, Info } from "lucide-react";
import { SeoReport } from "@/lib/seo-schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KeywordsAnalysisGridProps {
  seoReport: SeoReport;
}

export function KeywordsAnalysisGrid({ seoReport }: KeywordsAnalysisGridProps) {
  // Helper to map intents to your existing color palette
  const getIntentStyles = (intent?: string) => {
    switch (intent) {
      case "transactional":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      case "navigational":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
      case "commercial":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
      default: // informational
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Content Keywords (The "Left" Style) */}
      <Card className="border bg-gradient-to-br from-card to-card/95">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
              <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Content Keywords</CardTitle>
              <CardDescription>Primary keywords identified in your content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {seoReport.keywords.content_keywords.map((kw, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 bg-white/50 dark:bg-black/20 transition-all hover:shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">{kw.keyword}</span>
                <Badge className={`${getIntentStyles(kw.intent)} border-0 capitalize`}>
                  {kw.intent || "informational"}
                </Badge>
              </div>
              {kw.evidence?.[0] && (
                <div className="pl-3 border-l-2 border-primary/20">
                  <p className="text-sm text-muted-foreground italic">&ldquo;{kw.evidence[0].quote}&rdquo;</p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2. Keyword Themes (The "Right" Style) */}
      <Card className="border bg-gradient-to-br from-card to-card/95">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50">
              <Layers className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Keyword Themes</CardTitle>
              <CardDescription>Broad topics and thematic clusters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {seoReport.keywords.keyword_themes.map((theme, i) => (
            <div key={i} className="p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-950/10">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg text-orange-900 dark:text-orange-100">{theme.theme}</span>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  {theme.keywords.length} terms
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {theme.keywords.map((word, idx) => (
                  <span key={idx} className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/40">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}