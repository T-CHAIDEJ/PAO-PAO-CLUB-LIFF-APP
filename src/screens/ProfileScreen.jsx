import React, { useState } from 'react';
import { Settings, Medal, MapPin, ShoppingBag, Headphones, ChevronRight } from 'lucide-react';
import { Card, Badge, Avatar, Switch, Button } from '../components/index.jsx';
import { SkyDeco, SectionTitle } from '../shared/index.jsx';

function calcAge(birthdate) {
  if (!birthdate) return null;
  const ms = Date.now() - new Date(birthdate).getTime();
  const totalMonths = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.4375));
  if (totalMonths < 1) return 'แรกเกิด';
  const years = Math.floor(totalMonths / 12), months = totalMonths % 12;
  if (years === 0) return `${months} เดือน`;
  return months === 0 ? `${years} ปี` : `${years} ปี ${months} เดือน`;
}

export default function ProfileScreen({ go, user, child, childrenList, onSwitchChild }) {
  const [push,  setPush]  = useState(true);
  const [promo, setPromo] = useState(false);

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

  const LINKS = [
    { Icon: MapPin,      label: 'ที่อยู่จัดส่ง',       note: null },
    { Icon: ShoppingBag, label: 'ประวัติการสั่งซื้อ',  note: null },
    { Icon: Headphones,  label: 'ติดต่อเรา',            note: null },
  ];

  const handleLogout = () => {
    try { localStorage.removeItem('pp_line_uid'); } catch (e) { /* ignore */ }
    window.location.reload();
  };

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '24px 20px 52px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          {user?.picture_url
            ? <img src={user.picture_url} alt={name} style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.6)', flex: 'none' }} />
            : <Avatar name={name} size={62} ring />}
          <div style={{ flex: 1 }}>
            <div style={{ font: '800 20px var(--font-display)' }}>{name}</div>
            <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>{segLabel}</div>
          </div>
          <Settings width={22} height={22} style={{ opacity: .9 }} />
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

      {/* Notification settings */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionTitle>การแจ้งเตือน</SectionTitle>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ flex: 1, font: 'var(--weight-medium) 15px var(--font-base)', color: 'var(--text-body)' }}>เตือนเปลี่ยนผ้าอ้อม</span>
            <Switch checked={push} onChange={setPush} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <span style={{ flex: 1, font: 'var(--weight-medium) 15px var(--font-base)', color: 'var(--text-body)' }}>ข่าวสาร & โปรโมชั่น</span>
            <Switch checked={promo} onChange={setPromo} />
          </div>
        </Card>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <Button variant="soft" fullWidth onClick={handleLogout}>ออกจากระบบ</Button>
      </div>
    </div>
  );
}
