import React, { useState, useEffect } from 'react';
import { Star, Medal, TicketPercent, Package, Gift, Plus } from 'lucide-react';
import { Card, Badge, Button, Tabs } from '../components/index.jsx';
import { SkyDeco } from '../shared/index.jsx';
import { supabase } from '../lib/supabase.js';

const CATALOG = [
  { name: 'ส่วนลด 50 บาท',         pts: 200, Icon: TicketPercent, tag: 'ยอดนิยม' },
  { name: 'ส่วนลด 100 บาท',        pts: 400, Icon: TicketPercent, tag: null },
  { name: 'ผ้าเปียกเปา เปา 1 ห่อ',  pts: 350, Icon: Package,       tag: 'ใหม่!' },
  { name: 'ผ้าอ้อม Size M ฟรี 1 แพ็ค', pts: 800, Icon: Gift,    tag: null },
];

const TAB_ITEMS = [
  { label: 'แลกของรางวัล', value: 'catalog' },
  { label: 'ประวัติแต้ม',   value: 'history' },
];

const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
}
function activityLabel(a) {
  if (a.source === 'daily_login') return `เข้าสู่ระบบต่อเนื่อง (วันที่ ${a.streak_day ?? '-'})`;
  return a.source;
}

export default function RewardsScreen({ user }) {
  const [tab, setTab] = useState('catalog');
  const [activities, setActivities] = useState([]);

  const points = user?.points ?? 0;
  const streak = user?.login_streak ?? 0;

  useEffect(() => {
    if (!user?.line_uid) return;
    try {
      supabase
        .from('006_points')
        .select('*')
        .eq('line_uid', user.line_uid)
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => setActivities(data || []));
    } catch (e) {
      console.warn('[rewards] activities fetch failed:', e?.message);
    }
  }, [user?.line_uid]);

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '20px 20px 30px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>แต้มสะสมของคุณ</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <Star width={26} height={26} fill="#fff" />
            <span style={{ font: '800 42px var(--font-display)' }}>{points}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.18)', padding: '4px 12px', borderRadius: 999 }}>
              <Medal width={15} height={15} />
              <span style={{ font: 'var(--weight-semibold) 12px var(--font-base)' }}>สมาชิก Silver</span>
            </span>
            {streak > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.18)', padding: '4px 12px', borderRadius: 999 }}>
                <span style={{ font: 'var(--weight-semibold) 12px var(--font-base)' }}>🔥 เข้าระบบต่อเนื่อง {streak} วัน</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <Tabs value={tab} onChange={setTab} items={TAB_ITEMS} />
      </div>

      {tab === 'catalog' ? (
        <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {CATALOG.map((r, i) => {
            const can = points >= r.pts;
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
          {activities.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
              <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)' }}>ยังไม่มีประวัติแต้ม</div>
              <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 6 }}>เข้าแอปทุกวันเพื่อรับแต้มสะสม</div>
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {activities.map((h, i, arr) => (
                <div key={h.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: h.points > 0 ? 'var(--green-100)' : 'var(--blue-100)', color: h.points > 0 ? 'var(--green-700)' : 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    {h.points > 0 ? <Plus width={18} height={18} /> : <Gift width={18} height={18} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{activityLabel(h)}</div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{fmtDate(h.created_at)}</div>
                  </div>
                  <span style={{ font: 'var(--weight-bold) 15px var(--font-base)', color: h.points > 0 ? 'var(--green-600)' : 'var(--text-muted)' }}>{h.points > 0 ? '+' : ''}{h.points}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
