import React from 'react';
import { CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AppShell } from './components/AppShell';
import { ProfileSetupView } from './components/ProfileSetupView';
import { DashboardOverview } from './components/DashboardOverview';
import { ProjectsManagerView } from './components/ProjectsManagerView';
import { DevelopersDirectoryView } from './components/DevelopersDirectoryView';
import { TeamBuilderView } from './components/TeamBuilderView';
import { TeamWorkspaceView } from './components/TeamWorkspaceView';
import { InvitationsView } from './components/InvitationsView';
import { MyTasksView } from './components/MyTasksView';
import { AIAnalyzerView } from './components/AIAnalyzerView';
import { AIPlannerView } from './components/AIPlannerView';
import { AdminDashboardView } from './components/AdminDashboardView';

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3.5 rounded-lg border shadow-md flex items-start gap-2.5 text-xs bg-white ${
            t.type === 'error'
              ? 'border-[#FF8182] text-[#CF222E]'
              : t.type === 'success'
                ? 'border-[#ACEEBB] text-[#1A7F37]'
                : 'border-[#D1D9E0] text-[#1F2328]'
          }`}
        >
          {t.type === 'error' ? (
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0969DA]" />
          )}
          <span className="flex-1 leading-relaxed text-[#1F2328]">{t.text}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="text-[#656D76] hover:text-[#1F2328]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

const SkillBridgeRouter: React.FC = () => {
  const { authReady, authUser, emailVerified, currentProfile, activeView } = useApp();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm text-[#656D76]">
          <Loader2 className="w-4 h-4 animate-spin text-[#0969DA]" />
          Initializing SkillBridge...
        </div>
      </div>
    );
  }

  if (activeView === 'landing') {
    return <LandingPage />;
  }

  if (!authUser || !emailVerified || activeView === 'login') {
    return <LoginPage />;
  }

  // Authenticated user without completed profile is routed to onboarding
  if ((!currentProfile || !currentProfile.profileCompleted) && activeView === 'profile-setup') {
    return (
      <div className="min-h-screen bg-[#F6F8FA] py-10 px-4">
        <ProfileSetupView isOnboarding />
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'profile-setup':
        return <ProfileSetupView isOnboarding={!currentProfile?.profileCompleted} />;
      case 'overview':
        return <DashboardOverview />;
      case 'my-projects':
        return <ProjectsManagerView mode="mine" />;
      case 'explore-projects':
        return <ProjectsManagerView mode="explore" />;
      case 'find-developers':
        return <DevelopersDirectoryView />;
      case 'team-builder':
        return <TeamBuilderView />;
      case 'team-workspace':
        return <TeamWorkspaceView />;
      case 'invitations':
        return <InvitationsView />;
      case 'my-tasks':
        return <MyTasksView />;
      case 'ai-analyzer':
        return <AIAnalyzerView />;
      case 'ai-planner':
        return <AIPlannerView />;
      case 'settings':
        return <ProfileSetupView />;
      case 'admin':
        return <AdminDashboardView />;
      default:
        return <DashboardOverview />;
    }
  };

  return <AppShell>{renderView()}</AppShell>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SkillBridgeRouter />
        <ToastContainer />
      </AppProvider>
    </ErrorBoundary>
  );
}
