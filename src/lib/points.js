import { supabase } from './supabase.js';

// 7-day daily-login streak reward table (day 1 → day 7)
export const STREAK_POINTS = [5, 5, 10, 10, 15, 15, 50];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Dev B's schema (006_points) is a ledger: every award is a row that also
// snapshots the running balance. There is no `points` column on 001_users —
// "current points" = the balance on the most recent ledger row for this user.
async function getCurrentBalance(lineUid) {
  const { data } = await supabase
    .from('006_points')
    .select('balance')
    .eq('line_uid', lineUid)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data?.balance ?? 0;
}

// Awards daily-login points at most once per calendar day.
// Safe to call on every app boot — if the user already checked in today it no-ops.
// `lineUid` is the LINE userId (001_users.line_uid), used as the natural key
// across 001_users / 003_children / 004_growth / 006_points.
export async function checkinDaily(lineUid) {
  if (!lineUid) return null;

  const { data: u, error } = await supabase
    .from('001_users')
    .select('login_streak, login_count, last_checkin')
    .eq('line_uid', lineUid)
    .single();
  if (error || !u) return null;

  const today = todayStr();
  if (u.last_checkin === today) {
    const balance = await getCurrentBalance(lineUid);
    return { alreadyChecked: true, points: balance, streak: u.login_streak ?? 0 };
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
  const currentBalance = await getCurrentBalance(lineUid);
  const newBalance = currentBalance + award;

  await supabase
    .from('001_users')
    .update({ login_streak: newStreak, login_count: (u.login_count || 0) + 1, last_checkin: today })
    .eq('line_uid', lineUid);
  await supabase
    .from('006_points')
    .insert({ line_uid: lineUid, source: 'daily_login', points: award, balance: newBalance, streak_day: dayIndex + 1 });

  // Non-fatal audit trail — 002_user_logs currently rejects anon inserts
  // (RLS gap, same as 008_consent was), so this silently no-ops for now.
  try {
    await supabase.from('002_user_logs').insert({ line_uid: lineUid, action: 'checkin', new_value: String(newStreak) });
  } catch (e) { console.warn('[points] checkin log failed:', e?.message); }

  return { awarded: award, points: newBalance, streak: newStreak, streakDay: dayIndex + 1 };
}
