// The visible dock and every reading surface reserve the same space.
export const DOCK_HEIGHT = 54;
export const DOCK_GAP = 16;
export const dockBottom = (safeBottom: number) => Math.max(safeBottom, 12);
export const dockClearance = (safeBottom: number) =>
  dockBottom(safeBottom) + DOCK_HEIGHT + DOCK_GAP;
