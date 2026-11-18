import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FolderKanban,
  Send,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  buildRecommendedTeam,
  computeTeamCoverageFromMembers,
  rankDevelopersForProject,
} from '../utils/matchingEngine';
import type { TeamMemberSnapshot } from '../types';
import { Avatar } from './Avatar';

export const TeamBuilderView: React.FC = () => {
  const {
    projects,
    developers,
    invitations,
    currentProfile,
    authUser,
    sendInvitation,
    createOrUpdateTeam,
    setActiveView,
    setSelectedTeamId,
    pushToast,
  } = useApp();

  const uid = currentProfile?.userId || authUser?.uid || '';
  const selectableProjects = useMemo(() => {
    const owned = projects.filter((p) => p.ownerId === uid);
    return owned.length > 0 ? owned : projects;
  }, [projects, uid]);

  const [selectedProjId, setSelectedProjId] = useState<string>(selectableProjects[0]?.projectId || '');

  useEffect(() => {
    if (!selectedProjId && selectableProjects[0]) {
      setSelectedProjId(selectableProjects[0].projectId);
    }
  }, [selectableProjects, selectedProjId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.projectId === selectedProjId) || null,
    [projects, selectedProjId]
  );

  const existingMemberProfiles = useMemo(() => {
    if (!selectedProject) return [];
    return developers.filter((d) => selectedProject.memberIds.includes(d.userId));
  }, [developers, selectedProject]);

  // Deterministic Auto Team Recommendation
  const recommendedPlan = useMemo(() => {
    if (!selectedProject) return null;
    return buildRecommendedTeam(selectedProject, developers, existingMemberProfiles);
  }, [selectedProject, developers, existingMemberProfiles]);

  // Full ranked candidate pool
  const rankedCandidates = useMemo(() => {
    if (!selectedProject) return [];
    return rankDevelopersForProject(selectedProject, developers);
  }, [selectedProject, developers]);

  // Owner-selected candidate IDs (initialized from deterministic recommendation)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);

  useEffect(() => {
    if (recommendedPlan) {
      setSelectedCandidateIds(recommendedPlan.candidates.map((c) => c.match.developer.userId));
    } else {
      setSelectedCandidateIds([]);
    }
  }, [selectedProjId, recommendedPlan]);

  const toggleCandidate = (devId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(devId) ? prev.filter((id) => id !== devId) : [...prev, devId]
    );
  };

  // Live combined coverage of existing members + owner-selected candidates
  const liveCoverage = useMemo(() => {
    if (!selectedProject) return { coveredSkills: [], missingSkills: [], coveragePercentage: 0 };
    const selectedDevs = developers.filter((d) => selectedCandidateIds.includes(d.userId));
    const combined = [...existingMemberProfiles, ...selectedDevs];
    return computeTeamCoverageFromMembers(selectedProject.requiredSkills, combined);
  }, [selectedProject, developers, selectedCandidateIds, existingMemberProfiles]);

  const handleSendAllInvitations = async () => {
    if (!selectedProject) return;
    if (selectedProject.ownerId !== uid) {
      pushToast('info', 'Only the project owner can send invitations for this project.');
      return;
    }
    if (selectedCandidateIds.length === 0) {
      pushToast('info', 'Select at least one candidate to invite.');
      return;
    }
    setSendingInvites(true);
    try {
      for (const devId of selectedCandidateIds) {
        const cand = rankedCandidates.find((c) => c.developer.userId === devId);
        const rec = recommendedPlan?.candidates.find((c) => c.match.developer.userId === devId);
        if (!cand) continue;
        await sendInvitation({
          type: 'invite',
          project: selectedProject,
          targetUser: cand.developer,
          roleSuggested: rec?.suggestedRole || 'Collaborator',
          message: `You were matched with ${cand.overallScore}% skill compatibility for "${selectedProject.title}".`,
        });
      }
      pushToast('success', `Sent ${selectedCandidateIds.length} team invitations.`);
    } finally {
      setSendingInvites(false);
    }
  };

  const handleApproveAndCreateTeam = async () => {
    if (!selectedProject) return;
    if (selectedProject.ownerId !== uid) {
      pushToast('info', 'Select one of your own projects to create or update its team.');
      return;
    }

    setCreatingTeam(true);
    try {
      const ownerProfile = developers.find((d) => d.userId === selectedProject.ownerId) || currentProfile;
      const memberSnapshots: TeamMemberSnapshot[] = [];

      if (ownerProfile) {
        memberSnapshots.push({
          userId: ownerProfile.userId,
          name: ownerProfile.name,
          username: ownerProfile.username,
          avatarUrl: ownerProfile.avatarUrl,
          role: 'Project Owner',
          skills: ownerProfile.skills,
          matchScore: 100,
        });
      }

      for (const dev of existingMemberProfiles) {
        if (dev.userId === selectedProject.ownerId) continue;
        const score = rankedCandidates.find((r) => r.developer.userId === dev.userId)?.overallScore ?? 90;
        memberSnapshots.push({
          userId: dev.userId,
          name: dev.name,
          username: dev.username,
          avatarUrl: dev.avatarUrl,
          role: 'Team Member',
          skills: dev.skills,
          matchScore: score,
        });
      }

      // Also include any selected candidates not yet listed in memberIds
      const selectedDevs = developers.filter(
        (d) => selectedCandidateIds.includes(d.userId) && !selectedProject.memberIds.includes(d.userId)
      );
      for (const dev of selectedDevs) {
        const rec = recommendedPlan?.candidates.find((c) => c.match.developer.userId === dev.userId);
        const score = rankedCandidates.find((r) => r.developer.userId === dev.userId)?.overallScore ?? 85;
        memberSnapshots.push({
          userId: dev.userId,
          name: dev.name,
          username: dev.username,
          avatarUrl: dev.avatarUrl,
          role: rec?.suggestedRole || 'Collaborator',
          skills: dev.skills,
          matchScore: score,
        });
      }

      const team = await createOrUpdateTeam({
        project: selectedProject,
        members: memberSnapshots,
        skillCoverage: liveCoverage.coveragePercentage,
        coveredSkills: liveCoverage.coveredSkills,
      });

      setSelectedTeamId(team.teamId);
      setActiveView('team-workspace');
    } finally {
      setCreatingTeam(false);
    }
  };

  if (selectableProjects.length === 0 || !selectedProject) {
    return (
      <div className="p-10 text-center bg-white border border-[#D1D9E0] rounded-lg">
        <FolderKanban className="w-10 h-10 text-[#656D76] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#1F2328]">Create a Project to Use Team Builder</h2>
        <p className="mt-1 text-sm text-[#656D76]">
          Team Builder reads your project's required skills and recommends an optimal, non-redundant developer roster.
        </p>
        <button
          type="button"
          onClick={() => setActiveView('my-projects')}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#0969DA] rounded-lg"
        >
          Go to My Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D1D9E0]">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2328]">Automatic Team Builder &amp; Skill Matching</h1>
          <p className="mt-1 text-sm text-[#656D76]">
            Deterministic set-cover algorithm that maximizes skill coverage and minimizes redundant member overlap.
          </p>
        </div>
      </div>

      {/* Step 1: Select Project */}
      <div className="p-5 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-[#1F2328] mb-1">1. Select Project</label>
          <select
            value={selectedProjId}
            onChange={(e) => setSelectedProjId(e.target.value)}
            className="w-full max-w-xl px-3 py-2 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
          >
            {selectableProjects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.title} ({p.ownerId === uid ? 'Owned' : 'Public Sample'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[#656D76] block">Target Team Size</span>
            <span className="font-semibold text-[#1F2328] tabular-nums">{selectedProject.teamSize} members</span>
          </div>
          <div>
            <span className="text-[#656D76] block">Current Coverage</span>
            <span className="font-bold text-[#1A7F37] text-base tabular-nums">
              {liveCoverage.coveragePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Coverage Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-5 bg-white border border-[#D1D9E0] rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1F2328]">Skill Coverage Analysis</h2>
            <span className="text-sm font-bold text-[#0969DA] tabular-nums">
              {liveCoverage.coveredSkills.length}/{selectedProject.requiredSkills.length} covered
            </span>
          </div>

          <div className="h-2.5 bg-[#F6F8FA] rounded-full overflow-hidden border border-[#D1D9E0]">
            <div
              className="h-full bg-[#1A7F37] transition-all"
              style={{ width: `${liveCoverage.coveragePercentage}%` }}
            />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="font-semibold text-[#656D76]">Required Project Skills</p>
              <p className="mt-1 text-[#1F2328]">{selectedProject.requiredSkills.join(' · ')}</p>
            </div>
            <div>
              <p className="font-semibold text-[#1A7F37]">Covered by Selected Roster</p>
              <p className="mt-1 text-[#1F2328]">
                {liveCoverage.coveredSkills.length > 0 ? liveCoverage.coveredSkills.join(' · ') : 'None yet'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#CF222E]">Missing Skills</p>
              <p className="mt-1 text-[#1F2328]">
                {liveCoverage.missingSkills.length > 0
                  ? liveCoverage.missingSkills.join(' · ')
                  : 'All required skills covered (100%)'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D1D9E0] space-y-2">
            <p className="text-xs font-semibold text-[#1F2328]">
              Selected Team Roster ({existingMemberProfiles.length + selectedCandidateIds.length} total)
            </p>
            <div className="space-y-1.5">
              {existingMemberProfiles.map((m) => (
                <div
                  key={m.userId}
                  className="px-3 py-2 bg-[#F6F8FA] border border-[#D1D9E0] rounded-md flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-[#1F2328]">{m.name} (Current Member)</span>
                  <span className="text-[#656D76]">{m.skills.slice(0, 3).join(', ')}</span>
                </div>
              ))}
              {developers
                .filter((d) => selectedCandidateIds.includes(d.userId))
                .map((d) => {
                  const score = rankedCandidates.find((r) => r.developer.userId === d.userId)?.overallScore ?? 0;
                  return (
                    <div
                      key={d.userId}
                      className="px-3 py-2 bg-[#DDF4FF]/45 border border-[#B6E3FF] rounded-md flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[#1F2328]">{d.name}</span>
                      <span className="font-semibold text-[#0969DA] tabular-nums">{score}% match</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {selectedProject.ownerId === uid ? (
            <div className="pt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled={sendingInvites || selectedCandidateIds.length === 0}
                onClick={handleSendAllInvitations}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#0969DA] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] disabled:opacity-50 rounded-lg"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingInvites
                  ? 'Sending Invitations...'
                  : `Send Invitations (${selectedCandidateIds.length} Selected)`}
              </button>
              <button
                type="button"
                disabled={creatingTeam}
                onClick={handleApproveAndCreateTeam}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1A7F37] hover:bg-[#15692D] disabled:opacity-50 rounded-lg"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {creatingTeam ? 'Creating Team...' : 'Approve & Launch Team Workspace'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-[#656D76] pt-2">
              Viewing matching preview for another owner's project. Select your own project to send invitations or form a team.
            </p>
          )}
        </div>

        {/* Recommended Set-Cover + Full Ranked Candidate Pool */}
        <div className="lg:col-span-7 space-y-4">
          {recommendedPlan && recommendedPlan.candidates.length > 0 && (
            <div className="p-4 bg-[#FFF8C5]/50 border border-[#FAE17D] rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A6700]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommended Optimal Combination ({recommendedPlan.coveragePercentage}% Skill Coverage)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCandidateIds(recommendedPlan.candidates.map((c) => c.match.developer.userId))
                  }
                  className="text-xs font-medium text-[#0969DA] hover:underline"
                >
                  Apply Recommended Roster
                </button>
              </div>
              <p className="mt-1 text-xs text-[#656D76]">
                Selected {recommendedPlan.candidates.length} complementary{' '}
                {recommendedPlan.candidates.length === 1 ? 'developer' : 'developers'} covering{' '}
                {recommendedPlan.coveredSkills.join(', ')}.
              </p>
            </div>
          )}

          <div className="bg-white border border-[#D1D9E0] rounded-lg divide-y divide-[#D1D9E0]">
            <div className="px-5 py-3.5 bg-[#F6F8FA] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1F2328]">
                Ranked Candidates ({rankedCandidates.length})
              </h2>
              <span className="text-xs text-[#656D76]">Sorted by weighted skill match score</span>
            </div>

            {rankedCandidates.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#656D76]">
                <Users className="w-8 h-8 mx-auto mb-2 text-[#656D76]" />
                No additional public developers available outside the current project team.
              </div>
            ) : (
              rankedCandidates.map((cand) => {
                const isSelected = selectedCandidateIds.includes(cand.developer.userId);
                const recEntry = recommendedPlan?.candidates.find(
                  (c) => c.match.developer.userId === cand.developer.userId
                );
                const existingInv = invitations.find(
                  (i) => i.projectId === selectedProject.projectId && i.applicantId === cand.developer.userId
                );

                return (
                  <div key={cand.developer.userId} className="p-4 hover:bg-[#F6F8FA]/60 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCandidate(cand.developer.userId)}
                          aria-label={`Select ${cand.developer.name}`}
                          className="mt-1.5 w-4 h-4 accent-[#0969DA]"
                        />
                        <Avatar name={cand.developer.name} src={cand.developer.avatarUrl} size="md" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#1F2328]">{cand.developer.name}</p>
                            {recEntry && (
                              <span className="px-2 py-0.5 text-[11px] font-medium bg-[#FFF8C5] text-[#9A6700] rounded-md">
                                Optimal Pick · {recEntry.suggestedRole}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#656D76] mt-0.5">{cand.breakdownSummary}</p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            <span className="text-[#1A7F37]">
                              Matching: {cand.matchingSkills.length > 0 ? cand.matchingSkills.join(', ') : 'None'}
                            </span>
                            {cand.missingSkills.length > 0 && (
                              <span className="text-[#656D76]">
                                Missing: {cand.missingSkills.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1.5">
                        <div>
                          <span className="text-base font-bold text-[#0969DA] tabular-nums">
                            {cand.overallScore}%
                          </span>
                          <p className="text-[11px] text-[#656D76] tabular-nums">
                            Skill {cand.skillScore}% · Prof {cand.proficiencyBonus}%
                          </p>
                        </div>
                        {selectedProject.ownerId === uid && (
                          <div>
                            {existingInv ? (
                              <span className="text-xs font-medium text-[#656D76]">
                                Invite: {existingInv.status}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  sendInvitation({
                                    type: 'invite',
                                    project: selectedProject,
                                    targetUser: cand.developer,
                                    roleSuggested: recEntry?.suggestedRole || 'Collaborator',
                                    message: `Invited based on ${cand.overallScore}% skill match.`,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0969DA] bg-white border border-[#D1D9E0] hover:border-[#0969DA] rounded-md"
                              >
                                <UserPlus className="w-3 h-3" />
                                Invite
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
