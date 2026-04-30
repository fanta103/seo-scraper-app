"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Loader2, Globe, Shield, Zap, Search, FileText } from "lucide-react";
import remarkGfm from "remark-gfm";
import { SpiderLoader } from "@/components/SpiderLoader";

function AIChat({ seoReportId }: { seoReportId: string }) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, sendMessage, status } = useChat({
    id: seoReportId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { id: seoReportId },
    }),
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
  const isTyping = status === "submitted";

  // Detect [SEARCHING_WEB] token in the last assistant message
  const lastAssistantMessage = messages[messages.length - 1]?.role === "assistant"
    ? messages[messages.length - 1]
    : null;

  const isSearching = lastAssistantMessage?.parts.some(
    (p) => p.type === "text" && p.text?.includes("[SEARCHING_WEB]") && p.text.replace(/\[SEARCHING_WEB\]/g, "").trim().length === 0
  ) ?? false;

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
              const hasVisibleContent = message.parts.some(part =>
                (part.type === "text" && part.text.replace(/\[SEARCHING_WEB\]/g, "").trim().length > 0) ||
                (part.type === "tool-invocation") ||
                (part.type === "tool-call") ||
                (part.type === "tool-result") ||
                (part.type as string).startsWith("tool-")
              );

              if (!hasVisibleContent) return null;

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
                      const partAny = part as any;                      // Handle Tool Invocations (like stealthy_fetch from MCP)
                      const isToolCall = part.type === "tool-invocation" || part.type === "tool-call" || part.type === "tool-result";
                      const isStealthyFetch = (isToolCall && (partAny.toolInvocation?.toolName === "stealthy_fetch" || partAny.toolName === "stealthy_fetch")) || part.type === "tool-stealthy_fetch";

                      if (isStealthyFetch) {
                        const toolInvocation = partAny.toolInvocation || partAny;
                        const state = partAny.state || toolInvocation.state || (part.type === "tool-call" ? "call" : part.type === "tool-result" ? "result" : undefined);
                        const { args, result } = toolInvocation;
                        const url = args?.url || "the website";

                        if (state === "call" || state === "input-streaming" || state === "input-available") {
                          return (
                            <div key={`${message.id}-${i}`} className="flex items-center gap-4 p-5 my-4 bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-[2rem] shadow-sm ring-1 ring-indigo-500/5 transition-all duration-700">
                              <div className="relative">
                                <SpiderLoader size={54} speed={1.2} />
                              </div>
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-indigo-500 bg-white/80 dark:bg-indigo-900/40 uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-700/30 shadow-sm">Scrapling Bot</span>
                                  <span className="w-1 h-1 bg-indigo-300 dark:bg-indigo-700 rounded-full animate-pulse" />
                                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Deep Extraction Phase</span>
                                </div>
                                <div className="mt-2.5">
                                  <div className="text-[13px] font-medium text-indigo-900/80 dark:text-indigo-100/80">
                                    Auditing <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{url.replace(/^https?:\/\//, '')}</span>
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
                            </div>
                          );
                        }

                        if (state === "result" || state === "output-available") {
                          const resultData = toolInvocation.output || toolInvocation.result;
                          const isError = resultData?.error || !resultData;
                          const errorText = resultData?.errorText || resultData?.error || "Unknown error";

                          return (
                            <div key={`${message.id}-${i}`} className={cn(
                              "flex items-center gap-3 p-4 my-3 border rounded-2xl transition-all duration-500 hover:shadow-md",
                              isError
                                ? "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50 shadow-red-500/5"
                                : "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50 shadow-emerald-500/5"
                            )}>
                              <div className={cn(
                                "p-2.5 rounded-xl shadow-sm border",
                                isError
                                  ? "bg-white dark:bg-red-900/40 border-red-100 dark:border-red-700/50"
                                  : "bg-white dark:bg-emerald-900/40 border-emerald-100 dark:border-emerald-700/50"
                                )}>
                                {isError ? (
                                  <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                                ) : (
                                  <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                )}
                              </div>
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                    isError ? "text-red-600 bg-red-100 dark:bg-red-900/60" : "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60"
                                  )}>Scrapling Bot</span>
                                  <span className={cn(
                                    "w-1 h-1 rounded-full",
                                    isError ? "bg-red-300 dark:bg-red-700" : "bg-emerald-300 dark:bg-emerald-700"
                                  )} />
                                  <span className={cn(
                                    "text-[10px] font-medium uppercase tracking-widest",
                                    isError ? "text-red-500" : "text-emerald-500"
                                  )}>Audit {isError ? "Failed" : "Success"}</span>
                                </div>
                                <div className="mt-2">
                                  <div className={cn(
                                    "text-sm font-semibold",
                                    isError ? "text-red-900 dark:text-red-100" : "text-emerald-900 dark:text-emerald-100"
                                  )}>
                                    {isError ? "Verification Failed" : "DOM Analysis Complete"}
                                  </div>
                                  {!isError ? (
                                    <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/60 font-mono mt-1">
                                      Metadata, structure, and accessibility tags extracted.
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-red-600/80 dark:text-red-400/60 font-mono mt-1">
                                      {errorText}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
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

            {/* Typing indicator — shown while loading and NOT searching */}
            {isTyping && !isSearching && (
              <div className="flex justify-start">
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI is Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div >

          {/* Input */}
          < div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50" >
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your SEO report..."
                className="flex-1 h-11 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-11 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div >
        </div >
      )
      }

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

export default AIChat;