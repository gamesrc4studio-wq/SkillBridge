// Validation constants synchronized verbatim with firebase-blueprint.json

export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const DATE_KEY_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export const LIMITS = {
  ID_MAX: 128,
  NAME_MAX: 100,
  USERNAME_MIN: 2,
  USERNAME_MAX: 40,
  URL_MAX: 300,
  AVATAR_URL_MAX: 500,
  BIO_MAX: 600,
  EDUCATION_MAX: 120,
  COLLEGE_MAX: 150,
  SKILL_MAX_LEN: 100,
  SKILLS_MAX_COUNT: 25,
  INTERESTS_MAX_COUNT: 20,
  CATEGORIES_MAX_COUNT: 10,
  PROJECT_TITLE_MIN: 2,
  PROJECT_TITLE_MAX: 140,
  PROJECT_DESC_MIN: 10,
  PROJECT_DESC_MAX: 3000,
  PROJECT_DURATION_MAX: 60,
  TEAM_SIZE_MIN: 1,
  TEAM_SIZE_MAX: 20,
  SHARED_NOTES_MAX: 5000,
  TASK_TITLE_MIN: 2,
  TASK_TITLE_MAX: 160,
  TASK_DESC_MAX: 1500,
  MESSAGE_MAX: 2000,
  NOTIFICATION_MAX: 500,
  REPORT_REASON_MIN: 5,
  REPORT_REASON_MAX: 1000,
  SAVED_PROJECTS_MAX: 50,
} as const;

export function sanitizeId(input: string): string {
  const cleaned = input.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, LIMITS.ID_MAX);
  return cleaned || `id_${Date.now()}`;
}

export function sanitizeUsername(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, LIMITS.USERNAME_MAX);
  return cleaned.length >= LIMITS.USERNAME_MIN ? cleaned : `dev_${Date.now().toString().slice(-6)}`;
}

export function clampString(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

export function clampStringArray(items: string[], maxCount: number, maxItemLen = LIMITS.SKILL_MAX_LEN): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item.trim().slice(0, maxItemLen);
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      out.push(trimmed);
      if (out.length >= maxCount) break;
    }
  }
  return out;
}

export function validateProfileInput(input: {
  name: string;
  username: string;
  bio: string;
  skills: string[];
  github?: string;
  portfolio?: string;
}): string | null {
  if (!input.name.trim() || input.name.trim().length > LIMITS.NAME_MAX) {
    return `Full name must be between 1 and ${LIMITS.NAME_MAX} characters.`;
  }
  const uname = input.username.trim();
  if (uname.length < LIMITS.USERNAME_MIN || uname.length > LIMITS.USERNAME_MAX || !ID_PATTERN.test(uname)) {
    return 'Username must be 2–40 characters using only letters, numbers, underscores, or hyphens.';
  }
  if (input.bio.length > LIMITS.BIO_MAX) {
    return `Bio must be under ${LIMITS.BIO_MAX} characters.`;
  }
  if (input.skills.length === 0) {
    return 'Please add at least one technical skill.';
  }
  if (input.github && input.github.trim() && !/^https?:\/\//i.test(input.github.trim())) {
    return 'GitHub URL must start with http:// or https://';
  }
  if (input.portfolio && input.portfolio.trim() && !/^https?:\/\//i.test(input.portfolio.trim())) {
    return 'Portfolio URL must start with http:// or https://';
  }
  return null;
}

export function validateProjectInput(input: {
  title: string;
  description: string;
  requiredSkills: string[];
  teamSize: number;
  duration: string;
}): string | null {
  const title = input.title.trim();
  if (title.length < LIMITS.PROJECT_TITLE_MIN || title.length > LIMITS.PROJECT_TITLE_MAX) {
    return `Project name must be between ${LIMITS.PROJECT_TITLE_MIN} and ${LIMITS.PROJECT_TITLE_MAX} characters.`;
  }
  const desc = input.description.trim();
  if (desc.length < LIMITS.PROJECT_DESC_MIN || desc.length > LIMITS.PROJECT_DESC_MAX) {
    return `Description must be between ${LIMITS.PROJECT_DESC_MIN} and ${LIMITS.PROJECT_DESC_MAX} characters.`;
  }
  if (input.requiredSkills.length === 0) {
    return 'Add at least one required skill for matching.';
  }
  if (input.teamSize < LIMITS.TEAM_SIZE_MIN || input.teamSize > LIMITS.TEAM_SIZE_MAX) {
    return `Team size must be between ${LIMITS.TEAM_SIZE_MIN} and ${LIMITS.TEAM_SIZE_MAX}.`;
  }
  if (!input.duration.trim()) {
    return 'Specify an estimated project duration.';
  }
  return null;
}

export function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
