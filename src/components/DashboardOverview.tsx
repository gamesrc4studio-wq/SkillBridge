import React, { useMemo } from 'react';
import {
  ArrowRight,
  FolderKanban,
  Inbox,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateSkillMatch, rankDevelopersForProject } from '../utils/matchingEngine';
import { Avatar } from './Avatar';

export const DashboardOverview: React.FC = () => {
  const {
    currentProfile,
    authUser,
    projects,
    developers,
    teams,
    invitations,
    tasks,
    activities,
    setActiveView,
    setSelectedProjectId,
    setSelectedTeamId,
    setSelectedProfileId,
  } = useApp();

  const uid = currentProfile?.userId || authUser?.uid || '';

  const myProjects = useMemo(
    () => projects.filter((p) => p.ownerId === uid || p.memberIds.includes(uid)),
    [projects, uid]
  );

  const activeProjects = useMemo(
    () => myProjects.filter((p) => p.status === 'Open' || p.status === 'In Progress'),
    [myProjects]
  );

  const myTeams = useMemo(
    () => teams.filter((t) => t.ownerId === uid || t.memberIds.includes(uid)),
    [teams, uid]
  );

  const pendingInvites = useMemo(
    () => invitations.filter((i) => i.receiverId === uid && i.status === 'Pending'),
    [invitations, uid]
  );

  // Profile completion calculation
  const profileCompletion = useMemo(() => {
    if (!currentProfile) return 20;
    const checks = [
      Boolean(currentProfile.name),
      Boolean(currentProfile.username),
      Boolean(currentProfile.bio),
      Boolean(currentProfile.education || currentProfile.college),
      currentProfile.skills.length >= 2,
      Boolean(currentProfile.github || currentProfile.portfolio),
      currentProfile.interests.length > 0,
      currentProfile.preferredCategories.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [currentProfile]);

  // Recommended projects for current user
  const recommendedProjects = useMemo(() => {
    if (!currentProfile) return projects.slice(0, 3).map((p) => ({ project: p, score: 0, matching: [] as string[] }));
    return projects
      .filter((p) => p.ownerId !== uid && !p.memberIds.includes(uid) && p.status !== 'Completed')
      .map((p) => {
        const res = calculateSkillMatch(p, currentProfile);
        return { project: p, score: res.overallScore, matching: res.matchingSkills };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [projects, currentProfile, uid]);

  // Recommended developers for user's top open project (or general directory)
  const recommendedDevelopers = useMemo(() => {
    const ownedOpen = projects.find((p) => p.ownerId === uid && p.status !== 'Completed');
    if (ownedOpen) {
      return rankDevelopersForProject(ownedOpen, developers).slice(0, 4);
    }
    return developers
      .filter((d) => d.userId !== uid && d.isPublic)
      .slice(0, 4)
      .map((d) => ({
        developer: d,
        overallScore: 0,
        matchingSkills: d.skills.slice(0, 3),
        breakdownSummary: `${d.experience} · ${d.availability}`,
      }));
  }, [projects, developers, uid]);

  // GitHub-inspired 16-week (112-day) contribution calendar built from actual activities
  const calendarDays = useMemo(() => {
    const counts = new Map<string, number>();
    for (const act of activities) {
      counts.set(act.dateKey, (counts.get(act.dateKey) || 0) + 1);
    }
    const days: { dateKey: string; count: number }[] = [];
    const today = new Date();
    for (let i = 111; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ dateKey: key, count: counts.get(key) || 0 });
    }
    return days;
  }, [activities]);

  const calendarWeeks = useMemo(() => {
    const weeks: { dateKey: string; count: number }[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-[#EBEDF0]';
    if (count === 1) return 'bg-[#9BE9A8]';
    if (count === 2) return 'bg-[#40C463]';
    if (count === 3) return 'bg-[#30A14E]';
    return 'bg-[#216E39]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D1D9E0]">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2328]">
            Welcome back, {currentProfile?.name || authUser?.displayName || 'Developer'}
          </h1>
          <p className="mt-1 text-sm text-[#656D76]">
            Here is your collaboration summary, team skill coverage, and active project progress.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('ai-analyzer')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#1F2328] bg-[#FFF8C5] hover:bg-[#FAE17D]/60 border border-[#FAE17D] rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#9A6700]" />
            AI Analyze Idea
          </button>
          <button
            type="button"
            onClick={() => setActiveView('my-projects')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <p className="text-xs font-medium text-[#656D76]">Total Projects</p>
          <p className="mt-1.5 text-2xl font-bold text-[#1F2328] tabular-nums">{myProjects.length}</p>
          <p className="mt-1 text-xs text-[#656D76] tabular-nums">{activeProjects.length} active</p>
        </div>
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <p className="text-xs font-medium text-[#656D76]">Teams Joined</p>
          <p className="mt-1.5 text-2xl font-bold text-[#1F2328] tabular-nums">{myTeams.length}</p>
          <p className="mt-1 text-xs text-[#1A7F37]">Active workspaces</p>
        </div>
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <p className="text-xs font-medium text-[#656D76]">Pending Invitations</p>
          <p className="mt-1.5 text-2xl font-bold text-[#0969DA] tabular-nums">{pendingInvites.length}</p>
          <button
            type="button"
            onClick={() => setActiveView('invitations')}
            className="mt-1 text-xs text-[#0969DA] hover:underline"
          >
            Review inbox →
          </button>
        </div>
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#656D76]">Profile Completion</p>
            <span className="text-xs font-semibold text-[#1F2328] tabular-nums">{profileCompletion}%</span>
          </div>
          <div className="mt-3 h-2 bg-[#F6F8FA] rounded-full overflow-hidden border border-[#D1D9E0]">
            <div
              className="h-full bg-[#1A7F37] transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setActiveView('settings')}
            className="mt-2 text-xs text-[#0969DA] hover:underline"
          >
            {profileCompletion < 100 ? 'Complete profile →' : 'Edit profile →'}
          </button>
        </div>
      </div>

      {/* Contribution Calendar + Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 bg-white border border-[#D1D9E0] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1F2328]">Collaboration Activity Calendar</h2>
              <p className="text-xs text-[#656D76]">
                <span className="tabular-nums font-medium text-[#1F2328]">{activities.length}</span> recorded platform actions over the last 16 weeks
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#656D76]">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-[#EBEDF0]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#9BE9A8]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#40C463]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#216E39]" />
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="inline-flex gap-1.5">
              {calendarWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((day) => (
                    <div
                      key={day.dateKey}
                      title={`${day.dateKey}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                      className={`w-3.5 h-3.5 rounded-xs ${getCellColor(day.count)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="mt-5 pt-4 border-t border-[#D1D9E0]">
            <h3 className="text-xs font-semibold text-[#656D76] mb-2.5">Recent Events</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-[#656D76]">No recorded activity yet. Create a project or complete a task to start logging.</p>
            ) : (
              <ul className="space-y-2">
                {activities.slice(0, 5).map((act) => (
                  <li key={act.activityId} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#1F2328] truncate">
                      <span className="font-medium">{act.action}</span> · {act.targetTitle}
                    </span>
                    <span className="text-[#656D76] tabular-nums shrink-0">{act.dateKey}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Project & Team Progress */}
        <div className="lg:col-span-5 p-5 bg-white border border-[#D1D9E0] rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#1F2328]">Team &amp; Task Progress</h2>
              <button
                type="button"
                onClick={() => setActiveView('team-workspace')}
                className="text-xs font-medium text-[#0969DA] hover:underline"
              >
                Open Workspaces
              </button>
            </div>

            {myTeams.length === 0 ? (
              <div className="p-6 text-center bg-[#F6F8FA] rounded-lg border border-[#D1D9E0]">
                <FolderKanban className="w-7 h-7 text-[#656D76] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#1F2328]">No active teams yet</p>
                <p className="text-xs text-[#656D76] mt-1">
                  Use Team Builder to assemble a team or join an open project.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('team-builder')}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-[#0969DA] rounded-md"
                >
                  Open Team Builder
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myTeams.map((team) => {
                  const teamTasks = tasks.filter((t) => t.projectId === team.projectId);
                  const doneCount = teamTasks.filter((t) => t.status === 'Completed').length;
                  const taskPct = teamTasks.length > 0 ? Math.round((doneCount / teamTasks.length) * 100) : 0;
                  return (
                    <div
                      key={team.teamId}
                      onClick={() => {
                        setSelectedTeamId(team.teamId);
                        setActiveView('team-workspace');
                      }}
                      className="p-3.5 rounded-lg border border-[#D1D9E0] hover:border-[#0969DA] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#1F2328] truncate">{team.projectTitle}</p>
                        <span className="text-xs font-medium text-[#1A7F37] tabular-nums shrink-0">
                          {team.skillCoverage}% skills
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-[#656D76]">
                        <span>{team.members.length} members</span>
                        <span className="tabular-nums">
                          {doneCount}/{teamTasks.length} tasks done ({taskPct}%)
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 bg-[#F6F8FA] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0969DA]" style={{ width: `${taskPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Projects & Recommended Developers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1F2328]">Recommended Projects for You</h2>
              <p className="text-xs text-[#656D76]">Ranked by deterministic skill match score</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('explore-projects')}
              className="text-xs font-medium text-[#0969DA] hover:underline"
            >
              Explore all
            </button>
          </div>
          {recommendedProjects.length === 0 ? (
            <p className="text-xs text-[#656D76]">No open projects available to match right now.</p>
          ) : (
            <div className="space-y-3">
              {recommendedProjects.map(({ project, score, matching }) => (
                <div
                  key={project.projectId}
                  onClick={() => {
                    setSelectedProjectId(project.projectId);
                    setActiveView('explore-projects');
                  }}
                  className="p-3.5 rounded-lg border border-[#D1D9E0] hover:border-[#0969DA] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F2328] truncate">{project.title}</p>
                      <p className="text-xs text-[#656D76] mt-0.5">
                        {project.category} · {project.openPositions} open positions
                      </p>
                    </div>
                    {currentProfile && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#DDF4FF] text-[#0969DA] tabular-nums shrink-0">
                        {score}% match
                      </span>
                    )}
                  </div>
                  {matching.length > 0 && (
                    <p className="mt-2 text-xs text-[#1A7F37]">
                      Matched skills: {matching.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 bg-white border border-[#D1D9E0] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1F2328]">Recommended Developers</h2>
              <p className="text-xs text-[#656D76]">Public builders matching your active needs</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('find-developers')}
              className="text-xs font-medium text-[#0969DA] hover:underline"
            >
              Directory
            </button>
          </div>
          {recommendedDevelopers.length === 0 ? (
            <p className="text-xs text-[#656D76]">No public developers available yet.</p>
          ) : (
            <div className="space-y-3">
              {recommendedDevelopers.map((item) => (
                <div
                  key={item.developer.userId}
                  onClick={() => {
                    setSelectedProfileId(item.developer.userId);
                    setActiveView('find-developers');
                  }}
                  className="p-3.5 rounded-lg border border-[#D1D9E0] hover:border-[#0969DA] cursor-pointer transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={item.developer.name} src={item.developer.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F2328] truncate">{item.developer.name}</p>
                      <p className="text-xs text-[#656D76] truncate">
                        {item.developer.skills.slice(0, 4).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {item.overallScore > 0 ? (
                      <span className="text-xs font-semibold text-[#0969DA] tabular-nums">
                        {item.overallScore}% match
                      </span>
                    ) : (
                      <span className="text-xs text-[#656D76]">{item.developer.availability}</span>
                    )}
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#656D76] ml-2">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
