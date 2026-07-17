import { supabase } from './supabase.js';
import { logAction } from './userLogs.js';

export const PDPA_VERSION_FALLBACK = 'v1';
export const PDPA_TEXT_FALLBACK = 'เราจะเก็บข้อมูลของคุณเพื่อให้บริการที่ดีขึ้น ข้อมูลจะไม่ถูกเปิดเผยต่อบุคคลที่สาม และจะถูกจัดเก็บอย่างปลอดภัยตามมาตรฐาน PDPA';

// 008_consent is Dev B's catalog of policy versions (is_active flags the
// current one) — shared by onboarding's first-time consent step and the
// reconsent gate for members whose accepted version has fallen behind.
export async function fetchActiveConsent() {
  try {
    const { data } = await supabase
      .from('008_consent').select('consent_version, pdpa_text')
      .eq('is_active', true).limit(1).single();
    return data ?? null;
  } catch (e) {
    console.warn('[consent] fetch active failed:', e?.message);
    return null;
  }
}

// True only for members who already consented once but to an older
// version than the one currently active — guests have nothing to
// reconsent to yet (they pass through the normal onboarding PDPA step
// once they actually sign up), and someone who's never consented isn't
// "outdated", they just haven't onboarded.
export function isConsentOutdated(user, activeConsent) {
  if (!user || !activeConsent) return false;
  if (user.role === 'guest' || !user.is_consented) return false;
  return user.consent_version !== activeConsent.consent_version;
}

// Records acceptance of a (possibly new) consent version — used by both
// the first-time onboarding flow and the reconsent-after-version-bump flow.
export async function acceptConsent(lineUid, version) {
  const patch = { is_consented: true, consented_at: new Date().toISOString(), consent_version: version };
  const { error } = await supabase.from('001_users').update(patch).eq('line_uid', lineUid);
  if (error) throw error;
  logAction(lineUid, 'consent_update', { newValue: version });
  return patch;
}
