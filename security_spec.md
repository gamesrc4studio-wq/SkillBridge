# SkillBridge Security Specification (Phase 0)

## 1. Data Invariants

1. **Identity & PII Isolation**: Public developer profiles (`users/{userId}`) MUST NEVER contain PII (`email`). Email addresses and private bookmarks reside exclusively in `users/{userId}/private/account`, readable and writable only by `request.auth.uid == userId` or verified admin.
2. **Ownership Immutability**: On `projects`, `teams`, `tasks`, `invitations`, `savedAnalyses`, `activities`, and `reports`, `ownerId` / `senderId` / `userId` / `createdBy` / `reporterId` MUST match `request.auth.uid` on creation and remain immutable on update.
3. **Temporal Integrity**: All `createdAt`, `updatedAt`, and `timestamp` fields MUST equal `request.time` (`serverTimestamp()`) on write.
4. **Master Gate & Team Membership**: Tasks (`tasks/{taskId}`) and Team Messages (`messages/{messageId}`) can only be created/read/modified by the parent project's `ownerId` or members listed in `memberIds` on the parent `/projects/{projectId}` document.
5. **Terminal State & Action Transitions**: Invitations (`Pending` -> `Accepted` | `Rejected`) can only be transitioned by `receiverId`, and once `Accepted` or `Rejected`, cannot be altered by non-owners.
6. **Admin RBAC**: Admin moderation actions (`admins` check via verified email or `/admins/{uid}` document) cannot be self-assigned in `users/{userId}` or via client claims.
7. **Strict Schema & Size Bounds**: Every document checks `keys().hasAll(...)` and `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, and enforces `.size()` bounds on all strings and lists.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)

1. **Unauthenticated Write**: Create a project while `request.auth == null`.
2. **Unverified Email Write**: Create a project with `email_verified: false`.
3. **Shadow Field Injection on User**: Create `users/{uid}` with an extra `isAdmin: true` or `role: "admin"` field.
4. **PII Leak Attempt**: Read `users/{otherUid}/private/account` as a non-owner, non-admin user.
5. **Identity Spoofing on Project**: Create `projects/{id}` with `ownerId` set to another user's UID.
6. **ID Poisoning**: Create `projects/!invalid$id...` (or >128 char ID) violating `^[a-zA-Z0-9_\-]+$`.
7. **Timestamp Forgery**: Create a project with client-backdated `createdAt` instead of `request.time`.
8. **Unauthorized Task Creation**: Create a task in `tasks/{taskId}` for a project where the caller is neither `ownerId` nor in parent `projects/{projectId}.memberIds`.
9. **Unauthorized Message Snooping**: Read `messages/{msgId}` for a project where the caller is not in `teamMemberIds` and not `projectOwnerId`.
10. **Invitation Self-Approval**: As the sender of a `join_request`, attempt to update `invitations/{id}` `status` from `Pending` to `Accepted`.
11. **Project Owner Hijack**: Update `projects/{projectId}` changing `ownerId` or `createdAt`.
12. **Resource Exhaustion**: Create a project with a 50,000-character `description` or 100-item `requiredSkills` array.
