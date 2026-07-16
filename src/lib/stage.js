// Maps a child's age (or pregnancy) to a lifecycle stage bucket, matching
// 003_children.stage values, used for content/campaign targeting (target_stages).
//
// 003_children_stage_check was widened on 2026-07-16 to accept 'toddler'
// for 12mo+ (previously only null/pregnancy/newborn/early_infant/
// growing_infant were allowed, which broke registration for any child
// already 1yr+ — see git history for the incident). Re-verified live
// against the DB after the constraint update before restoring this value.
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
