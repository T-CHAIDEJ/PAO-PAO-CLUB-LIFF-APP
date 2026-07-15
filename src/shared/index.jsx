import React from 'react';
import { X, MoreHorizontal, UserCircle2, Plus } from 'lucide-react';

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

// Small pill button used in every screen's header to jump to Profile.
// Always a plain icon (never the user's photo) — showing their picture
// here duplicated/clashed with the avatar Home's greeting already shows.
export function ProfileButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'rgba(255,255,255,.18)', borderRadius: 999, padding: '5px 12px 5px 5px', cursor: 'pointer', color: '#fff', flex: 'none' }}
    >
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <UserCircle2 width={16} height={16} />
      </span>
      <span style={{ font: 'var(--weight-semibold) 12px var(--font-base)' }}>โปรไฟล์</span>
    </button>
  );
}

// Horizontal row of small avatars — one per child — used in every screen
// that shows child-specific info, so switching which child you're looking
// at works the same way everywhere. Tapping "+" opens the add-child flow;
// tapping an existing avatar again (while active) opens edit.
export function ChildSwitcherBar({ childrenList, activeChildId, onSwitchChild, onAdd, onEditActive }) {
  if (!childrenList) return null;
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '10px 12px', background: 'var(--gradient-hero)', borderRadius: 16 }}>
      {childrenList.map((c) => {
        const active = c.child_id === activeChildId;
        return (
          <button
            key={c.child_id}
            onClick={() => (active ? onEditActive && onEditActive() : onSwitchChild(c.child_id))}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', flex: 'none', padding: 0 }}
          >
            <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.2)', border: active ? '2px solid #fff' : '2px solid transparent' }}>
              {c.avatar_url
                ? <img src={c.avatar_url} alt={c.name || 'ลูก'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 18 }}>{c.is_pregnant ? '🤰' : '👶'}</span>}
            </div>
            <span style={{ font: `${active ? 'var(--weight-semibold)' : 'var(--weight-medium)'} 10px var(--font-base)`, color: '#fff', opacity: active ? 1 : .7, maxWidth: 54, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.name || (c.is_pregnant ? 'ในท้อง' : 'ลูก')}
            </span>
          </button>
        );
      })}
      <button onClick={onAdd} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', flex: 'none', padding: 0 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', border: '2px dashed rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Plus width={18} height={18} />
        </div>
        <span style={{ font: 'var(--weight-medium) 10px var(--font-base)', color: '#fff', opacity: .7 }}>เพิ่มลูก</span>
      </button>
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
