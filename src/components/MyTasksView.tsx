import React, { useMemo, useState } from 'react';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { TaskStatus } from '../types';

export const MyTasksView: React.FC = () => {
  const { tasks, projects, currentProfile, authUser, updateTask, setActiveView, setSelectedTeamId, teams } = useApp();
  const uid = currentProfile?.userId || authUser?.uid || '';
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [onlyAssignedToMe, setOnlyAssignedToMe] = useState(false);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((t) => (onlyAssignedToMe ? t.assignedTo === uid : true))
      .filter((t) => (statusFilter === 'All' ? true : t.status === statusFilter));
  }, [tasks, onlyAssignedToMe, uid, statusFilter]);

  const getProjectTitle = (projectId: string) =>
    projects.find((p) => p.projectId === projectId)?.title || 'Team Project';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D1D9E0]">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2328]">My Tasks</h1>
          <p className="mt-1 text-sm text-[#656D76]">
            Track deliverables across every team workspace you belong to.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('team-workspace')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#0969DA] bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
        >
          Open Kanban Board
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg">
          {(['All', 'To Do', 'In Progress', 'Completed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                statusFilter === st ? 'bg-white text-[#1F2328] border border-[#D1D9E0]' : 'text-[#656D76]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-[#1F2328] cursor-pointer">
          <input
            type="checkbox"
            checked={onlyAssignedToMe}
            onChange={(e) => setOnlyAssignedToMe(e.target.checked)}
            className="w-4 h-4 accent-[#0969DA]"
          />
          Assigned specifically to me
        </label>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="p-10 text-center bg-white border border-[#D1D9E0] rounded-lg">
          <CheckSquare className="w-9 h-9 text-[#656D76] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1F2328]">No tasks match this filter</p>
          <p className="mt-1 text-xs text-[#656D76]">
            Create tasks in Team Workspace or generate sprint tasks using the AI Project Planner.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#D1D9E0] rounded-lg divide-y divide-[#D1D9E0]">
          {visibleTasks.map((task) => (
            <div key={task.taskId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#656D76]">
                  <button
                    type="button"
                    onClick={() => {
                      const t = teams.find((tm) => tm.projectId === task.projectId);
                      if (t) setSelectedTeamId(t.teamId);
                      setActiveView('team-workspace');
                    }}
                    className="font-medium text-[#0969DA] hover:underline"
                  >
                    {getProjectTitle(task.projectId)}
                  </button>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-semibold ${
                      task.priority === 'High'
                        ? 'text-[#CF222E]'
                        : task.priority === 'Medium'
                          ? 'text-[#9A6700]'
                          : 'text-[#656D76]'
                    }`}
                  >
                    {task.priority} priority
                  </span>
                  {task.dueDate && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">Due {task.dueDate}</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-[#1F2328]">{task.title}</p>
                {task.description && <p className="mt-0.5 text-xs text-[#656D76]">{task.description}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#656D76] mr-2">
                  {task.assignedToName || 'Unassigned'}
                </span>
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.taskId, { status: e.target.value as TaskStatus })}
                  aria-label={`Status for ${task.title}`}
                  className="px-2.5 py-1.5 text-xs bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
