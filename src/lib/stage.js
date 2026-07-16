// Maps a child's age (or pregnancy) to a lifecycle stage bucket, matching
// 003_children.stage values, used for content/campaign targeting (target_stages).
//
// CONFIRMED EMPIRICALLY (2026-07-16, via anon-key insert probes against the
// live 003_children_stage_check constraint): only null, 'pregnancy',
// 'newborn', 'early_infant', and 'growing_infant' are accepted. 'toddler'
// (and every other 12mo+ bucket name we tried) violates the check
// constraint — Dev B never added a bucket for children 1yr+. Any insert or
// update that computed 'toddler' failed outright with a generic error,
// which is exactly the bug reported 2026-07-16 (child born 2025-01-15,
// ~18mo old, onboarding "already has a child" save always failed). Falling
// back to null here (allowed) rather than guessing another wrong string —
// ask Dev B to add a real 12mo+ bucket to the constraint, then update this.
export function computeStage(birthDateStr) {
  if (!birthDateStr) return null;
  const ms = Date.now() - new Date(birthDateStr).getTime();
  const months = ms / (1000 * 60 * 60 * 24 * 30.4375);
  if (months < 1) return 'newborn';
  if (months < 6) return 'early_infant';
  if (months < 12) return 'growing_infant';
  return null; // no DB bucket exists yet for 12mo+ — see comment above
}

export const PREGNANCY_STAGE = 'pregnancy';
