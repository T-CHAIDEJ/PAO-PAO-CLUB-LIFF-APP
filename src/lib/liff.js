import liff from '@line/liff';

const MOCK_PROFILE = {
  userId: 'dev_user_001',
  displayName: 'คุณแม่ทดสอบ',
  email: 'test@test.com',
};

let _profile = null;
let _initialized = false;

// LIFF ID is public (it appears in the liff.line.me URL). Hardcoded as a fallback
// so production no longer depends on the VITE_LIFF_ID env var being set correctly.
const DEFAULT_LIFF_ID = '2010539604-JK7iSamm';

export async function initLiff() {
  const liffId = import.meta.env.VITE_LIFF_ID || DEFAULT_LIFF_ID;

  if (!liffId || liffId === 'PLACEHOLDER_LIFF_ID') {
    _profile = MOCK_PROFILE;
    _initialized = true;
    return MOCK_PROFILE;
  }

  try {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) {
      liff.login();
      return null;
    }

    // Get userId from whichever source is available — resilient to missing scopes.
    // getProfile() needs the `profile` scope; the ID token needs `openid`.
    let lineProfile = null;
    try { lineProfile = await liff.getProfile(); } catch (e) { console.warn('[liff] getProfile failed:', e?.message); }
    let idToken = null;
    try { idToken = liff.getDecodedIDToken(); } catch { /* openid scope optional */ }

    const userId = lineProfile?.userId || idToken?.sub || null;
    if (!userId) {
      throw new Error('ไม่ได้ userId — เช็ค LIFF scope: profile / openid');
    }

    _profile = {
      userId,
      displayName: lineProfile?.displayName || idToken?.name || '',
      pictureUrl: lineProfile?.pictureUrl || idToken?.picture || null,
      email: idToken?.email ?? null,
    };
    _initialized = true;
    return _profile;
  } catch (err) {
    // In production, re-throw so App.jsx can show onboarding as guest
    // Do NOT fall back to mock profile — that would match existing test users in DB
    console.error('[liff] init error:', err);
    throw err;
  }
}

export async function getLiffProfile() {
  if (_initialized) return _profile;
  return initLiff();
}
