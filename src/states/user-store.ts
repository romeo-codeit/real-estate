import { create } from 'zustand';

type IUserStore = {
  userId: string | null;
  isAuthenticated: boolean;
  setUserId: (id: string) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
};

const useUserStore = create<IUserStore>((set) => ({
  userId: null,
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setUserId: (id) => set({ userId: id }),
}));

export default useUserStore;
