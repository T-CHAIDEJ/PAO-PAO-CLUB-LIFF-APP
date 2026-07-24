import { useState, useEffect } from 'react';
import { initLiff } from './lib/liff.js';
import { supabase } from './lib/supabase.js';
import { checkinDaily, fetchPointsSnapshot } from './lib/points.js';
import { loadDiaperSizes } from './lib/diaperSize.js';
import { useGrowthByChild } from './lib/useGrowthByChild.js';
import { fetchActiveConsent, isConsentOutdated, acceptConsent } from './lib/consent.js';
import BottomNav from './screens/BottomNav.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import TrackerScreen, { DiaperScreen } from './screens/TrackerScreen.jsx';
import SizeChartScreen from './screens/SizeChartScreen.jsx';
import KnowledgeScreen from './screens/KnowledgeScreen.jsx';
import RewardsScreen from './screens/RewardsScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import OnboardingScreen from './screens/OnboardingScreen.jsx';
import { ConsentUpdateModal } from './screens/ConsentUpdateModal.jsx';

const ACTIVE_CHILD_KEY = 'pp_active_child_id';

// Prefers whichever child was last viewed (persisted across sessions);
// falls back to the most recently added one if that child no longer
// exists in the list (e.g. viewed on another device).
function pickDefaultChildId(list) {
  if (!list.length) return null;
  let saved = null;
  try { saved = localStorage.getItem(ACTIVE_CHILD_KEY); } catch { /* ignore */ }
  if (saved && list.some(c => c.child_id === saved)) return saved;
  return list[0].child_id;
}

function LoadingScreen() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-hero)', gap: 8 }}>
      <img src="/paopao-logo.png" alt="PAO PAO CLUB" style={{ width: 200, height: 200, objectFit: 'contain' }} />
      <div style={{ font: 'var(--weight-semibold) 15px var(--font-base)', color: 'rgba(255,255,255,0.85)' }}>กำลังโหลด...</div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [trackerAutoOpenAdd, setTrackerAutoOpenAdd] = useState(false);
  const [lineProfile, setLineProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [childrenList, setChildrenList] = useState([]);
  const [activeChildId, setActiveChildIdState] = useState(null);
  const [checkin, setCheckin] = useState(null);
  const [activeConsent, setActiveConsent] = useState(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentError, setConsentError] = useState(null);

  const applyChildren = (list) => {
    setChildrenList(list);
    setActiveChildIdState((prev) => (list.some(c => c.child_id === prev) ? prev : pickDefaultChildId(list)));
  };

  useEffect(() => {
    async function lookupAndGo(userId, profile) {
      const { data: users } = await supabase
        .from('001_users').select('*').eq('line_uid', userId).single();
      if (users) {
        let merged = users;

        const consent = await fetchActiveConsent();
        setActiveConsent(consent);
        const outdated = isConsentOutdated(users, consent);
        setNeedsConsent(outdated);

        // Daily-login points are a "sanctioned" write like any other —
        // skip awarding more until the member re-accepts the newer policy.
        // Still load their existing balance read-only though — "outdated
        // consent" means can't earn/edit, not that their own data vanishes.
        if (!outdated) {
          try {
            const chk = await checkinDaily(users.line_uid);
            if (chk && chk.points != null) merged = { ...users, points: chk.points, login_streak: chk.streak ?? users.login_streak };
            if (chk && chk.awarded != null) setCheckin(chk);
          } catch { /* points are optional — never block boot */ }
        } else {
          try {
            const snap = await fetchPointsSnapshot(users.line_uid);
            if (snap) merged = { ...users, points: snap.points, login_streak: snap.streak };
          } catch { /* points are optional — never block boot */ }
        }

        // Backfill LINE display name / picture for existing users (once profile scope is granted)
        try {
          if (profile && (profile.displayName || profile.pictureUrl)) {
            const patch = {};
            if (profile.displayName) patch.display_name = profile.displayName;
            if (profile.pictureUrl) patch.picture_url = profile.pictureUrl;
            if (Object.keys(patch).length) {
              await supabase.from('001_users').update(patch).eq('line_uid', users.line_uid);
              merged = { ...merged, ...patch };
            }
          }
        } catch { /* non-critical */ }
        setUserData(merged);
        const { data: children } = await supabase
          .from('003_children').select('*').eq('line_uid', users.line_uid)
          .order('created_at', { ascending: false });
        applyChildren(children ?? []);
        setScreen('home');
      } else {
        setScreen('onboarding');
      }
    }

    async function boot() {
      // Try LIFF first
      try {
        const profile = await initLiff();
        setLineProfile(profile);
        if (!profile) { return; } // redirecting to LINE login
        localStorage.setItem('pp_line_uid', profile.userId);
        await lookupAndGo(profile.userId, profile);
        return;
      } catch (err) {
        console.warn('[boot] LIFF failed, trying localStorage fallback:', err.message);
      }

      // LIFF failed — check localStorage for a previously saved userId
      const cachedUid = localStorage.getItem('pp_line_uid');
      if (cachedUid && cachedUid !== 'dev_user_001') {
        try {
          await lookupAndGo(cachedUid, null);
          return;
        } catch (err) {
          console.warn('[boot] localStorage lookup failed:', err.message);
        }
      }

      setScreen('onboarding');
    }
    boot();
    loadDiaperSizes(); // fire-and-forget — recommendSize() falls back until this resolves
  }, []);

  const handleOnboardingComplete = async (data) => {
    let merged = data;
    try {
      if (data?.line_uid) {
        const chk = await checkinDaily(data.line_uid);
        if (chk && chk.points != null) merged = { ...data, points: chk.points, login_streak: chk.streak ?? data.login_streak };
        if (chk && chk.awarded != null) setCheckin(chk);
      }
    } catch { /* points are optional */ }
    setUserData(merged);

    // Load the child(ren) onboarding just created so Home shows them immediately
    if (data?.line_uid) {
      try {
        const { data: children } = await supabase
          .from('003_children').select('*').eq('line_uid', data.line_uid)
          .order('created_at', { ascending: false });
        applyChildren(children ?? []);
      } catch { /* segment C has no child */ }
    }

    setScreen('home');
  };

  const go = (s, opts) => {
    setScreen(s);
    if (opts?.openAddRecord) setTrackerAutoOpenAdd(true);
  };
  const goOnboarding = (seg) => setScreen(seg ? `onboarding-${seg.toLowerCase()}` : 'onboarding');

  const switchActiveChild = (childId) => {
    setActiveChildIdState(childId);
    try { localStorage.setItem(ACTIVE_CHILD_KEY, childId); } catch { /* ignore */ }
  };

  const refetchChildren = async () => {
    if (!userData?.line_uid) return;
    const { data } = await supabase
      .from('003_children').select('*').eq('line_uid', userData.line_uid)
      .order('created_at', { ascending: false });
    applyChildren(data ?? []);
  };

  const handleReconsent = async () => {
    if (!userData?.line_uid || !activeConsent) return;
    setConsentSaving(true); setConsentError(null);
    try {
      const patch = await acceptConsent(userData.line_uid, activeConsent.consent_version);
      setUserData(prev => ({ ...prev, ...patch }));
      setNeedsConsent(false);
      setShowConsentModal(false);
      // They were blocked from earning today's points while outdated —
      // catch that up immediately now instead of making them reopen the app.
      try {
        const chk = await checkinDaily(userData.line_uid);
        if (chk && chk.points != null) setUserData(prev => ({ ...prev, points: chk.points, login_streak: chk.streak ?? prev.login_streak }));
        if (chk && chk.awarded != null) setCheckin(chk);
      } catch { /* points are optional */ }
    } catch (e) {
      console.error('[consent] reconsent failed:', e);
      setConsentError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setConsentSaving(false);
    }
  };

  // patch applies to the active child unless a specific childId is given
  // (e.g. editing a child that isn't currently selected).
  const onChildUpdate = (patch, childId) => {
    const targetId = childId ?? activeChildId;
    setChildrenList(prev => prev.map(c => c.child_id === targetId ? { ...c, ...patch } : c));
  };
  const onUserUpdate = (patch) => setUserData(prev => prev ? { ...prev, ...patch } : prev);

  const childData = childrenList.find(c => c.child_id === activeChildId) ?? null;
  const growthByChild = useGrowthByChild(childrenList);
  const childSwitcherProps = { childrenList, activeChildId, onSwitchChild: switchActiveChild, onChildrenChange: refetchChildren, growthByChild };
  const consentGateProps = { needsConsent, onOpenConsent: () => setShowConsentModal(true) };

  if (screen === 'loading') return <LoadingScreen />;

  if (screen === 'onboarding') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <OnboardingScreen lineProfile={lineProfile} initialSegment={null} onComplete={handleOnboardingComplete} />
      </div>
    );
  }
  if (screen === 'onboarding-a') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <OnboardingScreen lineProfile={lineProfile} initialSegment="A" onComplete={handleOnboardingComplete} />
      </div>
    );
  }
  if (screen === 'onboarding-b') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <OnboardingScreen lineProfile={lineProfile} initialSegment="B" onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const navTab = screen === 'size' ? 'diaper' : screen === 'profile' ? 'home' : screen;

  let view;
  if      (screen === 'home')      view = <HomeScreen go={go} user={userData} child={childData} goOnboarding={goOnboarding} goProfile={() => go('profile')} checkin={checkin} onStreakSeen={() => setCheckin(null)} {...childSwitcherProps} {...consentGateProps} />;
  else if (screen === 'diaper')    view = <DiaperScreen go={go} child={childData} onChildUpdate={onChildUpdate} {...childSwitcherProps} {...consentGateProps} />;
  else if (screen === 'tracker')   view = <TrackerScreen go={go} child={childData} onChildUpdate={onChildUpdate} autoOpenAdd={trackerAutoOpenAdd} onAutoOpenAddConsumed={() => setTrackerAutoOpenAdd(false)} {...childSwitcherProps} {...consentGateProps} />;
  else if (screen === 'size')      view = <SizeChartScreen go={go} currentKg={growthByChild[activeChildId]?.weight_kg ?? childData?.birth_weight ?? 8.5} />;
  else if (screen === 'knowledge') view = <KnowledgeScreen go={go} child={childData} />;
  else if (screen === 'rewards')   view = <RewardsScreen go={go} user={userData} onUserUpdate={onUserUpdate} currentKg={growthByChild[activeChildId]?.weight_kg ?? childData?.birth_weight ?? null} {...consentGateProps} />;
  else if (screen === 'profile')   view = <ProfileScreen go={go} user={userData} child={childData} childrenList={childrenList} onSwitchChild={switchActiveChild} onUserUpdate={onUserUpdate} />;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div key={screen} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--surface-page)', scrollbarWidth: 'none' }}>
        {view}
      </div>
      <BottomNav active={navTab} onChange={go} />
      {showConsentModal && (
        <ConsentUpdateModal
          activeConsent={activeConsent}
          saving={consentSaving}
          error={consentError}
          onAccept={handleReconsent}
          onClose={() => { setShowConsentModal(false); setConsentError(null); }}
        />
      )}
    </div>
  );
}
