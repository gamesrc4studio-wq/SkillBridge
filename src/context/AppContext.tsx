import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase';
import type {
  ActivityEvent,
  AIProjectAnalysis,
  AppView,
  Invitation,
  ModerationReport,
  NotificationItem,
  Project,
  SavedAnalysis,
  Task,
  Team,
  TeamChannel,
  TeamMemberSnapshot,
  TeamMessage,
  UserProfile,
} from '../types';
import { clampString, clampStringArray, sanitizeId, sanitizeUsername, todayDateKey } from '../utils/validation';

function tsToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function formatAuthError(err: unknown): string {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before finishing. Try again when ready.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups for this site or sign in with email.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open.';
    case 'auth/network-request-failed':
      return 'Network error while connecting to Firebase Authentication. Check your connection and retry.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Double-check your details or reset your password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters with letters and numbers.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-email':
      return 'Please enter your email address first.';
    case 'auth/too-many-requests':
      return 'Too many attempts detected. Please wait a minute before trying again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support for help.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console yet. Enable Email/Password under Authentication → Sign-in method, or use Continue with Google.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  }
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface ProjectDraftFromAI {
  title: string;
  description: string;
  category: Project['category'];
  requiredSkills: string[];
  teamSize: number;
  difficulty: Project['difficulty'];
  objectives: string[];
  technologies: string[];
}

interface AppContextValue {
  authUser: FirebaseUser | null;
  emailVerified: boolean;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  isAdmin: boolean;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  postLoginView: AppView | null;
  setPostLoginView: (view: AppView | null) => void;
  navigateOrLogin: (targetView: AppView) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
  projectDraft: ProjectDraftFromAI | null;
  setProjectDraft: (draft: ProjectDraftFromAI | null) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;

  // Current user data
  currentProfile: UserProfile | null;
  savedProjectIds: string[];

  // Collections
  developers: UserProfile[];
  projects: Project[];
  teams: Team[];
  invitations: Invitation[];
  tasks: Task[];
  messages: TeamMessage[];
  notifications: NotificationItem[];
  reports: ModerationReport[];
  savedAnalyses: SavedAnalysis[];
  activities: ActivityEvent[];

  // Auth Actions
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (params: { name: string; email: string; password: string }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  refreshVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>;

  // Profile Actions
  saveProfile: (profileData: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  toggleSaveProject: (projectId: string) => Promise<void>;

  // Project Actions
  createProject: (data: Omit<Project, 'projectId' | 'ownerId' | 'ownerName' | 'memberIds' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Invitations & Join Requests
  sendInvitation: (params: {
    type: 'invite' | 'join_request';
    project: Project;
    targetUser: UserProfile;
    roleSuggested?: string;
    message?: string;
  }) => Promise<void>;
  respondToInvitation: (invitation: Invitation, decision: 'Accepted' | 'Rejected') => Promise<void>;
  cancelInvitation: (invitation: Invitation) => Promise<void>;

  // Teams & Workspace
  createOrUpdateTeam: (params: {
    project: Project;
    members: TeamMemberSnapshot[];
    skillCoverage: number;
    coveredSkills: string[];
  }) => Promise<Team>;
  updateTeamWorkspace: (teamId: string, updates: Partial<Pick<Team, 'sharedNotes' | 'announcements' | 'milestones' | 'status'>>) => Promise<void>;

  // Tasks
  createTask: (data: {
    project: Project;
    teamId: string;
    title: string;
    description: string;
    assignedTo: string;
    assignedToName: string;
    priority: Task['priority'];
    dueDate: string;
  }) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'assignedTo' | 'assignedToName' | 'status' | 'priority' | 'dueDate'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Messages
  sendTeamMessage: (params: {
    project: Project;
    channel: TeamChannel;
    message: string;
  }) => Promise<void>;

  // Notifications
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;

  // AI Saved Analyses
  saveAIAnalysis: (ideaPrompt: string, result: AIProjectAnalysis) => Promise<void>;
  deleteAIAnalysis: (analysisId: string) => Promise<void>;

  // Moderation & Admin
  submitReport: (params: {
    targetType: 'user' | 'project';
    targetId: string;
    targetTitle: string;
    reason: string;
  }) => Promise<void>;
  updateReportStatus: (reportId: string, status: ModerationReport['status']) => Promise<void>;
  adminToggleProjectVisibility: (projectId: string, visibility: 'Public' | 'Private') => Promise<void>;
  adminDeleteProject: (projectId: string) => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  pushToast: (type: ToastMessage['type'], text: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdminDoc, setIsAdminDoc] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('landing');
  const [postLoginView, setPostLoginView] = useState<AppView | null>(null);
  const postLoginViewRef = useRef<AppView | null>(null);

  useEffect(() => {
    postLoginViewRef.current = postLoginView;
  }, [postLoginView]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectDraftFromAI | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Live Firestore states
  const [fbCurrentProfile, setFbCurrentProfile] = useState<UserProfile | null>(null);
  const [fbSavedProjectIds, setFbSavedProjectIds] = useState<string[]>([]);
  const [fbDevelopers, setFbDevelopers] = useState<UserProfile[]>([]);
  const [fbProjectsPublic, setFbProjectsPublic] = useState<Project[]>([]);
  const [fbProjectsOwned, setFbProjectsOwned] = useState<Project[]>([]);
  const [fbProjectsMember, setFbProjectsMember] = useState<Project[]>([]);
  const [fbTeamsOwned, setFbTeamsOwned] = useState<Team[]>([]);
  const [fbTeamsMember, setFbTeamsMember] = useState<Team[]>([]);
  const [fbInvitesSent, setFbInvitesSent] = useState<Invitation[]>([]);
  const [fbInvitesReceived, setFbInvitesReceived] = useState<Invitation[]>([]);
  const [fbTasksOwner, setFbTasksOwner] = useState<Task[]>([]);
  const [fbTasksMember, setFbTasksMember] = useState<Task[]>([]);
  const [fbMessagesOwner, setFbMessagesOwner] = useState<TeamMessage[]>([]);
  const [fbMessagesMember, setFbMessagesMember] = useState<TeamMessage[]>([]);
  const [fbNotifications, setFbNotifications] = useState<NotificationItem[]>([]);
  const [fbReports, setFbReports] = useState<ModerationReport[]>([]);
  const [fbSavedAnalyses, setFbSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [fbActivities, setFbActivities] = useState<ActivityEvent[]>([]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const pushToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetFirestoreSlices = useCallback(() => {
    setFbCurrentProfile(null);
    setFbSavedProjectIds([]);
    setFbDevelopers([]);
    setFbProjectsPublic([]);
    setFbProjectsOwned([]);
    setFbProjectsMember([]);
    setFbTeamsOwned([]);
    setFbTeamsMember([]);
    setFbInvitesSent([]);
    setFbInvitesReceived([]);
    setFbTasksOwner([]);
    setFbTasksMember([]);
    setFbMessagesOwner([]);
    setFbMessagesMember([]);
    setFbNotifications([]);
    setFbReports([]);
    setFbSavedAnalyses([]);
    setFbActivities([]);
  }, []);

  const resolveSignedInRoute = useCallback(async (user: FirebaseUser) => {
    setAuthError(null);
    try {
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      setIsAdminDoc(adminSnap.exists());
    } catch {
      setIsAdminDoc(false);
    }

    try {
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      if (!profileSnap.exists() || !profileSnap.data()?.profileCompleted) {
        setActiveView('profile-setup');
      } else {
        const target = postLoginViewRef.current;
        if (target && target !== 'landing' && target !== 'login') {
          setActiveView(target);
          setPostLoginView(null);
        } else {
          setActiveView((prev) =>
            prev === 'landing' || prev === 'login' || prev === 'profile-setup' ? 'overview' : prev
          );
        }
      }
    } catch (err) {
      console.error('Error fetching initial profile:', err);
      setActiveView('profile-setup');
    }
  }, []);

  // Boot connection check & Auth listener
  useEffect(() => {
    testConnection();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      const verified = Boolean(user?.emailVerified);
      setEmailVerified(verified);

      if (user && verified) {
        await resolveSignedInRoute(user);
      } else if (user && !verified) {
        setIsAdminDoc(false);
        resetFirestoreSlices();
        setActiveView((prev) => (prev === 'landing' ? 'landing' : 'login'));
      } else {
        setIsAdminDoc(false);
        resetFirestoreSlices();
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [resetFirestoreSlices, resolveSignedInRoute]);

  const isAdmin = useMemo(() => {
    if (!authUser || !emailVerified) return false;
    return (emailVerified && authUser.email === 'games.rc4.studio@gmail.com') || isAdminDoc;
  }, [authUser, emailVerified, isAdminDoc]);

  // Real-time Firestore subscriptions (ONLY attached when authUser is present AND emailVerified)
  useEffect(() => {
    if (!authReady || !authUser || !emailVerified) return;
    const uid = authUser.uid;
    const unsubs: (() => void)[] = [];

    // 1. Own profile
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setFbCurrentProfile({
              ...(d as UserProfile),
              createdAt: tsToIso(d.createdAt),
              updatedAt: tsToIso(d.updatedAt),
            });
          } else {
            setFbCurrentProfile(null);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
      )
    );

    // 2. Own private account (email + savedProjectIds)
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'private', 'account'),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setFbSavedProjectIds(Array.isArray(d.savedProjectIds) ? d.savedProjectIds : []);
          } else {
            setFbSavedProjectIds([]);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/private/account`)
      )
    );

    // 3. Developer directory (All if admin, public otherwise)
    unsubs.push(
      onSnapshot(
        isAdmin ? query(collection(db, 'users')) : query(collection(db, 'users'), where('isPublic', '==', true)),
        (snap) => {
          setFbDevelopers(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                ...(data as UserProfile),
                createdAt: tsToIso(data.createdAt),
                updatedAt: tsToIso(data.updatedAt),
              };
            })
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      )
    );

    // 4. Projects (All if admin; otherwise Public + Owned + Member)
    const mapProject = (d: any): Project => {
      const data = d.data();
      return {
        ...(data as Project),
        objectives: Array.isArray(data.objectives) ? data.objectives : [],
        technologies: Array.isArray(data.technologies) ? data.technologies : [],
        createdAt: tsToIso(data.createdAt),
        updatedAt: tsToIso(data.updatedAt),
      };
    };
    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'projects')),
          (snap) => {
            setFbProjectsPublic(snap.docs.map(mapProject));
            setFbProjectsOwned([]);
            setFbProjectsMember([]);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'projects(admin)')
        )
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'projects'), where('visibility', '==', 'Public')),
          (snap) => setFbProjectsPublic(snap.docs.map(mapProject)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'projects(public)')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'projects'), where('ownerId', '==', uid)),
          (snap) => setFbProjectsOwned(snap.docs.map(mapProject)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'projects(owner)')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'projects'), where('memberIds', 'array-contains', uid)),
          (snap) => setFbProjectsMember(snap.docs.map(mapProject)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'projects(member)')
        )
      );
    }

    // 5. Teams
    const mapTeam = (d: any): Team => {
      const data = d.data();
      return {
        ...(data as Team),
        sharedNotes: data.sharedNotes ?? '',
        announcements: Array.isArray(data.announcements) ? data.announcements : [],
        milestones: Array.isArray(data.milestones) ? data.milestones : [],
        createdAt: tsToIso(data.createdAt),
        updatedAt: tsToIso(data.updatedAt),
      };
    };
    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'teams')),
          (snap) => {
            setFbTeamsOwned(snap.docs.map(mapTeam));
            setFbTeamsMember([]);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'teams(admin)')
        )
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'teams'), where('ownerId', '==', uid)),
          (snap) => setFbTeamsOwned(snap.docs.map(mapTeam)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'teams(owner)')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'teams'), where('memberIds', 'array-contains', uid)),
          (snap) => setFbTeamsMember(snap.docs.map(mapTeam)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'teams(member)')
        )
      );
    }

    // 6. Invitations
    const mapInv = (d: any): Invitation => {
      const data = d.data();
      return {
        ...(data as Invitation),
        createdAt: tsToIso(data.createdAt),
        updatedAt: tsToIso(data.updatedAt),
      };
    };
    unsubs.push(
      onSnapshot(
        query(collection(db, 'invitations'), where('senderId', '==', uid)),
        (snap) => setFbInvitesSent(snap.docs.map(mapInv)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'invitations(sent)')
      )
    );
    unsubs.push(
      onSnapshot(
        query(collection(db, 'invitations'), where('receiverId', '==', uid)),
        (snap) => setFbInvitesReceived(snap.docs.map(mapInv)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'invitations(received)')
      )
    );

    // 7. Tasks
    const mapTask = (d: any): Task => {
      const data = d.data();
      return {
        ...(data as Task),
        description: data.description ?? '',
        assignedTo: data.assignedTo ?? '',
        assignedToName: data.assignedToName ?? '',
        dueDate: data.dueDate ?? '',
        createdAt: tsToIso(data.createdAt),
        updatedAt: tsToIso(data.updatedAt),
      };
    };
    unsubs.push(
      onSnapshot(
        query(collection(db, 'tasks'), where('projectOwnerId', '==', uid)),
        (snap) => setFbTasksOwner(snap.docs.map(mapTask)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'tasks(owner)')
      )
    );
    unsubs.push(
      onSnapshot(
        query(collection(db, 'tasks'), where('teamMemberIds', 'array-contains', uid)),
        (snap) => setFbTasksMember(snap.docs.map(mapTask)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'tasks(member)')
      )
    );

    // 8. Messages
    const mapMsg = (d: any): TeamMessage => {
      const data = d.data();
      return {
        ...(data as TeamMessage),
        timestamp: tsToIso(data.timestamp),
      };
    };
    unsubs.push(
      onSnapshot(
        query(collection(db, 'messages'), where('projectOwnerId', '==', uid)),
        (snap) => setFbMessagesOwner(snap.docs.map(mapMsg)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'messages(owner)')
      )
    );
    unsubs.push(
      onSnapshot(
        query(collection(db, 'messages'), where('teamMemberIds', 'array-contains', uid)),
        (snap) => setFbMessagesMember(snap.docs.map(mapMsg)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'messages(member)')
      )
    );

    // 9. Notifications
    unsubs.push(
      onSnapshot(
        query(collection(db, 'notifications'), where('userId', '==', uid)),
        (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as NotificationItem),
              timestamp: tsToIso(data.timestamp),
            };
          });
          list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setFbNotifications(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
      )
    );

    // 10. Saved Analyses
    unsubs.push(
      onSnapshot(
        query(collection(db, 'savedAnalyses'), where('userId', '==', uid)),
        (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as SavedAnalysis),
              createdAt: tsToIso(data.createdAt),
            };
          });
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setFbSavedAnalyses(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'savedAnalyses')
      )
    );

    // 11. Activities (All if admin, own otherwise)
    unsubs.push(
      onSnapshot(
        isAdmin ? query(collection(db, 'activities')) : query(collection(db, 'activities'), where('userId', '==', uid)),
        (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as ActivityEvent),
              timestamp: tsToIso(data.timestamp),
            };
          });
          list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setFbActivities(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'activities')
      )
    );

    // 12. Reports (All if admin, own if standard user)
    const reportsQuery = isAdmin
      ? query(collection(db, 'reports'))
      : query(collection(db, 'reports'), where('reporterId', '==', uid));
    unsubs.push(
      onSnapshot(
        reportsQuery,
        (snap) => {
          setFbReports(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                ...(data as ModerationReport),
                createdAt: tsToIso(data.createdAt),
                updatedAt: tsToIso(data.updatedAt),
              };
            })
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, authUser, emailVerified, isAdmin]);

  // Merged Firebase collections
  const projects = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of [...fbProjectsPublic, ...fbProjectsOwned, ...fbProjectsMember]) {
      map.set(p.projectId, p);
    }
    return Array.from(map.values()).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [fbProjectsPublic, fbProjectsOwned, fbProjectsMember]);

  const teams = useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of [...fbTeamsOwned, ...fbTeamsMember]) {
      map.set(t.teamId, t);
    }
    return Array.from(map.values()).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [fbTeamsOwned, fbTeamsMember]);

  const invitations = useMemo(() => {
    const map = new Map<string, Invitation>();
    for (const inv of [...fbInvitesSent, ...fbInvitesReceived]) {
      map.set(inv.invitationId, inv);
    }
    return Array.from(map.values()).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [fbInvitesSent, fbInvitesReceived]);

  const tasks = useMemo(() => {
    const map = new Map<string, Task>();
    for (const t of [...fbTasksOwner, ...fbTasksMember]) {
      map.set(t.taskId, t);
    }
    return Array.from(map.values()).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [fbTasksOwner, fbTasksMember]);

  const messages = useMemo(() => {
    const map = new Map<string, TeamMessage>();
    for (const m of [...fbMessagesOwner, ...fbMessagesMember]) {
      map.set(m.messageId, m);
    }
    return Array.from(map.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [fbMessagesOwner, fbMessagesMember]);

  const developers = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const d of fbDevelopers) map.set(d.userId, d);
    if (fbCurrentProfile) map.set(fbCurrentProfile.userId, fbCurrentProfile);
    return Array.from(map.values());
  }, [fbDevelopers, fbCurrentProfile]);

  const currentProfile = fbCurrentProfile;
  const notifications = fbNotifications;
  const reports = fbReports;
  const savedAnalyses = fbSavedAnalyses;
  const activities = fbActivities;
  const savedProjectIds = fbSavedProjectIds;

  // Helper to log activity in Firestore
  const logActivity = useCallback(async (userId: string, action: string, targetTitle: string) => {
    const activityId = sanitizeId(`act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    const dateKey = todayDateKey();
    try {
      await setDoc(doc(db, 'activities', activityId), {
        activityId,
        userId,
        action: clampString(action, 120),
        targetTitle: clampString(targetTitle, 160),
        dateKey,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Activity logging skipped:', err);
    }
  }, []);

  // Auth Actions
  const loginWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      pushToast('success', 'Signed in with Google.');
    } catch (err: unknown) {
      const message = formatAuthError(err);
      setAuthError(message);
      pushToast('error', message);
    } finally {
      setAuthLoading(false);
    }
  }, [pushToast]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!cred.user.emailVerified) {
          pushToast('info', 'Verify your email address to unlock your SkillBridge workspace.');
        } else {
          pushToast('success', 'Welcome back to SkillBridge.');
        }
      } catch (err: unknown) {
        const message = formatAuthError(err);
        setAuthError(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [pushToast]
  );

  const registerWithEmail = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const trimmedName = clampString(name.trim(), 100);
        if (trimmedName) {
          try {
            await updateProfile(cred.user, { displayName: trimmedName });
          } catch (profileErr) {
            console.warn('Display name update skipped:', profileErr);
          }
        }
        try {
          await sendEmailVerification(cred.user);
          pushToast('success', 'Account created! Verification link sent to your inbox.');
        } catch (verifyErr) {
          console.warn('Initial verification email failed:', verifyErr);
          pushToast('info', 'Account created. Click Resend verification link if you did not receive an email.');
        }
      } catch (err: unknown) {
        const message = formatAuthError(err);
        setAuthError(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [pushToast]
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<boolean> => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        pushToast('success', `Password reset link sent to ${email.trim()}.`);
        return true;
      } catch (err: unknown) {
        const message = formatAuthError(err);
        setAuthError(message);
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    [pushToast]
  );

  const resendVerificationEmail = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await sendEmailVerification(auth.currentUser);
      pushToast('success', `Verification email resent to ${auth.currentUser.email}.`);
      return true;
    } catch (err: unknown) {
      const message = formatAuthError(err);
      setAuthError(message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [pushToast]);

  const refreshVerificationStatus = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      const updatedUser = auth.currentUser;
      const verified = Boolean(updatedUser?.emailVerified);
      setAuthUser(updatedUser);
      setEmailVerified(verified);

      if (verified && updatedUser) {
        await resolveSignedInRoute(updatedUser);
        pushToast('success', 'Email verified! Welcome to SkillBridge.');
        return true;
      }

      setAuthError('Your email is not verified yet. Open the link in your inbox (check spam too), then click Continue.');
      return false;
    } catch (err: unknown) {
      const message = formatAuthError(err);
      setAuthError(message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [pushToast, resolveSignedInRoute]);

  const logout = useCallback(async () => {
    try {
      if (authUser) {
        await signOut(auth);
      }
      setEmailVerified(false);
      resetFirestoreSlices();
      setPostLoginView(null);
      setActiveView('landing');
      pushToast('info', 'Signed out cleanly.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-out failed.';
      pushToast('error', message);
    }
  }, [authUser, pushToast, resetFirestoreSlices]);

  const navigateOrLogin = useCallback(
    (targetView: AppView) => {
      if (authUser) {
        setActiveView(targetView);
      } else {
        setPostLoginView(targetView);
        setAuthError(null);
        setActiveView('login');
      }
    },
    [authUser]
  );

  // Profile Actions
  const saveProfile = useCallback(
    async (profileData: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>) => {
      if (!authUser) throw new Error('Must be signed in to save profile.');
      const uid = authUser.uid;
      const cleanProfile = {
        userId: uid,
        name: clampString(profileData.name, 100),
        username: clampString(sanitizeUsername(profileData.username), 40),
        avatarUrl: clampString(profileData.avatarUrl || authUser.photoURL || '', 500),
        bio: clampString(profileData.bio, 600),
        education: clampString(profileData.education, 120),
        college: clampString(profileData.college, 150),
        skills: clampStringArray(profileData.skills, 25),
        skillLevels: profileData.skillLevels || {},
        experience: profileData.experience,
        github: clampString(profileData.github, 300),
        portfolio: clampString(profileData.portfolio, 300),
        interests: clampStringArray(profileData.interests, 20),
        availability: profileData.availability,
        preferredCategories: clampStringArray(profileData.preferredCategories, 10) as Project['category'][],
        isPublic: Boolean(profileData.isPublic),
        profileCompleted: true,
        updatedAt: serverTimestamp(),
      };

      try {
        const existingSnap = await getDoc(doc(db, 'users', uid));
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'users', uid), cleanProfile);
        } else {
          await setDoc(doc(db, 'users', uid), {
            ...cleanProfile,
            createdAt: serverTimestamp(),
          });
        }

        const privSnap = await getDoc(doc(db, 'users', uid, 'private', 'account'));
        if (privSnap.exists()) {
          await updateDoc(doc(db, 'users', uid, 'private', 'account'), {
            email: clampString(authUser.email || '', 200),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(doc(db, 'users', uid, 'private', 'account'), {
            userId: uid,
            email: clampString(authUser.email || '', 200),
            savedProjectIds: [],
            updatedAt: serverTimestamp(),
          });
        }

        await logActivity(uid, 'Updated developer profile', cleanProfile.name);
        pushToast('success', 'Developer profile saved.');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    },
    [authUser, logActivity, pushToast]
  );

  const toggleSaveProject = useCallback(
    async (projectId: string) => {
      if (!authUser) {
        pushToast('info', 'Please sign in to save projects.');
        return;
      }
      const uid = authUser.uid;
      const exists = fbSavedProjectIds.includes(projectId);
      const next = exists
        ? fbSavedProjectIds.filter((id) => id !== projectId)
        : clampStringArray([...fbSavedProjectIds, projectId], 50);

      try {
        const privRef = doc(db, 'users', uid, 'private', 'account');
        const privSnap = await getDoc(privRef);
        if (privSnap.exists()) {
          await updateDoc(privRef, {
            savedProjectIds: next,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(privRef, {
            userId: uid,
            email: clampString(authUser.email || '', 200),
            savedProjectIds: next,
            updatedAt: serverTimestamp(),
          });
        }
        pushToast('success', exists ? 'Removed from saved projects.' : 'Project saved.');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/private/account`);
      }
    },
    [authUser, fbSavedProjectIds, pushToast]
  );

  // Project Actions
  const createProject = useCallback(
    async (data: Omit<Project, 'projectId' | 'ownerId' | 'ownerName' | 'memberIds' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
      const ownerId = authUser?.uid;
      const ownerName = currentProfile?.name || authUser?.displayName || 'Developer';
      if (!ownerId) throw new Error('Authentication required to create a project.');

      const projectId = sanitizeId(`proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const payload: Project = {
        projectId,
        ownerId,
        ownerName: clampString(ownerName, 100),
        title: clampString(data.title, 140),
        description: clampString(data.description, 3000),
        category: data.category,
        projectType: data.projectType,
        requiredSkills: clampStringArray(data.requiredSkills, 25),
        teamSize: Math.min(20, Math.max(1, Number(data.teamSize) || 4)),
        experienceRequired: data.experienceRequired,
        duration: clampString(data.duration, 60),
        difficulty: data.difficulty,
        openPositions: Math.min(20, Math.max(0, Number(data.openPositions))),
        visibility: data.visibility,
        status: data.status,
        objectives: clampStringArray(data.objectives || [], 15),
        technologies: clampStringArray(data.technologies || [], 25),
        memberIds: [ownerId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'projects', projectId), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logActivity(ownerId, 'Created project', payload.title);
        pushToast('success', `Project "${payload.title}" published.`);
        return payload;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}`);
      }
    },
    [authUser, currentProfile, logActivity, pushToast]
  );

  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      const cleanUpdates: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.title !== undefined) cleanUpdates.title = clampString(updates.title, 140);
      if (updates.description !== undefined) cleanUpdates.description = clampString(updates.description, 3000);
      if (updates.category !== undefined) cleanUpdates.category = updates.category;
      if (updates.projectType !== undefined) cleanUpdates.projectType = updates.projectType;
      if (updates.requiredSkills !== undefined) cleanUpdates.requiredSkills = clampStringArray(updates.requiredSkills, 25);
      if (updates.teamSize !== undefined) cleanUpdates.teamSize = updates.teamSize;
      if (updates.experienceRequired !== undefined) cleanUpdates.experienceRequired = updates.experienceRequired;
      if (updates.duration !== undefined) cleanUpdates.duration = clampString(updates.duration, 60);
      if (updates.difficulty !== undefined) cleanUpdates.difficulty = updates.difficulty;
      if (updates.openPositions !== undefined) cleanUpdates.openPositions = updates.openPositions;
      if (updates.visibility !== undefined) cleanUpdates.visibility = updates.visibility;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.objectives !== undefined) cleanUpdates.objectives = clampStringArray(updates.objectives, 15);
      if (updates.technologies !== undefined) cleanUpdates.technologies = clampStringArray(updates.technologies, 25);
      if (updates.memberIds !== undefined) cleanUpdates.memberIds = updates.memberIds.slice(0, 20);

      try {
        await updateDoc(doc(db, 'projects', projectId), cleanUpdates);
        if (authUser) await logActivity(authUser.uid, 'Updated project', String(updates.title || projectId));
        pushToast('success', 'Project changes saved.');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
      }
    },
    [authUser, logActivity, pushToast]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        await deleteDoc(doc(db, 'projects', projectId));
        pushToast('success', 'Project deleted.');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
      }
    },
    [pushToast]
  );

  // Invitations & Join Requests
  const sendInvitation = useCallback(
    async ({
      type,
      project,
      targetUser,
      roleSuggested,
      message,
    }: {
      type: 'invite' | 'join_request';
      project: Project;
      targetUser: UserProfile;
      roleSuggested?: string;
      message?: string;
    }) => {
      const callerId = authUser?.uid;
      const callerName = currentProfile?.name || authUser?.displayName || 'Developer';
      if (!callerId) {
        pushToast('info', 'Please sign in to send invitations.');
        return;
      }

      const applicantId = type === 'invite' ? targetUser.userId : callerId;
      const applicantName = type === 'invite' ? targetUser.name : callerName;
      const receiverId = type === 'invite' ? targetUser.userId : project.ownerId;
      const receiverName = type === 'invite' ? targetUser.name : project.ownerName;

      if (callerId === receiverId) {
        pushToast('info', type === 'invite' ? 'You cannot invite yourself to your own project.' : 'You already own this project.');
        return;
      }

      if (project.memberIds.includes(applicantId)) {
        pushToast('info', `${applicantName} is already a member of "${project.title}".`);
        return;
      }

      const invitationId = sanitizeId(`${project.projectId}_${applicantId}`);
      const notifId = sanitizeId(`notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);

      const invPayload: Invitation = {
        invitationId,
        type,
        projectId: project.projectId,
        projectTitle: clampString(project.title, 140),
        senderId: callerId,
        senderName: clampString(callerName, 100),
        receiverId,
        receiverName: clampString(receiverName, 100),
        applicantId,
        applicantName: clampString(applicantName, 100),
        roleSuggested: clampString(roleSuggested || 'Collaborator', 80),
        message: clampString(message || '', 600),
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const notifMsg =
        type === 'invite'
          ? `${callerName} invited you to join "${project.title}" as ${invPayload.roleSuggested}.`
          : `${callerName} requested to join "${project.title}".`;

      try {
        const invRef = doc(db, 'invitations', invitationId);
        const existingInv = await getDoc(invRef);
        if (existingInv.exists()) {
          const existingStatus = existingInv.data()?.status;
          if (existingStatus === 'Pending') {
            pushToast('info', `A pending ${type === 'invite' ? 'invitation' : 'join request'} already exists for "${project.title}".`);
            return;
          }
          if (existingStatus === 'Accepted') {
            pushToast('info', `${applicantName} has already accepted an invitation for "${project.title}".`);
            return;
          }
          if (existingStatus === 'Rejected') {
            await deleteDoc(invRef);
          }
        }

        const batch = writeBatch(db);
        batch.set(invRef, {
          ...invPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          userId: receiverId,
          actorId: callerId,
          type: type === 'invite' ? 'invitation' : 'join_request',
          message: clampString(notifMsg, 500),
          linkView: 'invitations',
          read: false,
          timestamp: serverTimestamp(),
        });
        await batch.commit();

        await logActivity(callerId, type === 'invite' ? 'Sent project invitation' : 'Requested to join project', project.title);
        pushToast('success', type === 'invite' ? `Invitation sent to ${targetUser.name} (Pending acceptance).` : 'Join request submitted.');
      } catch (err) {
        pushToast('error', 'Could not send invitation. Please try again.');
        handleFirestoreError(err, OperationType.WRITE, `invitations/${invitationId}`);
      }
    },
    [authUser, currentProfile, logActivity, pushToast]
  );

  const respondToInvitation = useCallback(
    async (invitation: Invitation, decision: 'Accepted' | 'Rejected') => {
      const callerId = authUser?.uid;
      const callerName = currentProfile?.name || authUser?.displayName || 'Developer';
      if (!callerId) return;

      if (invitation.receiverId !== callerId) {
        pushToast('error', 'Only the recipient can respond to this invitation.');
        return;
      }

      if (invitation.status !== 'Pending') {
        pushToast('info', `This invitation was already ${invitation.status.toLowerCase()}.`);
        return;
      }

      const notifId = sanitizeId(`notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const notifMsg =
        decision === 'Accepted'
          ? `${callerName} accepted your ${invitation.type === 'invite' ? 'invitation' : 'join request'} for "${invitation.projectTitle}".`
          : `${callerName} declined the ${invitation.type === 'invite' ? 'invitation' : 'join request'} for "${invitation.projectTitle}".`;

      try {
        const batch = writeBatch(db);
        const invRef = doc(db, 'invitations', invitation.invitationId);
        batch.update(invRef, {
          status: decision,
          updatedAt: serverTimestamp(),
        });

        if (decision === 'Accepted') {
          const projRef = doc(db, 'projects', invitation.projectId);
          const projSnap = await getDoc(projRef);
          if (projSnap.exists()) {
            const pData = projSnap.data() as Project;
            const currentMembers = Array.isArray(pData.memberIds) ? pData.memberIds : [];
            if (!currentMembers.includes(invitation.applicantId)) {
              batch.update(projRef, {
                memberIds: [...currentMembers, invitation.applicantId].slice(0, 20),
                openPositions: Math.max(0, (pData.openPositions ?? 1) - 1),
                updatedAt: serverTimestamp(),
              });
            }
          }

          let matchingTeam = teams.find((t) => t.projectId === invitation.projectId) || null;
          if (!matchingTeam) {
            try {
              const teamSnap = await getDoc(doc(db, 'teams', sanitizeId(`team_${invitation.projectId}`)));
              if (teamSnap.exists()) {
                matchingTeam = teamSnap.data() as Team;
              }
            } catch {
              matchingTeam = null;
            }
          }

          if (matchingTeam && !matchingTeam.memberIds.includes(invitation.applicantId)) {
            const devSnap = await getDoc(doc(db, 'users', invitation.applicantId));
            const devData = devSnap.exists() ? (devSnap.data() as UserProfile) : null;
            const newSnap: TeamMemberSnapshot = {
              userId: invitation.applicantId,
              name: invitation.applicantName,
              username: devData?.username || 'member',
              avatarUrl: devData?.avatarUrl || '',
              role: invitation.roleSuggested || 'Collaborator',
              skills: devData?.skills || [],
              matchScore: 85,
            };
            batch.update(doc(db, 'teams', matchingTeam.teamId), {
              memberIds: [...matchingTeam.memberIds, invitation.applicantId].slice(0, 20),
              members: [...matchingTeam.members, newSnap].slice(0, 20),
              updatedAt: serverTimestamp(),
            });
          }
        }

        batch.set(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          userId: invitation.senderId,
          actorId: callerId,
          type: decision === 'Accepted' ? 'invitation_accepted' : 'invitation_rejected',
          message: clampString(notifMsg, 500),
          linkView: 'invitations',
          read: false,
          timestamp: serverTimestamp(),
        });

        await batch.commit();
        await logActivity(callerId, `${decision} collaboration`, invitation.projectTitle);
        pushToast('success', `Invitation ${decision.toLowerCase()}.`);
      } catch (err) {
        pushToast('error', 'Failed to update invitation status.');
        handleFirestoreError(err, OperationType.UPDATE, `invitations/${invitation.invitationId}`);
      }
    },
    [authUser, currentProfile, teams, logActivity, pushToast]
  );

  const cancelInvitation = useCallback(
    async (invitation: Invitation) => {
      const callerId = authUser?.uid;
      if (!callerId) return;
      if (invitation.senderId !== callerId && !isAdmin) {
        pushToast('error', 'Only the sender can withdraw this invitation.');
        return;
      }
      try {
        await deleteDoc(doc(db, 'invitations', invitation.invitationId));
        pushToast('info', `Withdrew invitation for "${invitation.projectTitle}".`);
      } catch (err) {
        pushToast('error', 'Could not withdraw invitation.');
        handleFirestoreError(err, OperationType.DELETE, `invitations/${invitation.invitationId}`);
      }
    },
    [authUser, isAdmin, pushToast]
  );

  // Team Creation / Update
  const createOrUpdateTeam = useCallback(
    async ({
      project,
      members,
      skillCoverage,
      coveredSkills,
    }: {
      project: Project;
      members: TeamMemberSnapshot[];
      skillCoverage: number;
      coveredSkills: string[];
    }): Promise<Team> => {
      const ownerId = authUser?.uid;
      if (!ownerId) throw new Error('Authentication required.');

      const existingTeam = teams.find((t) => t.projectId === project.projectId);
      const teamId = existingTeam?.teamId || sanitizeId(`team_${project.projectId}`);
      const memberIds = Array.from(new Set([project.ownerId, ...members.map((m) => m.userId)])).slice(0, 20);

      const teamObj: Team = {
        teamId,
        projectId: project.projectId,
        projectTitle: clampString(project.title, 140),
        ownerId: project.ownerId,
        memberIds,
        members: members.slice(0, 20),
        skillCoverage: Math.min(100, Math.max(0, Math.round(skillCoverage))),
        coveredSkills: clampStringArray(coveredSkills, 25),
        status: existingTeam?.status || 'Active',
        sharedNotes: existingTeam?.sharedNotes || `Workspace initialized for ${project.title}.`,
        announcements: existingTeam?.announcements || [],
        milestones: existingTeam?.milestones || [],
        createdAt: existingTeam?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const batch = writeBatch(db);
        const teamRef = doc(db, 'teams', teamId);
        if (existingTeam) {
          batch.update(teamRef, {
            projectTitle: teamObj.projectTitle,
            memberIds: teamObj.memberIds,
            members: teamObj.members,
            skillCoverage: teamObj.skillCoverage,
            coveredSkills: teamObj.coveredSkills,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(teamRef, {
            ...teamObj,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        batch.update(doc(db, 'projects', project.projectId), {
          memberIds,
          status: 'In Progress',
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        await logActivity(ownerId, 'Formed project team', project.title);
        pushToast('success', `Team workspace saved for "${project.title}".`);
        return teamObj;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `teams/${teamId}`);
      }
    },
    [authUser, teams, logActivity, pushToast]
  );

  const updateTeamWorkspace = useCallback(
    async (teamId: string, updates: Partial<Pick<Team, 'sharedNotes' | 'announcements' | 'milestones' | 'status'>>) => {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.sharedNotes !== undefined) payload.sharedNotes = clampString(updates.sharedNotes, 5000);
      if (updates.announcements !== undefined) payload.announcements = updates.announcements.slice(0, 50);
      if (updates.milestones !== undefined) payload.milestones = updates.milestones.slice(0, 30);
      if (updates.status !== undefined) payload.status = updates.status;

      try {
        await updateDoc(doc(db, 'teams', teamId), payload);
        pushToast('success', 'Workspace updated.');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `teams/${teamId}`);
      }
    },
    [pushToast]
  );

  // Tasks
  const createTask = useCallback(
    async (data: {
      project: Project;
      teamId: string;
      title: string;
      description: string;
      assignedTo: string;
      assignedToName: string;
      priority: Task['priority'];
      dueDate: string;
    }) => {
      const callerId = authUser?.uid;
      if (!callerId) return;

      const taskId = sanitizeId(`task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const taskObj: Task = {
        taskId,
        projectId: data.project.projectId,
        teamId: data.teamId,
        projectOwnerId: data.project.ownerId,
        teamMemberIds: data.project.memberIds.slice(0, 20),
        title: clampString(data.title, 160),
        description: clampString(data.description, 1500),
        assignedTo: clampString(data.assignedTo, 128),
        assignedToName: clampString(data.assignedToName, 100),
        createdBy: callerId,
        status: 'To Do',
        priority: data.priority,
        dueDate: clampString(data.dueDate, 40),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'tasks', taskId), {
          ...taskObj,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (data.assignedTo && data.assignedTo !== callerId) {
          const notifId = sanitizeId(`notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
          batch.set(doc(db, 'notifications', notifId), {
            notificationId: notifId,
            userId: data.assignedTo,
            actorId: callerId,
            type: 'task_assigned',
            message: clampString(`You were assigned task "${taskObj.title}" in ${data.project.title}.`, 500),
            linkView: 'team-workspace',
            read: false,
            timestamp: serverTimestamp(),
          });
        }
        await batch.commit();
        await logActivity(callerId, 'Created task', taskObj.title);
        pushToast('success', 'Task created.');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tasks/${taskId}`);
      }
    },
    [authUser, logActivity, pushToast]
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      updates: Partial<Pick<Task, 'title' | 'description' | 'assignedTo' | 'assignedToName' | 'status' | 'priority' | 'dueDate'>>
    ) => {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.title !== undefined) payload.title = clampString(updates.title, 160);
      if (updates.description !== undefined) payload.description = clampString(updates.description, 1500);
      if (updates.assignedTo !== undefined) payload.assignedTo = clampString(updates.assignedTo, 128);
      if (updates.assignedToName !== undefined) payload.assignedToName = clampString(updates.assignedToName, 100);
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.dueDate !== undefined) payload.dueDate = clampString(updates.dueDate, 40);

      try {
        await updateDoc(doc(db, 'tasks', taskId), payload);
        if (authUser && updates.status === 'Completed') {
          await logActivity(authUser.uid, 'Completed task', updates.title || taskId);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
      }
    },
    [authUser, logActivity]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        pushToast('success', 'Task deleted.');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
      }
    },
    [pushToast]
  );

  // Team Messaging
  const sendTeamMessage = useCallback(
    async ({ project, channel, message }: { project: Project; channel: TeamChannel; message: string }) => {
      const callerId = authUser?.uid;
      const callerName = currentProfile?.name || authUser?.displayName || 'Developer';
      const callerAvatar = currentProfile?.avatarUrl || authUser?.photoURL || '';
      if (!callerId || !message.trim()) return;

      const messageId = sanitizeId(`msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const msgObj: TeamMessage = {
        messageId,
        projectId: project.projectId,
        channel,
        senderId: callerId,
        senderName: clampString(callerName, 100),
        senderAvatar: clampString(callerAvatar, 500),
        message: clampString(message, 2000),
        projectOwnerId: project.ownerId,
        teamMemberIds: project.memberIds.slice(0, 20),
        timestamp: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'messages', messageId), {
          ...msgObj,
          timestamp: serverTimestamp(),
        });
        await logActivity(callerId, `Messaged #${channel}`, project.title);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `messages/${messageId}`);
      }
    },
    [authUser, currentProfile, logActivity]
  );

  // Notifications
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      for (const n of fbNotifications.filter((item) => !item.read)) {
        batch.update(doc(db, 'notifications', n.notificationId), { read: true });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  }, [fbNotifications]);

  const clearNotifications = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      for (const n of fbNotifications) {
        batch.delete(doc(db, 'notifications', n.notificationId));
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'notifications');
    }
  }, [fbNotifications]);

  // Saved AI Analyses
  const saveAIAnalysis = useCallback(
    async (ideaPrompt: string, result: AIProjectAnalysis) => {
      const uid = authUser?.uid;
      if (!uid) {
        pushToast('info', 'Sign in to save analyses.');
        return;
      }
      const analysisId = sanitizeId(`ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const savedObj: SavedAnalysis = {
        analysisId,
        userId: uid,
        ideaPrompt: clampString(ideaPrompt, 2000),
        result,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'savedAnalyses', analysisId), {
          ...savedObj,
          createdAt: serverTimestamp(),
        });
        await logActivity(uid, 'Saved AI project analysis', result.title);
        pushToast('success', 'AI analysis saved to Firestore.');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `savedAnalyses/${analysisId}`);
      }
    },
    [authUser, logActivity, pushToast]
  );

  const deleteAIAnalysis = useCallback(
    async (analysisId: string) => {
      try {
        await deleteDoc(doc(db, 'savedAnalyses', analysisId));
        pushToast('success', 'Saved analysis removed.');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `savedAnalyses/${analysisId}`);
      }
    },
    [pushToast]
  );

  // Moderation & Admin
  const submitReport = useCallback(
    async ({
      targetType,
      targetId,
      targetTitle,
      reason,
    }: {
      targetType: 'user' | 'project';
      targetId: string;
      targetTitle: string;
      reason: string;
    }) => {
      const callerId = authUser?.uid;
      if (!callerId) {
        pushToast('info', 'Please sign in to submit a moderation report.');
        return;
      }
      const reportId = sanitizeId(`rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const repObj: ModerationReport = {
        reportId,
        reporterId: callerId,
        targetType,
        targetId: sanitizeId(targetId),
        targetTitle: clampString(targetTitle, 160),
        reason: clampString(reason, 1000),
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'reports', reportId), {
          ...repObj,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('success', 'Report submitted for admin review.');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
      }
    },
    [authUser, pushToast]
  );

  const updateReportStatus = useCallback(
    async (reportId: string, status: ModerationReport['status']) => {
      try {
        await updateDoc(doc(db, 'reports', reportId), {
          status,
          updatedAt: serverTimestamp(),
        });
        pushToast('success', `Report updated to ${status}.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
      }
    },
    [pushToast]
  );

  const adminToggleProjectVisibility = useCallback(
    async (projectId: string, visibility: 'Public' | 'Private') => {
      try {
        await updateDoc(doc(db, 'projects', projectId), {
          visibility,
          updatedAt: serverTimestamp(),
        });
        pushToast('success', `Project visibility set to ${visibility}.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
      }
    },
    [pushToast]
  );

  const adminDeleteProject = useCallback(
    async (projectId: string) => {
      await deleteProject(projectId);
    },
    [deleteProject]
  );

  const value: AppContextValue = {
    authUser,
    emailVerified,
    authReady,
    authLoading,
    authError,
    clearAuthError,
    isAdmin,
    activeView,
    setActiveView,
    postLoginView,
    setPostLoginView,
    navigateOrLogin,
    selectedProjectId,
    setSelectedProjectId,
    selectedTeamId,
    setSelectedTeamId,
    selectedProfileId,
    setSelectedProfileId,
    projectDraft,
    setProjectDraft,
    globalSearchQuery,
    setGlobalSearchQuery,
    currentProfile,
    savedProjectIds,
    developers,
    projects,
    teams,
    invitations,
    tasks,
    messages,
    notifications,
    reports,
    savedAnalyses,
    activities,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    sendPasswordReset,
    resendVerificationEmail,
    refreshVerificationStatus,
    logout,
    saveProfile,
    toggleSaveProject,
    createProject,
    updateProject,
    deleteProject,
    sendInvitation,
    respondToInvitation,
    cancelInvitation,
    createOrUpdateTeam,
    updateTeamWorkspace,
    createTask,
    updateTask,
    deleteTask,
    sendTeamMessage,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    saveAIAnalysis,
    deleteAIAnalysis,
    submitReport,
    updateReportStatus,
    adminToggleProjectVisibility,
    adminDeleteProject,
    toasts,
    pushToast,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
