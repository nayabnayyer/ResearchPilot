import React from 'react';
import { Sparkles, ShieldAlert, MessageSquare, HelpCircle, Lightbulb } from 'lucide-react';

const STARTER_PROMPTS = [
  {
    icon: Lightbulb,
    title: "I have a rough idea",
    prompt: "I want to research how remote learning affects university students' motivation and study habits.",
  },
  {
    icon: HelpCircle,
    title: "I don't have a specific topic yet",
    prompt: "I need to design a research project for my class, but I don't know where to start. Can we explore some topics together?",
  },
  {
    icon: Sparkles,
    title: "I want to examine an assumption",
    prompt: "I'm curious whether AI tools make students write better essays, or if they just make them finish faster.",
  },
];

export default function WelcomeHero({ onSelectPrompt }) {
  return (
    <div className="py-8 sm:py-12 max-w-2xl mx-auto text-center px-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Your AI Research Mentor</span>
      </div>

      {/* Headline */}
      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
        Every great study starts with a question.
      </h2>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto">
        Let’s explore your idea together. You don't need to have everything figured out yet—we'll take it one focused question at a time.
      </p>

      {/* Privacy Notice Banner */}
      <div className="mb-8 p-3.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs text-left flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Free-tier AI Notice: </span>
          <span>On Google AI Studio's free tier, prompts and responses may be processed to improve AI models. Please do not submit confidential, sensitive, or personal information.</span>
        </div>
      </div>

      {/* Starter Suggestions */}
      <div className="text-left">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center sm:text-left">
          Choose a starting point or write your own below:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STARTER_PROMPTS.map((starter, idx) => {
            const Icon = starter.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectPrompt(starter.prompt)}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-sm text-left transition-all duration-150 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 flex items-center justify-center mb-2.5 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800 mb-1 group-hover:text-indigo-900 transition-colors">
                    {starter.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    "{starter.prompt}"
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
