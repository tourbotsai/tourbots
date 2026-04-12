import { useCallback, useEffect, useState } from 'react';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

type TeamRole = 'owner' | 'admin' | 'manager' | 'viewer';

export interface TeamMember {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  access_role: TeamRole;
  account_role: 'user' | 'admin' | 'platform_admin';
  is_primary: boolean;
  is_owner: boolean;
  is_active: boolean;
  access_granted_at: string;
  created_at: string;
}

interface InvitePayload {
  email: string;
  role: Exclude<TeamRole, 'owner'>;
  first_name?: string;
  last_name?: string;
  password?: string;
  account_role?: 'user' | 'admin' | 'platform_admin';
}

export function useTeamMembers() {
  const { getAuthHeaders } = useAuthHeaders();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/app/team-members', {
        headers: await getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load team members');
      }
      setMembers(data.members || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = useCallback(
    async (payload: InvitePayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const response = await fetch('/api/app/team-members', {
          method: 'POST',
          headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to add team member');
        }
        await fetchMembers();
        return data;
      } catch (err: any) {
        const message = err.message || 'Failed to add team member';
        setError(message);
        throw new Error(message);
      } finally {
        setIsMutating(false);
      }
    },
    [getAuthHeaders, fetchMembers]
  );

  const updateMemberRole = useCallback(
    async (userId: string, role: Exclude<TeamRole, 'owner'>) => {
      setIsMutating(true);
      setError(null);
      try {
        const response = await fetch(`/api/app/team-members/${userId}`, {
          method: 'PATCH',
          headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ role }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to update team member role');
        }
        await fetchMembers();
      } catch (err: any) {
        const message = err.message || 'Failed to update team member role';
        setError(message);
        throw new Error(message);
      } finally {
        setIsMutating(false);
      }
    },
    [getAuthHeaders, fetchMembers]
  );

  const removeMember = useCallback(
    async (userId: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const response = await fetch(`/api/app/team-members/${userId}`, {
          method: 'DELETE',
          headers: await getAuthHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to remove team member');
        }
        await fetchMembers();
      } catch (err: any) {
        const message = err.message || 'Failed to remove team member';
        setError(message);
        throw new Error(message);
      } finally {
        setIsMutating(false);
      }
    },
    [getAuthHeaders, fetchMembers]
  );

  const setMemberPassword = useCallback(
    async (userId: string, password: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const response = await fetch(`/api/app/team-members/${userId}/password`, {
          method: 'PATCH',
          headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to update team member password');
        }
        return data;
      } catch (err: any) {
        const message = err.message || 'Failed to update team member password';
        setError(message);
        throw new Error(message);
      } finally {
        setIsMutating(false);
      }
    },
    [getAuthHeaders]
  );

  return {
    members,
    isLoading,
    isMutating,
    error,
    fetchMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    setMemberPassword,
  };
}
