import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addActivity,
  archiveActivity,
  createGroup,
  deleteGroup,
  fetchGroupActivities,
  fetchGroupWithMembers,
  fetchUserGroups,
  joinGroupByCode,
  leaveGroup,
  regenerateInviteCode,
  removeMember,
  updateGroup,
} from '@/services/groupService';
import { STALE_TIMES } from '@/services/queryClient';
import {
  ActivitySeed,
  AddActivityInput,
  UpdateGroupInput,
} from '@/types';

/**
 * React Query hooks for groups, members & activities.
 * Query keys are centralized here for precise cache invalidation.
 */

export const GROUP_KEYS = {
  userGroups: ['groups', 'user'] as const,
  group: (groupId: string) => ['group', groupId] as const,
  groupMembers: (groupId: string) => ['group-members', groupId] as const,
  groupActivities: (groupId: string) => ['group-activities', groupId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useUserGroups() {
  return useQuery({
    queryKey: GROUP_KEYS.userGroups,
    queryFn: fetchUserGroups,
    staleTime: STALE_TIMES.groups,
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: GROUP_KEYS.group(groupId),
    queryFn: () => fetchGroupWithMembers(groupId),
    enabled: groupId.length > 0,
    staleTime: STALE_TIMES.groups,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: GROUP_KEYS.groupMembers(groupId),
    queryFn: async () => (await fetchGroupWithMembers(groupId)).members,
    enabled: groupId.length > 0,
    staleTime: STALE_TIMES.groups,
  });
}

export function useGroupActivities(groupId: string, unarchivedOnly: boolean = true) {
  return useQuery({
    queryKey: GROUP_KEYS.groupActivities(groupId),
    queryFn: () => fetchGroupActivities(groupId, unarchivedOnly),
    enabled: groupId.length > 0,
    staleTime: STALE_TIMES.groups,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, templates }: { input: Parameters<typeof createGroup>[0]; templates?: ActivitySeed[] }) =>
      createGroup(input, templates),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(group.id) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupActivities(group.id) });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinGroupByCode(code),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(group.id) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupMembers(group.id) });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(groupId) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupMembers(groupId) });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, updates }: { groupId: string; updates: UpdateGroupInput }) =>
      updateGroup(groupId, updates),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(group.id) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      removeMember(groupId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupMembers(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
    },
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => regenerateInviteCode(groupId),
    onSuccess: (_code, groupId) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.group(groupId) });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => deleteGroup(groupId),
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.userGroups });
      queryClient.removeQueries({ queryKey: GROUP_KEYS.group(groupId) });
      queryClient.removeQueries({ queryKey: GROUP_KEYS.groupMembers(groupId) });
      queryClient.removeQueries({ queryKey: GROUP_KEYS.groupActivities(groupId) });
    },
  });
}

// ─── Activity Mutations ──────────────────────────────────────────────────────

export function useAddActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, input }: { groupId: string; input: AddActivityInput }) =>
      addActivity(groupId, input),
    onSuccess: (_activity, variables) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.groupActivities(variables.groupId) });
    },
  });
}

export function useArchiveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) => archiveActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-activities'] });
    },
  });
}
