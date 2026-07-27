import { Home, Baby, Activity, BookOpen, Gift } from 'lucide-react';

const TABS = [
  { id: 'home',      label: 'หน้าแรก',   Icon: Home },
  { id: 'diaper',    label: 'ผ้าอ้อม',   Icon: Baby },
  { id: 'tracker',   label: 'พัฒนาการ',  Icon: Activity },
  { id: 'knowledge', label: 'ความรู้',    Icon: BookOpen },
  { id: 'rewards',   label: 'รางวัล',    Icon: Gift },
];

export default function BottomNav({ active, onChange }) {
  return (
    <div style={{ display: 'flex', background: '#fff', borderTop: '1px solid var(--gray-100)', padding: '8px 6px', flex: 'none', boxShadow: '0 -4px 18px rgba(27,94,140,0.05)' }}>
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{ flex: 1, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 30, borderRadius: 999, background: on ? 'var(--surface-soft)' : 'transparent', color: on ? 'var(--color-primary)' : 'var(--gray-400)', transition: 'background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)' }}>
              <Icon width={21} height={21} />
            </span>
            <span style={{ font: `${on ? 'var(--weight-semibold)' : 'var(--weight-medium)'} 10px var(--font-base)`, color: on ? 'var(--color-primary-strong)' : 'var(--gray-400)' }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
