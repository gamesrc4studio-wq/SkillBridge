export const PROJECT_CATEGORIES = [
  'Web Development',
  'Artificial Intelligence',
  'Machine Learning',
  'Mobile Applications',
  'Data Science',
  'Cybersecurity',
  'Blockchain',
  'Other',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ExperienceLevel = 'Student' | 'Entry' | 'Intermediate' | 'Senior';
export type AvailabilityStatus = 'Available' | 'Part-time' | 'Weekends Only' | 'Busy';
export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type ProjectType = 'Open Source' | 'Startup' | 'Academic' | 'Hackathon' | 'Research';
export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ProjectStatus = 'Open' | 'In Progress' | 'Recruitment Closed' | 'Completed';
export type ProjectVisibility = 'Public' | 'Private';
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type InvitationStatus = 'Pending' | 'Accepted' | 'Rejected';
export type InvitationType = 'invite' | 'join_request';
export type TeamChannel = 'general' | 'engineering' | 'design' | 'milestones';

export interface UserProfile {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio: string;
  education: string;
  college: string;
  skills: string[];
  skillLevels: Record<string, SkillProficiency>;
  experience: ExperienceLevel;
  github: string;
  portfolio: string;
  interests: string[];
  availability: AvailabilityStatus;
  preferredCategories: ProjectCategory[];
  isPublic: boolean;
  profileCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrivateUserAccount {
  userId: string;
  email: string;
  savedProjectIds: string[];
  updatedAt?: string;
}

export interface Project {
  projectId: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  category: ProjectCategory;
  projectType: ProjectType;
  requiredSkills: string[];
  teamSize: number;
  experienceRequired: 'Any' | ExperienceLevel;
  duration: string;
  difficulty: ProjectDifficulty;
  openPositions: number;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  objectives: string[];
  technologies: string[];
  memberIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMemberSnapshot {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role: string;
  skills: string[];
  matchScore: number;
}

export interface TeamAnnouncement {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface TeamMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Team {
  teamId: string;
  projectId: string;
  projectTitle: string;
  ownerId: string;
  memberIds: string[];
  members: TeamMemberSnapshot[];
  skillCoverage: number;
  coveredSkills: string[];
  status: 'Active' | 'Completed' | 'Archived';
  sharedNotes: string;
  announcements: TeamAnnouncement[];
  milestones: TeamMilestone[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Invitation {
  invitationId: string;
  type: InvitationType;
  projectId: string;
  projectTitle: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  applicantId: string;
  applicantName: string;
  roleSuggested?: string;
  message?: string;
  status: InvitationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  taskId: string;
  projectId: string;
  teamId: string;
  projectOwnerId: string;
  teamMemberIds: string[];
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMessage {
  messageId: string;
  projectId: string;
  channel: TeamChannel;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  projectOwnerId: string;
  teamMemberIds: string[];
  timestamp: string;
}

export interface NotificationItem {
  notificationId: string;
  userId: string;
  actorId: string;
  type:
    | 'invitation'
    | 'invitation_accepted'
    | 'invitation_rejected'
    | 'join_request'
    | 'task_assigned'
    | 'task_updated'
    | 'announcement'
    | 'project_update';
  message: string;
  linkView?: string;
  read: boolean;
  timestamp: string;
}

export interface ModerationReport {
  reportId: string;
  reporterId: string;
  targetType: 'user' | 'project';
  targetId: string;
  targetTitle: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Dismissed';
  createdAt?: string;
  updatedAt?: string;
}

export interface AIProjectAnalysis {
  title: string;
  category: ProjectCategory;
  overview: string;
  problemStatement: string;
  proposedSolution: string;
  requiredSkills: string[];
  suggestedRoles: {
    role: string;
    responsibilities: string;
    skills: string[];
  }[];
  recommendedTeamSize: number;
  recommendedTechnologies: string[];
  complexity: ProjectDifficulty;
  roadmap: {
    phase: string;
    duration: string;
    focus: string;
  }[];
  milestones: {
    title: string;
    deliverable: string;
    targetWeek: string;
  }[];
  suggestedTasks: {
    title: string;
    description: string;
    priority: TaskPriority;
    role: string;
  }[];
}

export interface SavedAnalysis {
  analysisId: string;
  userId: string;
  ideaPrompt: string;
  result: AIProjectAnalysis;
  createdAt: string;
}

export interface AIProjectPlan {
  phases: {
    name: string;
    goal: string;
    timeframe: string;
  }[];
  milestones: {
    title: string;
    criteria: string;
    dueOffsetDays: number;
  }[];
  tasks: {
    title: string;
    description: string;
    priority: TaskPriority;
    dueOffsetDays: number;
    suggestedRole: string;
  }[];
  techRecommendations: {
    technology: string;
    purpose: string;
  }[];
  challenges: {
    risk: string;
    mitigation: string;
  }[];
}

export interface ActivityEvent {
  activityId: string;
  userId: string;
  action: string;
  targetTitle: string;
  dateKey: string;
  timestamp: string;
}

export type AppView =
  | 'landing'
  | 'login'
  | 'profile-setup'
  | 'overview'
  | 'my-projects'
  | 'explore-projects'
  | 'find-developers'
  | 'team-builder'
  | 'team-workspace'
  | 'invitations'
  | 'my-tasks'
  | 'ai-analyzer'
  | 'ai-planner'
  | 'settings'
  | 'admin';

export interface SkillMatchResult {
  developer: UserProfile;
  overallScore: number;
  skillScore: number;
  proficiencyBonus: number;
  experienceScore: number;
  availabilityScore: number;
  interestScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  breakdownSummary: string;
}

export interface RecommendedTeamCandidate {
  match: SkillMatchResult;
  newlyCoveredSkills: string[];
  suggestedRole: string;
}

export interface RecommendedTeamPlan {
  candidates: RecommendedTeamCandidate[];
  coveredSkills: string[];
  missingSkills: string[];
  coveragePercentage: number;
  averageMatchScore: number;
}
