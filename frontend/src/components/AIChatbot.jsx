"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  RotateCcw,
  Bot,
  Copy,
  Check,
  PanelRightClose,
  Database,
  Cpu,
  ShieldCheck,
  Terminal,
  RefreshCw,
  Clock,
  Wrench,
} from "lucide-react";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const [userRole, setUserRole] = useState("ROLE_PG_OWNER");
  const [userName, setUserName] = useState("User");

  // Initial greeting tailored to user role
  const getInitialGreeting = useCallback((role, name) => {
    if (role === "ROLE_TENANT") {
      return {
        id: "welcome-1",
        sender: "ai",
        source: "GEMINI_AI",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### 🤖 Antigravity AI Copilot Online\n\nHello **${name}**! I'm your dedicated PG assistant connected live to your records.\n\nYou can ask about:\n- 💳 **Pending rent dues** & invoice breakdown\n- 🏠 **Your assigned room & bed** details\n- 🛠️ **Status of your complaints** & requests\n- 📅 Checkout and notice policies`,
      };
    }
    return {
      id: "welcome-1",
      sender: "ai",
      source: "GEMINI_AI",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: `### ⚡ Antigravity PG Copilot Online\n\nGreetings **${name}**! I am your AI management co-pilot, connected in real-time to your PostgreSQL database and powered by Google Gemini.\n\nQuick operations you can run:\n- 💸 *"Give me list of tenants who have not paid fees"*\n- 🛏️ *"Show vacant beds and room occupancy"*\n- ⚠️ *"Any open maintenance complaints?"*\n- 👥 *"List active tenants with phone and rent"*\n- 📊 *"Monthly revenue & collection summary"*`,
    };
  }, []);

  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const role = Cookies.get("role") || "ROLE_PG_OWNER";
    const name = Cookies.get("user_name") || "Owner";
    setUserRole(role);
    setUserName(name);
    setMessages([getInitialGreeting(role, name)]);
  }, [getInitialGreeting]);

  // Global event listener to open sidebar from topbar or keyboard shortcuts
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    const handleToggleEvent = () => setIsOpen((prev) => !prev);

    const handleKeyDown = (e) => {
      // Toggle sidebar with Ctrl+J or Cmd+J
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("open-ai-copilot", handleOpenEvent);
    window.addEventListener("toggle-ai-copilot", handleToggleEvent);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-ai-copilot", handleOpenEvent);
      window.removeEventListener("toggle-ai-copilot", handleToggleEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Default suggested prompt chips based on role
  const getDefaultPrompts = () => {
    if (userRole === "ROLE_TENANT") {
      return [
        "What are my pending dues?",
        "Show my room & bed info",
        "What is the status of my complaints?",
        "How to submit checkout notice?",
      ];
    }
    return [
      "Tenants not paying fees",
      "Show vacant beds & rooms",
      "Any open maintenance complaints?",
      "List active tenants with rent",
      "Monthly revenue summary",
    ];
  };

  const handleSendMessage = async (textToSend) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent || loading) return;

    const userMsg = {
      id: "msg-" + Date.now(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: messageContent,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);
    setLastFailedMessage(null);

    try {
      const response = await api.post("/ai/chat", {
        message: messageContent,
        conversationId: conversationId || undefined,
      });

      const aiReply = response.data;
      if (aiReply.conversationId) {
        setConversationId(aiReply.conversationId);
      }
      if (Array.isArray(aiReply.suggestedActions) && aiReply.suggestedActions.length > 0) {
        setDynamicSuggestions(aiReply.suggestedActions);
      }

      const aiMsg = {
        id: "ai-" + Date.now(),
        sender: "ai",
        source: aiReply.source || "GEMINI_AI",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: aiReply.reply || "I couldn't process that request.",
        latencyMs: aiReply.latencyMs,
        toolInvoked: aiReply.toolInvoked,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      setLastFailedMessage(messageContent);
      const isRateLimit = err.response?.status === 429;
      const errMsg = {
        id: "err-" + Date.now(),
        sender: "ai",
        source: isRateLimit ? "RATE_LIMITED" : "ERROR",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text:
          err.response?.data?.message ||
          (isRateLimit
            ? "⚠️ Rate limit reached. Please wait a moment before trying again."
            : "⚠️ Unable to contact AI service. Please verify your connection or retry."),
        canRetry: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDownInput = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    if (conversationId) {
      try {
        await api.delete(`/ai/conversations/${conversationId}`);
      } catch (ignored) {
      }
    }
    setConversationId(null);
    setDynamicSuggestions([]);
    setLastFailedMessage(null);
    setMessages([getInitialGreeting(userRole, userName)]);
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Safe Markdown rendering without innerHTML / XSS risks
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split("\n");
    return lines.map((line, lineIdx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={lineIdx} className="font-bold text-sm text-slate-900 dark:text-white mt-2 mb-1 flex items-center gap-1.5">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2);
        return (
          <div key={lineIdx} className="flex items-start gap-2 my-0.5 text-xs leading-relaxed">
            <span className="text-indigo-500 mt-1 font-bold shrink-0">•</span>
            <span className="text-slate-700 dark:text-slate-200">{formatInlineMarkdown(content)}</span>
          </div>
        );
      }
      if (line.trim() === "---") {
        return <hr key={lineIdx} className="my-2 border-slate-200 dark:border-slate-800" />;
      }
      if (!line.trim()) {
        return <div key={lineIdx} className="h-1.5" />;
      }
      return (
        <p key={lineIdx} className="my-0.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
          {formatInlineMarkdown(line)}
        </p>
      );
    });
  };

  const formatInlineMarkdown = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const currentPrompts = dynamicSuggestions.length > 0 ? dynamicSuggestions : getDefaultPrompts();

  return (
    <>
      {/* =========================================================================
          RIGHT EDGE DOCKED TRIGGER TAB
          ========================================================================= */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-label="Open AI Copilot Sidebar"
          className="fixed top-1/2 -translate-y-1/2 right-0 z-40 flex items-center gap-2 py-3 px-2 bg-slate-900/90 dark:bg-slate-900/95 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-white rounded-l-2xl shadow-2xl border-y border-l border-indigo-500/30 backdrop-blur-md transition-all duration-300 hover:translate-x-[-3px] cursor-pointer group"
          title="Open AI Copilot Sidebar (Ctrl+J)"
        >
          <div className="relative flex flex-col items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 group-hover:bg-white/20 flex items-center justify-center transition-colors shadow-xs">
              <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-slate-200 group-hover:text-white uppercase [writing-mode:vertical-rl] rotate-180 select-none py-1">
              AI Copilot
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30" />
          </div>
        </button>
      )}

      {/* =========================================================================
          BACKDROP OVERLAY
          ========================================================================= */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
          ANTIGRAVITY RIGHT-SIDEBAR DRAWER
          ========================================================================= */}
      <aside
        role="complementary"
        aria-label="Antigravity AI Copilot"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 h-screen w-full sm:w-[480px] md:w-[500px] lg:w-[520px] max-w-full bg-white dark:bg-slate-950 border-l border-slate-200/90 dark:border-slate-800/90 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* TOP STATUS BAR & HEADER */}
        <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Antigravity AI Copilot
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                    Enterprise
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-indigo-500" />
                    Gemini 3.5 Flash
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    PostgreSQL Live
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Restart conversation & clear history"
                aria-label="Restart conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Collapse Sidebar (Esc)"
                aria-label="Close Sidebar"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Session Context Banner */}
          <div className="px-5 py-1.5 bg-indigo-50/50 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Scope:</span>
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">{userName}</strong>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/70 dark:bg-slate-800 rounded font-mono">
                {userRole.replace("ROLE_", "")}
              </span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
              Ctrl+J to toggle
            </span>
          </div>
        </div>

        {/* CHAT MESSAGES STREAM */}
        <div
          aria-live="polite"
          className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40 select-text"
        >
          {messages.map((msg, index) => {
            const isAi = msg.sender === "ai";
            const isError = msg.source === "ERROR" || msg.source === "RATE_LIMITED";
            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 ${isAi ? "justify-start" : "justify-end"}`}
              >
                {isAi && (
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                      isError
                        ? "bg-amber-500 text-white"
                        : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[88%] rounded-2xl p-4 text-xs shadow-xs transition-all ${
                    isAi
                      ? isError
                        ? "bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-tl-xs"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-slate-900/5"
                      : "bg-indigo-600 text-white rounded-tr-xs shadow-indigo-600/20"
                  }`}
                >
                  {/* Copy button */}
                  {isAi && !isError && (
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.text, index)}
                      className="absolute -top-2.5 -right-2.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Copy response"
                      aria-label="Copy response"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}

                  {/* Content */}
                  <div className="space-y-1">{renderFormattedText(msg.text)}</div>

                  {/* Retry Button if failed */}
                  {msg.canRetry && lastFailedMessage && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                      <button
                        type="button"
                        onClick={() => handleSendMessage(lastFailedMessage)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry Query
                      </button>
                    </div>
                  )}

                  {/* Footer metadata */}
                  <div
                    className={`flex items-center justify-between gap-2 mt-3 pt-2 text-[10px] ${
                      isAi
                        ? "text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 font-mono"
                        : "text-indigo-200 border-t border-indigo-500/40"
                    }`}
                  >
                    {isAi && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold">
                          {msg.source === "GEMINI_AI" ? (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Gemini AI
                            </>
                          ) : msg.source === "DATABASE_DIRECT" ? (
                            <>
                              <Database className="w-2.5 h-2.5 text-emerald-500" /> Live DB Fallback
                            </>
                          ) : msg.source === "RATE_LIMITED" ? (
                            "Rate Limited"
                          ) : (
                            "System"
                          )}
                        </span>
                        {msg.latencyMs && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {msg.latencyMs}ms
                          </span>
                        )}
                        {msg.toolInvoked && msg.toolInvoked !== "CONVERSATIONAL" && (
                          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-mono hidden sm:inline">
                            [{msg.toolInvoked}]
                          </span>
                        )}
                      </div>
                    )}
                    <span className={isAi ? "" : "ml-auto"}>{msg.timestamp}</span>
                  </div>
                </div>

                {!isAi && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs text-xs font-bold">
                    {userName ? userName[0].toUpperCase() : "U"}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Animation */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Querying PostgreSQL & synthesizing with Gemini...
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span>intent: analyzing</span>
                    <span>•</span>
                    <span className="text-indigo-500">authorized tool scope attached</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT TERMINAL & SUGGESTIONS FOOTER */}
        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
          {/* Quick Prompts */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1 px-1">
              <Terminal className="w-3 h-3 text-indigo-500" />
              Suggested Actions & Follow-ups
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {currentPrompts.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(item)}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer font-medium text-left shadow-2xs"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Form */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/90 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-2.5 shadow-xs">
            <textarea
              ref={textareaRef}
              rows={2}
              maxLength={1000}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDownInput}
              disabled={loading}
              placeholder="Ask about fee defaulters, vacant beds, complaints, tenants..."
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
            />
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 mt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <Database className="w-3 h-3 text-indigo-500" />
                <span>PostgreSQL Live</span>
                <span>•</span>
                <span className={inputMessage.length > 900 ? "text-amber-500 font-bold" : ""}>
                  {inputMessage.length}/1000
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Send query (Enter)"
                aria-label="Send query"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Run</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
            Antigravity Copilot synthesizes directly with verified PG database records.
          </p>
        </div>
      </aside>
    </>
  );
}
