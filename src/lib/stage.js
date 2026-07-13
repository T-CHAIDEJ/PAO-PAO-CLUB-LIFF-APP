// Maps a child's age (or pregnancy) to a lifecycle stage bucket, matching
// 003_children.stage values, used for content/campaign targeting (target_stages).
//
// ASSUMPTION FLAGGED FOR DEV B: only 'pregnancy' is confirmed (seen written by
// Form A in Dev B's own screen map doc). The other bucket names/boundaries
// below are our best guess from the original stage request (Newborn 0-1M,
// Early Infant 1-6M, Growing Infant 6-12M, Toddler 1-3Y) — confirm exact
// string values and month boundaries before relying on this for real targeting.
export function computeStage(birthDateStr) {
  if (!birthDateStr) return null;
  const ms = Date.now() - new Date(birthDateStr).getTime();
  const months = ms / (1000 * 60 * 60 * 24 * 30.4375);
  if (months < 1) return 'newborn';
  if (months < 6) return 'early_infant';
  if (months < 12) return 'growing_infant';
  return 'toddler'; // also covers >3y, since there's no bucket beyond toddler yet
}

export const PREGNANCY_STAGE = 'pregnancy';
