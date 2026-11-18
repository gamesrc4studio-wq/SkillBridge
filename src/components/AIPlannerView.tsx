import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Loader2,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AIProjectPlan } from '../types';

export const AIPlannerView: React.FC = () => {
  const { projects, teams, currentProfile, authUser, createTask, setActiveView, pushToast } = useApp();
  const uid = currentProfile?.userId || authUser?.uid || '';

  // Only projects the user owns or belongs to can be planned
  const myProjects = useMemo(
    () => projects.filter((p) => p.ownerId === uid || p.memberIds.includes(uid)),
    [projects, uid]
  );

  const [selectedProjId, setSelectedProjId] = useState<string>(myProjects[0]?.projectId || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [plan, setPlan] = useState<AIProjectPlan | null>(null);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addingTasks, setAddingTasks] = useState(false);

  useEffect(() => {
    if (myProjects.length === 0) {
      if (selectedProjId) setSelectedProjId('');
      return;
    }
    if (!myProjects.some((p) => p.projectId === selectedProjId)) {
      setSelectedProjId(myProjects[0].projectId);
    }
  }, [myProjects, selectedProjId]);

  const selectedProject = useMemo(
    () => myProjects.find((p) => p.projectId === selectedProjId) || null,
    [myProjects, selectedProjId]
  );

  const canPlanSelected = Boolean(
    selectedProject && (selectedProject.ownerId === uid || selectedProject.memberIds.includes(uid))
  );

  const generatePlan = async () => {
    if (!selectedProject || !canPlanSelected) {
      setErrorMsg('Only project owners and confirmed team members can generate a plan for a project.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setConfirmOpen(false);

    try {
      const res = await fetch('/api/ai/project-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: selectedProject.title,
          description: selectedProject.description,
          category: selectedProject.category,
          requiredSkills: selectedProject.requiredSkills,
          teamSize: selectedProject.teamSize,
          duration: selectedProject.duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate project plan.');
      const generated = data.plan as AIProjectPlan;
      setPlan(generated);
      setSelectedTaskIndices(generated.tasks.map((_, idx) => idx));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach AI Project Planner.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskIndex = (idx: number) => {
    setSelectedTaskIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const computeDueDate = (offsetDays: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + Math.max(1, offsetDays));
    return d.toISOString().slice(0, 10);
  };

  const handleConfirmAddTasks = async () => {
    if (!plan || !selectedProject || !canPlanSelected) return;
    const team = teams.find((t) => t.projectId === selectedProject.projectId);
    const teamId = team?.teamId || `team_${selectedProject.projectId}`;

    setAddingTasks(true);
    try {
      for (const idx of selectedTaskIndices) {
        const t = plan.tasks[idx];
        if (!t) continue;
        await createTask({
          project: selectedProject,
          teamId,
          title: t.title,
          description: `${t.description} (Suggested role: ${t.suggestedRole})`,
          assignedTo: selectedProject.ownerId,
          assignedToName: selectedProject.ownerName,
          priority: t.priority === 'High' || t.priority === 'Low' ? t.priority : 'Medium',
          dueDate: computeDueDate(t.dueOffsetDays || 7),
        });
      }
      setConfirmOpen(false);
      pushToast('success', `Added ${selectedTaskIndices.length} tasks to "${selectedProject.title}".`);
    } catch (err: unknown) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to add tasks.');
    } finally {
      setAddingTasks(false);
    }
  };

  if (myProjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="pb-5 border-b border-[#D1D9E0]">
          <p className="text-xs font-semibold text-[#9A6700] mb-1.5 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini Development Planner
          </p>
          <h1 className="text-2xl font-bold text-[#1F2328]">AI Project Planner</h1>
          <p className="mt-1 text-sm text-[#656D76]">
            Generate execution phases, milestones, and sprint tasks for projects you own or belong to.
          </p>
        </div>

        <div className="p-10 text-center bg-white border border-[#D1D9E0] rounded-lg">
          <FolderKanban className="w-10 h-10 text-[#656D76] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#1F2328]">Join or Create a Project to Plan</h2>
          <p className="mt-1 text-sm text-[#656D76] max-w-md mx-auto">
            Only project owners and team members can generate development plans and append tasks to a project workspace.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('my-projects')}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg"
            >
              Create a Project
            </button>
            <button
              type="button"
              onClick={() => setActiveView('explore-projects')}
              className="px-4 py-2 text-sm font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-lg"
            >
              Explore Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#D1D9E0]">
        <p className="text-xs font-semibold text-[#9A6700] mb-1.5 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Gemini Development Planner
        </p>
        <h1 className="text-2xl font-bold text-[#1F2328]">AI Project Planner</h1>
        <p className="mt-1 text-sm text-[#656D76]">
          Select one of your active projects to generate execution phases, milestones, prioritized tasks, and technical risk mitigations.
        </p>
      </div>

      {/* Project Selector (Restricted to member/owned projects) */}
      <div className="p-5 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-[#1F2328] mb-1.5">Select Your Project</label>
          <select
            value={selectedProjId}
            onChange={(e) => {
              setSelectedProjId(e.target.value);
              setPlan(null);
              setErrorMsg(null);
              setConfirmOpen(false);
            }}
            className="w-full px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
          >
            {myProjects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.title} ({p.category}) · {p.ownerId === uid ? 'Owner' : 'Team Member'}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={loading || !selectedProject || !canPlanSelected}
          onClick={generatePlan}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-60 rounded-lg whitespace-nowrap shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
          {loading ? 'Generating Plan...' : 'Generate Development Plan'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[#FFEBE9] border border-[#FF8182] rounded-lg text-sm text-[#CF222E]">
          {errorMsg}
        </div>
      )}

      {plan && selectedProject && !loading && (
        <div className="space-y-6">
          {/* Phases & Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg">
              <h2 className="text-sm font-semibold text-[#1F2328] mb-3">Project Phases</h2>
              <div className="space-y-3">
                {plan.phases.map((ph, i) => (
                  <div key={i} className="p-3 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#1F2328]">
                      <span>{ph.name}</span>
                      <span className="text-[#0969DA] tabular-nums">{ph.timeframe}</span>
                    </div>
                    <p className="mt-1 text-[#656D76]">{ph.goal}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg">
              <h2 className="text-sm font-semibold text-[#1F2328] mb-3">Development Milestones</h2>
              <div className="space-y-3">
                {plan.milestones.map((ms, i) => (
                  <div key={i} className="p-3 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#1F2328]">
                      <span>{ms.title}</span>
                      <span className="text-[#1A7F37] tabular-nums">Target: {computeDueDate(ms.dueOffsetDays)}</span>
                    </div>
                    <p className="mt-1 text-[#656D76]">{ms.criteria}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested Tasks with Non-Overwriting Confirmation */}
          <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#1F2328]">
                  Suggested Sprint Tasks ({selectedTaskIndices.length}/{plan.tasks.length} selected)
                </h2>
                <p className="text-xs text-[#656D76]">
                  Adding tasks appends them cleanly to your workspace without overwriting existing tasks.
                </p>
              </div>
              <button
                type="button"
                disabled={selectedTaskIndices.length === 0 || !canPlanSelected}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1A7F37] hover:bg-[#15692D] disabled:opacity-50 rounded-lg shrink-0"
              >
                <PlusSquare className="w-4 h-4" />
                Add Selected Tasks to Workspace
              </button>
            </div>

            {confirmOpen && (
              <div className="p-4 bg-[#FFF8C5] border border-[#FAE17D] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-[#1F2328]">
                  <p className="font-semibold">Confirm Adding {selectedTaskIndices.length} Generated Tasks</p>
                  <p className="text-[#656D76] mt-0.5">
                    Existing tasks in &quot;{selectedProject.title}&quot; will be preserved. Proceed?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D1D9E0] rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={addingTasks}
                    onClick={handleConfirmAddTasks}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0969DA] rounded-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {addingTasks ? 'Adding...' : 'Confirm & Append Tasks'}
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-[#D1D9E0]">
              {plan.tasks.map((t, idx) => {
                const checked = selectedTaskIndices.includes(idx);
                return (
                  <label
                    key={idx}
                    className="py-3 flex items-start gap-3 cursor-pointer hover:bg-[#F6F8FA] px-2 rounded-md"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTaskIndex(idx)}
                      className="mt-1 w-4 h-4 accent-[#0969DA]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1F2328]">{t.title}</p>
                      <p className="text-xs text-[#656D76] mt-0.5">{t.description}</p>
                    </div>
                    <div className="text-right shrink-0 text-xs">
                      <span
                        className={`font-semibold ${
                          t.priority === 'High'
                            ? 'text-[#CF222E]'
                            : t.priority === 'Medium'
                              ? 'text-[#9A6700]'
                              : 'text-[#656D76]'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <p className="text-[#656D76] tabular-nums">Due {computeDueDate(t.dueOffsetDays)}</p>
                      <p className="text-[#0969DA]">{t.suggestedRole}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tech Recommendations & Challenges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg">
              <h2 className="text-sm font-semibold text-[#1F2328] mb-3">Technology Recommendations</h2>
              <div className="space-y-2.5">
                {plan.techRecommendations.map((tr, i) => (
                  <div key={i} className="text-xs pb-2 border-b border-[#D1D9E0] last:border-b-0 last:pb-0">
                    <p className="font-semibold text-[#1F2328]">{tr.technology}</p>
                    <p className="text-[#656D76] mt-0.5">{tr.purpose}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg">
              <h2 className="text-sm font-semibold text-[#1F2328] mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#9A6700]" />
                Potential Challenges &amp; Mitigations
              </h2>
              <div className="space-y-2.5">
                {plan.challenges.map((ch, i) => (
                  <div key={i} className="text-xs pb-2 border-b border-[#D1D9E0] last:border-b-0 last:pb-0">
                    <p className="font-semibold text-[#1F2328]">{ch.risk}</p>
                    <p className="text-[#656D76] mt-0.5">Mitigation: {ch.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveView('team-workspace')}
              className="px-4 py-2 text-xs font-medium text-[#0969DA] bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg hover:bg-[#EAEFF4]"
            >
              View Tasks in Team Workspace →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
