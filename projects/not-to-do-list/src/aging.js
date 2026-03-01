const HOUR = 60 * 60 * 1000;

export const getAgingStage = (createdAt, now = Date.now()) => {
  const age = now - createdAt;
  const date = new Date(now);
  const minutesToMidnight = (23 - date.getHours()) * 60 + (60 - date.getMinutes());
  const midnightPressure = minutesToMidnight <= 60;

  if (age >= 12 * HOUR || midnightPressure) return "panicking";
  if (age >= 6 * HOUR) return "anxious";
  if (age >= 2 * HOUR) return "nervous";
  return "calm";
};
