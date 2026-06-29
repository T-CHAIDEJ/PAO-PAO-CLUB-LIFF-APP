import React, { useState, useEffect } from 'react';
import { initLiff } from './lib/liff.js';
import { supabase } from './lib/supabase.js';
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-hero)', gap: 16 }}>
      <span style={{ fontSize: 64 }}>🐣</span>
      <div style={{ font: 'var(--weight-semibold) 16px var(--font-base)', color: 'rgba(255,255,255,0.9)' }}>กำลังโหลด...</div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [lineProfile, setLineProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [childData, setChildData] = useState(null);

  useEffect(() => {
    async function boot() {
      try {
        const profile = await initLiff();
        setLineProfile(profile);
        if (!profile) return;

        const { data: users } = await supabase
          .from('users')
          .select('*')
          .eq('line_user_id', profile.userId)
          .single();

        if (users) {
          setUserData(users);
          if (users.id) {
            const { data: children } = await supabase
              .from('children')
              .select('*')
              .eq('user_id', users.id)
              .order('birthdate', { ascending: false })
              .limit(1)
              .single();
            setChildData(children ?? null);
          }
          setScreen('home');
        } else {
          setScreen('onboarding');
        }
      } catch (err) {
        console.error('[boot]', err);
        setScreen('onboarding');
      }
    }
    boot();
  }, []);

  const handleOnboardingComplete = (data) => {
    setUserData(data);
    setScreen('home');
  };

  const go = (s) => setScreen(s);
  const goOnboarding = (seg) => setScreen(seg ? `onboarding-${seg.toLowerCase()}` : 'onboarding');

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
  if      (screen === 'home')      view = <HomeScreen go={go} user={userData} child={childData} goOnboarding={goOnboarding} goProfile={() => go('profile')} />;
  else if (screen === 'diaper')    view = <DiaperScreen go={go} />;
  else if (screen === 'tracker')   view = <TrackerScreen />;
  else if (screen === 'size')      view = <SizeChartScreen go={go} currentKg={childData?.weight_kg ?? 8.5} />;
  else if (screen === 'knowledge') view = <KnowledgeScreen go={go} />;
  else if (screen === 'rewards')   view = <RewardsScreen go={go} />;
  else if (screen === 'profile')   view = <ProfileScreen go={go} />;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div key={screen} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--surface-page)', scrollbarWidth: 'none' }}>
        {view}
      </div>
      <BottomNav active={navTab} onChange={go} />
    </div>
  );
}
