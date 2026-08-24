import { create } from 'zustand';
import { Group, GroupMember } from '@/types';

interface GroupState {
  groups: Group[];
  activeGroup: Group | null;
  activeGroupMembers: GroupMember[];
  isLoading: boolean;

  // Actions
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;
  setActiveGroup: (group: Group | null) => void;
  setActiveGroupMembers: (members: GroupMember[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  activeGroup: null,
  activeGroupMembers: [],
  isLoading: false,

  setGroups: (groups) => set({ groups }),

  addGroup: (group) =>
    set((state) => ({ groups: [group, ...state.groups] })),

  updateGroup: (groupId, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
      activeGroup:
        state.activeGroup?.id === groupId
          ? { ...state.activeGroup, ...updates }
          : state.activeGroup,
    })),

  removeGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      activeGroup:
        state.activeGroup?.id === groupId ? null : state.activeGroup,
    })),

  setActiveGroup: (group) => set({ activeGroup: group }),
  setActiveGroupMembers: (members) => set({ activeGroupMembers: members }),
  setLoading: (isLoading) => set({ isLoading }),
}));
