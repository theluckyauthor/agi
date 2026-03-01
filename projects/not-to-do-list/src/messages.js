export const SURVIVAL_MESSAGES = [
  "You didn't do it. The world didn't end. Legend.",
  "That took zero effort and maximum discipline.",
  "Scientists confirm: not doing things works.",
  "You absolute unit of restraint.",
  "Another day, another thing completely avoided.",
  "Your therapist would be proud. Or confused.",
  "Not done. Still iconic.",
  "Productivity cults hate this one trick.",
  "You chose peace over panic. Respect.",
  "No action. Maximum impact.",
  "The urge showed up. You did not.",
  "You skipped it and somehow leveled up.",
  "Minimal output, maximal survival.",
  "A masterpiece of strategic avoidance.",
  "You protected your energy like a champion.",
];

export const CLOSE_CALL_MESSAGES = [
  "You looked it in the eye. And walked away.",
  "The universe trembled. You held steady.",
  "That's not restraint. That's power.",
  "You were this close. This. Close. And you chose yourself.",
  "Temptation: 0. You: everything.",
];

export const pickMessage = (closeCall = false) => {
  const pool = closeCall ? CLOSE_CALL_MESSAGES : SURVIVAL_MESSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getTodayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseKeyToDate = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const diffDays = (a, b) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
};

export const updateStreak = (streak, dateKey) => {
  if (!streak?.lastDate) {
    return { count: 1, lastDate: dateKey };
  }

  if (streak.lastDate === dateKey) {
    return streak;
  }

  const currentDate = parseKeyToDate(dateKey);
  const lastDate = parseKeyToDate(streak.lastDate);
  const delta = diffDays(currentDate, lastDate);

  if (delta === 1) {
    return { count: streak.count + 1, lastDate: dateKey };
  }

  return { count: 1, lastDate: dateKey };
};
