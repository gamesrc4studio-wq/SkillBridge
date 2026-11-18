import type {
  AvailabilityStatus,
  ExperienceLevel,
  Project,
  RecommendedTeamCandidate,
  RecommendedTeamPlan,
  SkillMatchResult,
  SkillProficiency,
  UserProfile,
} from '../types';

const SKILL_ALIASES: Record<string, string> = {
  'reactjs': 'react',
  'react.js': 'react',
  'nodejs': 'node.js',
  'node': 'node.js',
  'nextjs': 'next.js',
  'next': 'next.js',
  'ts': 'typescript',
  'js': 'javascript',
  'ui/ux design': 'ui/ux',
  'ux/ui': 'ui/ux',
  'ui design': 'ui/ux',
  'ux design': 'ui/ux',
  'ai': 'ai/ml',
  'ml': 'ai/ml',
  'machine learning': 'ai/ml',
  'artificial intelligence': 'ai/ml',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'tailwind': 'tailwind css',
  'tailwindcss': 'tailwind css',
  'k8s': 'kubernetes',
  'py': 'python',
};

export function normalizeSkill(skill: string): string {
  const lower = skill.trim().toLowerCase();
  return SKILL_ALIASES[lower] ?? lower;
}

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = {
  Student: 1,
  Entry: 2,
  Intermediate: 3,
  Senior: 4,
};

const PROFICIENCY_WEIGHT: Record<SkillProficiency, number> = {
  Beginner: 0.45,
  Intermediate: 0.7,
  Advanced: 0.9,
  Expert: 1.0,
};

const AVAILABILITY_SCORE: Record<AvailabilityStatus, number> = {
  Available: 100,
  'Part-time': 75,
  'Weekends Only': 55,
  Busy: 20,
};

export function calculateSkillMatch(project: Project, developer: UserProfile): SkillMatchResult {
  const required = project.requiredSkills.filter(Boolean);
  const devSkillMap = new Map<string, { original: string; proficiency: SkillProficiency }>();

  for (const s of developer.skills) {
    const norm = normalizeSkill(s);
    const prof = developer.skillLevels?.[s] ?? 'Intermediate';
    devSkillMap.set(norm, { original: s, proficiency: prof });
  }

  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  let proficiencySum = 0;

  for (const reqSkill of required) {
    const normReq = normalizeSkill(reqSkill);
    const hit = devSkillMap.get(normReq);
    if (hit) {
      matchingSkills.push(reqSkill);
      proficiencySum += PROFICIENCY_WEIGHT[hit.proficiency] ?? 0.7;
    } else {
      missingSkills.push(reqSkill);
    }
  }

  // 1. Skill Overlap (55% weight)
  const skillRatio = required.length > 0 ? matchingSkills.length / required.length : 0;
  const skillScore = Math.round(skillRatio * 100);

  // 2. Proficiency on matched skills (15% weight)
  const avgProf = matchingSkills.length > 0 ? proficiencySum / matchingSkills.length : 0;
  const proficiencyBonus = Math.round(avgProf * 100);

  // 3. Experience Alignment (15% weight)
  let experienceScore = 100;
  if (project.experienceRequired !== 'Any') {
    const reqRank = EXPERIENCE_RANK[project.experienceRequired] ?? 2;
    const devRank = EXPERIENCE_RANK[developer.experience] ?? 2;
    if (devRank >= reqRank) {
      experienceScore = 100;
    } else if (reqRank - devRank === 1) {
      experienceScore = 70;
    } else {
      experienceScore = 40;
    }
  }

  // 4. Availability (10% weight)
  const availabilityScore = AVAILABILITY_SCORE[developer.availability] ?? 60;

  // 5. Category / Interest Alignment (5% weight)
  const catLower = project.category.toLowerCase();
  const catMatch = developer.preferredCategories?.some((c) => c.toLowerCase() === catLower);
  const interestMatch = developer.interests?.some((int) => {
    const il = int.toLowerCase();
    return catLower.includes(il) || il.includes(catLower.split(' ')[0]);
  });
  const interestScore = catMatch ? 100 : interestMatch ? 80 : 30;

  // Weighted total
  const overallScore = Math.min(
    100,
    Math.round(
      skillScore * 0.55 +
        proficiencyBonus * 0.15 +
        experienceScore * 0.15 +
        availabilityScore * 0.10 +
        interestScore * 0.05
    )
  );

  const breakdownSummary = `${matchingSkills.length}/${required.length} required skills · ${developer.experience} · ${developer.availability}`;

  return {
    developer,
    overallScore,
    skillScore,
    proficiencyBonus,
    experienceScore,
    availabilityScore,
    interestScore,
    matchingSkills,
    missingSkills,
    breakdownSummary,
  };
}

export function rankDevelopersForProject(
  project: Project,
  developers: UserProfile[],
  excludeIds: string[] = []
): SkillMatchResult[] {
  const excluded = new Set([project.ownerId, ...project.memberIds, ...excludeIds]);
  return developers
    .filter((d) => d.isPublic && !excluded.has(d.userId))
    .map((dev) => calculateSkillMatch(project, dev))
    .sort((a, b) => {
      if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
      if (b.matchingSkills.length !== a.matchingSkills.length) {
        return b.matchingSkills.length - a.matchingSkills.length;
      }
      return a.developer.userId.localeCompare(b.developer.userId);
    });
}

function inferRoleFromSkills(skills: string[]): string {
  const norms = skills.map(normalizeSkill);
  if (norms.some((s) => s.includes('ai/ml') || s.includes('pytorch') || s.includes('tensorflow') || s.includes('nlp'))) {
    return 'AI / ML Engineer';
  }
  if (norms.some((s) => s.includes('data') || s.includes('pandas') || s.includes('sql'))) {
    return 'Data Scientist';
  }
  if (norms.some((s) => s.includes('ui/ux') || s.includes('figma') || s.includes('design'))) {
    return 'UI/UX Designer';
  }
  if (norms.some((s) => s.includes('react') || s.includes('vue') || s.includes('tailwind') || s.includes('frontend'))) {
    if (norms.some((s) => s.includes('node.js') || s.includes('python') || s.includes('mongodb') || s.includes('postgresql'))) {
      return 'Full-Stack Developer';
    }
    return 'Frontend Developer';
  }
  if (norms.some((s) => s.includes('node.js') || s.includes('python') || s.includes('go') || s.includes('java') || s.includes('firebase'))) {
    return 'Backend Engineer';
  }
  if (norms.some((s) => s.includes('security') || s.includes('solidity') || s.includes('blockchain'))) {
    return 'Security / Protocol Engineer';
  }
  return 'Software Contributor';
}

/**
 * Deterministic Team Formation Engine (Greedy Set-Cover + Match Score Tie-Breaker)
 * Prioritizes covering missing project skills and avoids selecting redundant members unnecessarily.
 */
export function buildRecommendedTeam(
  project: Project,
  developers: UserProfile[],
  existingMemberProfiles: UserProfile[] = []
): RecommendedTeamPlan {
  const required = project.requiredSkills.filter(Boolean);
  const coveredNorms = new Set<string>();

  for (const existing of existingMemberProfiles) {
    for (const s of existing.skills) {
      const norm = normalizeSkill(s);
      if (required.some((r) => normalizeSkill(r) === norm)) {
        coveredNorms.add(norm);
      }
    }
  }

  const maxAdditionalSlots = Math.max(1, project.teamSize - Math.max(1, project.memberIds.length));
  const pool = rankDevelopersForProject(project, developers);
  const selected: RecommendedTeamCandidate[] = [];
  const usedIds = new Set<string>();

  for (let slot = 0; slot < maxAdditionalSlots; slot++) {
    const uncoveredReq = required.filter((r) => !coveredNorms.has(normalizeSkill(r)));
    if (uncoveredReq.length === 0 && selected.length > 0) {
      break; // Avoid adding redundant members when 100% required skills are already covered
    }

    let bestCandidate: {
      match: SkillMatchResult;
      newlyCovered: string[];
    } | null = null;

    for (const candidate of pool) {
      if (usedIds.has(candidate.developer.userId)) continue;

      const newlyCovered = candidate.matchingSkills.filter(
        (skill) => !coveredNorms.has(normalizeSkill(skill))
      );

      if (uncoveredReq.length > 0 && newlyCovered.length === 0) {
        continue; // Skip candidates who add zero uncovered skills while gaps remain
      }

      if (!bestCandidate) {
        bestCandidate = { match: candidate, newlyCovered };
      } else if (newlyCovered.length > bestCandidate.newlyCovered.length) {
        bestCandidate = { match: candidate, newlyCovered };
      } else if (
        newlyCovered.length === bestCandidate.newlyCovered.length &&
        candidate.overallScore > bestCandidate.match.overallScore
      ) {
        bestCandidate = { match: candidate, newlyCovered };
      }
    }

    if (!bestCandidate) break;

    usedIds.add(bestCandidate.match.developer.userId);
    for (const s of bestCandidate.newlyCovered) {
      coveredNorms.add(normalizeSkill(s));
    }

    selected.push({
      match: bestCandidate.match,
      newlyCoveredSkills: bestCandidate.newlyCovered,
      suggestedRole: inferRoleFromSkills(
        bestCandidate.newlyCovered.length > 0
          ? bestCandidate.newlyCovered
          : bestCandidate.match.developer.skills
      ),
    });
  }

  const coveredSkills = required.filter((r) => coveredNorms.has(normalizeSkill(r)));
  const missingSkills = required.filter((r) => !coveredNorms.has(normalizeSkill(r)));
  const coveragePercentage =
    required.length > 0 ? Math.round((coveredSkills.length / required.length) * 100) : 100;
  const averageMatchScore =
    selected.length > 0
      ? Math.round(selected.reduce((acc, c) => acc + c.match.overallScore, 0) / selected.length)
      : 0;

  return {
    candidates: selected,
    coveredSkills,
    missingSkills,
    coveragePercentage,
    averageMatchScore,
  };
}

export function computeTeamCoverageFromMembers(
  requiredSkills: string[],
  members: { skills: string[] }[]
): { coveredSkills: string[]; missingSkills: string[]; coveragePercentage: number } {
  const memberNorms = new Set<string>();
  for (const m of members) {
    for (const s of m.skills) {
      memberNorms.add(normalizeSkill(s));
    }
  }
  const coveredSkills = requiredSkills.filter((r) => memberNorms.has(normalizeSkill(r)));
  const missingSkills = requiredSkills.filter((r) => !memberNorms.has(normalizeSkill(r)));
  const coveragePercentage =
    requiredSkills.length > 0
      ? Math.round((coveredSkills.length / requiredSkills.length) * 100)
      : 100;
  return { coveredSkills, missingSkills, coveragePercentage };
}
