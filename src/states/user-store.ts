import { create } from 'zustand';
import { User, UserRole, Permission } from '@/lib/types';

type IUserStore = {
  userId: string | null;
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  permissions: Permission[];
  setUserId: (id: string) => void;
  setUser: (user: User) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setRole: (role: UserRole) => void;
  setPermissions: (permissions: Permission[]) => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  logout: () => void;
};

const useUserStore = create<IUserStore>((set, get) => ({
  userId: null,
  user: null,
  isAuthenticated: false,
  role: null,
  permissions: [],
  setUserId: (id) => set({ userId: id }),
  setUser: (user) => set({
    user,
    userId: user.id,
    isAuthenticated: true,
    role: user.role,
    permissions: user.permissions
  }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setRole: (role) => set({ role }),
  setPermissions: (permissions) => set({ permissions }),
  hasPermission: (permission) => get().permissions.includes(permission),
  hasRole: (role) => get().role === role,
  logout: () => set({
    userId: null,
    user: null,
    isAuthenticated: false,
    role: null,
    permissions: []
  }),
}));

export default useUserStore;
