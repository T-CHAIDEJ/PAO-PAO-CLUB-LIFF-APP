import { useState } from 'react';
import { Medal, MapPin, Headphones, ChevronRight } from 'lucide-react';
import { Card, Badge, Avatar, Button } from '../components/index.jsx';
import { SkyDeco, SectionTitle, ComingSoon, HERO_BG } from '../shared/index.jsx';
import { calcAge } from '../lib/age.js';
import { AddressModal, hasShippingInfo } from './AddressModal.jsx';

export default function ProfileScreen({ go, user, child, childrenList, onSwitchChild, onUserUpdate }) {
  const [showAddress, setShowAddress] = useState(false);
  const [comingSoon, setComingSoon] = useState(null);

  const name = user?.parent_name || user?.display_name || 'คุณแม่';
  const points = user?.points ?? 0;
  // `role` on 001_users is guest/member/staff/admin, not our pregnancy/newborn
  // segment — that lives on children.is_pregnant instead.
  const segLabel = user?.role === 'guest'
    ? 'สมาชิกทั่วไป'
    : child?.is_pregnant
      ? 'คุณแม่ตั้งครรภ์'
      : child
        ? 'คุณแม่มือใหม่'
        : 'สมาชิก';

  const goToChild = (childId) => {
    if (onSwitchChild) onSwitchChild(childId);
    if (go) go('tracker');
  };

  // "ประวัติการสั่งซื้อ" removed for now — no central order system exists
  // yet to back it. "ติดต่อเรา" stays visible but as coming-soon until the
  // contact page + its DB wiring get built.
  const LINKS = [
    { Icon: MapPin,     label: 'ที่อยู่จัดส่ง', note: hasShippingInfo(user) ? user.province : 'ยังไม่ได้ระบุ', onClick: () => setShowAddress(true) },
    { Icon: Headphones, label: 'ติดต่อเรา',      note: null, onClick: () => setComingSoon('ติดต่อเรา') },
  ];

  const handleLogout = () => {
    try { localStorage.removeItem('pp_line_uid'); } catch { /* ignore */ }
    window.location.reload();
  };

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ ...HERO_BG, position: 'relative', padding: '24px 20px 52px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          {user?.picture_url
            ? <img src={user.picture_url} alt={name} style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.6)', flex: 'none' }} />
            : <Avatar name={name} size={62} ring />}
          <div style={{ flex: 1 }}>
            <div style={{ font: '800 20px var(--font-display)' }}>{name}</div>
            <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>{segLabel}</div>
          </div>
        </div>
      </div>

      {/* Points balance card overlapping hero — no Tier, just a running balance */}
      <div style={{ padding: '0 16px', marginTop: -34, position: 'relative' }}>
        <Card style={{ boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Medal width={24} height={24} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--weight-bold) 16px var(--font-display)', color: 'var(--text-heading)' }}>แต้มสะสมของฉัน</div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>สะสมไว้แลกของรางวัลได้เลย</div>
          </div>
          <Badge variant="solidGreen">{points}</Badge>
        </Card>
      </div>

      {/* Children */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionTitle>ข้อมูลลูกน้อย</SectionTitle>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {(childrenList ?? []).map((c, i, arr) => (
            <div key={c.child_id} onClick={() => goToChild(c.child_id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--gray-100)' : 'none', cursor: 'pointer' }}>
              <span style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                {c.avatar_url
                  ? <img src={c.avatar_url} alt={c.name || 'ลูก'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 18 }}>{c.is_pregnant ? '🤰' : '👶'}</span>}
              </span>
              <span style={{ flex: 1, font: 'var(--weight-medium) 15px var(--font-base)', color: 'var(--text-body)' }}>{c.name || (c.is_pregnant ? 'ลูกน้อยในท้อง' : 'ลูกน้อย')}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{c.is_pregnant ? 'ตั้งครรภ์' : calcAge(c.birth_date)}</span>
              <ChevronRight width={19} height={19} style={{ color: 'var(--text-faint)' }} />
            </div>
          ))}
          {(!childrenList || childrenList.length === 0) && (
            <div style={{ padding: '14px 16px', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>ยังไม่ได้เพิ่มข้อมูลลูก</div>
          )}
        </Card>
      </div>

      {/* Links */}
      <div style={{ padding: '18px 16px 0' }}>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {LINKS.map(({ Icon, label, note, onClick }, i) => (
            <div key={i} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < LINKS.length - 1 ? '1px solid var(--gray-100)' : 'none', cursor: 'pointer' }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-soft)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon width={19} height={19} />
              </span>
              <span style={{ flex: 1, font: 'var(--weight-medium) 15px var(--font-base)', color: 'var(--text-body)' }}>{label}</span>
              {note && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{note}</span>}
              <ChevronRight width={19} height={19} style={{ color: 'var(--text-faint)' }} />
            </div>
          ))}
        </Card>
      </div>

      {/* Notification settings — coming soon (the old toggles were pure
          local state that persisted nowhere, worse than saying so honestly) */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionTitle>การแจ้งเตือน</SectionTitle>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, flex: 'none' }}>🚧</span>
          <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            ตั้งค่าการแจ้งเตือน (เตือนเปลี่ยนผ้าอ้อม, ข่าวสาร & โปรโมชั่น) กำลังพัฒนา เร็วๆ นี้
          </div>
        </Card>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <Button variant="soft" fullWidth onClick={handleLogout}>ออกจากระบบ</Button>
      </div>

      {showAddress && (
        <AddressModal
          user={user}
          onClose={() => setShowAddress(false)}
          onSaved={(patch) => { onUserUpdate && onUserUpdate(patch); setShowAddress(false); }}
        />
      )}
      {comingSoon && <ComingSoon title={comingSoon} onClose={() => setComingSoon(null)} />}
    </div>
  );
}
