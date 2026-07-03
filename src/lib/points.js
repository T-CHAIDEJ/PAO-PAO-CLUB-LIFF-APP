import { supabase } from './supabase.js';

// 7-day daily-login streak reward table (day 1 → day 7)
export const STREAK_POINTS = [5, 5, 10, 10, 15, 15, 50];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Awards daily-login points at most once per calendar day.
// Safe to call on every app boot — if the user already checked in today it no-ops.
export async function checkinDaily(userId) {
  if (!userId) return null;

  const { data: u, error } = await supabase
    .from('users')
    .select('points, login_streak, last_checkin')
    .eq('id', userId)
    .single();
  if (error || !u) return null;

  const today = todayStr();
  if (u.last_checkin === today) {
    return { alreadyChecked: true, points: u.points ?? 0, streak: u.login_streak ?? 0 };
  }

  // Consecutive day → streak + 1, otherwise reset to 1. Cycles every 7 days.
  let newStreak;
  if (u.last_checkin) {
    const diffDays = Math.round((new Date(today) - new Date(u.last_checkin)) / 86400000);
    newStreak = diffDays === 1 ? (u.login_streak || 0) + 1 : 1;
  } else {
    newStreak = 1;
  }

  const dayIndex = (newStreak - 1) % 7; // 0..6
  const award = STREAK_POINTS[dayIndex];
  const newPoints = (u.points || 0) + award;

  await supabase
    .from('users')
    .update({ points: newPoints, login_streak: newStreak, last_checkin: today })
    .eq('id', userId);
  await supabase
    .from('point_activities')
    .insert({ user_id: userId, type: 'daily_login', points: award, streak_day: dayIndex + 1 });

  return { awarded: award, points: newPoints, streak: newStreak, streakDay: dayIndex + 1 };
}
