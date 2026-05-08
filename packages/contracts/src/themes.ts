export type ThemePack = {
  id: "graph-paper-v1";
  label: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
    muted: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
};

export const THEME_PACKS: ThemePack[] = [
  {
    id: "graph-paper-v1",
    label: "Graph paper",
    colors: {
      background: "#0B1020",
      foreground: "#F5F7FF",
      accent: "#7C5CFF",
      muted: "#98A2C3",
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
  },
];

export const DEFAULT_THEME_PACK_ID = THEME_PACKS[0]?.id;

export function getThemeById(id: ThemePack["id"]): ThemePack {
  const found = THEME_PACKS.find((t) => t.id === id);
  if (!found) {
    throw new Error(`Unknown theme pack: ${id}`);
  }
  return found;
}
