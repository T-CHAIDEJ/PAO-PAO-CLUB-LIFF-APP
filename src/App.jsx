import React, { useState } from 'react';
import { Signal, Wifi, BatteryFull } from 'lucide-react';
import { LineChrome } from './shared/index.jsx';
import BottomNav from './screens/BottomNav.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import TrackerScreen from './screens/TrackerScreen.jsx';
import SizeChartScreen from './screens/SizeChartScreen.jsx';
import KnowledgeScreen from './screens/KnowledgeScreen.jsx';
import RewardsScreen from './screens/RewardsScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';

const TITLES = {
  home:      'PAO PAO Club',
  tracker:   'พัฒนาการ',
  size:      'ตารางไซส์',
  knowledge: 'ความรู้',
  rewards:   'ของรางวัล',
  profile:   'โปรไฟล์',
};

function StatusBar() {
  return (
    <div style={{ height: 30, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flex: 'none', font: '600 12px var(--font-base)', color: 'var(--gray-700)' }}>
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Signal width={15} height={15} />
        <Wifi width={15} height={15} />
        <BatteryFull width={18} height={18} />
      </span>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const navTab = screen === 'size' ? 'tracker' : screen;
  const go = (s) => setScreen(s);

  let view;
  if      (screen === 'home')      view = <HomeScreen go={go} />;
  else if (screen === 'tracker')   view = <TrackerScreen go={go} />;
  else if (screen === 'size')      view = <SizeChartScreen go={go} currentKg={8.5} />;
  else if (screen === 'knowledge') view = <KnowledgeScreen go={go} />;
  else if (screen === 'rewards')   view = <RewardsScreen go={go} />;
  else if (screen === 'profile')   view = <ProfileScreen go={go} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#E9EEF2' }}>
      <div style={{ width: 390, height: 820, background: '#fff', borderRadius: 44, boxShadow: '0 30px 80px rgba(12,68,124,0.28)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', border: '9px solid #0E1B27' }}>
        <StatusBar />
        <LineChrome title={TITLES[screen]} />
        <div key={screen} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--surface-page)', scrollbarWidth: 'none' }}>
          {view}
        </div>
        <BottomNav active={navTab} onChange={go} />
      </div>
    </div>
  );
}
