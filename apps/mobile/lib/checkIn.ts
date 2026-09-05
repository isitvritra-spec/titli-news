export const HOLD_DURATION_MS = 2_600;

export type CheckInBand = "light" | "tender" | "heavy";

export type CheckInFeedback = {
  band: CheckInBand;
  label: string;
  message: string;
};

export function pressureFromDuration(durationMs: number) {
  if (!Number.isFinite(durationMs)) return 0;
  return Math.min(Math.max(durationMs, 0) / HOLD_DURATION_MS, 1);
}

export function getCheckInFeedback(pressure: number): CheckInFeedback {
  const normalized = Math.min(Math.max(pressure, 0), 1);

  if (normalized < 0.3) {
    return {
      band: "light",
      label: "Light today",
      message: "Keep the day soft. You do not need to fill every space.",
    };
  }

  if (normalized < 0.7) {
    return {
      band: "tender",
      label: "A little tender",
      message: "Make room for yourself before you make room for the noise.",
    };
  }

  return {
    band: "heavy",
    label: "Heavy today",
    message: "One small thing at a time. That is enough for this moment.",
  };
}
