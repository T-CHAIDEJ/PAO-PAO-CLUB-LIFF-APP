import React from 'react';
import { Baby, Ruler, Gift, ScanLine, Bell, ChevronRight, Star, Package, TicketPercent } from 'lucide-react';
import { Card, Badge, Button, ProgressBar } from '../components/index.jsx';
import { SkyDeco, Wordmark, SectionTitle } from '../shared/index.jsx';

const ACTIONS = [
  { id: 'tracker', Icon: Baby,      label: 'ติดตามผ้าอ้อม', tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
  { id: 'size',    Icon: Ruler,     label: 'ตารางไซส์',     tone: 'var(--green-100)', fg: 'var(--green-700)' },
  { id: 'rewards', Icon: Gift,      label: 'แลกของรางวัล',  tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
  { id: 'scan',    Icon: ScanLine,  label: 'สแกนรับแต้ม',  tone: 'var(--green-100)', fg: 'var(--green-700)' },
];

const FEATURED = [
  { name: 'ส่วนลด 50 บาท',          pts: 200, Icon: TicketPercent, tag: 'ยอดนิยม' },
  { name: 'ผ้าอ้อม Size M ฟรี 1 แพ็ค', pts: 800, Icon: Package,       tag: null },
  { name: 'ผ้าเปียกเปา เปา',          pts: 350, Icon: TicketPercent, tag: 'ใหม่!' },
];

export default function HomeScreen({ go }) {
  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%' }}>
      {/* Hero */}
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '18px 20px 58px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark dark scale={1} />
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell width={20} height={20} />
          </span>
        </div>
        <div style={{ position: 'relative', marginTop: 18 }}>
          <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', opacity: .9 }}>สวัสดีค่ะ คุณแม่ 👶</div>
          <div style={{ font: '800 24px var(--font-display)', marginTop: 2 }}>น้องเปา · 8.5 กก.</div>
        </div>
      </div>

      {/* Points card overlapping hero */}
      <div style={{ padding: '0 16px', marginTop: -42, position: 'relative' }}>
        <Card style={{ boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>แต้มสะสม PAO PAO Club</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                <span style={{ font: '800 30px var(--font-display)', color: 'var(--text-heading)' }}>320</span>
                <span style={{ font: 'var(--weight-semibold) 14px var(--font-base)', color: 'var(--text-muted)' }}>แต้ม</span>
              </div>
            </div>
            <Badge variant="solidGreen">สมาชิก Silver</Badge>
          </div>
          <div style={{ marginTop: 14 }}>
            <ProgressBar value={320} max={500} tone="green" />
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 6 }}>อีก 180 แต้ม เลื่อนขั้นเป็น Gold</div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {ACTIONS.map(({ id, Icon, label, tone, fg }) => (
            <button key={id} onClick={() => go(id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: 0 }}>
              <span style={{ width: 56, height: 56, borderRadius: 18, background: tone, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <Icon width={24} height={24} />
              </span>
              <span style={{ font: 'var(--weight-medium) 11px var(--font-base)', color: 'var(--text-body)', textAlign: 'center', lineHeight: 1.25 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended size */}
      <div style={{ padding: '22px 16px 0' }}>
        <Card tone="soft" interactive onClick={() => go('tracker')} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--color-secondary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Baby width={26} height={26} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>ไซส์ที่แนะนำสำหรับน้องเปา</div>
            <div style={{ font: 'var(--weight-bold) 18px var(--font-display)', color: 'var(--text-heading)' }}>Size L · 9–14 กก.</div>
          </div>
          <ChevronRight width={22} height={22} style={{ color: 'var(--text-faint)' }} />
        </Card>
      </div>

      {/* Promo banner */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, background: 'var(--gradient-green)', padding: '18px 20px', color: '#fff' }}>
          <div style={{ position: 'relative', maxWidth: '72%' }}>
            <div style={{ font: '800 18px var(--font-display)' }}>ซื้อ 2 แถม 1</div>
            <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .95, marginTop: 2 }}>เฉพาะสมาชิกคลับ เดือนนี้เท่านั้น</div>
            <div style={{ marginTop: 12 }}>
              <Button variant="white" size="sm">ดูโปรโมชั่น</Button>
            </div>
          </div>
          <span style={{ position: 'absolute', right: -6, bottom: -10, fontSize: 76, opacity: .25 }}>🎁</span>
        </div>
      </div>

      {/* Featured rewards */}
      <div style={{ padding: '22px 0 0' }}>
        <div style={{ padding: '0 16px' }}>
          <SectionTitle action="ดูทั้งหมด" onAction={() => go('rewards')}>ของรางวัลแนะนำ</SectionTitle>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
          {FEATURED.map((r, i) => (
            <Card key={i} padded={false} style={{ width: 150, flex: 'none', overflow: 'hidden' }}>
              <div style={{ height: 90, background: i % 2 ? 'var(--surface-green)' : 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <r.Icon width={34} height={34} style={{ color: i % 2 ? 'var(--green-600)' : 'var(--blue-500)' }} />
                {r.tag && <span style={{ position: 'absolute', top: 8, left: 8 }}><Badge variant={r.tag === 'ใหม่!' ? 'accent' : 'solidBlue'} size="sm">{r.tag}</Badge></span>}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-body)', lineHeight: 1.3, minHeight: 34 }}>{r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, color: 'var(--color-secondary)' }}>
                  <Star width={15} height={15} fill="var(--color-secondary)" />
                  <span style={{ font: 'var(--weight-bold) 14px var(--font-base)', color: 'var(--text-title)' }}>{r.pts}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>แต้ม</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}
