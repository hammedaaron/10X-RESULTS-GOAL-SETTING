import { GoalNote, ConsistencyStats } from '../types';

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateConsistencyStats(
  goals: GoalNote[],
  targetPerDay: number = 2,
  windowDays: number = 14
): ConsistencyStats {
  // Aggregate all sessions across active (non-deleted) goals
  const activeGoals = goals.filter((g) => !g.deletedAt);
  const dateCounts: Record<string, number> = {};
  let totalSessions = 0;

  activeGoals.forEach((goal) => {
    (goal.sessionsLog || []).forEach((session) => {
      totalSessions++;
      try {
        const sessionDate = new Date(session.timestamp);
        if (!isNaN(sessionDate.getTime())) {
          const key = formatDateKey(sessionDate);
          dateCounts[key] = (dateCounts[key] || 0) + 1;
        }
      } catch {
        // ignore invalid date
      }
    });
  });

  const todayKey = getTodayKey();
  const todaySessionsCount = dateCounts[todayKey] || 0;
  const isTargetMetToday = todaySessionsCount >= targetPerDay;

  // Last 7 days breakdown for visual dots
  const last7Days: ConsistencyStats['last7Days'] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const count = dateCounts[key] || 0;
    last7Days.push({
      date: key,
      dayName: i === 0 ? 'Today' : dayNames[d.getDay()],
      count,
      met: count >= targetPerDay,
    });
  }

  // Calculate Streak: consecutive days (going back from today or yesterday) where count >= targetPerDay
  let streak = 0;
  const checkDate = new Date();
  // If today is met, streak starts from today; if not yet met today, check if yesterday was met
  let offset = isTargetMetToday ? 0 : 1;

  for (let i = offset; i < 90; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const count = dateCounts[key] || 0;
    if (count >= targetPerDay) {
      streak++;
    } else {
      break;
    }
  }

  // Calculate Consistency Rate over windowDays (e.g., 14 days)
  let daysMet = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const count = dateCounts[key] || 0;
    if (count >= targetPerDay) {
      daysMet++;
    }
  }

  const consistencyRate = Math.round((daysMet / windowDays) * 100);

  return {
    consistencyRate,
    currentStreak: streak,
    todaySessionsCount,
    targetSessionsPerDay: targetPerDay,
    isTargetMetToday,
    last7Days,
    totalSessionsAllTime: totalSessions,
  };
}
