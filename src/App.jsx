import React, { useState, useEffect } from 'react';
import { initLiff } from './lib/liff.js';
import { supabase } from './lib/supabase.js';
import { checkinDaily } from './lib/points.js';
import BottomNav from './screens/BottomNav.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import TrackerScreen, { DiaperScreen } from './screens/TrackerScreen.jsx';
import SizeChartScreen from './screens/SizeChartScreen.jsx';
import KnowledgeScreen from './screens/KnowledgeScreen.jsx';
import RewardsScreen from './screens/RewardsScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import OnboardingScreen from './screens/OnboardingScreen.jsx';

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
  const [lineProfile, setLineProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [childData, setChildData] = useState(null);
  const [checkin, setCheckin] = useState(null);
  const [liffMsg, setLiffMsg] = useState('');

  useEffect(() => {
    async function lookupAndGo(userId, profile) {
      const { data: users } = await supabase
        .from('001_users').select('*').eq('line_uid', userId).single();
      if (users) {
        let merged = users;
        try {
          const chk = await checkinDaily(users.line_uid);
          if (chk && chk.points != null) merged = { ...users, points: chk.points, login_streak: chk.streak ?? users.login_streak };
          if (chk && chk.awarded != null) setCheckin(chk);
        } catch (e) { /* points are optional — never block boot */ }

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
        } catch (e) { /* non-critical */ }
        setUserData(merged);
        const { data: children } = await supabase
          .from('003_children').select('*').eq('line_uid', users.line_uid)
          .order('birth_date', { ascending: false }).limit(1).single();
        setChildData(children ?? null);
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
        setLiffMsg('LIFF ล้มเหลว ✗ ' + (err?.message || String(err)));
        console.warn('[boot] LIFF failed, trying localStorage fallback:', err.message);
      }

      // LIFF failed — check localStorage for a previously saved userId
      const cachedUid = localStorage.getItem('pp_line_uid');
      if (cachedUid && cachedUid !== 'dev_user_001') {
        setLiffMsg((m) => m + ' | ใช้ cache: ' + cachedUid);
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
  }, []);

  const handleOnboardingComplete = async (data) => {
    let merged = data;
    try {
      if (data?.line_uid) {
        const chk = await checkinDaily(data.line_uid);
        if (chk && chk.points != null) merged = { ...data, points: chk.points, login_streak: chk.streak ?? data.login_streak };
        if (chk && chk.awarded != null) setCheckin(chk);
      }
    } catch (e) { /* points are optional */ }
    setUserData(merged);

    // Load the child that onboarding just created so Home shows it immediately
    if (data?.line_uid) {
      try {
        const { data: children } = await supabase
          .from('003_children').select('*').eq('line_uid', data.line_uid)
          .order('birth_date', { ascending: false }).limit(1).single();
        setChildData(children ?? null);
      } catch (e) { /* segment C has no child */ }
    }

    setScreen('home');
  };

  const go = (s) => setScreen(s);
  const goOnboarding = (seg) => setScreen(seg ? `onboarding-${seg.toLowerCase()}` : 'onboarding');

  // TEMP debug bar — shows LIFF status on-device (remove after LIFF confirmed working)
  const DebugBar = liffMsg ? (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,.82)', color: '#4ade80', font: '11px/1.4 monospace', padding: '5px 9px', wordBreak: 'break-all' }}>
      {liffMsg}
    </div>
  ) : null;

  if (screen === 'loading') return <><LoadingScreen />{DebugBar}</>;

  if (screen === 'onboarding') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <OnboardingScreen lineProfile={lineProfile} initialSegment={null} onComplete={handleOnboardingComplete} />
        {DebugBar}
      </div>
    );
  }
  if (screen === 'onboarding-a') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <OnboardingScreen lineProfile={lineProfile} initialSegment="A" onComplete={handleOnboardingComplete} />
        {DebugBar}
      </div>
    );
  }
  if (screen === 'onboarding-b') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <OnboardingScreen lineProfile={lineProfile} initialSegment="B" onComplete={handleOnboardingComplete} />
        {DebugBar}
      </div>
    );
  }

  const navTab = screen === 'size' ? 'diaper' : screen === 'profile' ? 'home' : screen;

  let view;
  if      (screen === 'home')      view = <HomeScreen go={go} user={userData} child={childData} goOnboarding={goOnboarding} goProfile={() => go('profile')} checkin={checkin} onStreakSeen={() => setCheckin(null)} />;
  else if (screen === 'diaper')    view = <DiaperScreen go={go} child={childData} />;
  else if (screen === 'tracker')   view = <TrackerScreen child={childData} />;
  else if (screen === 'size')      view = <SizeChartScreen go={go} currentKg={childData?.birth_weight ?? 8.5} />;
  else if (screen === 'knowledge') view = <KnowledgeScreen go={go} />;
  else if (screen === 'rewards')   view = <RewardsScreen go={go} user={userData} />;
  else if (screen === 'profile')   view = <ProfileScreen go={go} user={userData} child={childData} />;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div key={screen} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--surface-page)', scrollbarWidth: 'none' }}>
        {view}
      </div>
      <BottomNav active={navTab} onChange={go} />
      {DebugBar}
    </div>
  );
}
