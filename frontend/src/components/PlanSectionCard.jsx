import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

const UNRESOLVED_MARKER =
  '(?:unresolved|to be determined|to be finalized|tbd|needs clarification|not yet specified|not yet decided|not yet finalized|unconfirmed|open question|undecided)';

const UNRESOLVED_MARKER_PATTERN = new RegExp(`\\b${UNRESOLVED_MARKER}\\b`, 'i');

const LEADING_UNRESOLVED_PATTERN = new RegExp(`^${UNRESOLVED_MARKER}\\b`, 'i');

const CORE_VARIABLE_UNRESOLVED_PATTERN = new RegExp(
  `\\b(?:independent|dependent|primary|core|outcome|predictor)\\s+variables?\\s*:\\s*${UNRESOLVED_MARKER}\\b`,
  'i'
);

const FIRST_SENTENCE_UNRESOLVED_PATTERN = new RegExp(
  `(?::\\s*${UNRESOLVED_MARKER}\\b|\\b(?:is|are|remains?|still)\\s+${UNRESOLVED_MARKER}\\b|\\b(?:has|have)\\s+not\\s+(?:yet\\s+)?been\\s+(?:decided|determined|finalized|specified|chosen|selected|established)\\b)`,
  'i'
);

export function hasUnresolvedContent(text, sectionKey = '') {
  if (typeof text !== 'string' || !text.trim()) {
    return true;
  }

  if (sectionKey === 'limitations') {
    return false;
  }

  if (sectionKey === 'data_requirements' || sectionKey === 'analysis_plan') {
    return UNRESOLVED_MARKER_PATTERN.test(text);
  }

  const trimmed = text.trim();
  if (LEADING_UNRESOLVED_PATTERN.test(trimmed)) {
    return true;
  }

  const withoutParens = trimmed.replace(/\([^)]*\)/g, ' ');
  if (CORE_VARIABLE_UNRESOLVED_PATTERN.test(withoutParens)) {
    return true;
  }

  const firstSentence = withoutParens
    .split(/(?:[.!\n]+|\s+;\s+)/)[0]
    .replace(new RegExp(`\\s*[-–—]\\s*${UNRESOLVED_MARKER}\\b.*$`, 'i'), '')
    .trim();

  return (
    LEADING_UNRESOLVED_PATTERN.test(firstSentence) ||
    FIRST_SENTENCE_UNRESOLVED_PATTERN.test(firstSentence)
  );
}

export default function PlanSectionCard({
  sectionKey,
  stepNumber,
  title,
  subtitle,
  icon: Icon,
  content,
  isModified = false,
}) {
  const isUnresolved = hasUnresolvedContent(content, sectionKey);

  return (
    <article
      aria-labelledby={`plan-section-title-${sectionKey}`}
      className={`rounded-2xl bg-white border p-5 sm:p-6 shadow-xs transition-all ${
        isModified
          ? 'border-indigo-300 ring-1 ring-indigo-100'
          : 'border-slate-200/90'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              {typeof stepNumber === 'number' && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                  Section {stepNumber}
                </span>
              )}
            </div>
            <h3
              id={`plan-section-title-${sectionKey}`}
              className="text-base font-semibold text-slate-900 leading-snug"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isModified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium">
              <Sparkles className="w-3 h-3" />
              <span>Revised</span>
            </span>
          )}
          {isUnresolved && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/90 text-amber-800 text-[11px] font-medium">
              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Needs clarification</span>
            </span>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-0 sm:pl-12">
        {content}
      </div>
    </article>
  );
}
