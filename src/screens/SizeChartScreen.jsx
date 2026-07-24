import { ChevronLeft, Info } from 'lucide-react';
import { Card, Badge } from '../components/index.jsx';
import { SkyDeco, SizeBoundaryNotice, HERO_BG } from '../shared/index.jsx';
import { recommendSize, getSizes, isNearSizeBoundary } from '../lib/diaperSize.js';

export default function SizeChartScreen({ go, currentKg = 8.5 }) {
  const cur = recommendSize(currentKg).code;
  const nearBoundary = isNearSizeBoundary(currentKg);
  // Read on every render (not module scope) — loadDiaperSizes() at App boot
  // resolves async, so the cache may still be filling in when this mounts.
  const ROWS = getSizes().map(s => ({
    code: s.code,
    range: `${s.min ?? 0} – ${s.max ?? '...'} กก.`,
    stage: s.description || '—',
  }));

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ ...HERO_BG, position: 'relative', padding: '16px 16px 24px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => go('diaper')} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft width={22} height={22} />
          </button>
          <div>
            <div style={{ font: 'var(--weight-medium) 12px var(--font-base)', opacity: .9 }}>PAO PAO Size Guide</div>
            <div style={{ font: '800 20px var(--font-display)' }}>ตารางไซซ์ผ้าอ้อม</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 16px 0' }}>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '12px 18px', background: 'var(--surface-soft)', font: 'var(--weight-bold) 11px var(--font-base)', letterSpacing: '.06em', color: 'var(--blue-700)', textTransform: 'uppercase' }}>
            <span style={{ width: 64 }}>ไซซ์</span>
            <span style={{ flex: 1 }}>น้ำหนัก</span>
            <span>ช่วงวัย</span>
          </div>
          {ROWS.map((r, i) => {
            const active = r.code === cur;
            return (
              <div key={r.code} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: i < ROWS.length - 1 ? '1px solid var(--gray-100)' : 'none', background: active ? 'var(--surface-green)' : 'transparent' }}>
                <span style={{ width: 64 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 12, background: active ? 'var(--color-secondary)' : 'var(--gray-100)', color: active ? '#fff' : 'var(--text-body)', font: '800 15px var(--font-display)' }}>{r.code}</span>
                </span>
                <span style={{ flex: 1, font: 'var(--weight-semibold) 15px var(--font-base)', color: 'var(--text-body)' }}>{r.range}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{r.stage}</span>
              </div>
            );
          })}
        </Card>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge variant="green">●</Badge>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>แถบสีเขียวคือไซซ์ที่แนะนำสำหรับลูกน้อย ({currentKg} กก.)</span>
        </div>

        <div style={{ marginTop: 6, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>คำนวณจาก: ตารางเทียบขนาดผ้าอ้อมเปาเปา</div>

        <div style={{ marginTop: 16 }}>
          <Card tone="soft" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Info width={20} height={20} style={{ color: 'var(--blue-600)', flex: 'none', marginTop: 2 }} />
            <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.5 }}>ช่วงน้ำหนักซ้อนทับกันได้ — หากผ้าอ้อมเริ่มรัดหรือรั่วซึม แนะนำขยับขึ้นไซซ์ถัดไป</div>
          </Card>
        </div>

        {nearBoundary && (
          <div style={{ marginTop: 12 }}>
            <SizeBoundaryNotice />
          </div>
        )}
      </div>
    </div>
  );
}
