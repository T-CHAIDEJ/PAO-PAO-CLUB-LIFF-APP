import liff from '@line/liff';

const MOCK_PROFILE = {
  userId: 'dev_user_001',
  displayName: 'คุณแม่ทดสอบ',
  email: 'test@test.com',
};

let _profile = null;
let _initialized = false;

export async function initLiff() {
  const liffId = import.meta.env.VITE_LIFF_ID;

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
    const lineProfile = await liff.getProfile();
    _profile = {
      userId: lineProfile.userId,
      displayName: lineProfile.displayName,
      email: liff.getDecodedIDToken()?.email ?? null,
    };
    _initialized = true;
    return _profile;
  } catch (err) {
    console.warn('[liff] init error, using mock profile:', err);
    _profile = MOCK_PROFILE;
    _initialized = true;
    return MOCK_PROFILE;
  }
}

export async function getLiffProfile() {
  if (_initialized) return _profile;
  return initLiff();
}
