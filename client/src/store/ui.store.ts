import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "system" | "light" | "dark";

interface UIStore {
  createWorkspaceModalOpen: boolean;
  setCreateWorkspaceModalOpen: (open: boolean) => void;

  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;

  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      createWorkspaceModalOpen: false,
      setCreateWorkspaceModalOpen: (open) =>
        set({ createWorkspaceModalOpen: open }),

      uploadModalOpen: false,
      setUploadModalOpen: (open) => set({ uploadModalOpen: open }),

      activeConversationId: null,
      setActiveConversationId: (id) => set({ activeConversationId: id }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      theme: "system",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "within-ui",
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);