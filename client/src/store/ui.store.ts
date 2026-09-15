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

  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/*
  Applies the theme to the html element.
  Called on store init and on every theme change.
*/
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
        /*
          Apply saved theme immediately on page load
          before React renders to avoid a flash of wrong theme.
        */
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);