import React, { useState } from 'react';
import {
  AlertCircle,
  BookmarkCheck,
  Copy,
  FolderPlus,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PROJECT_CATEGORIES, type AIProjectAnalysis, type ProjectCategory } from '../types';

const EXAMPLE_IDEA =
  'I want to build an AI-powered learning platform where students can ask questions and receive personalized explanations.';

export const AIAnalyzerView: React.FC = () => {
  const {
    savedAnalyses,
    saveAIAnalysis,
    deleteAIAnalysis,
    setProjectDraft,
    setActiveView,
    pushToast,
  } = useApp();

  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIProjectAnalysis | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');

  const runAnalysis = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (trimmed.length < 10) {
      setErrorMsg('Please describe your project idea in at least 10 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setLastPrompt(trimmed);

    try {
      const res = await fetch('/api/ai/analyze-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze project idea.');
      }
      setAnalysis(data.analysis as AIProjectAnalysis);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach AI analyzer endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(idea);
  };

  const handleCopy = async () => {
    if (!analysis) return;
    const text = [
      `# ${analysis.title} (${analysis.complexity})`,
      `Category: ${analysis.category} | Team Size: ${analysis.recommendedTeamSize}`,
      `\n## Overview\n${analysis.overview}`,
      `\n## Problem Statement\n${analysis.problemStatement}`,
      `\n## Proposed Solution\n${analysis.proposedSolution}`,
      `\n## Required Skills\n${analysis.requiredSkills.join(', ')}`,
      `\n## Recommended Technologies\n${analysis.recommendedTechnologies.join(', ')}`,
      `\n## Suggested Roles\n${analysis.suggestedRoles
        .map((r) => `- ${r.role}: ${r.responsibilities} (${r.skills.join(', ')})`)
        .join('\n')}`,
      `\n## Roadmap\n${analysis.roadmap.map((p) => `- ${p.phase} (${p.duration}): ${p.focus}`).join('\n')}`,
      `\n## Milestones\n${analysis.milestones.map((m) => `- ${m.title} (${m.targetWeek}): ${m.deliverable}`).join('\n')}`,
      `\n## Suggested Tasks\n${analysis.suggestedTasks.map((t) => `- [${t.priority}] ${t.title} (${t.role}): ${t.description}`).join('\n')}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      pushToast('success', 'Structured analysis copied to clipboard.');
    } catch {
      pushToast('error', 'Clipboard access denied by browser.');
    }
  };

  const handleCreateProject = () => {
    if (!analysis) return;
    const validCat: ProjectCategory = PROJECT_CATEGORIES.includes(analysis.category)
      ? analysis.category
      : 'Artificial Intelligence';
    setProjectDraft({
      title: analysis.title,
      description: `${analysis.overview}\n\nProblem: ${analysis.problemStatement}\n\nSolution: ${analysis.proposedSolution}`,
      category: validCat,
      requiredSkills: analysis.requiredSkills,
      teamSize: Math.min(20, Math.max(2, analysis.recommendedTeamSize || 4)),
      difficulty:
        analysis.complexity === 'Beginner' || analysis.complexity === 'Advanced'
          ? analysis.complexity
          : 'Intermediate',
      objectives: analysis.milestones.map((m) => `${m.title}: ${m.deliverable}`),
      technologies: analysis.recommendedTechnologies,
    });
    setActiveView('my-projects');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-[#D1D9E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FFF8C5] text-[#9A6700] text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Google Gemini
          </div>
          <h1 className="text-2xl font-bold text-[#1F2328]">Turn Your Idea Into a Project Plan.</h1>
          <p className="mt-1 text-sm text-[#656D76]">
            Describe what you want to build and receive a complete 12-part engineering specification ready to launch.
          </p>
        </div>
      </div>

      {/* Chat-style Prompt Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="p-5 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg space-y-3">
            <label htmlFor="idea-input" className="block text-xs font-semibold text-[#1F2328]">
              Project Idea Prompt
            </label>
            <textarea
              id="idea-input"
              rows={4}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your project idea..."
              className="w-full p-3.5 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIdea(EXAMPLE_IDEA)}
                className="text-xs font-medium text-[#0969DA] hover:underline"
              >
                Use example: AI-powered student learning platform
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-60 rounded-lg transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Analyzing with Gemini...' : 'Analyze Idea'}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-4 bg-[#FFEBE9] border border-[#FF8182] rounded-lg flex items-start gap-3 text-sm text-[#CF222E]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">AI Analysis Failed</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="p-10 bg-white border border-[#D1D9E0] rounded-lg text-center space-y-3">
              <Loader2 className="w-7 h-7 text-[#0969DA] animate-spin mx-auto" />
              <p className="text-sm font-medium text-[#1F2328]">
                Structuring architecture, team roles, milestones, and sprint tasks...
              </p>
              <p className="text-xs text-[#656D76]">Running server-side Gemini inference</p>
            </div>
          )}

          {/* Structured 12-Section Output */}
          {analysis && !loading && (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="p-4 bg-[#FFF8C5]/50 border border-[#FAE17D] rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#9A6700]">Analysis Ready</p>
                  <h2 className="text-lg font-bold text-[#1F2328]">{analysis.title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => runAnalysis(lastPrompt || idea)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#D1D9E0] hover:bg-[#F6F8FA] rounded-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#D1D9E0] hover:bg-[#F6F8FA] rounded-md"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => saveAIAnalysis(lastPrompt || idea, analysis)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#D1D9E0] hover:bg-[#F6F8FA] rounded-md"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-[#1A7F37]" />
                    Save Analysis
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-md"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Create Project From Analysis
                  </button>
                </div>
              </div>

              {/* Overview, Problem, Solution */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
                  <h3 className="text-xs font-semibold text-[#656D76]">01. Project Overview</h3>
                  <p className="mt-2 text-sm text-[#1F2328] leading-relaxed">{analysis.overview}</p>
                </div>
                <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
                  <h3 className="text-xs font-semibold text-[#656D76]">02. Problem Statement</h3>
                  <p className="mt-2 text-sm text-[#1F2328] leading-relaxed">{analysis.problemStatement}</p>
                </div>
                <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
                  <h3 className="text-xs font-semibold text-[#656D76]">03. Proposed Solution</h3>
                  <p className="mt-2 text-sm text-[#1F2328] leading-relaxed">{analysis.proposedSolution}</p>
                </div>
              </div>

              {/* Team Size, Complexity, Skills, Technologies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#656D76]">04. Complexity &amp; Team Size</span>
                    <span className="font-semibold text-[#0969DA] tabular-nums">
                      {analysis.complexity} · {analysis.recommendedTeamSize} Members
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#656D76]">Required Technical Skills</p>
                    <p className="mt-1 text-sm font-medium text-[#1F2328]">{analysis.requiredSkills.join(' · ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#656D76]">Recommended Technologies</p>
                    <p className="mt-1 text-sm text-[#1F2328]">{analysis.recommendedTechnologies.join(' · ')}</p>
                  </div>
                </div>

                <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
                  <h3 className="text-xs font-semibold text-[#656D76] mb-2">05. Suggested Team Roles</h3>
                  <div className="space-y-2.5">
                    {analysis.suggestedRoles.map((role, i) => (
                      <div key={i} className="text-xs pb-2 border-b border-[#D1D9E0] last:border-b-0 last:pb-0">
                        <p className="font-semibold text-[#1F2328]">{role.role}</p>
                        <p className="text-[#656D76] mt-0.5">{role.responsibilities}</p>
                        <p className="text-[#0969DA] mt-0.5">Skills: {role.skills.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Roadmap & Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
                  <h3 className="text-xs font-semibold text-[#656D76] mb-3">06. Development Roadmap</h3>
                  <div className="space-y-3">
                    {analysis.roadmap.map((step, i) => (
                      <div key={i} className="text-xs">
                        <div className="flex items-center justify-between font-semibold text-[#1F2328]">
                          <span>{step.phase}</span>
                          <span className="text-[#656D76] tabular-nums">{step.duration}</span>
                        </div>
                        <p className="text-[#656D76] mt-0.5">{step.focus}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
                  <h3 className="text-xs font-semibold text-[#656D76] mb-3">07. Project Milestones</h3>
                  <div className="space-y-3">
                    {analysis.milestones.map((ms, i) => (
                      <div key={i} className="text-xs">
                        <div className="flex items-center justify-between font-semibold text-[#1F2328]">
                          <span>{ms.title}</span>
                          <span className="text-[#1A7F37] tabular-nums">{ms.targetWeek}</span>
                        </div>
                        <p className="text-[#656D76] mt-0.5">{ms.deliverable}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggested Initial Tasks */}
              <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
                <h3 className="text-xs font-semibold text-[#656D76] mb-3">08. Suggested Initial Tasks</h3>
                <div className="divide-y divide-[#D1D9E0]">
                  {analysis.suggestedTasks.map((task, i) => (
                    <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#1F2328]">{task.title}</p>
                        <p className="text-xs text-[#656D76] mt-0.5">{task.description}</p>
                      </div>
                      <div className="text-right shrink-0 text-xs">
                        <span
                          className={`font-semibold ${
                            task.priority === 'High'
                              ? 'text-[#CF222E]'
                              : task.priority === 'Medium'
                                ? 'text-[#9A6700]'
                                : 'text-[#656D76]'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <p className="text-[#656D76]">{task.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Saved Analyses History */}
        <div className="lg:col-span-4">
          <div className="p-5 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg space-y-3">
            <h2 className="text-sm font-semibold text-[#1F2328]">Saved Analyses ({savedAnalyses.length})</h2>
            {savedAnalyses.length === 0 ? (
              <p className="text-xs text-[#656D76] leading-relaxed">
                Analyze an idea and click "Save Analysis" to keep blueprints here for comparison or project creation.
              </p>
            ) : (
              <div className="space-y-2.5">
                {savedAnalyses.map((item) => (
                  <div
                    key={item.analysisId}
                    className="p-3 bg-white border border-[#D1D9E0] rounded-lg space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAnalysis(item.result);
                          setIdea(item.ideaPrompt);
                          setLastPrompt(item.ideaPrompt);
                        }}
                        className="text-left text-xs font-semibold text-[#0969DA] hover:underline"
                      >
                        {item.result.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAIAnalysis(item.analysisId)}
                        className="text-[#656D76] hover:text-[#CF222E]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#656D76] line-clamp-2">{item.ideaPrompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
