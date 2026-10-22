import React, { useState, useEffect, useRef } from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import Header from './components/Header';
import WelcomeHero from './components/WelcomeHero';
import ChatView from './components/ChatView';
import PlanReviewView from './components/PlanReviewView';
import ErrorBanner from './components/ErrorBanner';
import { sendChatMessage, generateResearchPlan } from './services/api';
import {
  loadSessionState,
  isValidPlan,
  saveMessages,
  savePlan,
  saveStage,
  saveModifiedSections,
  clearSessionState,
} from './services/storage';

export default function App() {
  const [initialSession] = useState(() => loadSessionState());
  const [messages, setMessages] = useState(() => initialSession.messages);
  const [plan, setPlan] = useState(() => initialSession.plan);
  const [stage, setStage] = useState(() => initialSession.stage);
  const [modifiedSections, setModifiedSections] = useState(
    () => initialSession.modifiedSections
  );
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const isGeneratingPlanRef = useRef(false);
  const [error, setError] = useState(null);
  const [lastFailedAction, setLastFailedAction] = useState(null);
  const [readyForPlan, setReadyForPlan] = useState(
    () => initialSession.messages.length >= 8
  );

  // Single source of truth for persisting confirmed session state:
  // Never persists while a chat or plan request is in flight.
  useEffect(() => {
    if (isLoading || isGeneratingPlan) {
      return;
    }

    const hasConfirmedMessages =
      messages.length > 0 &&
      messages[messages.length - 1]?.role === 'assistant';
    const hasValidSavedPlan = Boolean(plan) && isValidPlan(plan);

    if (hasConfirmedMessages) {
      saveMessages(messages);
    }

    if (hasValidSavedPlan) {
      savePlan(plan);
      saveModifiedSections(modifiedSections);
    }

    if (hasConfirmedMessages || hasValidSavedPlan) {
      const effectiveStage =
        stage === 'review' && hasValidSavedPlan ? 'review' : 'chat';
      saveStage(effectiveStage);
    }
  }, [messages, plan, stage, modifiedSections, isLoading, isGeneratingPlan]);

  // Send message turn
  const handleSendMessage = async (textOverride = null) => {
    const textToSend = (textOverride !== null ? textOverride : inputText).trim();
    if (!textToSend || isLoading || isGeneratingPlan || isGeneratingPlanRef.current) return;

    const previousMessages = messages;
    const userMessage = { role: 'user', content: textToSend };
    const nextMessages = [...previousMessages, userMessage];

    // Optimistically update UI state; useEffect will not persist while isLoading is true
    setMessages(nextMessages);
    setInputText('');
    setError(null);
    setLastFailedAction(null);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(nextMessages);
      const mentorMessage = { role: 'assistant', content: response.message };
      const confirmedMessages = [...nextMessages, mentorMessage];
      const nextReady =
        Boolean(response.ready_for_plan) || confirmedMessages.length >= 8;

      setMessages(confirmedMessages);
      setStage('chat');
      setReadyForPlan(nextReady);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to receive mentor response.');
      setLastFailedAction('chat');
      // Restore unsent text to input so student never loses what they typed
      setInputText(textToSend);
      // Restore conversation to confirmed messages before isLoading becomes false
      setMessages(previousMessages);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate or regenerate seven-section research plan
  const handleGeneratePlan = async () => {
    if (
      isLoading ||
      isGeneratingPlan ||
      isGeneratingPlanRef.current ||
      messages.length < 2
    ) {
      return;
    }

    isGeneratingPlanRef.current = true;
    setError(null);
    setLastFailedAction(null);
    setIsGeneratingPlan(true);

    try {
      const generatedPlan = await generateResearchPlan(messages);
      if (!isValidPlan(generatedPlan)) {
        throw new Error(
          'Generated research plan did not match the required seven-section structure. Please try again.'
        );
      }

      setPlan(generatedPlan);
      setModifiedSections([]);
      setStage('review');
    } catch (err) {
      console.error('Plan generation error:', err);
      setError(err.message || 'Failed to generate research plan.');
      setLastFailedAction('plan');
      // Existing messages, previously saved plan, and current stage remain untouched
    } finally {
      isGeneratingPlanRef.current = false;
      setIsGeneratingPlan(false);
    }
  };

  const handleBackToChat = () => {
    if (isGeneratingPlan || isGeneratingPlanRef.current) return;
    setError(null);
    setLastFailedAction(null);
    setStage('chat');
  };

  const handleViewPlan = () => {
    if (
      isLoading ||
      isGeneratingPlan ||
      isGeneratingPlanRef.current ||
      !plan ||
      !isValidPlan(plan)
    ) {
      return;
    }
    setError(null);
    setLastFailedAction(null);
    setStage('review');
  };

  const handleSelectStarterPrompt = (promptText) => {
    setInputText(promptText);
  };

  const handleResetConversation = () => {
    clearSessionState();
    setMessages([]);
    setPlan(null);
    setStage('welcome');
    setModifiedSections([]);
    setInputText('');
    setError(null);
    setLastFailedAction(null);
    setReadyForPlan(false);
  };

  const handleRetry = () => {
    if (lastFailedAction === 'plan') {
      handleGeneratePlan();
      return;
    }
    if (inputText.trim()) {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        onReset={handleResetConversation}
        hasMessages={messages.length > 0 || Boolean(plan) || stage !== 'welcome'}
      />

      <main className="flex-1 flex flex-col">
        {stage === 'review' && plan ? (
          <PlanReviewView
            plan={plan}
            modifiedSections={modifiedSections}
            onBackToChat={handleBackToChat}
            onRegeneratePlan={handleGeneratePlan}
            isGeneratingPlan={isGeneratingPlan}
            error={error}
          />
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full px-4 sm:px-6">
            <div className="flex-1 flex items-center justify-center">
              <WelcomeHero onSelectPrompt={handleSelectStarterPrompt} />
            </div>

            {/* Initial input bar on welcome view */}
            <div className="py-4 border-t border-slate-200 bg-slate-50">
              {plan && isValidPlan(plan) && (
                <div className="mb-3 p-3.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-slate-800 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong className="text-indigo-950">Saved research plan available:</strong>{' '}
                      Your previously generated seven-section research plan is still saved.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleViewPlan}
                    disabled={isLoading || isGeneratingPlan}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Saved Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2 bg-white rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 p-2 shadow-xs transition-all"
              >
                <textarea
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Share a research idea, curiosity, or question to get started..."
                  disabled={isLoading}
                  className="flex-1 resize-none bg-transparent outline-hidden px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400 max-h-32"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-xs font-semibold transition-colors shrink-0"
                >
                  Start Exploring
                </button>
              </form>
              <ErrorBanner
                error={error}
                onRetry={handleRetry}
                className="mt-3"
              />
            </div>
          </div>
        ) : (
          <ChatView
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            onSendMessage={() => handleSendMessage()}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
            readyForPlan={readyForPlan}
            onGeneratePlan={handleGeneratePlan}
            isGeneratingPlan={isGeneratingPlan}
            hasExistingPlan={Boolean(plan)}
            onViewPlan={handleViewPlan}
          />
        )}
      </main>
    </div>
  );
}
