export function feedIndexForOffset(offset: number, viewportHeight: number, itemCount: number) {
  if (itemCount <= 0 || viewportHeight <= 0) return 0;

  return Math.min(
    itemCount - 1,
    Math.max(0, Math.round(offset / viewportHeight)),
  );
}
