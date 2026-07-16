import { supabase } from './supabase.js';

function deviceType() {
  return typeof navigator !== 'undefined' ? navigator.userAgent : null;
}

// Fire-and-forget audit trail into 002_user_logs — every call here is
// informational only and must never throw or block the action it's
// recording. Silently no-ops until 002_user_logs has an anon INSERT policy
// (currently RLS-blocked — see reset_to_pregnant.sql / chat for the SQL).
export async function logAction(lineUid, action, { oldValue = null, newValue = null } = {}) {
  if (!lineUid) return;
  try {
    await supabase.from('002_user_logs').insert({
      line_uid: lineUid,
      action,
      old_value: oldValue != null ? String(oldValue) : null,
      new_value: newValue != null ? String(newValue) : null,
      device_type: deviceType(),
    });
  } catch (e) {
    console.warn('[userLogs] action log failed:', e?.message);
  }
}

// Errors share the same table/shape as actions so they're queryable the
// same way — action is prefixed "error:" to filter easily, and new_value
// carries the actual error message so we can diagnose without needing the
// user to reproduce it live for us.
export function logError(lineUid, context, error) {
  const message = error?.message || String(error);
  return logAction(lineUid, `error:${context}`, { newValue: message });
}
