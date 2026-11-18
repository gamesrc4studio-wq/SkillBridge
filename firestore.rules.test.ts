/**
 * SkillBridge Security Rules Verification Suite (Dirty Dozen Adversarial Payloads)
 * Verifies rule invariants against firebase-blueprint.json schema & DRAFT_firestore.rules.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
  enforcedByRule: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Project Write',
    collection: 'projects/proj_unauth',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { projectId: 'proj_unauth', title: 'Rogue Project' },
    enforcedByRule: 'isVerified() rejects null auth',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    collection: 'projects/proj_unverified',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { email_verified: false, projectId: 'proj_unverified' },
    enforcedByRule: 'request.auth.token.email_verified == true',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on User Profile',
    collection: 'users/uid_attacker',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { userId: 'uid_attacker', isAdmin: true, role: 'superadmin' },
    enforcedByRule: 'incoming().keys().hasOnly([...]) rejects isAdmin and role',
  },
  {
    id: 4,
    name: 'PII Leak Attempt on Private Account',
    collection: 'users/uid_victim/private/account',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { callerUid: 'uid_attacker' },
    enforcedByRule: 'isOwner(userId) || isAdmin() blocks non-owner read',
  },
  {
    id: 5,
    name: 'Identity Spoofing on Project Create',
    collection: 'projects/proj_spoof',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { projectId: 'proj_spoof', ownerId: 'uid_victim' },
    enforcedByRule: 'incoming().ownerId == request.auth.uid',
  },
  {
    id: 6,
    name: 'Document ID Poisoning',
    collection: 'projects/bad$id!with*chars',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { projectId: 'bad$id!with*chars' },
    enforcedByRule: "isValidId(projectId) matches '^[a-zA-Z0-9_\\\\-]+$'",
  },
  {
    id: 7,
    name: 'Client Timestamp Forgery',
    collection: 'projects/proj_time',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    enforcedByRule: 'incoming().createdAt == request.time',
  },
  {
    id: 8,
    name: 'Unauthorized Task Creation',
    collection: 'tasks/task_rogue',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { taskId: 'task_rogue', projectId: 'proj_other' },
    enforcedByRule: 'isProjectMember(incoming().projectId) Master Gate',
  },
  {
    id: 9,
    name: 'Unauthorized Team Message Snooping',
    collection: 'messages/msg_private',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { callerUid: 'uid_outsider' },
    enforcedByRule: 'projectOwnerId == uid || uid in teamMemberIds',
  },
  {
    id: 10,
    name: 'Invitation Self-Approval',
    collection: 'invitations/proj1_uid_attacker',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { status: 'Accepted', callerUid: 'uid_attacker' },
    enforcedByRule: 'existing().receiverId == request.auth.uid',
  },
  {
    id: 11,
    name: 'Project Owner Hijack on Update',
    collection: 'projects/proj1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { ownerId: 'uid_attacker' },
    enforcedByRule: 'incoming().ownerId == existing().ownerId',
  },
  {
    id: 12,
    name: 'Resource Exhaustion Payload',
    collection: 'projects/proj_dos',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { descriptionLength: 50000, requiredSkillsCount: 100 },
    enforcedByRule: 'isValidString(data.description, 10, 3000) && isValidStringList(data.requiredSkills, 25)',
  },
];
