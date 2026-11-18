import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminDashboardView: React.FC = () => {
  const {
    isAdmin,
    developers,
    projects,
    teams,
    reports,
    activities,
    updateReportStatus,
    adminToggleProjectVisibility,
    adminDeleteProject,
  } = useApp();

  const [tab, setTab] = useState<'reports' | 'projects' | 'users'>('reports');

  if (!isAdmin) {
    return (
      <div className="p-10 text-center bg-white border border-[#D1D9E0] rounded-lg">
        <ShieldAlert className="w-10 h-10 text-[#CF222E] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#1F2328]">Admin Access Required</h2>
        <p className="mt-1 text-sm text-[#656D76]">
          Administrative moderation routes are protected by verified server-side Firestore security rules.
        </p>
      </div>
    );
  }

  const openProjectsCount = projects.filter((p) => p.status === 'Open').length;
  const pendingReportsCount = reports.filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#D1D9E0]">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#1F2328]">Admin Governance Console</h1>
        </div>
        <p className="mt-1 text-sm text-[#656D76]">
          Monitor registered developers, active teams, project visibility, and moderation reports.
        </p>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <p className="text-xs text-[#656D76]">Registered Users</p>
          <p className="mt-1 text-2xl font-bold text-[#1F2328] tabular-nums">{developers.length}</p>
        </div>
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <p className="text-xs text-[#656D76]">Total Projects</p>
          <p className="mt-1 text-2xl font-bold text-[#1F2328] tabular-nums">{projects.length}</p>
        </div>
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <p className="text-xs text-[#656D76]">Active Teams</p>
          <p className="mt-1 text-2xl font-bold text-[#1A7F37] tabular-nums">{teams.length}</p>
        </div>
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <p className="text-xs text-[#656D76]">Open Projects</p>
          <p className="mt-1 text-2xl font-bold text-[#0969DA] tabular-nums">{openProjectsCount}</p>
        </div>
        <div className="p-4 bg-white border border-[#D1D9E0] rounded-lg">
          <p className="text-xs text-[#656D76]">Pending Reports</p>
          <p className="mt-1 text-2xl font-bold text-[#CF222E] tabular-nums">{pendingReportsCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg">
        <button
          type="button"
          onClick={() => setTab('reports')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
            tab === 'reports' ? 'bg-white text-[#1F2328] border border-[#D1D9E0]' : 'text-[#656D76]'
          }`}
        >
          Reported Content ({reports.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('projects')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
            tab === 'projects' ? 'bg-white text-[#1F2328] border border-[#D1D9E0]' : 'text-[#656D76]'
          }`}
        >
          Manage Projects ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
            tab === 'users' ? 'bg-white text-[#1F2328] border border-[#D1D9E0]' : 'text-[#656D76]'
          }`}
        >
          Users &amp; Activity ({developers.length})
        </button>
      </div>

      {tab === 'reports' && (
        <div className="bg-white border border-[#D1D9E0] rounded-lg divide-y divide-[#D1D9E0]">
          {reports.length === 0 ? (
            <p className="p-8 text-center text-xs text-[#656D76]">No moderation reports submitted.</p>
          ) : (
            reports.map((rep) => (
              <div key={rep.reportId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#656D76]">
                    <span className="font-semibold text-[#1F2328]">
                      {rep.targetType === 'project' ? 'Reported Project' : 'Reported Profile'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-semibold ${
                        rep.status === 'Pending'
                          ? 'text-[#CF222E]'
                          : rep.status === 'Resolved'
                            ? 'text-[#1A7F37]'
                            : 'text-[#656D76]'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#1F2328]">{rep.targetTitle}</p>
                  <p className="mt-0.5 text-xs text-[#656D76]">{rep.reason}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateReportStatus(rep.reportId, 'Reviewed')}
                    className="px-2.5 py-1 text-xs bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReportStatus(rep.reportId, 'Resolved')}
                    className="px-2.5 py-1 text-xs text-white bg-[#1A7F37] rounded-md"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReportStatus(rep.reportId, 'Dismissed')}
                    className="px-2.5 py-1 text-xs text-[#656D76] bg-[#F6F8FA] border border-[#D1D9E0] rounded-md"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'projects' && (
        <div className="bg-white border border-[#D1D9E0] rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F8FA] border-b border-[#D1D9E0] text-[#656D76]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Project</th>
                <th className="py-2.5 px-4 font-semibold">Owner</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold">Visibility</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D9E0]">
              {projects.map((p) => (
                <tr key={p.projectId} className="hover:bg-[#F6F8FA]/60">
                  <td className="py-3 px-4 font-medium text-[#1F2328]">{p.title}</td>
                  <td className="py-3 px-4 text-[#656D76]">{p.ownerName}</td>
                  <td className="py-3 px-4 text-[#656D76]">{p.category}</td>
                  <td className="py-3 px-4 font-medium text-[#1F2328]">{p.visibility}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        adminToggleProjectVisibility(
                          p.projectId,
                          p.visibility === 'Public' ? 'Private' : 'Public'
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded"
                    >
                      {p.visibility === 'Public' ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Make Private
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Make Public
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => adminDeleteProject(p.projectId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[#CF222E] bg-[#FFEBE9] rounded"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#D1D9E0] rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F8FA] border-b border-[#D1D9E0] text-[#656D76]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Developer</th>
                  <th className="py-2.5 px-4 font-semibold">Experience</th>
                  <th className="py-2.5 px-4 font-semibold">Skills</th>
                  <th className="py-2.5 px-4 font-semibold">Directory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1D9E0]">
                {developers.map((d) => (
                  <tr key={d.userId} className="hover:bg-[#F6F8FA]/60">
                    <td className="py-3 px-4 font-medium text-[#1F2328]">
                      {d.name} (@{d.username})
                    </td>
                    <td className="py-3 px-4 text-[#656D76]">{d.experience}</td>
                    <td className="py-3 px-4 text-[#656D76]">{d.skills.slice(0, 3).join(', ')}</td>
                    <td className="py-3 px-4 text-[#1A7F37]">{d.isPublic ? 'Public' : 'Private'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-5 p-4 bg-white border border-[#D1D9E0] rounded-lg">
            <h3 className="text-xs font-semibold text-[#656D76] mb-3">Recent Platform Activities</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-[#656D76]">No recent activities recorded.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {activities.slice(0, 8).map((a) => (
                  <li key={a.activityId} className="flex items-center justify-between gap-2">
                    <span className="truncate text-[#1F2328]">
                      <span className="font-medium">{a.action}</span> · {a.targetTitle}
                    </span>
                    <span className="text-[#656D76] tabular-nums shrink-0">{a.dateKey}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
