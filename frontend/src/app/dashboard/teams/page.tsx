'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Search, Trash2, UsersRound, UserPlus, Crown, Shield, User, X } from 'lucide-react';
import { Card, Badge, Modal, Input, Textarea, Button, EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog';
import api from '@/lib/api';

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
}

const roleIcons: Record<string, any> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

const roleColors: Record<string, string> = {
  OWNER: 'warning',
  ADMIN: 'info',
  MEMBER: 'neutral',
};

export default function TeamsPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const toast = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  const [teamForm, setTeamForm] = useState({ name: '', description: '' });
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'MEMBER' });

  const fetchTeams = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      api.setToken(token);
      const res = await api.getTeams();
      setTeams((res.data as Team[]) || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  const fetchUsers = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      api.setToken(token);
      const res = await api.getUsers({ limit: 200 });
      setAllUsers(((res.data as any[]) || []).map((u: any) => ({ id: u.id, name: u.name, email: u.email })));
    } catch { /* ignore */ }
  }, [getToken, isSignedIn]);

  useEffect(() => { if (isLoaded && isSignedIn) { fetchTeams(); fetchUsers(); } }, [isLoaded, isSignedIn, fetchTeams, fetchUsers]);

  const handleCreateTeam = async () => {
    if (!teamForm.name) { toast.error('Team name is required'); return; }
    setSubmitting(true);
    try {
      const token = await getToken();
      api.setToken(token);
      await api.createTeam(teamForm);
      toast.success('Team created');
      setShowCreateModal(false);
      setTeamForm({ name: '', description: '' });
      fetchTeams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    const ok = await confirm({ title: 'Delete Team', message: 'Delete this team?', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      const token = await getToken();
      api.setToken(token);
      await api.deleteTeam(id);
      toast.success('Team deleted');
      fetchTeams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete team');
    }
  };

  const handleAddMember = async () => {
    if (!memberForm.userId || !selectedTeam) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      api.setToken(token);
      await api.addTeamMember(selectedTeam.id, memberForm);
      toast.success('Member added');
      setShowAddMemberModal(false);
      setMemberForm({ userId: '', role: 'MEMBER' });
      fetchTeams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    const ok = await confirm({ title: 'Remove Member', message: 'Remove this member?', variant: 'warning', confirmLabel: 'Remove' });
    if (!ok) return;
    try {
      const token = await getToken();
      api.setToken(token);
      await api.removeTeamMember(teamId, userId);
      toast.success('Member removed');
      fetchTeams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Teams</h1>
          <p className="text-neutral-500 mt-1">{teams.length} teams</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="w-12 h-12" />}
          title="No teams yet"
          description="Create teams to organize your sales force"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <Card key={team.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <UsersRound className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{team.name}</h3>
                    {team.description && <p className="text-xs text-neutral-500">{team.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setSelectedTeam(team); setShowAddMemberModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title="Add member"
                  >
                    <UserPlus className="w-4 h-4 text-blue-500" />
                  </button>
                  <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete team">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Members ({team.members?.length || 0})
                </p>
                {team.members?.map(member => {
                  const RoleIcon = roleIcons[member.role] || User;
                  return (
                    <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold">
                          {member.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{member.user.name}</p>
                          <p className="text-xs text-neutral-500">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={(roleColors[member.role] || 'neutral') as any} size="sm">
                          <RoleIcon className="w-3 h-3 mr-1" />{member.role}
                        </Badge>
                        {member.role !== 'OWNER' && (
                          <button onClick={() => handleRemoveMember(team.id, member.user.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                            <X className="w-3 h-3 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!team.members || team.members.length === 0) && (
                  <p className="text-sm text-neutral-400 text-center py-3">No members yet</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Team">
        <div className="space-y-4">
          <Input label="Team Name *" value={teamForm.name} onChange={(e) => setTeamForm(f => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" value={teamForm.description} onChange={(e) => setTeamForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateTeam} loading={submitting}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title={`Add Member to ${selectedTeam?.name || 'Team'}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">User</label>
            <select
              value={memberForm.userId}
              onChange={(e) => setMemberForm(f => ({ ...f, userId: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
            >
              <option value="">Select User</option>
              {allUsers
                .filter(u => !selectedTeam?.members?.some(m => m.user.id === u.id))
                .map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role</label>
            <select
              value={memberForm.role}
              onChange={(e) => setMemberForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAddMemberModal(false)}>Cancel</Button>
            <Button onClick={handleAddMember} loading={submitting}>Add Member</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
