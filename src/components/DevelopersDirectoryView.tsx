import React, { useMemo, useState } from 'react';
import { ExternalLink, Flag, Github, Globe, Mail, Search, Send, UserPlus, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateSkillMatch } from '../utils/matchingEngine';
import type { UserProfile } from '../types';
import { Avatar } from './Avatar';

export const DevelopersDirectoryView: React.FC = () => {
  const {
    developers,
    projects,
    currentProfile,
    authUser,
    selectedProfileId,
    setSelectedProfileId,
    sendInvitation,
    submitReport,
    setActiveView,
    pushToast,
  } = useApp();

  const uid = currentProfile?.userId || authUser?.uid || '';
  const myOwnedProjects = useMemo(() => projects.filter((p) => p.ownerId === uid), [projects, uid]);

  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [expFilter, setExpFilter] = useState('All');
  const [availFilter, setAvailFilter] = useState('All');
  const [matchProjectId, setMatchProjectId] = useState<string>(myOwnedProjects[0]?.projectId || '');

  // Invite Modal
  const [inviteTarget, setInviteTarget] = useState<UserProfile | null>(null);
  const [inviteProjectId, setInviteProjectId] = useState<string>(myOwnedProjects[0]?.projectId || '');
  const [inviteRole, setInviteRole] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  // Report Modal
  const [reportDev, setReportDev] = useState<UserProfile | null>(null);
  const [reportReason, setReportReason] = useState('');

  const referenceProject = useMemo(
    () => projects.find((p) => p.projectId === matchProjectId) || null,
    [projects, matchProjectId]
  );

  const filteredDevelopers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sk = skillFilter.trim().toLowerCase();

    return developers
      .filter((d) => d.isPublic)
      .filter((d) => {
        if (q) {
          const hay = `${d.name} ${d.username} ${d.bio} ${d.college} ${d.skills.join(' ')} ${d.interests.join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (sk && !d.skills.some((s) => s.toLowerCase().includes(sk))) return false;
        if (expFilter !== 'All' && d.experience !== expFilter) return false;
        if (availFilter !== 'All' && d.availability !== availFilter) return false;
        return true;
      })
      .map((dev) => ({
        dev,
        match: referenceProject ? calculateSkillMatch(referenceProject, dev) : null,
      }))
      .sort((a, b) => {
        if (a.match && b.match) return b.match.overallScore - a.match.overallScore;
        return a.dev.name.localeCompare(b.dev.name);
      });
  }, [developers, search, skillFilter, expFilter, availFilter, referenceProject]);

  const activeProfile = useMemo(
    () => developers.find((d) => d.userId === selectedProfileId) || null,
    [developers, selectedProfileId]
  );

  const handleOpenInvite = (dev: UserProfile) => {
    if (myOwnedProjects.length === 0) {
      pushToast('info', 'Create a project first so you can invite developers to your team.');
      setActiveView('my-projects');
      return;
    }
    setInviteTarget(dev);
    setInviteProjectId(matchProjectId || myOwnedProjects[0].projectId);
    setInviteRole('');
    setInviteMsg(`Hi ${dev.name}, your skill profile fits our project goals. Would you like to collaborate?`);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTarget) return;
    const proj = projects.find((p) => p.projectId === inviteProjectId);
    if (!proj) return;
    await sendInvitation({
      type: 'invite',
      project: proj,
      targetUser: inviteTarget,
      roleSuggested: inviteRole || 'Collaborator',
      message: inviteMsg,
    });
    setInviteTarget(null);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDev) return;
    if (reportReason.trim().length < 5) {
      pushToast('error', 'Please enter a reason (at least 5 characters).');
      return;
    }
    await submitReport({
      targetType: 'user',
      targetId: reportDev.userId,
      targetTitle: `${reportDev.name} (@${reportDev.username})`,
      reason: reportReason.trim(),
    });
    setReportDev(null);
    setReportReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D1D9E0]">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2328]">Find Developers</h1>
          <p className="mt-1 text-sm text-[#656D76]">
            Browse public developer profiles, inspect verified skills, and rank candidates against your projects.
          </p>
        </div>
        {myOwnedProjects.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#656D76] whitespace-nowrap">Rank relevance for:</span>
            <select
              value={matchProjectId}
              onChange={(e) => setMatchProjectId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg max-w-[220px]"
            >
              <option value="">Alphabetical (No project)</option>
              {myOwnedProjects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#656D76] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username, bio..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
          />
        </div>
        <input
          type="text"
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          placeholder="Filter by skill (e.g. Python)"
          className="px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
        />
        <select
          value={expFilter}
          onChange={(e) => setExpFilter(e.target.value)}
          aria-label="Filter by experience"
          className="px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg"
        >
          <option value="All">Experience: All</option>
          <option value="Student">Student</option>
          <option value="Entry">Entry</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Senior">Senior</option>
        </select>
        <select
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value)}
          aria-label="Filter by availability"
          className="px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg"
        >
          <option value="All">Availability: All</option>
          <option value="Available">Available</option>
          <option value="Part-time">Part-time</option>
          <option value="Weekends Only">Weekends Only</option>
          <option value="Busy">Busy</option>
        </select>
      </div>

      {/* Directory Grid */}
      {filteredDevelopers.length === 0 ? (
        <div className="p-10 text-center bg-white border border-[#D1D9E0] rounded-lg">
          <Users className="w-9 h-9 text-[#656D76] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#1F2328]">No public developers match these filters</h3>
          <p className="mt-1 text-sm text-[#656D76]">Try clearing the skill or availability filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDevelopers.map(({ dev, match }) => (
            <div
              key={dev.userId}
              className="p-5 bg-white border border-[#D1D9E0] rounded-lg flex flex-col justify-between hover:border-[#0969DA]/60 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={dev.name} src={dev.avatarUrl} size="lg" />
                    <div className="min-w-0">
                      <h3
                        onClick={() => setSelectedProfileId(dev.userId)}
                        className="text-base font-semibold text-[#1F2328] hover:text-[#0969DA] cursor-pointer truncate"
                      >
                        {dev.name}
                      </h3>
                      <p className="text-xs text-[#656D76] truncate">
                        @{dev.username} · {dev.experience} · {dev.availability}
                      </p>
                    </div>
                  </div>
                  {match && dev.userId !== uid && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#DDF4FF] text-[#0969DA] tabular-nums shrink-0">
                      {match.overallScore}% match
                    </span>
                  )}
                </div>

                {dev.bio && <p className="mt-3 text-sm text-[#656D76] line-clamp-2 leading-relaxed">{dev.bio}</p>}

                <div className="mt-3 text-xs text-[#1F2328]">
                  <span className="font-medium text-[#656D76]">Skills: </span>
                  {dev.skills.join(' · ')}
                </div>

                {(dev.education || dev.college) && (
                  <p className="mt-1 text-xs text-[#656D76]">
                    {[dev.education, dev.college].filter(Boolean).join(' · ')}
                  </p>
                )}

                {match && match.matchingSkills.length > 0 && (
                  <p className="mt-2 text-xs text-[#1A7F37]">
                    Matches {match.matchingSkills.length} project skills: {match.matchingSkills.join(', ')}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3.5 border-t border-[#D1D9E0] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-[#656D76]">
                  {dev.github && (
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-[#1F2328]"
                    >
                      <Github className="w-3.5 h-3.5" /> GitHub
                    </a>
                  )}
                  {dev.portfolio && (
                    <a
                      href={dev.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-[#1F2328]"
                    >
                      <Globe className="w-3.5 h-3.5" /> Portfolio
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProfileId(dev.userId)}
                    className="px-3 py-1.5 text-xs font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-md"
                  >
                    View Profile
                  </button>
                  {dev.userId !== uid && (
                    <button
                      type="button"
                      onClick={() => handleOpenInvite(dev)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-md"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Invite to Project
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Public Profile Modal */}
      {activeProfile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1D9E0] rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D1D9E0]">
              <div className="flex items-center gap-4">
                <Avatar name={activeProfile.name} src={activeProfile.avatarUrl} size="xl" />
                <div>
                  <h2 className="text-xl font-bold text-[#1F2328]">{activeProfile.name}</h2>
                  <p className="text-sm text-[#656D76]">
                    @{activeProfile.username} · {activeProfile.experience} · {activeProfile.availability}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfileId(null)}
                className="p-1.5 text-[#656D76] hover:text-[#1F2328] rounded-md border border-[#D1D9E0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeProfile.bio && (
              <div>
                <h3 className="text-xs font-semibold text-[#656D76]">About</h3>
                <p className="mt-1 text-sm text-[#1F2328] leading-relaxed">{activeProfile.bio}</p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-[#656D76] mb-2">Skills &amp; Proficiency</h3>
              <div className="grid grid-cols-2 gap-2">
                {activeProfile.skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-3 py-2 bg-[#F6F8FA] border border-[#D1D9E0] rounded-md flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-[#1F2328]">{skill}</span>
                    <span className="text-[#656D76]">{activeProfile.skillLevels?.[skill] || 'Intermediate'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#656D76] block">Education</span>
                <span className="text-[#1F2328] font-medium">
                  {[activeProfile.education, activeProfile.college].filter(Boolean).join(' · ') || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-[#656D76] block">Interests</span>
                <span className="text-[#1F2328] font-medium">
                  {activeProfile.interests.join(', ') || 'General Engineering'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {activeProfile.github && (
                <a
                  href={activeProfile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F8FA] border border-[#D1D9E0] rounded-md text-[#1F2328] hover:border-[#0969DA]"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub Profile
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {activeProfile.portfolio && (
                <a
                  href={activeProfile.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F8FA] border border-[#D1D9E0] rounded-md text-[#1F2328] hover:border-[#0969DA]"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Portfolio
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="pt-4 border-t border-[#D1D9E0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setReportDev(activeProfile)}
                className="inline-flex items-center gap-1 text-xs text-[#656D76] hover:text-[#CF222E]"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Profile
              </button>
              <div className="flex items-center gap-2">
                {activeProfile.userId !== uid && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = activeProfile;
                      setSelectedProfileId(null);
                      handleOpenInvite(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#0969DA] rounded-md"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Invite to Project
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedProfileId(null)}
                  className="px-4 py-1.5 text-xs font-medium bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSendInvite}
            className="bg-white border border-[#D1D9E0] rounded-lg max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1F2328]">Invite {inviteTarget.name}</h3>
              <button type="button" onClick={() => setInviteTarget(null)} className="text-[#656D76]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Select Project</label>
              <select
                value={inviteProjectId}
                onChange={(e) => setInviteProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              >
                {myOwnedProjects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Suggested Role</label>
              <input
                type="text"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                placeholder="e.g. AI/ML Engineer, Frontend Lead"
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2328] mb-1">Invitation Note</label>
              <textarea
                rows={3}
                value={inviteMsg}
                onChange={(e) => setInviteMsg(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInviteTarget(null)}
                className="px-3.5 py-2 text-xs font-medium bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0969DA] rounded-lg"
              >
                <Send className="w-3.5 h-3.5" />
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Profile Modal */}
      {reportDev && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleReportSubmit}
            className="bg-white border border-[#D1D9E0] rounded-lg max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-[#1F2328]">Report Profile</h3>
            <p className="text-xs text-[#656D76]">Reporting: {reportDev.name}</p>
            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full px-3 py-2 text-sm bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportDev(null)}
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
