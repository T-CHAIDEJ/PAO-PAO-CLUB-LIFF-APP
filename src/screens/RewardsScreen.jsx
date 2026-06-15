import React, { useState } from 'react';
import { Star, Medal, TicketPercent, Package, Gift, Plus } from 'lucide-react';
import { Card, Badge, Button, Tabs } from '../components/index.jsx';
import { SkyDeco } from '../shared/index.jsx';

const CATALOG = [
  { name: 'ส่วนลด 50 บาท',         pts: 200, Icon: TicketPercent, tag: 'ยอดนิยม' },
  { name: 'ส่วนลด 100 บาท',        pts: 400, Icon: TicketPercent, tag: null },
  { name: 'ผ้าเปียกเปา เปา 1 ห่อ',  pts: 350, Icon: Package,       tag: 'ใหม่!' },
  { name: 'ผ้าอ้อม Size M ฟรี 1 แพ็ค', pts: 800, Icon: Gift,    tag: null },
];

const HISTORY = [
  { name: 'แลกส่วนลด 50 บาท', pts: -200, when: '12 มิ.ย.' },
  { name: 'ซื้อครบ 500 บาท',  pts: +50,  when: '8 มิ.ย.' },
  { name: 'สแกนโค้ดในแพ็ค',   pts: +20,  when: '5 มิ.ย.' },
  { name: 'เช็คอินรายวัน',    pts: +5,   when: '5 มิ.ย.' },
];

const TAB_ITEMS = [
  { label: 'แลกของรางวัล', value: 'catalog' },
  { label: 'ประวัติแต้ม',   value: 'history' },
];

const POINTS = 320;

export default function RewardsScreen() {
  const [tab, setTab] = useState('catalog');

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '20px 20px 30px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>แต้มสะสมของคุณ</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <Star width={26} height={26} fill="#fff" />
            <span style={{ font: '800 42px var(--font-display)' }}>{POINTS}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'rgba(255,255,255,.18)', padding: '4px 12px', borderRadius: 999 }}>
            <Medal width={15} height={15} />
            <span style={{ font: 'var(--weight-semibold) 12px var(--font-base)' }}>สมาชิก Silver</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <Tabs value={tab} onChange={setTab} items={TAB_ITEMS} />
      </div>

      {tab === 'catalog' ? (
        <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {CATALOG.map((r, i) => {
            const can = POINTS >= r.pts;
            return (
              <Card key={i} padded={false} style={{ overflow: 'hidden' }}>
                <div style={{ height: 84, background: i % 2 ? 'var(--surface-green)' : 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <r.Icon width={32} height={32} style={{ color: i % 2 ? 'var(--green-600)' : 'var(--blue-500)' }} />
                  {r.tag && <span style={{ position: 'absolute', top: 8, left: 8 }}><Badge variant={r.tag === 'ใหม่!' ? 'accent' : 'solidBlue'} size="sm">{r.tag}</Badge></span>}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-body)', lineHeight: 1.3, minHeight: 34 }}>{r.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0 10px' }}>
                    <Star width={14} height={14} fill="var(--color-secondary)" style={{ color: 'var(--color-secondary)' }} />
                    <span style={{ font: 'var(--weight-bold) 14px var(--font-base)', color: 'var(--text-title)' }}>{r.pts}</span>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>แต้ม</span>
                  </div>
                  <Button variant={can ? 'primary' : 'soft'} size="sm" fullWidth disabled={!can}>{can ? 'แลกเลย' : 'แต้มไม่พอ'}</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '16px 16px 0' }}>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {HISTORY.map((h, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: h.pts > 0 ? 'var(--green-100)' : 'var(--blue-100)', color: h.pts > 0 ? 'var(--green-700)' : 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  {h.pts > 0 ? <Plus width={18} height={18} /> : <Gift width={18} height={18} />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{h.name}</div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{h.when}</div>
                </div>
                <span style={{ font: 'var(--weight-bold) 15px var(--font-base)', color: h.pts > 0 ? 'var(--green-600)' : 'var(--text-muted)' }}>{h.pts > 0 ? '+' : ''}{h.pts}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
