import React, { useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import ErrorBanner from './ErrorBanner';

export default function ChatView({
  messages,
  inputText,
  setInputText,
  onSendMessage,
  isLoading,
  error,
  onRetry,
  readyForPlan,
  onGeneratePlan,
  isGeneratingPlan = false,
  hasExistingPlan = false,
  onViewPlan = null,
}) {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isBusy = isLoading || isGeneratingPlan;
  const canGeneratePlan =
    messages.length >= 2 && messages[messages.length - 1]?.role === 'assistant';

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isGeneratingPlan]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isBusy && inputText.trim()) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full px-4 sm:px-6">
      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-2 font-medium">ResearchPilot is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Plan Generation Action Banner (available after >=1 complete exchange; prominent when readyForPlan is true) */}
        {canGeneratePlan && onGeneratePlan && (
          <div
            className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs transition-all ${
              readyForPlan
                ? 'bg-indigo-50/90 border-indigo-200 text-slate-800'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              <Sparkles
                className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
                  readyForPlan ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />
              <div>
                {readyForPlan ? (
                  <span>
                    <strong className="text-indigo-950">Ready for your research plan:</strong>{' '}
                    ResearchPilot has gathered enough context to synthesize a seven-section study plan, or you can keep chatting below.
                  </span>
                ) : (
                  <span>
                    <strong className="text-slate-800">Explore or synthesize:</strong>{' '}
                    Continue the conversation to sharpen your study design, or generate a preliminary seven-section plan now.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasExistingPlan && onViewPlan && (
                <button
                  type="button"
                  onClick={onViewPlan}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Saved Plan</span>
                </button>
              )}

              <button
                type="button"
                onClick={onGeneratePlan}
                disabled={isBusy}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  readyForPlan
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                {isGeneratingPlan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Plan...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {hasExistingPlan
                        ? 'Regenerate Research Plan'
                        : 'Generate Research Plan'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Alert with preserved state */}
        <ErrorBanner error={error} onRetry={onRetry} />

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="py-4 border-t border-slate-200 bg-slate-50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isBusy && inputText.trim()) {
              onSendMessage();
            }
          }}
          className="relative flex items-end gap-2 bg-white rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 p-2 shadow-xs transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your research curiosity or answer the mentor's question..."
            disabled={isBusy}
            className="flex-1 resize-none bg-transparent outline-hidden px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400 max-h-40"
          />
          <button
            type="submit"
            disabled={isBusy || !inputText.trim()}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors shrink-0"
            title="Send message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line.
        </p>
      </div>
    </div>
  );
}
