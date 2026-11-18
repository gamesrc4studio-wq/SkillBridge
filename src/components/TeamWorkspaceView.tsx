import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  Hash,
  Megaphone,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Task, TaskPriority, TaskStatus, TeamChannel } from '../types';
import { Avatar } from './Avatar';

const CHANNELS: { id: TeamChannel; label: string }[] = [
  { id: 'general', label: 'general' },
  { id: 'engineering', label: 'engineering' },
  { id: 'design', label: 'design' },
  { id: 'milestones', label: 'milestones' },
];

export const TeamWorkspaceView: React.FC = () => {
  const {
    teams,
    projects,
    tasks,
    messages,
    currentProfile,
    authUser,
    selectedTeamId,
    setSelectedTeamId,
    updateTeamWorkspace,
    createTask,
    updateTask,
    deleteTask,
    sendTeamMessage,
    setActiveView,
  } = useApp();

  const uid = currentProfile?.userId || authUser?.uid || '';
  const myTeams = useMemo(
    () => teams.filter((t) => t.ownerId === uid || t.memberIds.includes(uid)),
    [teams, uid]
  );

  useEffect(() => {
    if (!selectedTeamId && myTeams[0]) {
      setSelectedTeamId(myTeams[0].teamId);
    }
  }, [myTeams, selectedTeamId, setSelectedTeamId]);

  const activeTeam = useMemo(
    () => myTeams.find((t) => t.teamId === selectedTeamId) || myTeams[0] || null,
    [myTeams, selectedTeamId]
  );

  const activeProject = useMemo(
    () => (activeTeam ? projects.find((p) => p.projectId === activeTeam.projectId) || null : null),
    [projects, activeTeam]
  );

  const [tab, setTab] = useState<'overview' | 'kanban' | 'chat' | 'milestones'>('kanban');
  const [notesDraft, setNotesDraft] = useState('');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDue, setMilestoneDue] = useState('');

  // Kanban Task modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Messaging
  const [activeChannel, setActiveChannel] = useState<TeamChannel>('general');
  const [msgInput, setMsgInput] = useState('');

  useEffect(() => {
    if (activeTeam) {
      setNotesDraft(activeTeam.sharedNotes || '');
    }
  }, [activeTeam?.teamId]);

  const teamTasks = useMemo(
    () => (activeTeam ? tasks.filter((t) => t.projectId === activeTeam.projectId) : []),
    [tasks, activeTeam]
  );

  const completedTasksCount = teamTasks.filter((t) => t.status === 'Completed').length;
  const progressPct = teamTasks.length > 0 ? Math.round((completedTasksCount / teamTasks.length) * 100) : 0;

  const channelMessages = useMemo(
    () =>
      activeTeam
        ? messages.filter((m) => m.projectId === activeTeam.projectId && m.channel === activeChannel)
        : [],
    [messages, activeTeam, activeChannel]
  );

  if (!activeTeam || !activeProject) {
    return (
      <div className="p-10 text-center bg-white border border-[#D1D9E0] rounded-lg">
        <Users className="w-10 h-10 text-[#656D76] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#1F2328]">No Active Team Workspace</h2>
        <p className="mt-1 text-sm text-[#656D76]">
          Form a team in Team Builder or accept an invitation to unlock your shared Kanban board and team channels.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('team-builder')}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0969DA] rounded-lg"
          >
            Open Team Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveView('explore-projects')}
            className="px-4 py-2 text-sm font-medium text-[#1F2328] bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
          >
            Explore Projects
          </button>
        </div>
      </div>
    );
  }

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskAssignee(activeTeam.members[0]?.userId || uid);
    setTaskPriority('Medium');
    setTaskDueDate('');
    setTaskModalOpen(true);
  };

  const openEditTask = (t: Task) => {
    setEditingTask(t);
    setTaskTitle(t.title);
    setTaskDesc(t.description);
    setTaskAssignee(t.assignedTo || uid);
    setTaskPriority(t.priority);
    setTaskDueDate(t.dueDate);
    setTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim().length < 2) return;
    const member = activeTeam.members.find((m) => m.userId === taskAssignee);
    const assignedName = member?.name || currentProfile?.name || 'Team Member';

    if (editingTask) {
      await updateTask(editingTask.taskId, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assignedTo: taskAssignee,
        assignedToName: assignedName,
        priority: taskPriority,
        dueDate: taskDueDate,
      });
    } else {
      await createTask({
        project: activeProject,
        teamId: activeTeam.teamId,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assignedTo: taskAssignee,
        assignedToName: assignedName,
        priority: taskPriority,
        dueDate: taskDueDate,
      });
    }
    setTaskModalOpen(false);
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementInput.trim()) return;
    const next = [
      {
        id: `ann_${Date.now()}`,
        authorId: uid,
        authorName: currentProfile?.name || authUser?.displayName || 'Team Member',
        text: announcementInput.trim(),
        createdAt: new Date().toISOString(),
      },
      ...activeTeam.announcements,
    ];
    await updateTeamWorkspace(activeTeam.teamId, { announcements: next });
    setAnnouncementInput('');
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    const next = [
      ...activeTeam.milestones,
      {
        id: `ms_${Date.now()}`,
        title: milestoneTitle.trim(),
        dueDate: milestoneDue || new Date().toISOString().slice(0, 10),
        completed: false,
      },
    ];
    await updateTeamWorkspace(activeTeam.teamId, { milestones: next });
    setMilestoneTitle('');
    setMilestoneDue('');
  };

  const toggleMilestone = async (id: string) => {
    const next = activeTeam.milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m));
    await updateTeamWorkspace(activeTeam.teamId, { milestones: next });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    await sendTeamMessage({
      project: activeProject,
      channel: activeChannel,
      message: msgInput.trim(),
    });
    setMsgInput('');
  };

  const columns: TaskStatus[] = ['To Do', 'In Progress', 'Completed'];

  return (
    <div className="space-y-6">
      {/* Header + Team Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#D1D9E0]">
        <div>
          <p className="text-xs font-medium text-[#0969DA]">Team Workspace · {activeTeam.status}</p>
          <h1 className="text-2xl font-bold text-[#1F2328] mt-0.5">{activeTeam.projectTitle}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#656D76] tabular-nums">
            <span>{activeTeam.members.length} team members</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#1A7F37] font-medium">{activeTeam.skillCoverage}% skill coverage</span>
            <span aria-hidden="true">·</span>
            <span>
              {completedTasksCount}/{teamTasks.length} tasks completed ({progressPct}%)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {myTeams.length > 1 && (
            <select
              value={activeTeam.teamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              aria-label="Switch team workspace"
              className="px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
            >
              {myTeams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.projectTitle}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={openCreateTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg w-fit">
        {(
          [
            { id: 'kanban', label: `Task Board (${teamTasks.length})` },
            { id: 'chat', label: 'Team Discussion' },
            { id: 'overview', label: 'Overview & Notes' },
            { id: 'milestones', label: 'Milestones & Announcements' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === t.id
                ? 'bg-white text-[#1F2328] border border-[#D1D9E0]'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: KANBAN TASK BOARD */}
      {tab === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colTasks = teamTasks.filter((t) => t.status === col);
            return (
              <div key={col} className="bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg p-3.5 flex flex-col min-h-[360px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D1D9E0]">
                  <span className="text-xs font-semibold text-[#1F2328]">{col}</span>
                  <span className="text-xs font-medium text-[#656D76] tabular-nums">{colTasks.length}</span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#656D76] border border-dashed border-[#D1D9E0] rounded-lg bg-white/60">
                      No tasks in {col}.
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div key={task.taskId} className="p-3.5 bg-white border border-[#D1D9E0] rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#1F2328]">{task.title}</h4>
                          <span
                            className={`text-[11px] font-semibold shrink-0 ${
                              task.priority === 'High'
                                ? 'text-[#CF222E]'
                                : task.priority === 'Medium'
                                  ? 'text-[#9A6700]'
                                  : 'text-[#656D76]'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-[#656D76] line-clamp-3">{task.description}</p>
                        )}
                        <div className="text-[11px] text-[#656D76] flex items-center justify-between pt-1">
                          <span>Assigned: {task.assignedToName || 'Unassigned'}</span>
                          {task.dueDate && <span className="tabular-nums">Due {task.dueDate}</span>}
                        </div>

                        <div className="pt-2 border-t border-[#D1D9E0] flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1">
                            {col !== 'To Do' && (
                              <button
                                type="button"
                                onClick={() => updateTask(task.taskId, { status: 'To Do' })}
                                className="px-2 py-1 text-[11px] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded"
                              >
                                To Do
                              </button>
                            )}
                            {col !== 'In Progress' && (
                              <button
                                type="button"
                                onClick={() => updateTask(task.taskId, { status: 'In Progress' })}
                                className="px-2 py-1 text-[11px] bg-[#DDF4FF]/60 hover:bg-[#DDF4FF] text-[#0969DA] border border-[#B6E3FF] rounded"
                              >
                                In Progress
                              </button>
                            )}
                            {col !== 'Completed' && (
                              <button
                                type="button"
                                onClick={() => updateTask(task.taskId, { status: 'Completed' })}
                                className="px-2 py-1 text-[11px] bg-[#DAFBE1] text-[#1A7F37] border border-[#ACEEBB] rounded"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Edit task"
                              onClick={() => openEditTask(task)}
                              className="p-1 text-[#656D76] hover:text-[#1F2328]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete task"
                              onClick={() => deleteTask(task.taskId)}
                              className="p-1 text-[#656D76] hover:text-[#CF222E]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TEAM MESSAGING */}
      {tab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#D1D9E0] rounded-lg overflow-hidden bg-white min-h-[460px]">
          <div className="lg:col-span-3 bg-[#F6F8FA] border-b lg:border-b-0 lg:border-r border-[#D1D9E0] p-3">
            <p className="px-2 text-[11px] font-semibold text-[#656D76] mb-2">Team Channels</p>
            <div className="flex lg:flex-col gap-1 overflow-x-auto">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannel(ch.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                    activeChannel === ch.id
                      ? 'bg-white text-[#0969DA] border border-[#D1D9E0]'
                      : 'text-[#656D76] hover:text-[#1F2328]'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-9 flex flex-col">
            <div className="px-4 py-3 border-b border-[#D1D9E0] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1F2328] flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-[#656D76]" />
                {activeChannel}
              </span>
              <span className="text-xs text-[#656D76]">Authorized team members only</span>
            </div>

            <div className="flex-1 p-4 space-y-4 max-h-[380px] overflow-y-auto">
              {channelMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#656D76]">
                  <MessageSquare className="w-7 h-7 mx-auto mb-2 text-[#656D76]" />
                  No messages in #{activeChannel} yet. Start the discussion below.
                </div>
              ) : (
                channelMessages.map((msg) => (
                  <div key={msg.messageId} className="flex items-start gap-3">
                    <Avatar name={msg.senderName} src={msg.senderAvatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-[#1F2328]">{msg.senderName}</span>
                        <span className="text-[11px] text-[#656D76] tabular-nums">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-[#1F2328] leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#D1D9E0] bg-[#F6F8FA] flex gap-2">
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder={`Message #${activeChannel}...`}
                className="flex-1 px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
              <button
                type="submit"
                disabled={!msgInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-50 rounded-lg"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: OVERVIEW & SHARED NOTES */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-3">
              <h2 className="text-sm font-semibold text-[#1F2328]">Project Overview &amp; Objectives</h2>
              <p className="text-sm text-[#656D76] leading-relaxed">{activeProject.description}</p>
              {activeProject.objectives.length > 0 && (
                <ul className="list-disc list-inside text-xs text-[#1F2328] space-y-1 pt-2">
                  {activeProject.objectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              )}
              <div className="pt-2 border-t border-[#D1D9E0] text-xs text-[#656D76]">
                Required Skills: <span className="text-[#1F2328] font-medium">{activeProject.requiredSkills.join(' · ')}</span>
              </div>
            </div>

            <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#1F2328]">Shared Engineering Notes</h2>
                <button
                  type="button"
                  onClick={() => updateTeamWorkspace(activeTeam.teamId, { sharedNotes: notesDraft })}
                  className="px-3 py-1 text-xs font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-md"
                >
                  Save Notes
                </button>
              </div>
              <textarea
                rows={7}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Document architecture decisions, API endpoints, and meeting notes..."
                className="w-full p-3 text-sm font-mono bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
              />
            </div>
          </div>

          <div className="lg:col-span-5 p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-4">
            <h2 className="text-sm font-semibold text-[#1F2328]">Team Members ({activeTeam.members.length})</h2>
            <div className="space-y-3">
              {activeTeam.members.map((m) => (
                <div
                  key={m.userId}
                  className="p-3 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F2328] truncate">{m.name}</p>
                      <p className="text-xs text-[#656D76] truncate">
                        {m.role} · {m.skills.slice(0, 3).join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#0969DA] tabular-nums shrink-0">
                    {m.matchScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MILESTONES & ANNOUNCEMENTS */}
      {tab === 'milestones' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-4">
            <h2 className="text-sm font-semibold text-[#1F2328]">Project Milestones</h2>
            <form onSubmit={handleAddMilestone} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="New milestone title..."
                className="flex-1 min-w-[160px] px-3 py-1.5 text-xs bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
              />
              <input
                type="date"
                value={milestoneDue}
                onChange={(e) => setMilestoneDue(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#0969DA] rounded-md"
              >
                Add
              </button>
            </form>

            {activeTeam.milestones.length === 0 ? (
              <p className="text-xs text-[#656D76]">No milestones added yet.</p>
            ) : (
              <div className="space-y-2">
                {activeTeam.milestones.map((ms) => (
                  <label
                    key={ms.id}
                    className="p-3 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 text-xs">
                      <input
                        type="checkbox"
                        checked={ms.completed}
                        onChange={() => toggleMilestone(ms.id)}
                        className="w-4 h-4 accent-[#1A7F37]"
                      />
                      <span className={ms.completed ? 'line-through text-[#656D76]' : 'font-medium text-[#1F2328]'}>
                        {ms.title}
                      </span>
                    </span>
                    <span className="text-[11px] text-[#656D76] tabular-nums">{ms.dueDate}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-4">
            <h2 className="text-sm font-semibold text-[#1F2328] flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-[#0969DA]" />
              Team Announcements
            </h2>
            <form onSubmit={handlePostAnnouncement} className="flex gap-2">
              <input
                type="text"
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                placeholder="Share a sprint update with the team..."
                className="flex-1 px-3 py-1.5 text-xs bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#0969DA] rounded-md"
              >
                Post
              </button>
            </form>

            {activeTeam.announcements.length === 0 ? (
              <p className="text-xs text-[#656D76]">No announcements posted yet.</p>
            ) : (
              <div className="space-y-3">
                {activeTeam.announcements.map((ann) => (
                  <div key={ann.id} className="p-3 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg text-xs">
                    <div className="flex items-center justify-between text-[#656D76]">
                      <span className="font-semibold text-[#1F2328]">{ann.authorName}</span>
                      <span className="tabular-nums">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-[#1F2328] leading-relaxed">{ann.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleTaskSubmit}
            className="bg-white border border-[#D1D9E0] rounded-lg max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1F2328]">{editingTask ? 'Edit Task' : 'Create Task'}</h3>
              <button type="button" onClick={() => setTaskModalOpen(false)} className="text-[#656D76]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Implement API route for skill matching"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Description</label>
              <textarea
                rows={3}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1F2328] mb-1">Assign To</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                >
                  {activeTeam.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1F2328] mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Deadline</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0969DA] rounded-lg"
              >
                <Check className="w-3.5 h-3.5" />
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
