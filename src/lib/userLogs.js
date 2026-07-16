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
// same way. 002_user_logs has no dedicated error-code/stack-trace columns,
// so this makes deliberate use of the two generic value columns instead of
// stretching one: old_value carries the Postgres/Supabase error code when
// present (e.g. '23514' check-violation, '42501' RLS-blocked) so failures
// can be filtered by code without parsing message text; new_value carries
// the human-readable message (plus hint, if Postgres supplied one). action
// is prefixed "error:" so error rows are easy to isolate from normal
// activity in the same table.
export function logError(lineUid, context, error) {
  const code = error?.code ?? null;
  const parts = [error?.message || String(error)];
  if (error?.hint) parts.push(`hint: ${error.hint}`);
  return logAction(lineUid, `error:${context}`, { oldValue: code, newValue: parts.join(' | ') });
}
