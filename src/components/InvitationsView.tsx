import React, { useMemo, useState } from 'react';
import { Check, Inbox, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const InvitationsView: React.FC = () => {
  const { invitations, currentProfile, authUser, respondToInvitation, setSelectedProjectId, setActiveView } = useApp();
  const uid = currentProfile?.userId || authUser?.uid || '';
  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming');

  const incoming = useMemo(
    () => invitations.filter((i) => i.receiverId === uid),
    [invitations, uid]
  );

  const sent = useMemo(
    () => invitations.filter((i) => i.senderId === uid),
    [invitations, uid]
  );

  const list = tab === 'incoming' ? incoming : sent;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#D1D9E0]">
        <h1 className="text-2xl font-bold text-[#1F2328]">Invitations &amp; Join Requests</h1>
        <p className="mt-1 text-sm text-[#656D76]">
          Review team invitations you have received and manage developer applications to your projects.
        </p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg">
        <button
          type="button"
          onClick={() => setTab('incoming')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
            tab === 'incoming' ? 'bg-white text-[#1F2328] border border-[#D1D9E0]' : 'text-[#656D76]'
          }`}
        >
          Incoming ({incoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
            tab === 'sent' ? 'bg-white text-[#1F2328] border border-[#D1D9E0]' : 'text-[#656D76]'
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="p-10 text-center bg-white border border-[#D1D9E0] rounded-lg">
          <Inbox className="w-9 h-9 text-[#656D76] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1F2328]">
            No {tab === 'incoming' ? 'incoming' : 'sent'} invitations yet
          </p>
          <p className="mt-1 text-xs text-[#656D76]">
            Explore projects or invite developers from Team Builder to start collaborating.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((inv) => (
            <div
              key={inv.invitationId}
              className="p-5 bg-white border border-[#D1D9E0] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#656D76]">
                  <span className="font-semibold text-[#0969DA]">
                    {inv.type === 'invite' ? 'Team Invitation' : 'Join Request'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Role: {inv.roleSuggested || 'Collaborator'}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-semibold ${
                      inv.status === 'Accepted'
                        ? 'text-[#1A7F37]'
                        : inv.status === 'Rejected'
                          ? 'text-[#CF222E]'
                          : 'text-[#9A6700]'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <h3
                  onClick={() => {
                    setSelectedProjectId(inv.projectId);
                    setActiveView('explore-projects');
                  }}
                  className="mt-1 text-base font-semibold text-[#1F2328] hover:text-[#0969DA] cursor-pointer"
                >
                  {inv.projectTitle}
                </h3>
                <p className="text-xs text-[#656D76] mt-0.5">
                  {tab === 'incoming'
                    ? `From ${inv.senderName}`
                    : `To ${inv.receiverName}`}
                </p>
                {inv.message && <p className="mt-2 text-sm text-[#1F2328]">{inv.message}</p>}
              </div>

              {tab === 'incoming' && inv.status === 'Pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => respondToInvitation(inv, 'Accepted')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1A7F37] hover:bg-[#15692D] rounded-lg"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToInvitation(inv, 'Rejected')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#CF222E] bg-[#F6F8FA] hover:bg-[#FFEBE9] border border-[#D1D9E0] rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
