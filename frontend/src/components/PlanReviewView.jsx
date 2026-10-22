import React from 'react';
import {
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  Sliders,
  Compass,
  Database,
  BarChart2,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import PlanSectionCard from './PlanSectionCard';
import ErrorBanner from './ErrorBanner';

export const PLAN_SECTIONS_META = [
  {
    key: 'research_question',
    title: 'Research Question',
    subtitle: 'The core question guiding your inquiry',
    icon: HelpCircle,
  },
  {
    key: 'hypothesis',
    title: 'Hypothesis',
    subtitle: 'Testable expectation or central proposition',
    icon: Lightbulb,
  },
  {
    key: 'variables',
    title: 'Variables',
    subtitle: 'Independent, dependent, and controlled factors',
    icon: Sliders,
  },
  {
    key: 'methodology',
    title: 'Methodology',
    subtitle: 'Overall study design and research approach',
    icon: Compass,
  },
  {
    key: 'data_requirements',
    title: 'Data Requirements',
    subtitle: 'Participants, sources, and collection procedures',
    icon: Database,
  },
  {
    key: 'analysis_plan',
    title: 'Analysis Plan',
    subtitle: 'Techniques for evaluating collected data',
    icon: BarChart2,
  },
  {
    key: 'limitations',
    title: 'Limitations',
    subtitle: 'Boundaries, unresolved assumptions, and validity risks',
    icon: ShieldAlert,
  },
];

export default function PlanReviewView({
  plan,
  modifiedSections = [],
  onBackToChat,
  onRegeneratePlan,
  isGeneratingPlan = false,
  error = null,
}) {
  if (!plan) {
    return null;
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
      {/* Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Seven-Section Study Blueprint</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Your Research Plan
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Synthesized from your mentoring dialogue. Sections marked{' '}
            <span className="font-medium text-amber-800">Needs clarification</span>{' '}
            highlight open decisions you can explore further in conversation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onBackToChat && (
            <button
              type="button"
              onClick={onBackToChat}
              disabled={isGeneratingPlan}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Conversation</span>
            </button>
          )}

          {onRegeneratePlan && (
            <button
              type="button"
              onClick={onRegeneratePlan}
              disabled={isGeneratingPlan}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`}
              />
              <span>
                {isGeneratingPlan ? 'Regenerating...' : 'Regenerate Plan'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Non-destructive error banner if regeneration fails */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={onRegeneratePlan}
          className="mb-6"
        />
      )}

      {/* Seven Section Cards */}
      <div className="space-y-4">
        {PLAN_SECTIONS_META.map((section, idx) => (
          <PlanSectionCard
            key={section.key}
            sectionKey={section.key}
            stepNumber={idx + 1}
            title={section.title}
            subtitle={section.subtitle}
            icon={section.icon}
            content={plan[section.key]}
            isModified={modifiedSections.includes(section.key)}
          />
        ))}
      </div>

      {/* Bottom Return Prompt */}
      {onBackToChat && (
        <div className="mt-8 p-4 rounded-xl bg-slate-100/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
          <span>
            Want to clarify an unresolved variable or discuss methodology options with ResearchPilot?
          </span>
          <button
            type="button"
            onClick={onBackToChat}
            disabled={isGeneratingPlan}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Mentoring Dialogue</span>
          </button>
        </div>
      )}
    </div>
  );
}
