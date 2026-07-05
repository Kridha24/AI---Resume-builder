import React, { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, Send, X, Loader2, ArrowRight, User, HelpCircle, GraduationCap, Briefcase } from "lucide-react";
import { ResumeData } from "../types";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AICoachSidebarProps {
  resumeData: ResumeData;
  coverLetterText?: string;
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

const QUICK_SUGGESTIONS = [
  "Improve my professional summary",
  "Suggest stronger bullet points for my latest job",
  "What critical tech skills am I missing for this role?",
  "Review my cover letter layout and suggest improvements",
];

export default function AICoachSidebar({
  resumeData,
  coverLetterText,
  isOpen,
  onClose,
  accentColor
}: AICoachSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Hello! I am your Resumify Career Coach. 🎯

I have loaded your active resume profile (${resumeData.personalInfo.fullName || "Draft candidate"}) and current cover letter session in the background.

How can I assist you with your resume or cover letter today? Ask me to write high-impact bullet points, suggest keywords, or refine your professional pitch!`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) {
      setInput("");
    }

    const updatedMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          context: {
            resumeData,
            coverLetter: coverLetterText
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to contact Career Coach.");
      }

      setMessages(prev => [...prev, { role: "model", content: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: "model", content: `⚠️ Error: ${err.message || "Could not connect to AI services. Make sure your GEMINI_API_KEY is configured."}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple, ultra-reliable Markdown parser to render bold, bullet points, and paragraphs cleanly
  const renderMessageContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      let trimmed = line.trim();
      
      // Check if bullet point
      const isBullet = trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•");
      if (isBullet) {
        // Strip the bullet symbol
        const bulletText = trimmed.replace(/^[-*•]\s*/, "");
        return (
          <li key={index} className="ml-4 list-disc pl-1 mb-1.5 text-xs text-slate-700 font-sans leading-relaxed">
            {parseFormatting(bulletText)}
          </li>
        );
      }

      // Check if numbered list
      const isNumbered = /^\d+\.\s+/.test(trimmed);
      if (isNumbered) {
        const numberedText = trimmed.replace(/^\d+\.\s+/, "");
        const num = trimmed.match(/^\d+/)![0];
        return (
          <li key={index} className="ml-4 list-decimal pl-1 mb-1.5 text-xs text-slate-700 font-sans leading-relaxed" style={{ listStyleType: "decimal" }}>
            {parseFormatting(numberedText)}
          </li>
        );
      }

      // Default paragraph
      if (!trimmed) return <div key={index} className="h-2" />;
      return (
        <p key={index} className="text-xs text-slate-700 leading-relaxed font-sans mb-2">
          {parseFormatting(trimmed)}
        </p>
      );
    });
  };

  // Replace **bold** and `code` sections
  const parseFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="bg-slate-100 text-red-600 px-1 py-0.5 rounded font-mono text-[11px]">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-y-0 right-0 w-96 bg-slate-50 border-l border-slate-200 shadow-2xl z-50 flex flex-col h-full transform transition-all duration-300">
      
      {/* Sidebar Header */}
      <div 
        className="px-4 py-3.5 border-b text-white flex items-center justify-between shadow-sm shrink-0"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-100 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">AI Career Assistant</h3>
            <span className="text-[10px] text-indigo-100 font-medium">Synced with your profile</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div 
              key={idx} 
              className={`flex items-start space-x-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: accentColor + "20", color: accentColor }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              
              <div 
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs ${
                  isUser 
                    ? "bg-slate-900 text-white rounded-tr-none font-medium" 
                    : "bg-white border border-slate-200 rounded-tl-none"
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{m.content}</p>
                ) : (
                  <div className="space-y-1">{renderMessageContent(m.content)}</div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center shrink-0 text-slate-600 shadow-sm font-bold text-xs">
                  U
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-2.5 justify-start">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 animate-spin"
              style={{ backgroundColor: accentColor + "20", color: accentColor }}
            >
              <Loader2 className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-xs text-slate-500 font-medium flex items-center space-x-2">
              <span>Thinking and drafting...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions list (only show if not loading) */}
      {!isLoading && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-150 space-y-1.5 shrink-0">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Suggested Prompts</span>
          <div className="flex flex-col space-y-1 max-h-28 overflow-y-auto">
            {QUICK_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-left text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-200 transition-all cursor-pointer truncate"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input panel */}
      <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AI coach for help..."
          className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-slate-50 focus:bg-white leading-normal"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
