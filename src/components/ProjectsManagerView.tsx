import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  Edit3,
  ExternalLink,
  Flag,
  FolderGit2,
  Lock,
  Plus,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  PROJECT_CATEGORIES,
  type ExperienceLevel,
  type Project,
  type ProjectCategory,
  type ProjectDifficulty,
  type ProjectStatus,
  type ProjectType,
  type ProjectVisibility,
} from '../types';
import { calculateSkillMatch } from '../utils/matchingEngine';
import { validateProjectInput } from '../utils/validation';

interface ProjectsManagerViewProps {
  mode: 'explore' | 'mine';
}

export const ProjectsManagerView: React.FC<ProjectsManagerViewProps> = ({ mode }) => {
  const {
    projects,
    developers,
    invitations,
    savedProjectIds,
    currentProfile,
    authUser,
    selectedProjectId,
    setSelectedProjectId,
    projectDraft,
    setProjectDraft,
    createProject,
    updateProject,
    deleteProject,
    toggleSaveProject,
    sendInvitation,
    respondToInvitation,
    submitReport,
    setActiveView,
    pushToast,
  } = useApp();

  const uid = currentProfile?.userId || authUser?.uid || '';

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [skillFilter, setSkillFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [expFilter, setExpFilter] = useState<string>('All');
  const [onlyOpenPositions, setOnlyOpenPositions] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest'>('relevance');
  const [mineTab, setMineTab] = useState<'owned' | 'joined' | 'saved'>('owned');

  // Create / Edit form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Web Development');
  const [projectType, setProjectType] = useState<ProjectType>('Open Source');
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, Node.js');
  const [techInput, setTechInput] = useState('React, TypeScript, Tailwind CSS');
  const [objectivesInput, setObjectivesInput] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [experienceRequired, setExperienceRequired] = useState<'Any' | ExperienceLevel>('Any');
  const [duration, setDuration] = useState('8 weeks');
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>('Intermediate');
  const [openPositions, setOpenPositions] = useState(2);
  const [visibility, setVisibility] = useState<ProjectVisibility>('Public');
  const [status, setStatus] = useState<ProjectStatus>('Open');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Join Request Modal
  const [joinTarget, setJoinTarget] = useState<Project | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinRole, setJoinRole] = useState('');

  // Report Modal
  const [reportTarget, setReportTarget] = useState<Project | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Auto-open form when coming from AI Analyzer "Create Project From Analysis"
  useEffect(() => {
    if (projectDraft && mode === 'mine') {
      setEditingId(null);
      setTitle(projectDraft.title);
      setDescription(projectDraft.description);
      setCategory(projectDraft.category);
      setProjectType('Startup');
      setSkillsInput(projectDraft.requiredSkills.join(', '));
      setTechInput(projectDraft.technologies.join(', '));
      setObjectivesInput(projectDraft.objectives.join('\n'));
      setTeamSize(projectDraft.teamSize);
      setOpenPositions(Math.max(1, projectDraft.teamSize - 1));
      setDifficulty(projectDraft.difficulty);
      setDuration('8 weeks');
      setVisibility('Public');
      setStatus('Open');
      setFormOpen(true);
      setProjectDraft(null);
    }
  }, [projectDraft, mode, setProjectDraft]);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('Web Development');
    setProjectType('Open Source');
    setSkillsInput('React, Node.js, TypeScript');
    setTechInput('React, Express, Firebase');
    setObjectivesInput('');
    setTeamSize(4);
    setExperienceRequired('Any');
    setDuration('6 weeks');
    setDifficulty('Intermediate');
    setOpenPositions(3);
    setVisibility('Public');
    setStatus('Open');
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingId(proj.projectId);
    setTitle(proj.title);
    setDescription(proj.description);
    setCategory(proj.category);
    setProjectType(proj.projectType);
    setSkillsInput(proj.requiredSkills.join(', '));
    setTechInput(proj.technologies.join(', '));
    setObjectivesInput(proj.objectives.join('\n'));
    setTeamSize(proj.teamSize);
    setExperienceRequired(proj.experienceRequired);
    setDuration(proj.duration);
    setDifficulty(proj.difficulty);
    setOpenPositions(proj.openPositions);
    setVisibility(proj.visibility);
    setStatus(proj.status);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedTech = techInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedObjectives = objectivesInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const err = validateProjectInput({
      title,
      description,
      requiredSkills: parsedSkills,
      teamSize,
      duration,
    });
    if (err) {
      setFormError(err);
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateProject(editingId, {
          title: title.trim(),
          description: description.trim(),
          category,
          projectType,
          requiredSkills: parsedSkills,
          technologies: parsedTech,
          objectives: parsedObjectives,
          teamSize,
          experienceRequired,
          duration: duration.trim(),
          difficulty,
          openPositions,
          visibility,
          status,
        });
      } else {
        const created = await createProject({
          title: title.trim(),
          description: description.trim(),
          category,
          projectType,
          requiredSkills: parsedSkills,
          technologies: parsedTech,
          objectives: parsedObjectives,
          teamSize,
          experienceRequired,
          duration: duration.trim(),
          difficulty,
          openPositions,
          visibility,
          status,
        });
        setSelectedProjectId(created.projectId);
      }
      setFormOpen(false);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = useMemo(() => {
    let base = projects;
    if (mode === 'mine') {
      if (mineTab === 'owned') base = projects.filter((p) => p.ownerId === uid);
      else if (mineTab === 'joined') base = projects.filter((p) => p.ownerId !== uid && p.memberIds.includes(uid));
      else base = projects.filter((p) => savedProjectIds.includes(p.projectId));
    } else {
      base = projects.filter((p) => p.visibility === 'Public' || p.ownerId === uid || p.memberIds.includes(uid));
    }

    const q = search.trim().toLowerCase();
    const sk = skillFilter.trim().toLowerCase();

    const filtered = base.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.description} ${p.ownerName} ${p.requiredSkills.join(' ')} ${p.technologies.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (difficultyFilter !== 'All' && p.difficulty !== difficultyFilter) return false;
      if (expFilter !== 'All' && p.experienceRequired !== expFilter) return false;
      if (onlyOpenPositions && (p.openPositions <= 0 || p.status === 'Recruitment Closed' || p.status === 'Completed')) {
        return false;
      }
      if (sk && !p.requiredSkills.some((s) => s.toLowerCase().includes(sk))) return false;
      return true;
    });

    return filtered
      .map((p) => ({
        project: p,
        match: currentProfile ? calculateSkillMatch(p, currentProfile) : null,
      }))
      .sort((a, b) => {
        if (sortBy === 'relevance' && a.match && b.match) {
          return b.match.overallScore - a.match.overallScore;
        }
        return (b.project.updatedAt ?? '').localeCompare(a.project.updatedAt ?? '');
      });
  }, [
    projects,
    mode,
    mineTab,
    uid,
    savedProjectIds,
    search,
    categoryFilter,
    difficultyFilter,
    expFilter,
    onlyOpenPositions,
    skillFilter,
    sortBy,
    currentProfile,
  ]);

  const activeDetailProject = useMemo(
    () => projects.find((p) => p.projectId === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const activeProjectApplicants = useMemo(() => {
    if (!activeDetailProject) return [];
    return invitations.filter(
      (i) => i.projectId === activeDetailProject.projectId && i.type === 'join_request'
    );
  }, [invitations, activeDetailProject]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinTarget) return;
    const ownerProfile = developers.find((d) => d.userId === joinTarget.ownerId) || {
      userId: joinTarget.ownerId,
      name: joinTarget.ownerName,
      username: 'owner',
      bio: '',
      education: '',
      college: '',
      skills: [],
      skillLevels: {},
      experience: 'Intermediate' as const,
      github: '',
      portfolio: '',
      interests: [],
      availability: 'Available' as const,
      preferredCategories: [],
      isPublic: true,
      profileCompleted: true,
    };
    await sendInvitation({
      type: 'join_request',
      project: joinTarget,
      targetUser: ownerProfile,
      roleSuggested: joinRole || 'Collaborator',
      message: joinMessage,
    });
    setJoinTarget(null);
    setJoinMessage('');
    setJoinRole('');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    if (reportReason.trim().length < 5) {
      pushToast('error', 'Please enter a brief reason (at least 5 characters).');
      return;
    }
    await submitReport({
      targetType: 'project',
      targetId: reportTarget.projectId,
      targetTitle: reportTarget.title,
      reason: reportReason.trim(),
    });
    setReportTarget(null);
    setReportReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D1D9E0]">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2328]">
            {mode === 'mine' ? 'My Projects' : 'Explore Projects'}
          </h1>
          <p className="mt-1 text-sm text-[#656D76]">
            {mode === 'mine'
              ? 'Create, manage, and recruit teammates for your initiatives.'
              : 'Discover open-source, academic, hackathon, and startup projects matched to your skills.'}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Mode Tabs for My Projects */}
      {mode === 'mine' && (
        <div className="inline-flex items-center gap-1 p-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg">
          {(['owned', 'joined', 'saved'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMineTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mineTab === tab
                  ? 'bg-white text-[#1F2328] border border-[#D1D9E0]'
                  : 'text-[#656D76] hover:text-[#1F2328]'
              }`}
            >
              {tab === 'owned' ? 'Created by Me' : tab === 'joined' ? 'Collaborating' : 'Saved Bookmarks'}
            </button>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-4 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#656D76] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project title, tech, or description..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
            >
              <option value="All">All Categories</option>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              aria-label="Filter by difficulty"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevance' | 'newest')}
              aria-label="Sort projects"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="newest">Sort: Updated</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Filter by skill (e.g. React, Python)"
            className="px-3 py-1.5 text-xs bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA] w-56"
          />
          <select
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
            aria-label="Filter by experience"
            className="px-3 py-1.5 text-xs bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
          >
            <option value="All">Experience: Any</option>
            <option value="Student">Student</option>
            <option value="Entry">Entry</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Senior">Senior</option>
          </select>
          <label className="inline-flex items-center gap-2 text-xs text-[#1F2328] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyOpenPositions}
              onChange={(e) => setOnlyOpenPositions(e.target.checked)}
              className="w-4 h-4 accent-[#0969DA]"
            />
            Open positions only
          </label>
          <span className="ml-auto text-xs text-[#656D76] tabular-nums">
            Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
      </div>

      {/* Repository-Style Project Cards */}
      {filteredProjects.length === 0 ? (
        <div className="p-10 text-center bg-white border border-[#D1D9E0] rounded-lg">
          <FolderGit2 className="w-9 h-9 text-[#656D76] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#1F2328]">No matching projects found</h3>
          <p className="mt-1 text-sm text-[#656D76]">
            {mode === 'mine'
              ? 'Create your first project or analyze an idea with Gemini AI to get started.'
              : 'Adjust your search or filters to discover more collaboration projects.'}
          </p>
          {mode === 'mine' && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map(({ project, match }) => {
            const isOwner = project.ownerId === uid;
            const isMember = project.memberIds.includes(uid);
            const isSaved = savedProjectIds.includes(project.projectId);
            const alreadyRequested = invitations.some(
              (i) => i.projectId === project.projectId && i.applicantId === uid && i.status === 'Pending'
            );

            return (
              <div
                key={project.projectId}
                className="p-5 bg-white border border-[#D1D9E0] rounded-lg flex flex-col justify-between hover:border-[#0969DA]/60 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#656D76]">
                        <span className="font-medium text-[#0969DA]">{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.projectType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.difficulty}</span>
                        {project.visibility === 'Private' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-[#656D76]">
                              <Lock className="w-3 h-3" /> Private
                            </span>
                          </>
                        )}
                      </div>
                      <h3
                        onClick={() => setSelectedProjectId(project.projectId)}
                        className="mt-1 text-base font-semibold text-[#1F2328] hover:text-[#0969DA] cursor-pointer"
                      >
                        {project.title}
                      </h3>
                      <p className="text-xs text-[#656D76] mt-0.5">Owner: {project.ownerName}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          project.status === 'Open'
                            ? 'text-[#1A7F37]'
                            : project.status === 'Recruitment Closed'
                              ? 'text-[#CF222E]'
                              : 'text-[#0969DA]'
                        }`}
                      >
                        {project.status}
                      </span>
                      {match && !isMember && (
                        <span className="text-xs font-semibold text-[#0969DA] tabular-nums">
                          {match.overallScore}% match
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-2.5 text-sm text-[#656D76] line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-3 text-xs text-[#1F2328]">
                    <span className="font-medium text-[#656D76]">Required Skills: </span>
                    {project.requiredSkills.join(' · ')}
                  </div>
                  {project.technologies.length > 0 && (
                    <div className="mt-1 text-xs text-[#656D76]">
                      <span>Tech: {project.technologies.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#D1D9E0] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs text-[#656D76] tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {project.memberIds.length}/{project.teamSize} members
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{project.openPositions} open</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSaveProject(project.projectId)}
                      title={isSaved ? 'Remove bookmark' : 'Save project'}
                      className={`p-1.5 rounded-md border transition-colors ${
                        isSaved
                          ? 'bg-[#FFF8C5] border-[#FAE17D] text-[#9A6700]'
                          : 'bg-[#F6F8FA] border-[#D1D9E0] text-[#656D76] hover:text-[#1F2328]'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(project.projectId)}
                      className="px-3 py-1.5 text-xs font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-md"
                    >
                      View Project
                    </button>

                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => openEditModal(project)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0969DA] bg-[#DDF4FF]/60 hover:bg-[#DDF4FF] border border-[#B6E3FF] rounded-md"
                      >
                        <Edit3 className="w-3 h-3" />
                        Manage
                      </button>
                    ) : isMember ? (
                      <span className="text-xs font-medium text-[#1A7F37] px-2">Member</span>
                    ) : alreadyRequested ? (
                      <span className="text-xs font-medium text-[#656D76] px-2">Requested</span>
                    ) : (
                      <button
                        type="button"
                        disabled={project.openPositions <= 0 || project.status === 'Recruitment Closed'}
                        onClick={() => {
                          setJoinTarget(project);
                          setJoinRole('Contributor');
                          setJoinMessage('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-50 rounded-md"
                      >
                        <UserPlus className="w-3 h-3" />
                        Request to Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {activeDetailProject && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1D9E0] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D1D9E0]">
              <div>
                <p className="text-xs font-medium text-[#0969DA]">
                  {activeDetailProject.category} · {activeDetailProject.projectType} · {activeDetailProject.duration}
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#1F2328]">{activeDetailProject.title}</h2>
                <p className="text-xs text-[#656D76] mt-0.5">
                  Created by {activeDetailProject.ownerName} · Status: {activeDetailProject.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="p-1.5 text-[#656D76] hover:text-[#1F2328] rounded-md border border-[#D1D9E0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-[#656D76]">Overview</h3>
                <p className="mt-1 text-sm text-[#1F2328] leading-relaxed whitespace-pre-line">
                  {activeDetailProject.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg text-xs">
                <div>
                  <span className="text-[#656D76] block">Difficulty</span>
                  <span className="font-semibold text-[#1F2328]">{activeDetailProject.difficulty}</span>
                </div>
                <div>
                  <span className="text-[#656D76] block">Experience</span>
                  <span className="font-semibold text-[#1F2328]">{activeDetailProject.experienceRequired}</span>
                </div>
                <div>
                  <span className="text-[#656D76] block">Team Size</span>
                  <span className="font-semibold text-[#1F2328] tabular-nums">
                    {activeDetailProject.memberIds.length} / {activeDetailProject.teamSize}
                  </span>
                </div>
                <div>
                  <span className="text-[#656D76] block">Open Positions</span>
                  <span className="font-semibold text-[#1A7F37] tabular-nums">{activeDetailProject.openPositions}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#656D76]">Required Skills &amp; Technologies</h3>
                <p className="mt-1 text-sm text-[#1F2328]">
                  Skills: <span className="font-medium">{activeDetailProject.requiredSkills.join(', ')}</span>
                </p>
                {activeDetailProject.technologies.length > 0 && (
                  <p className="mt-1 text-sm text-[#656D76]">
                    Stack: {activeDetailProject.technologies.join(', ')}
                  </p>
                )}
              </div>

              {activeDetailProject.objectives.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[#656D76]">Project Objectives</h3>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside text-sm text-[#1F2328]">
                    {activeDetailProject.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Owner Controls & Applicants */}
              {activeDetailProject.ownerId === uid && (
                <div className="pt-3 border-t border-[#D1D9E0] space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(null);
                        setActiveView('team-builder');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Find Matches in Team Builder
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateProject(activeDetailProject.projectId, {
                          status:
                            activeDetailProject.status === 'Recruitment Closed' ? 'Open' : 'Recruitment Closed',
                        })
                      }
                      className="px-3 py-1.5 text-xs font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-md"
                    >
                      {activeDetailProject.status === 'Recruitment Closed'
                        ? 'Reopen Recruitment'
                        : 'Close Recruitment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openEditModal(activeDetailProject);
                        setSelectedProjectId(null);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-md"
                    >
                      Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteProject(activeDetailProject.projectId);
                        setSelectedProjectId(null);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#CF222E] bg-[#FFEBE9] hover:bg-[#FFD7D5] rounded-md ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-[#656D76] mb-2">
                      Applicants ({activeProjectApplicants.length})
                    </h4>
                    {activeProjectApplicants.length === 0 ? (
                      <p className="text-xs text-[#656D76]">No join requests for this project yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeProjectApplicants.map((app) => (
                          <div
                            key={app.invitationId}
                            className="p-3 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#1F2328]">
                                {app.applicantName} · {app.roleSuggested || 'Collaborator'}
                              </p>
                              {app.message && <p className="text-xs text-[#656D76] mt-0.5">{app.message}</p>}
                            </div>
                            {app.status === 'Pending' ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => respondToInvitation(app, 'Accepted')}
                                  className="px-2.5 py-1 text-xs font-medium text-white bg-[#1A7F37] rounded-md"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => respondToInvitation(app, 'Rejected')}
                                  className="px-2.5 py-1 text-xs font-medium text-[#CF222E] bg-white border border-[#D1D9E0] rounded-md"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-[#656D76]">{app.status}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#D1D9E0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setReportTarget(activeDetailProject)}
                className="inline-flex items-center gap-1 text-xs text-[#656D76] hover:text-[#CF222E]"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Project
              </button>
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="px-4 py-1.5 text-xs font-medium text-[#1F2328] bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1D9E0] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D1D9E0]">
              <h2 className="text-lg font-bold text-[#1F2328]">
                {editingId ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1.5 text-[#656D76] hover:text-[#1F2328] rounded-md border border-[#D1D9E0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-[#FFEBE9] border border-[#FF8182] text-xs text-[#CF222E]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1F2328] mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Campus Study AI Assistant"
                  className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F2328] mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem, goals, and what collaborators will build..."
                  className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                  >
                    {PROJECT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                  >
                    <option value="Open Source">Open Source</option>
                    <option value="Startup">Startup</option>
                    <option value="Academic">Academic</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Research">Research</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as ProjectDifficulty)}
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F2328] mb-1">
                  Required Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, Python, AI/ML, UI/UX"
                  className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F2328] mb-1">
                  Technologies (comma-separated)
                </label>
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="TypeScript, Tailwind CSS, Firebase, Gemini API"
                  className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F2328] mb-1">
                  Objectives (one per line)
                </label>
                <textarea
                  rows={2}
                  value={objectivesInput}
                  onChange={(e) => setObjectivesInput(e.target.value)}
                  placeholder="Ship MVP in 4 weeks&#10;Onboard 20 beta users"
                  className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Team Size</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Open Positions</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={openPositions}
                    onChange={(e) => setOpenPositions(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="8 weeks"
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Experience</label>
                  <select
                    value={experienceRequired}
                    onChange={(e) => setExperienceRequired(e.target.value as 'Any' | ExperienceLevel)}
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                  >
                    <option value="Any">Any</option>
                    <option value="Student">Student</option>
                    <option value="Entry">Entry</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                  >
                    <option value="Public">Public (Visible in Explore)</option>
                    <option value="Private">Private (Team only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1F2328] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Recruitment Closed">Recruitment Closed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D1D9E0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#1F2328] bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] disabled:opacity-60 rounded-lg"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Request Modal */}
      {joinTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleJoinSubmit}
            className="bg-white border border-[#D1D9E0] rounded-lg max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1F2328]">Request to Join Project</h3>
              <button type="button" onClick={() => setJoinTarget(null)} className="text-[#656D76]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#656D76]">
              Project: <span className="font-semibold text-[#1F2328]">{joinTarget.title}</span>
            </p>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Target Role</label>
              <input
                type="text"
                value={joinRole}
                onChange={(e) => setJoinRole(e.target.value)}
                placeholder="e.g. Frontend Developer, AI Engineer"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Pitch / Message to Owner</label>
              <textarea
                rows={3}
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Briefly share your relevant skills and why you want to collaborate..."
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setJoinTarget(null)}
                className="px-3.5 py-2 text-xs font-medium bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg"
              >
                <Send className="w-3.5 h-3.5" />
                Send Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Project Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleReportSubmit}
            className="bg-white border border-[#D1D9E0] rounded-lg max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-[#1F2328]">Report Project</h3>
            <p className="text-xs text-[#656D76]">Reporting: {reportTarget.title}</p>
            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Explain why this project should be reviewed by moderators..."
              className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="px-3.5 py-2 text-xs font-medium bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-[#CF222E] rounded-lg"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
