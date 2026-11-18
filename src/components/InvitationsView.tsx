import React, { useMemo, useState } from 'react';
import { Check, Clock, Inbox, RotateCcw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const InvitationsView: React.FC = () => {
  const {
    invitations,
    currentProfile,
    authUser,
    respondToInvitation,
    cancelInvitation,
    setSelectedProjectId,
    setActiveView,
  } = useApp();
  const uid = currentProfile?.userId || authUser?.uid || '';
  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming');
  const [busyId, setBusyId] = useState<string | null>(null);

  const incoming = useMemo(
    () => invitations.filter((i) => i.receiverId === uid),
    [invitations, uid]
  );

  const sent = useMemo(
    () => invitations.filter((i) => i.senderId === uid),
    [invitations, uid]
  );

  const list = tab === 'incoming' ? incoming : sent;

  const handleDecision = async (inv: (typeof invitations)[number], decision: 'Accepted' | 'Rejected') => {
    setBusyId(inv.invitationId);
    try {
      await respondToInvitation(inv, decision);
    } finally {
      setBusyId(null);
    }
  };

  const handleWithdraw = async (inv: (typeof invitations)[number]) => {
    setBusyId(inv.invitationId);
    try {
      await cancelInvitation(inv);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#D1D9E0]">
        <h1 className="text-2xl font-bold text-[#1F2328]">Invitations &amp; Join Requests</h1>
        <p className="mt-1 text-sm text-[#656D76]">
          Review incoming team invitations, approve project applicants, and track pending sent invites.
        </p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg">
        <button
          type="button"
          onClick={() => setTab('incoming')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
            tab === 'incoming' ? 'bg-white text-[#1F2328] border border-[#D1D9E0]' : 'text-[#656D76]'
          }`}
        >
          Incoming ({incoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
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
          {list.map((inv) => {
            const isBusy = busyId === inv.invitationId;
            return (
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
                      {inv.status === 'Pending' && tab === 'sent'
                        ? 'Pending recipient response'
                        : inv.status}
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
                      disabled={isBusy}
                      onClick={() => handleDecision(inv, 'Accepted')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1A7F37] hover:bg-[#15692D] disabled:opacity-50 rounded-lg whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDecision(inv, 'Rejected')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#CF222E] bg-[#F6F8FA] hover:bg-[#FFEBE9] disabled:opacity-50 border border-[#D1D9E0] rounded-lg whitespace-nowrap"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                )}

                {tab === 'sent' && inv.status === 'Pending' && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs text-[#9A6700] font-medium whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting response
                    </span>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleWithdraw(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#CF222E] bg-[#F6F8FA] hover:bg-[#FFEBE9] disabled:opacity-50 border border-[#D1D9E0] rounded-lg whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Withdraw
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
