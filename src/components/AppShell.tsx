import React, { useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  CalendarClock,
  Check,
  CheckSquare,
  Compass,
  FolderKanban,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';
import type { AppView } from '../types';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    activeView,
    setActiveView,
    isAdmin,
    authUser,
    currentProfile,
    developers,
    projects,
    teams,
    invitations,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    globalSearchQuery,
    setGlobalSearchQuery,
    setSelectedProjectId,
    setSelectedTeamId,
    setSelectedProfileId,
    logout,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const currentUid = currentProfile?.userId || authUser?.uid || '';
  const unreadNotifs = useMemo(() => notifications.filter((n) => !n.read), [notifications]);
  const pendingInvitesCount = useMemo(
    () => invitations.filter((i) => i.receiverId === currentUid && i.status === 'Pending').length,
    [invitations, currentUid]
  );

  const navItems: { id: AppView; label: string; icon: React.ReactNode; badge?: number; ai?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'my-projects', label: 'My Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'explore-projects', label: 'Explore Projects', icon: <Compass className="w-4 h-4" /> },
    { id: 'find-developers', label: 'Find Developers', icon: <Users className="w-4 h-4" /> },
    { id: 'team-builder', label: 'Team Builder', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'team-workspace', label: 'Team Workspace', icon: <Home className="w-4 h-4" /> },
    {
      id: 'invitations',
      label: 'Invitations',
      icon: <Inbox className="w-4 h-4" />,
      badge: pendingInvitesCount > 0 ? pendingInvitesCount : undefined,
    },
    { id: 'my-tasks', label: 'My Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'ai-analyzer', label: 'AI Project Analyzer', icon: <Sparkles className="w-4 h-4" />, ai: true },
    { id: 'ai-planner', label: 'AI Project Planner', icon: <CalendarClock className="w-4 h-4" />, ai: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Dashboard',
      icon: <ShieldAlert className="w-4 h-4" />,
    });
  }

  // Global search results across Developers, Projects, Skills, Teams
  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedProjects = projects
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.requiredSkills.some((s) => s.toLowerCase().includes(q))
      )
      .slice(0, 4);

    const matchedDevs = developers
      .filter(
        (d) =>
          d.isPublic &&
          (d.name.toLowerCase().includes(q) ||
            d.username.toLowerCase().includes(q) ||
            d.skills.some((s) => s.toLowerCase().includes(q)))
      )
      .slice(0, 4);

    const matchedTeams = teams
      .filter(
        (t) =>
          t.projectTitle.toLowerCase().includes(q) ||
          t.coveredSkills.some((s) => s.toLowerCase().includes(q))
      )
      .slice(0, 3);

    return { matchedProjects, matchedDevs, matchedTeams };
  }, [globalSearchQuery, projects, developers, teams]);

  const navigate = (view: AppView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    setNotifOpen(false);
    setProfileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#1F2328] flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 h-16 bg-[#F6F8FA] border-b border-[#D1D9E0] px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle sidebar navigation"
            className="lg:hidden p-2 rounded-lg border border-[#D1D9E0] bg-white text-[#1F2328]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => navigate('overview')} className="text-left">
            <BrandLogo size="sm" />
          </button>
          <nav className="hidden xl:flex items-center gap-5 ml-6 text-sm font-medium text-[#656D76]">
            <button
              type="button"
              onClick={() => navigate('explore-projects')}
              className={`hover:text-[#1F2328] whitespace-nowrap ${
                activeView === 'explore-projects' ? 'text-[#0969DA]' : ''
              }`}
            >
              Explore
            </button>
            <button
              type="button"
              onClick={() => navigate('my-projects')}
              className={`hover:text-[#1F2328] whitespace-nowrap ${
                activeView === 'my-projects' ? 'text-[#0969DA]' : ''
              }`}
            >
              Projects
            </button>
            <button
              type="button"
              onClick={() => navigate('team-workspace')}
              className={`hover:text-[#1F2328] whitespace-nowrap ${
                activeView === 'team-workspace' ? 'text-[#0969DA]' : ''
              }`}
            >
              Teams
            </button>
            <button
              type="button"
              onClick={() => navigate('ai-analyzer')}
              className={`inline-flex items-center gap-1.5 hover:text-[#1F2328] whitespace-nowrap ${
                activeView === 'ai-analyzer' ? 'text-[#0969DA]' : ''
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[#9A6700]" />
              AI Assistant
            </button>
          </nav>
        </div>

        {/* Global Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-[#656D76] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              placeholder="Search developers, projects, skills, teams..."
              aria-label="Global search"
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#0969DA]"
            />
            {globalSearchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setGlobalSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#656D76] hover:text-[#1F2328]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchFocused && searchResults && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#D1D9E0] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto p-2">
              {searchResults.matchedProjects.length === 0 &&
              searchResults.matchedDevs.length === 0 &&
              searchResults.matchedTeams.length === 0 ? (
                <p className="p-3 text-xs text-[#656D76]">No matching projects, developers, skills, or teams found.</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.matchedProjects.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[11px] font-semibold text-[#656D76]">Projects</p>
                      {searchResults.matchedProjects.map((p) => (
                        <button
                          key={p.projectId}
                          type="button"
                          onMouseDown={() => {
                            setSelectedProjectId(p.projectId);
                            navigate('explore-projects');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#F6F8FA] flex items-center justify-between gap-2"
                        >
                          <span className="text-sm font-medium text-[#1F2328] truncate">{p.title}</span>
                          <span className="text-xs text-[#656D76] shrink-0">{p.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.matchedDevs.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[11px] font-semibold text-[#656D76]">Developers &amp; Skills</p>
                      {searchResults.matchedDevs.map((d) => (
                        <button
                          key={d.userId}
                          type="button"
                          onMouseDown={() => {
                            setSelectedProfileId(d.userId);
                            navigate('find-developers');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#F6F8FA] flex items-center justify-between gap-2"
                        >
                          <span className="text-sm font-medium text-[#1F2328] truncate">
                            {d.name} (@{d.username})
                          </span>
                          <span className="text-xs text-[#656D76] truncate max-w-[160px]">
                            {d.skills.slice(0, 3).join(', ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.matchedTeams.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[11px] font-semibold text-[#656D76]">Teams</p>
                      {searchResults.matchedTeams.map((t) => (
                        <button
                          key={t.teamId}
                          type="button"
                          onMouseDown={() => {
                            setSelectedTeamId(t.teamId);
                            navigate('team-workspace');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#F6F8FA] flex items-center justify-between gap-2"
                        >
                          <span className="text-sm font-medium text-[#1F2328] truncate">{t.projectTitle}</span>
                          <span className="text-xs text-[#1A7F37] tabular-nums shrink-0">
                            {t.skillCoverage}% coverage
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Notifications & Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileMenuOpen(false);
              }}
              aria-label="Notifications"
              className="relative p-2 rounded-lg border border-[#D1D9E0] bg-white hover:bg-[#F6F8FA] text-[#1F2328]"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0969DA] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#D1D9E0] rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b border-[#D1D9E0] flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#1F2328]">
                    Notifications ({unreadNotifs.length} unread)
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadNotifs.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs text-[#0969DA] hover:underline inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearNotifications}
                        className="text-xs text-[#656D76] hover:text-[#CF222E] inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#D1D9E0]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#656D76]">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.notificationId}
                        onClick={() => {
                          markNotificationRead(n.notificationId);
                          if (n.linkView) navigate(n.linkView as AppView);
                        }}
                        className={`p-3.5 cursor-pointer hover:bg-[#F6F8FA] transition-colors ${
                          n.read ? 'bg-white' : 'bg-[#DDF4FF]/35'
                        }`}
                      >
                        <p className="text-xs text-[#1F2328] leading-relaxed">{n.message}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#656D76]">
                          <span>{new Date(n.timestamp).toLocaleDateString()}</span>
                          {!n.read && <span className="font-medium text-[#0969DA]">Unread</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-lg border border-[#D1D9E0] bg-white hover:bg-[#F6F8FA]"
            >
              <Avatar
                name={currentProfile?.name || authUser?.displayName || 'Developer'}
                src={currentProfile?.avatarUrl || authUser?.photoURL || undefined}
                size="xs"
              />
              <span className="hidden sm:inline text-xs font-medium text-[#1F2328] max-w-[110px] truncate">
                {currentProfile?.name || authUser?.displayName || 'Developer'}
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D1D9E0] rounded-lg shadow-lg z-50 py-1.5">
                <div className="px-3.5 py-2 border-b border-[#D1D9E0]">
                  <p className="text-xs font-semibold text-[#1F2328] truncate">
                    {currentProfile?.name || authUser?.displayName}
                  </p>
                  <p className="text-[11px] text-[#656D76] truncate">
                    {authUser?.email || `@${currentProfile?.username}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('settings')}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#1F2328] hover:bg-[#F6F8FA] flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-[#656D76]" />
                  Profile &amp; Settings
                </button>
                <button
                  type="button"
                  onClick={() => navigate('landing')}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#1F2328] hover:bg-[#F6F8FA] flex items-center gap-2"
                >
                  <Home className="w-3.5 h-3.5 text-[#656D76]" />
                  Landing Page
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#CF222E] hover:bg-[#F6F8FA] flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Workspace Body: Sidebar + Content */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 bg-[#F6F8FA] border-r border-[#D1D9E0] flex-col p-4 justify-between">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#0969DA] font-semibold border border-[#D1D9E0]'
                      : 'text-[#1F2328] hover:bg-[#EAEFF4]/70 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className={item.ai ? 'text-[#9A6700]' : active ? 'text-[#0969DA]' : 'text-[#656D76]'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-[#0969DA] text-white tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#D1D9E0] text-xs text-[#656D76]">
            <p className="leading-relaxed">
              Signed in as <span className="font-medium text-[#1F2328]">@{currentProfile?.username || 'developer'}</span>
            </p>
          </div>
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="fixed inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
            <aside className="relative w-64 max-w-[80vw] bg-[#F6F8FA] border-r border-[#D1D9E0] p-4 flex flex-col z-50 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D1D9E0]">
                <BrandLogo size="sm" />
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1 text-[#656D76]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${
                        active ? 'bg-white text-[#0969DA] font-semibold border border-[#D1D9E0]' : 'text-[#1F2328]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-[#0969DA] text-white tabular-nums">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 bg-white min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
