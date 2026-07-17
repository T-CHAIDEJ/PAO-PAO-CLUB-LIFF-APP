import { supabase } from './supabase.js';

// 7-day daily-login streak reward table (day 1 → day 7)
export const STREAK_POINTS = [5, 5, 10, 10, 15, 15, 50];

// All points earned this season expire together at the end of SS1. This is
// only written onto each ledger row — nothing currently deducts expired
// points from `balance` automatically (no scheduled job), so the displayed
// balance won't drop on its own after this date yet.
const SEASON_EXPIRES_AT = '2026-12-31T23:59:59+07:00';

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

// Read-only — current balance + streak with no writes at all. Used when the
// member can't check in right now (e.g. outdated consent) but should still
// see their existing balance rather than it appearing to reset to 0.
export async function fetchPointsSnapshot(lineUid) {
  if (!lineUid) return null;
  const { data: u } = await supabase.from('001_users').select('login_streak').eq('line_uid', lineUid).single();
  const balance = await getCurrentBalance(lineUid);
  return { points: balance, streak: u?.login_streak ?? 0 };
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

  // Atomically claim today's checkin: the UPDATE only affects a row if
  // last_checkin still isn't today, so if this function fires twice at
  // nearly the same moment (double-tap reload, retry after a slow
  // response, etc.) only one of the two calls can win the race — Postgres
  // serializes concurrent UPDATEs on the same row, so the loser's WHERE
  // clause re-evaluates against the winner's already-committed write and
  // correctly matches nothing. Verified against real concurrent requests
  // before relying on this. Previously this was a plain unconditional
  // UPDATE with no such guard, so both calls could pass the earlier
  // last_checkin check and each insert their own 006_points row —
  // confirmed as the cause of dev_user_001's duplicate same-timestamp
  // ledger rows found while auditing the points-balance mismatches.
  const { data: claimed, error: claimErr } = await supabase
    .from('001_users')
    .update({ login_streak: newStreak, login_count: (u.login_count || 0) + 1, last_checkin: today })
    .eq('line_uid', lineUid)
    .or(`last_checkin.is.null,last_checkin.neq.${today}`)
    .select('line_uid');

  if (claimErr || !claimed || claimed.length === 0) {
    // Lost the race (or the update failed) — another call already
    // recorded today's checkin, so behave like the already-checked-in
    // fast path instead of awarding points twice.
    const balance = await getCurrentBalance(lineUid);
    return { alreadyChecked: true, points: balance, streak: newStreak };
  }

  const currentBalance = await getCurrentBalance(lineUid);
  const newBalance = currentBalance + award;

  await supabase
    .from('006_points')
    .insert({ line_uid: lineUid, source: 'daily_login', points: award, balance: newBalance, streak_day: dayIndex + 1, expired_at: SEASON_EXPIRES_AT });

  // Non-fatal audit trail — 002_user_logs currently rejects anon inserts
  // (RLS gap, same as 008_consent was), so this silently no-ops for now.
  try {
    await supabase.from('002_user_logs').insert({ line_uid: lineUid, action: 'checkin', new_value: String(newStreak) });
  } catch (e) { console.warn('[points] checkin log failed:', e?.message); }

  return { awarded: award, points: newBalance, streak: newStreak, streakDay: dayIndex + 1 };
}
