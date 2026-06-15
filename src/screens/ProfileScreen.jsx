import React, { useState } from 'react';
import { Settings, Medal, Baby, MapPin, ShoppingBag, Headphones, ChevronRight } from 'lucide-react';
import { Card, Badge, Avatar, Switch, Button } from '../components/index.jsx';
import { SkyDeco, SectionTitle } from '../shared/index.jsx';

const LINKS = [
  { Icon: Baby,        label: 'ข้อมูลลูกน้อย',      note: 'น้องเปา · 8.5 กก.' },
  { Icon: MapPin,      label: 'ที่อยู่จัดส่ง',       note: '2 ที่อยู่' },
  { Icon: ShoppingBag, label: 'ประวัติการสั่งซื้อ',  note: null },
  { Icon: Headphones,  label: 'ติดต่อเรา',            note: null },
];

export default function ProfileScreen() {
  const [push,  setPush]  = useState(true);
  const [promo, setPromo] = useState(false);

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '24px 20px 52px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name="มิ้นต์ ใจดี" size={62} ring />
          <div style={{ flex: 1 }}>
            <div style={{ font: '800 20px var(--font-display)' }}>คุณแม่ มิ้นต์</div>
            <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>เข้าร่วมคลับ มี.ค. 2024</div>
          </div>
          <Settings width={22} height={22} style={{ opacity: .9 }} />
        </div>
      </div>

      {/* Tier card overlapping hero */}
      <div style={{ padding: '0 16px', marginTop: -34, position: 'relative' }}>
        <Card style={{ boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Medal width={24} height={24} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--weight-bold) 16px var(--font-display)', color: 'var(--text-heading)' }}>สมาชิก Silver</div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>320 แต้ม · อีก 180 แต้มเป็น Gold</div>
          </div>
          <Badge variant="solidGreen">320</Badge>
        </Card>
      </div>

      {/* Links */}
      <div style={{ padding: '18px 16px 0' }}>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {LINKS.map(({ Icon, label, note }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < LINKS.length - 1 ? '1px solid var(--gray-100)' : 'none', cursor: 'pointer' }}>
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
        <Button variant="soft" fullWidth>ออกจากระบบ</Button>
      </div>
    </div>
  );
}
