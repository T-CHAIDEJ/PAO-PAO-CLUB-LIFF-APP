import React, { useState } from 'react';
import { Minus, Plus, BellRing, RefreshCw, Scale, ChevronRight } from 'lucide-react';
import { Card, Button, Switch } from '../components/index.jsx';
import { SkyDeco, SectionTitle } from '../shared/index.jsx';

const PP_SIZES = [
  { code: 'S',   min: 4,  max: 8  },
  { code: 'M',   min: 6,  max: 11 },
  { code: 'L',   min: 9,  max: 14 },
  { code: 'XL',  min: 12, max: 17 },
  { code: 'XXL', min: 15, max: 25 },
];

export function recommendSize(kg) {
  return PP_SIZES.find(s => kg >= s.min && kg <= s.max) || PP_SIZES[PP_SIZES.length - 1];
}

const stepBtn = { width: 52, height: 52, borderRadius: '50%', border: 'none', background: 'var(--surface-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

export default function TrackerScreen({ go }) {
  const [kg, setKg] = useState(8.5);
  const [remind, setRemind] = useState(true);
  const size = recommendSize(kg);
  const step = (d) => setKg(v => Math.max(2, Math.min(20, Math.round((v + d) * 10) / 10)));

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '20px 20px 26px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative' }}>
          <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>ติดตามผ้าอ้อม</div>
          <div style={{ font: '800 22px var(--font-display)', marginTop: 2 }}>น้องเปา</div>
        </div>
      </div>

      {/* Weight stepper */}
      <div style={{ padding: '18px 16px 0' }}>
        <Card>
          <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', textAlign: 'center' }}>น้ำหนักลูกน้อยตอนนี้</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 14 }}>
            <button onClick={() => step(-0.1)} style={stepBtn}><Minus width={22} height={22} /></button>
            <div style={{ textAlign: 'center', minWidth: 110 }}>
              <span style={{ font: '800 46px var(--font-display)', color: 'var(--text-heading)' }}>{kg.toFixed(1)}</span>
              <span style={{ font: 'var(--weight-semibold) 16px var(--font-base)', color: 'var(--text-muted)', marginLeft: 4 }}>กก.</span>
            </div>
            <button onClick={() => step(0.1)} style={stepBtn}><Plus width={22} height={22} /></button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
            {[-1, -0.5, 0.5, 1].map(d => (
              <button key={d} onClick={() => step(d)} style={{ border: '1px solid var(--border-default)', background: '#fff', borderRadius: 999, padding: '6px 12px', font: 'var(--weight-semibold) 12px var(--font-base)', color: 'var(--text-body)', cursor: 'pointer' }}>{d > 0 ? '+' : ''}{d}</button>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommended size */}
      <div style={{ padding: '16px 16px 0' }}>
        <Card tone="green" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--color-secondary)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: 'var(--shadow-green)' }}>
            <span style={{ font: '800 26px var(--font-display)', lineHeight: 1 }}>{size.code}</span>
            <span style={{ font: 'var(--weight-semibold) 9px var(--font-base)', letterSpacing: '.06em', opacity: .9 }}>SIZE</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--type-caption)', color: 'var(--green-700)' }}>ไซส์ที่แนะนำ</div>
            <div style={{ font: 'var(--weight-bold) 19px var(--font-display)', color: 'var(--text-heading)' }}>Size {size.code}</div>
            <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>สำหรับน้ำหนัก {size.min}–{size.max} กก.</div>
          </div>
          <button onClick={() => go('size')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--green-700)', display: 'flex' }}>
            <ChevronRight width={22} height={22} />
          </button>
        </Card>
      </div>

      {/* Reminder */}
      <div style={{ padding: '16px 16px 0' }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-soft)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <BellRing width={21} height={21} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--weight-semibold) 15px var(--font-base)', color: 'var(--text-body)' }}>เตือนเปลี่ยนผ้าอ้อม</div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>ทุก 3 ชั่วโมง · 06:00–22:00</div>
          </div>
          <Switch checked={remind} onChange={setRemind} />
        </Card>
      </div>

      {/* Recent log */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionTitle>บันทึกล่าสุด</SectionTitle>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {[
            { label: 'เปลี่ยนผ้าอ้อม',       ago: '2 ชม.ที่แล้ว',   Icon: RefreshCw },
            { label: 'บันทึกน้ำหนัก 8.5 กก.', ago: 'วันนี้ 08:12',    Icon: Scale },
            { label: 'เปลี่ยนผ้าอ้อม',       ago: 'เมื่อวาน 21:40', Icon: RefreshCw },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gray-50)', color: 'var(--blue-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <r.Icon width={18} height={18} />
              </span>
              <span style={{ flex: 1, font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{r.label}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{r.ago}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
