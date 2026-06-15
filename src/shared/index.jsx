import React from 'react';
import { X, MoreHorizontal } from 'lucide-react';

export function SkyDeco() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', color: '#fff' }}>
      <span style={{ position: 'absolute', top: 14, left: 22, fontSize: 34, opacity: .22 }}>☁</span>
      <span style={{ position: 'absolute', top: 60, right: 30, fontSize: 22, opacity: .16 }}>☁</span>
      <span style={{ position: 'absolute', top: 30, right: 96, fontSize: 14, opacity: .4 }}>✦</span>
      <span style={{ position: 'absolute', top: 78, left: 120, fontSize: 11, opacity: .35 }}>✦</span>
      <span style={{ position: 'absolute', top: 100, left: 40, fontSize: 9, opacity: .3 }}>✦</span>
    </div>
  );
}

export function Wordmark({ scale = 1, dark = false }) {
  return (
    <div style={{ background: dark ? 'transparent' : '#fff', borderRadius: 999, padding: dark ? 0 : `${6 * scale}px ${16 * scale}px`, boxShadow: dark ? 'none' : 'var(--shadow-sm)', textAlign: 'center', lineHeight: .9, display: 'inline-block' }}>
      <div style={{ font: `800 ${20 * scale}px var(--font-display)`, color: dark ? '#fff' : 'var(--blue-500)', letterSpacing: '.01em' }}>PAO PAO</div>
      <div style={{ font: `700 ${11 * scale}px var(--font-thai)`, color: dark ? 'rgba(255,255,255,.85)' : 'var(--blue-700)' }}>เปา เปา คลับ</div>
    </div>
  );
}

export function LineChrome({ title }) {
  return (
    <div style={{ height: 44, background: '#fff', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flex: 'none' }}>
      <span style={{ position: 'absolute', left: 14, color: 'var(--gray-500)', display: 'flex' }}>
        <X width={22} height={22} />
      </span>
      <span style={{ font: 'var(--weight-semibold) 15px var(--font-base)', color: 'var(--gray-700)' }}>{title}</span>
      <span style={{ position: 'absolute', right: 14, color: 'var(--gray-500)', display: 'flex' }}>
        <MoreHorizontal width={22} height={22} />
      </span>
    </div>
  );
}

export function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px' }}>
      <h3 style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)', margin: 0 }}>{children}</h3>
      {action && <button onClick={onAction} style={{ border: 'none', background: 'transparent', font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-link)', cursor: 'pointer' }}>{action}</button>}
    </div>
  );
}
