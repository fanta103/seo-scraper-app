"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Globe,
  Zap,
  Camera,
  Download,
  ExternalLink,
  Search,
  Layout,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import remarkGfm from "remark-gfm";
import { SpiderLoader } from "@/components/SpiderLoader";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

function messageHasVisibleContent(message: UIMessage): boolean {
  return message.parts.some(
    (part) =>
      (part.type === "text" &&
        part.text.replace(/\[SEARCHING_WEB\]/g, "").trim().length > 0) ||
      part.type === "tool-invocation" ||
      part.type === "tool-call" ||
      part.type === "tool-result" ||
      (part.type as string).startsWith("tool-"),
  );
}

function AIChatInner({
  seoReportId,
  initialMessages,
}: {
  seoReportId: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<{
    data?: string;
    mimeType?: string;
    url?: string;
    websiteUrl: string;
  } | null>(null);
  const { messages, sendMessage, status, error } = useChat({
    id: seoReportId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id,
          },
        };
      },
    }),
    onError: (err) => {
      console.error("Chat stream error:", err);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const isLoading = status === "streaming" || status === "submitted";
  const canSend = !isLoading;

  const lastMessage = messages[messages.length - 1];
  const lastAssistantMessage =
    lastMessage?.role === "assistant" ? lastMessage : null;

  const isSearching =
    lastAssistantMessage?.parts.some(
      (p) =>
        p.type === "text" &&
        p.text?.includes("[SEARCHING_WEB]") &&
        p.text.replace(/\[SEARCHING_WEB\]/g, "").trim().length === 0,
    ) ?? false;

  // Keep indicator visible through submitted + early streaming until text/tools appear
  const showPendingIndicator =
    isLoading &&
    !isSearching &&
    (!lastMessage ||
      lastMessage.role === "user" ||
      !messageHasVisibleContent(lastMessage));

  return (
    <>
      {/* Chat Widget */}
      {isExpanded && (
        <div className="fixed bottom-20 right-6 z-50 w-[500px] h-[600px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">AI SEO Assistant</h3>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isLoading ? "bg-yellow-300 animate-pulse" : "bg-green-300"
                    )}
                  />
                  <p className="text-xs text-indigo-100">
                    {isSearching ? "Searching..." : isLoading ? "Thinking..." : "Online"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                👋 Hi! Ask me anything about your SEO report.
              </div>
            )}

            {messages.map((message, idx) => {
              if (!messageHasVisibleContent(message)) return null;

              return (
                <div
                  key={`${message.id}-${idx}`}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm",
                      message.role === "user"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md"
                    )}
                  >
                    {message.parts.map((part, i) => {
                      const partAny = part as any;
                      // Handle Tool Invocations (like stealthy_fetch from MCP)
                      const isToolCall = part.type === "tool-invocation" || part.type === "tool-call" || part.type === "tool-result";
                      const isStealthyFetch =
                        (isToolCall &&
                          (partAny.toolInvocation?.toolName === "stealthy_fetch" ||
                            partAny.toolName === "stealthy_fetch")) ||
                        part.type === "tool-stealthy_fetch";
                      const isScreenshot =
                        (isToolCall &&
                          (partAny.toolInvocation?.toolName ===
                            "capture_screenshot" ||
                            partAny.toolName === "capture_screenshot")) ||
                        part.type === "tool-capture_screenshot";
                      const isUiUxAudit =
                        (isToolCall &&
                          (partAny.toolInvocation?.toolName === "audit_ui_ux" ||
                            partAny.toolName === "audit_ui_ux")) ||
                        part.type === "tool-audit_ui_ux";

                      if (isStealthyFetch) {
                        const toolInvocation = partAny.toolInvocation || partAny;
                        const state = partAny.state || toolInvocation.state || (part.type === "tool-call" ? "call" : part.type === "tool-result" ? "result" : undefined);
                        const { args } = toolInvocation;
                        const url = args?.url || "the website";

                        const isLastAssistantMessage = message.role === "assistant" && idx === messages.length - 1;
                        const isCurrentlyStreaming = isLastAssistantMessage && isLoading;

                        const hasResult =
                          state === "result" ||
                          toolInvocation.output ||
                          toolInvocation.result;
                        let phase: "extraction" | "analysis" | "complete";

                        if (
                          state === "call" ||
                          state === "input-streaming" ||
                          state === "input-available"
                        ) {
                          phase = "extraction";
                        } else if (hasResult) {
                          phase = isCurrentlyStreaming ? "analysis" : "complete";
                        } else {
                          phase = isCurrentlyStreaming ? "analysis" : "complete";
                        }

                        return (
                          <div key={`${message.id}-${i}`} className="my-4 overflow-hidden">
                            <AnimatePresence mode="wait">
                              {phase === "extraction" && (
                                <motion.div
                                  key="extraction"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className="flex items-center gap-4 p-5 bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-[2rem] shadow-sm ring-1 ring-indigo-500/5"
                                >
                                  <div className="shrink-0">
                                    <SpiderLoader size={54} speed={1.2} variant="left" />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-indigo-500 bg-white/80 dark:bg-indigo-900/40 uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-700/30 shadow-sm">Crawlera Bot 🕸️</span>
                                      <span className="w-1 h-1 bg-indigo-300 dark:bg-indigo-700 rounded-full animate-pulse" />
                                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Extraction Phase</span>
                                    </div>
                                    <div className="mt-2.5">
                                      <div className="text-[13px] font-medium text-indigo-900/80 dark:text-indigo-100/80 truncate">
                                        Crawling <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{url.replace(/^https?:\/\//, '')}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <div className="flex gap-0.5">
                                          <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                          <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                          <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
                                        </div>
                                        <div className="text-[10px] text-indigo-400/80 font-medium italic">Bypassing anti-bot protections...</div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {phase === "analysis" && (
                                <motion.div
                                  key="analysis"
                                  initial={{ opacity: 0, scale: 1.05 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className="flex items-center gap-4 p-5 bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-[2rem] shadow-sm ring-1 ring-indigo-500/5"
                                >
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-cyan-500 bg-white/80 dark:bg-indigo-900/40 uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-cyan-100/50 dark:border-indigo-700/30 shadow-sm">Crawlera Bot 🕸️</span>
                                      <span className="w-1 h-1 bg-cyan-300 dark:bg-cyan-700 rounded-full animate-pulse" />
                                      <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">Analysis Phase</span>
                                    </div>
                                    <div className="mt-2.5">
                                      <div className="text-[13px] font-medium text-indigo-900/80 dark:text-indigo-100/80">
                                        Processing <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Scraped Data</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <div className="text-[10px] text-cyan-400/80 font-medium italic">Turning data into insights...</div>
                                        <div className="flex gap-0.5">
                                          <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                                          <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                                          <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.4s]" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="shrink-0">
                                    <SpiderLoader size={54} speed={0.8} variant="right" />
                                  </div>
                                </motion.div>
                              )}

                              {phase === "complete" && (
                                <motion.div
                                  key="complete"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={cn(
                                    "flex items-center gap-4 p-5 my-4 border rounded-[2rem] transition-all duration-500 hover:shadow-md",
                                    (toolInvocation.output || toolInvocation.result)?.error
                                      ? "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50 shadow-red-500/5"
                                      : "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50 shadow-emerald-500/5"
                                  )}
                                >
                                  <div className="shrink-0">
                                    {(toolInvocation.output || toolInvocation.result)?.error ? (
                                      <SpiderLoader size={54} speed={0.5} variant="error" />
                                    ) : (
                                      <div className="p-3 bg-white dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-700/50 rounded-2xl shadow-sm">
                                        <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                        (toolInvocation.output || toolInvocation.result)?.error
                                          ? "text-red-600 bg-white dark:bg-red-900/40 border-red-100 dark:border-red-800/30"
                                          : "text-emerald-600 bg-white dark:bg-emerald-900/40 border-emerald-100 dark:border-emerald-800/30"
                                      )}>Crawlera Bot 🕸️</span>
                                      <span className={cn(
                                        "w-1 h-1 rounded-full",
                                        (toolInvocation.output || toolInvocation.result)?.error ? "bg-red-300 dark:bg-red-700" : "bg-emerald-300 dark:bg-emerald-700"
                                      )} />
                                      <span className={cn(
                                        "text-[10px] font-semibold uppercase tracking-widest",
                                        (toolInvocation.output || toolInvocation.result)?.error ? "text-red-500" : "text-emerald-500"
                                      )}>Audit {(toolInvocation.output || toolInvocation.result)?.error ? "Failed" : "Success"}</span>
                                    </div>
                                    <div className="mt-2">
                                      <div className={cn(
                                        "text-[15px] font-bold leading-tight",
                                        (toolInvocation.output || toolInvocation.result)?.error ? "text-red-900 dark:text-red-100" : "text-emerald-900 dark:text-emerald-100"
                                      )}>
                                        {(toolInvocation.output || toolInvocation.result)?.error ? "Verification Failed" : "Structure Successfully Mapped"}
                                      </div>
                                      {!(toolInvocation.output || toolInvocation.result)?.error ? (
                                        <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/60 font-medium mt-1">
                                          We’ve got you covered ! .
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-red-600/80 dark:text-red-400/60 font-medium mt-1 italic">
                                          {(() => {
                                            const res = toolInvocation.output || toolInvocation.result;
                                            const err = res?.errorText || res?.error;
                                            if (!err) return "Unknown error occurred during fetch.";
                                            if (typeof err === "string") return err;
                                            if (typeof err === "object") {
                                              return err.text || err.message || JSON.stringify(err);
                                            }
                                            return String(err);
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      if (isUiUxAudit) {
                        const toolInvocation = partAny.toolInvocation || partAny;
                        const state =
                          partAny.state ||
                          toolInvocation.state ||
                          (part.type === "tool-call"
                            ? "call"
                            : part.type === "tool-result"
                              ? "result"
                              : undefined);
                        const resultData =
                          toolInvocation.output ?? toolInvocation.result;
                        const url =
                          toolInvocation.input?.url ??
                          toolInvocation.args?.url ??
                          resultData?.screenshot?.websiteUrl ??
                          resultData?.audit?.websiteUrl ??
                          "the page";
                        const screenshotImg = resultData?.screenshot;
                        const audit = resultData?.audit;
                        const auditError =
                          resultData?.error ?? toolInvocation.errorText;
                        const isDone =
                          state === "output-available" ||
                          state === "output-error" ||
                          state === "result" ||
                          audit ||
                          auditError;

                        const scoreColor = (score: number) =>
                          score >= 75
                            ? "text-emerald-600 dark:text-emerald-400"
                            : score >= 50
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400";

                        return (
                          <div key={`${message.id}-${i}`} className="my-4 overflow-hidden">
                            <AnimatePresence mode="wait">
                              {!isDone && (
                                <motion.div
                                  key="auditing"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="flex items-center gap-4 p-5 bg-violet-50/40 dark:bg-violet-900/10 border border-violet-100/50 dark:border-violet-800/30 rounded-[2rem] shadow-sm ring-1 ring-violet-500/5"
                                >
                                  <div className="shrink-0">
                                    <SpiderLoader size={54} speed={1.2} variant="screenshot" />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-violet-600 bg-white/80 dark:bg-violet-900/40 uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-violet-100/50 dark:border-violet-700/30 shadow-sm">
                                        Design Audit
                                      </span>
                                      <span className="w-1 h-1 bg-violet-300 dark:bg-violet-700 rounded-full animate-pulse" />
                                      <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest">
                                        Capturing &amp; analyzing
                                      </span>
                                    </div>
                                    <div className="mt-2.5 text-[13px] font-medium text-violet-900/80 dark:text-violet-100/80 truncate">
                                      Reviewing{" "}
                                      <span className="text-violet-600 dark:text-violet-400 font-semibold">
                                        {String(url).replace(/^https?:\/\//, "")}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {isDone && (
                                <motion.div
                                  key="audit-done"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-4"
                                >
                                  {auditError && !audit && (
                                    <div className="flex items-center gap-4 p-5 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-[2rem]">
                                      <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                                      <div>
                                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">
                                          UI/UX Audit Failed
                                        </div>
                                        <div className="text-[12px] text-red-700 dark:text-red-300">
                                          {typeof auditError === "string"
                                            ? auditError
                                            : JSON.stringify(auditError)}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {screenshotImg?.data || screenshotImg?.url?.startsWith("/api/") ? (
                                    <div className="rounded-[1.5rem] overflow-hidden border border-violet-100 dark:border-violet-800/40 shadow-lg bg-white dark:bg-gray-900">
                                      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800/30">
                                        <div className="flex items-center gap-2">
                                          <Layout className="w-3.5 h-3.5 text-violet-600" />
                                          <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 truncate max-w-[220px]">
                                            {String(url).replace(/^https?:\/\//, "")}
                                          </span>
                                        </div>
                                      </div>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={
                                          screenshotImg.data
                                            ? `data:${screenshotImg.mimeType};base64,${screenshotImg.data}`
                                            : screenshotImg.url
                                        }
                                        alt={`Screenshot of ${url}`}
                                        className="w-full h-auto object-top block"
                                        style={{ maxHeight: "320px", objectFit: "cover" }}
                                      />
                                    </div>
                                  ) : null}

                                  {audit && (
                                    <div className="rounded-[1.5rem] border border-violet-100 dark:border-violet-800/40 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                                      <div className="px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800/30 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                          <Layout className="w-4 h-4 text-violet-600" />
                                          <span className="text-sm font-bold text-violet-900 dark:text-violet-100">
                                            UI/UX Audit
                                          </span>
                                        </div>
                                        <span
                                          className={cn(
                                            "text-2xl font-black tabular-nums",
                                            scoreColor(audit.overallScore),
                                          )}
                                        >
                                          {audit.overallScore}
                                          <span className="text-xs font-semibold text-gray-400 ml-0.5">
                                            /100
                                          </span>
                                        </span>
                                      </div>

                                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                          {audit.summary}
                                        </p>
                                      </div>

                                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                          Category scores
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {audit.categories?.map(
                                            (cat: {
                                              name: string;
                                              score: number;
                                              summary: string;
                                            }) => (
                                              <div
                                                key={cat.name}
                                                className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                                              >
                                                <div className="flex items-center justify-between gap-1">
                                                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 capitalize truncate">
                                                    {cat.name.replace(/_/g, " ")}
                                                  </span>
                                                  <span
                                                    className={cn(
                                                      "text-xs font-bold",
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
                                            ),
                                          )}
                                        </div>
                                      </div>

                                      {audit.strengths?.length > 0 && (
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Strengths
                                          </div>
                                          <ul className="space-y-1">
                                            {audit.strengths.map((s: string, j: number) => (
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

                                      {audit.issues?.length > 0 && (
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">
                                            <AlertTriangle className="w-3 h-3" />
                                            Issues
                                          </div>
                                          <ul className="space-y-2">
                                            {audit.issues.map(
                                              (
                                                issue: {
                                                  severity: string;
                                                  area: string;
                                                  finding: string;
                                                  recommendation: string;
                                                },
                                                j: number,
                                              ) => (
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
                                                  <p className="text-violet-600 dark:text-violet-400 mt-1">
                                                    → {issue.recommendation}
                                                  </p>
                                                </li>
                                              ),
                                            )}
                                          </ul>
                                        </div>
                                      )}

                                      {audit.quickWins?.length > 0 && (
                                        <div className="px-4 py-3">
                                          <div className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-2">
                                            Quick wins
                                          </div>
                                          <ul className="space-y-1">
                                            {audit.quickWins.map((q: string, j: number) => (
                                              <li
                                                key={j}
                                                className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5"
                                              >
                                                <span className="text-violet-500">⚡</span>
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

                      if (isScreenshot) {
                        const toolInvocation = partAny.toolInvocation || partAny;
                        const state =
                          partAny.state ||
                          toolInvocation.state ||
                          (part.type === "tool-call"
                            ? "call"
                            : part.type === "tool-result"
                              ? "result"
                              : undefined);
                        const resultData =
                          toolInvocation.output ?? toolInvocation.result;

                        const url =
                          toolInvocation.input?.url ??
                          toolInvocation.args?.url ??
                          resultData?.screenshot?.websiteUrl ??
                          "the page";
                        const screenshotImg = resultData?.screenshot;
                        const screenshotError =
                          resultData?.error ?? toolInvocation.errorText;

                        const screenshotPhase =
                          state === "output-available" ||
                          state === "output-error" ||
                          state === "result" ||
                          screenshotImg?.data ||
                          screenshotImg?.url ||
                          screenshotError
                            ? "done"
                            : "rendering";

                        return (
                          <div key={`${message.id}-${i}`} className="my-4 overflow-hidden">
                            <AnimatePresence mode="wait">
                              {screenshotPhase === "rendering" && (
                                <motion.div
                                  key="rendering"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.4, ease: "easeOut" }}
                                  className="flex items-center gap-4 p-5 bg-emerald-50/40 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30 rounded-[2rem] shadow-sm ring-1 ring-emerald-500/5"
                                >
                                  <div className="shrink-0">
                                    <SpiderLoader size={54} speed={1.4} variant="screenshot" />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-emerald-600 bg-white/80 dark:bg-emerald-900/40 uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-emerald-100/50 dark:border-emerald-700/30 shadow-sm">
                                        Crawlero Bot 📸
                                      </span>
                                      <span className="w-1 h-1 bg-emerald-300 dark:bg-emerald-700 rounded-full animate-pulse" />
                                      <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">
                                        Rendering Page
                                      </span>
                                    </div>
                                    <div className="mt-2.5">
                                      <div className="text-[13px] font-medium text-emerald-900/80 dark:text-emerald-100/80 truncate">
                                        Capturing{" "}
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                          {url.replace(/^https?:\/\//, "")}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <div className="flex gap-0.5">
                                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" />
                                        </div>
                                        <div className="text-[10px] text-emerald-500/80 font-medium italic">
                                          Waiting for page to fully render...
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {screenshotPhase === "done" && (
                                <motion.div
                                  key="done"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                >
                                  {screenshotError ? (
                                    <div className="flex items-center gap-4 p-5 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-[2rem]">
                                      <div className="shrink-0">
                                        <SpiderLoader size={54} speed={0.5} variant="error" />
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">
                                          Screenshot Failed
                                        </div>
                                        <div className="text-[12px] text-red-700 dark:text-red-300 italic">
                                          {typeof screenshotError === "string"
                                            ? screenshotError
                                            : JSON.stringify(screenshotError)}
                                        </div>
                                      </div>
                                    </div>
                                  ) : screenshotImg && !screenshotImg.data && !screenshotImg.url?.startsWith("/api/") ? (
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-600 dark:text-gray-400">
                                      <Camera className="w-4 h-4 shrink-0" />
                                      Screenshot of{" "}
                                      {url.replace(/^https?:\/\//, "")} is no
                                      longer in this session. Ask again to
                                      capture a fresh preview.
                                    </div>
                                  ) : screenshotImg?.data || screenshotImg?.url ? (
                                    <div className="rounded-[1.5rem] overflow-hidden border border-emerald-100 dark:border-emerald-800/40 shadow-lg bg-white dark:bg-gray-900">
                                      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/30">
                                        <div className="flex items-center gap-2">
                                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 truncate max-w-[220px]">
                                            {url.replace(/^https?:\/\//, "")}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <a
                                            href={screenshotImg.data ? `data:${screenshotImg.mimeType};base64,${screenshotImg.data}` : screenshotImg.url}
                                            download={`screenshot-${Date.now()}.png`}
                                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors"
                                            title="Download screenshot"
                                          >
                                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                                          </a>
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors"
                                            title="Open page"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                                          </a>
                                        </div>
                                      </div>
                                      <div
                                        className="relative cursor-zoom-in group"
                                        onClick={() =>
                                          setFullScreenImage({
                                            data: screenshotImg.data,
                                            mimeType: screenshotImg.mimeType,
                                            url: screenshotImg.url,
                                            websiteUrl: url,
                                          })
                                        }
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={screenshotImg.data ? `data:${screenshotImg.mimeType};base64,${screenshotImg.data}` : screenshotImg.url}
                                          alt={`Screenshot of ${url}`}
                                          className="w-full h-auto object-top block transition-transform duration-500 group-hover:scale-[1.02]"
                                          style={{
                                            maxHeight: "420px",
                                            objectFit: "cover",
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <div className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                            <Search className="w-5 h-5 text-indigo-600" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : null}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      if (part.type === "text") {
                        const cleanText = part.text.replace(/\[SEARCHING_WEB\]/g, "").trim();
                        if (!cleanText) return null;
                        return (
                          <div key={`${message.id}-${i}`} className="leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="mb-3 pl-4 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="mb-3 pl-4 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                a: ({ children, href }) => (
                                  <a
                                    href={href}
                                    className="text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                                h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                code: ({ children }) => (
                                  <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                ),
                                pre: ({ children }) => (
                                  <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto mb-3">
                                    {children}
                                  </pre>
                                ),
                              }}
                            >
                              {cleanText}
                            </ReactMarkdown>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            })}

            {/* Searching indicator — shown when [SEARCHING_WEB] token detected */}
            {isSearching && isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Searching the web…</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pending indicator — until assistant text or tool UI is visible */}
            {showPendingIndicator && (
              <div className="flex justify-start">
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      AI is thinking…
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div >

          {/* Input */}
          <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            {error && (
              <p className="mb-2 text-xs text-red-600 dark:text-red-400">
                {error.message}
              </p>
            )}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your SEO report..."
                className="flex-1 h-11 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400"
                disabled={!canSend}
              />
              <Button
                type="submit"
                disabled={!input.trim() || !canSend}
                className="h-11 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div >
      )
      }

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10"
            onClick={() => setFullScreenImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-full max-h-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-12 left-0 right-0 flex items-center justify-between text-white px-2">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium truncate max-w-[200px] md:max-w-md">
                    {fullScreenImage.websiteUrl}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={fullScreenImage.data ? `data:${fullScreenImage.mimeType};base64,${fullScreenImage.data}` : (fullScreenImage.url || "")}
                    download={`screenshot-${Date.now()}.png`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden md:inline">Download</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setFullScreenImage(null)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto custom-scrollbar rounded-xl shadow-2xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fullScreenImage.data ? `data:${fullScreenImage.mimeType};base64,${fullScreenImage.data}` : (fullScreenImage.url || "")}
                  alt="Full screen screenshot"
                  className="max-w-none block"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105"
        >
          {isExpanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>
    </>
  );
}

function AIChat({ seoReportId }: { seoReportId: string }) {
  const { user } = useUser();
  const savedMessages = useQuery(
    api.reportChats.getMessages,
    user?.id ? { snapshotId: seoReportId, userId: user.id } : "skip",
  );

  if (savedMessages === undefined) {
    return null;
  }

  return (
    <AIChatInner seoReportId={seoReportId} initialMessages={savedMessages} />
  );
}

export default AIChat;