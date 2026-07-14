import React, { useState, useEffect } from 'react';
import { Scale, Ruler, Calendar, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Badge, Button } from '../components/index.jsx';
import { SectionTitle } from '../shared/index.jsx';
import { getWHOData, getWHOValueAtMonth } from '../data/whoData.js';
import { getWHOWflData, getWHOWflAtLength } from '../data/whoWflData.js';
import { supabase } from '../lib/supabase.js';
import { recommendSize } from '../lib/diaperSize.js';

// ─── helpers ────────────────────────────────────────────────────────────────

const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function ageInMonths(birthDate, atDate) {
  return Math.max(0, (new Date(atDate) - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30.4375));
}

function formatThaiDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatAgeLabel(months) {
  const m = Math.round(months);
  if (m < 1) return 'แรกเกิด';
  if (m < 12) return `${m} เดือน`;
  const yr = Math.floor(m / 12), mo = m % 12;
  return mo === 0 ? `${yr} ปี` : `${yr} ปี ${mo} เดือน`;
}

// Piecewise z-score: uses sd2neg(-2SD) and sd2pos(+2SD) as anchors
function calcZScore(value, who) {
  if (!who || !who.median) return null;
  if (value < who.median) {
    const halfRange = who.median - who.sd2neg;
    return halfRange > 0 ? -2 * (who.median - value) / halfRange : 0;
  }
  const halfRange = who.sd2pos - who.median;
  return halfRange > 0 ? 2 * (value - who.median) / halfRange : 0;
}

function getRangeStatus(value, min, max, unit) {
  if (value < min) return { status: 'below', chipLabel: 'ต่ำกว่าเกณฑ์', deltaText: `ต่ำกว่าเกณฑ์ ${(min - value).toFixed(1)} ${unit}` };
  if (value > max) return { status: 'above', chipLabel: 'สูงกว่าเกณฑ์', deltaText: `สูงกว่าเกณฑ์ ${(value - max).toFixed(1)} ${unit}` };
  return { status: 'normal', chipLabel: 'ตามเกณฑ์', deltaText: 'อยู่ในช่วงเกณฑ์ WHO' };
}

const WH_ZONES = [
  { key: 'very_low',    zMin: -3,   zMax: -2,   label: 'ผอม',         friendly: 'น้ำหนักต่ำกว่าเกณฑ์เมื่อเทียบกับส่วนสูง' },
  { key: 'low',         zMin: -2,   zMax: -1.5, label: 'ค่อนข้างผอม', friendly: 'น้ำหนักต่ำกว่าช่วงสมส่วนเล็กน้อย' },
  { key: 'normal',      zMin: -1.5, zMax:  1.5, label: 'สมส่วน',      friendly: 'น้ำหนักเหมาะสมเมื่อเทียบกับส่วนสูง' },
  { key: 'high',        zMin:  1.5, zMax:  2,   label: 'เริ่มอ้วน',   friendly: 'น้ำหนักสูงกว่าช่วงสมส่วนเล็กน้อย' },
  { key: 'very_high',   zMin:  2,   zMax:  3,   label: 'อ้วน',        friendly: 'น้ำหนักสูงกว่าเกณฑ์เมื่อเทียบกับส่วนสูง' },
];
const WA_ZONES = [
  { key: 'very_low',  zMin: -3,   zMax: -2,   label: 'น้ำหนักน้อย',          friendly: 'น้ำหนักต่ำกว่าเกณฑ์ตามวัย' },
  { key: 'low',       zMin: -2,   zMax: -1.5, label: 'น้ำหนักค่อนข้างน้อย',  friendly: 'น้ำหนักต่ำกว่าค่ากลางเล็กน้อย' },
  { key: 'normal',    zMin: -1.5, zMax:  1.5, label: 'น้ำหนักตามเกณฑ์',      friendly: 'น้ำหนักอยู่ในช่วงเหมาะสมตามวัย' },
  { key: 'high',      zMin:  1.5, zMax:  2,   label: 'น้ำหนักค่อนข้างมาก',   friendly: 'น้ำหนักสูงกว่าค่ากลางเล็กน้อย' },
  { key: 'very_high', zMin:  2,   zMax:  3,   label: 'น้ำหนักมาก',            friendly: 'น้ำหนักสูงกว่าเกณฑ์ตามวัย' },
];
const HA_ZONES = [
  { key: 'very_low',  zMin: -3,   zMax: -2,   label: 'เตี้ย',              friendly: 'ส่วนสูงต่ำกว่าเกณฑ์ตามวัย' },
  { key: 'low',       zMin: -2,   zMax: -1.5, label: 'ค่อนข้างเตี้ย',      friendly: 'ส่วนสูงต่ำกว่าค่ากลางเล็กน้อย' },
  { key: 'normal',    zMin: -1.5, zMax:  1.5, label: 'ส่วนสูงตามเกณฑ์',    friendly: 'ส่วนสูงอยู่ในช่วงเหมาะสมตามวัย' },
  { key: 'high',      zMin:  1.5, zMax:  2,   label: 'ค่อนข้างสูง',         friendly: 'ส่วนสูงสูงกว่าค่ากลางเล็กน้อย' },
  { key: 'very_high', zMin:  2,   zMax:  3,   label: 'สูง',                 friendly: 'ส่วนสูงสูงกว่าเกณฑ์ตามวัย' },
];

function getZone(z, zones) {
  const clamped = Math.max(-3, Math.min(3, z ?? 0));
  return zones.find(zn => clamped >= zn.zMin && clamped < zn.zMax) || zones[2];
}

const ZONE_COLORS = {
  very_low:  { bg: 'var(--orange-100, #FFF3E0)', fg: 'var(--orange-700, #E65100)' },
  low:       { bg: 'var(--yellow-100, #FFFDE7)', fg: 'var(--yellow-800, #F57F17)' },
  normal:    { bg: 'var(--surface-green, #E8F5E9)', fg: 'var(--green-700, #2E7D32)' },
  high:      { bg: 'var(--yellow-100, #FFFDE7)', fg: 'var(--yellow-800, #F57F17)' },
  very_high: { bg: 'var(--orange-100, #FFF3E0)', fg: 'var(--orange-700, #E65100)' },
};

// ─── RangeIndicator ──────────────────────────────────────────────────────────

function RangeIndicator({ value, min, max, unit }) {
  const range = max - min;
  const buffer = range * 0.3;
  const displayMin = Math.min(min - buffer, value - buffer * 0.5);
  const displayMax = Math.max(max + buffer, value + buffer * 0.5);
  const span = displayMax - displayMin || 1;

  const normStart = ((min - displayMin) / span) * 100;
  const normEnd   = ((max - displayMin) / span) * 100;
  const valuePct  = Math.max(1, Math.min(99, ((value - displayMin) / span) * 100));

  const { status, chipLabel, deltaText } = getRangeStatus(value, min, max, unit);

  const chipColor = status === 'normal'
    ? { bg: 'var(--surface-green)', color: 'var(--green-700)' }
    : { bg: '#FFF3E0', color: '#E65100' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{
          padding: '3px 10px', borderRadius: 999,
          background: chipColor.bg, color: chipColor.color,
          font: 'var(--weight-semibold) 11px var(--font-base)',
        }}>{chipLabel}</span>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
          เกณฑ์ WHO: {min}–{max} {unit}
        </span>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', height: 10, background: 'var(--gray-100)', borderRadius: 5, marginBottom: 6 }}>
        {/* Normal zone highlight */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${normStart}%`, width: `${normEnd - normStart}%`,
          background: 'var(--color-secondary)', borderRadius: 5, opacity: 0.35,
        }} />
        {/* Value marker */}
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateX(-50%) translateY(-50%)',
          left: `${valuePct}%`,
          width: 4, height: 18, borderRadius: 2,
          background: status === 'normal' ? 'var(--green-700)' : '#E65100',
          boxShadow: '0 0 0 2px #fff',
          zIndex: 2,
        }} />
      </div>

      {/* Min/Max labels */}
      <div style={{ position: 'relative', height: 14 }}>
        <span style={{
          position: 'absolute', left: `${normStart}%`,
          font: 'var(--weight-medium) 9px var(--font-base)', color: 'var(--text-faint)',
          transform: 'translateX(-50%)',
        }}>{min}</span>
        <span style={{
          position: 'absolute', left: `${normEnd}%`,
          font: 'var(--weight-medium) 9px var(--font-base)', color: 'var(--text-faint)',
          transform: 'translateX(-50%)',
        }}>{max}</span>
      </div>

      <div style={{ font: 'var(--type-caption)', color: status === 'normal' ? 'var(--green-700)' : '#E65100', marginTop: 2 }}>
        {deltaText}
      </div>
    </div>
  );
}

// ─── GrowthZoneBar ───────────────────────────────────────────────────────────

const ZONE_SEGS = [
  { key: 'very_low',  width: 1,   bg: '#FFCC80' },
  { key: 'low',       width: 0.5, bg: '#FFE082' },
  { key: 'normal',    width: 3,   bg: '#A5D6A7' },
  { key: 'high',      width: 0.5, bg: '#FFE082' },
  { key: 'very_high', width: 1,   bg: '#FFCC80' },
];
const TOTAL_UNITS = ZONE_SEGS.reduce((s, z) => s + z.width, 0); // 6

function GrowthZoneBar({ zScore }) {
  const clamped = Math.max(-3, Math.min(3, zScore ?? 0));
  // map clamped z (-3..+3) → percentage across bar
  // bar segments: -3→-2 (1u), -2→-1.5 (0.5u), -1.5→1.5 (3u), 1.5→2 (0.5u), 2→3 (1u)
  // cumulative edges: 0, 1, 1.5, 4.5, 5, 6
  const zToUnit = (z) => {
    if (z <= -2) return (z + 3);           // -3..−2 → 0..1
    if (z <= -1.5) return 1 + (z + 2) * 1;// -2..−1.5 → 1..1.5
    if (z <=  1.5) return 1.5 + (z + 1.5) * (3 / 3); // -1.5..1.5 → 1.5..4.5
    if (z <=  2)   return 4.5 + (z - 1.5) * 1;        // 1.5..2 → 4.5..5
    return 5 + (z - 2);                                // 2..3 → 5..6
  };
  const markerPct = (zToUnit(clamped) / TOTAL_UNITS) * 100;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ position: 'relative', display: 'flex', borderRadius: 6, overflow: 'visible', height: 10 }}>
        {ZONE_SEGS.map((seg, i) => (
          <div key={seg.key} style={{
            flex: seg.width, height: '100%', background: seg.bg,
            borderRadius: i === 0 ? '6px 0 0 6px' : i === ZONE_SEGS.length - 1 ? '0 6px 6px 0' : 0,
          }} />
        ))}
        {/* Marker */}
        <div style={{
          position: 'absolute', top: '50%', left: `${markerPct}%`,
          transform: 'translate(-50%, -50%)',
          width: 4, height: 18, borderRadius: 2,
          background: 'var(--text-heading)', boxShadow: '0 0 0 2px #fff',
          zIndex: 2,
        }} />
      </div>
      <div style={{ display: 'flex', marginTop: 3 }}>
        {ZONE_SEGS.map(seg => (
          <div key={seg.key} style={{ flex: seg.width, textAlign: 'center', font: '9px var(--font-base)', color: 'var(--text-faint)', lineHeight: 1.2 }}>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary metric cards ─────────────────────────────────────────────────────

const METRICS = [
  { key: 'weightKg', indicator: 'wfa',  label: 'น้ำหนัก',  unit: 'กก.', Icon: Scale,  tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
  { key: 'heightCm', indicator: 'lhfa', label: 'ส่วนสูง',  unit: 'ซม.', Icon: Ruler,  tone: 'var(--green-100)', fg: 'var(--green-700)' },
];

function MetricSummaryCard({ metric, value, who }) {
  const { label, unit, Icon, tone, fg } = metric;
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: tone, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon width={21} height={21} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ font: '800 26px var(--font-display)', color: 'var(--text-heading)' }}>{value.toFixed(1)}</span>
            <span style={{ font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-muted)' }}>{unit}</span>
          </div>
        </div>
      </div>
      <RangeIndicator value={value} min={who.sd2neg} max={who.sd2pos} unit={unit} />
    </Card>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const CHART_TABS = [
  { id: 'wa', label: 'น้ำหนักตามอายุ'    },
  { id: 'ha', label: 'ส่วนสูงตามอายุ'    },
  { id: 'wh', label: 'น้ำหนักเทียบส่วนสูง' },
];

function ChartTabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface-soft)', borderRadius: 'var(--radius-md)', padding: 3, gap: 2 }}>
      {CHART_TABS.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, border: 'none', cursor: 'pointer', padding: '7px 2px',
            borderRadius: 'calc(var(--radius-md) - 2px)',
            background: on ? '#fff' : 'transparent',
            boxShadow: on ? 'var(--shadow-card)' : 'none',
            font: `${on ? 'var(--weight-semibold)' : 'var(--weight-medium)'} 10px var(--font-base)`,
            color: on ? 'var(--color-primary)' : 'var(--text-muted)',
            transition: 'all var(--dur-base)',
            whiteSpace: 'nowrap',
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}

// ─── Growth Interpretation Card ───────────────────────────────────────────────

function InterpretationCard({ title, zone, measurementText, zScore }) {
  const colors = ZONE_COLORS[zone.key] || ZONE_COLORS.normal;
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)' }}>{title}</div>
        <span style={{
          padding: '4px 12px', borderRadius: 999,
          background: colors.bg, color: colors.fg,
          font: 'var(--weight-semibold) 12px var(--font-base)',
        }}>{zone.label}</span>
      </div>

      <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: 6 }}>
        {zone.friendly}
      </div>
      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 10 }}>
        {measurementText}
      </div>

      {zScore !== null && <GrowthZoneBar zScore={zScore} />}

      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)', color: 'var(--text-faint)', lineHeight: 1.5 }}>
        ข้อมูลนี้ใช้เพื่อช่วยติดตามแนวโน้มการเจริญเติบโตเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์
      </div>
    </Card>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function ChartLegend({ lineColor = 'var(--color-primary)' }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
      {[
        { color: lineColor, label: 'ข้อมูลลูก', solid: true },
        { color: 'var(--gray-300)', label: 'ช่วงเกณฑ์', solid: false },
        { color: 'var(--blue-300)', label: 'ค่ากลาง',   solid: false },
      ].map(({ color, label, solid }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          <span style={{ width: 16, height: solid ? 2.5 : 1.5, background: color, borderRadius: 1, opacity: solid ? 1 : 0.8 }} />
          {label}
        </span>
      ))}
    </div>
  );
}

// Small floating label shown above/below a tapped data point, with a
// background dark enough to read on top of the WHO band + gridlines.
function ChartTooltip({ x, y, W, lines }) {
  const boxW = 112, boxH = 15 * lines.length + 12;
  let bx = x - boxW / 2;
  if (bx < 2) bx = 2;
  if (bx + boxW > W - 2) bx = W - 2 - boxW;
  let by = y - boxH - 10;
  if (by < 2) by = y + 10;
  return (
    <g pointerEvents="none">
      <rect x={bx} y={by} width={boxW} height={boxH} rx="6" fill="var(--text-heading)" opacity="0.92" />
      {lines.map((line, i) => (
        <text key={i} x={bx + boxW / 2} y={by + 15 + i * 15} textAnchor="middle" fontSize="9.5" fill="#fff" fontWeight={i === 0 ? 700 : 400}>
          {line}
        </text>
      ))}
    </g>
  );
}

// Picks a "nice" round step (1/2/5/10 × a power of 10) for axis gridlines.
function niceStep(range, targetCount) {
  const rawStep = range / targetCount;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const norm = rawStep / mag;
  if (norm < 1.5) return mag;
  if (norm < 3) return 2 * mag;
  if (norm < 7) return 5 * mag;
  return 10 * mag;
}

function niceTicks(min, max, targetCount) {
  const step = niceStep(max - min, targetCount);
  const ticks = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-6; t += step) {
    ticks.push(Math.round(t * 100) / 100);
  }
  return ticks;
}

function pickMonthStep(range) {
  if (range <= 6) return 1;
  if (range <= 12) return 2;
  if (range <= 24) return 3;
  if (range <= 48) return 6;
  return 12;
}

function buildAgeChart(records, gender, birthDate, indicator, color) {
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const key = indicator === 'wfa' ? 'weightKg' : 'heightCm';
  const unit = indicator === 'wfa' ? 'กก.' : 'ซม.';
  const points = sorted.map(r => ({ month: ageInMonths(birthDate, r.date), val: r[key], date: r.date }));
  if (!points.length) return null;

  const wfa = getWHOData(gender, indicator);
  const minM = Math.max(0, Math.floor(Math.min(...points.map(p => p.month))) - 1);
  const maxM = Math.ceil(Math.max(...points.map(p => p.month))) + 1;
  const whoSlice = Array.from(new Set([minM, ...wfa.filter(d => d.month > minM && d.month < maxM).map(d => d.month), maxM]))
    .sort((a, b) => a - b).map(m => ({ month: m, ...getWHOValueAtMonth(gender, indicator, m) }));

  const vMin = Math.min(...points.map(p => p.val), ...whoSlice.map(d => d.sd2neg)) - (indicator === 'wfa' ? 0.5 : 1);
  const vMax = Math.max(...points.map(p => p.val), ...whoSlice.map(d => d.sd2pos)) + (indicator === 'wfa' ? 0.5 : 1);
  const currentM = Math.min(maxM, Math.max(minM, ageInMonths(birthDate, new Date())));

  return { points, whoSlice, minM, maxM, vMin, vMax, currentM, color, unit };
}

function AgeChart({ chartData, title }) {
  const [selected, setSelected] = useState(null);
  if (!chartData) return null;
  const { points, whoSlice, minM, maxM, vMin, vMax, currentM, color, unit } = chartData;
  const W = 326, H = 190, mg = { top: 14, right: 10, bottom: 30, left: 30 };
  const pW = W - mg.left - mg.right, pH = H - mg.top - mg.bottom;
  const xSc = m => mg.left + ((m - minM) / ((maxM - minM) || 1)) * pW;
  const ySc = v => mg.top + (1 - (v - vMin) / ((vMax - vMin) || 1)) * pH;

  const bandTop    = whoSlice.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xSc(d.month).toFixed(1)} ${ySc(d.sd2pos).toFixed(1)}`).join(' ');
  const bandBottom = [...whoSlice].reverse().map((d, i) => `L ${xSc(d.month).toFixed(1)} ${ySc(d.sd2neg).toFixed(1)}`).join(' ');
  const band = bandTop + ' ' + bandBottom + ' Z';

  const yTicks = niceTicks(vMin, vMax, 5);
  const monthStep = pickMonthStep(maxM - minM);
  const xTicks = [];
  for (let m = Math.ceil(minM / monthStep) * monthStep; m <= maxM; m += monthStep) xTicks.push(m);

  const currentX = xSc(currentM);

  return (
    <Card>
      <SectionTitle>แนวโน้มย้อนหลัง</SectionTitle>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} onClick={() => setSelected(null)}>
        {/* Horizontal gridlines + y-axis labels */}
        {yTicks.map((v, i) => (
          <g key={`y${i}`}>
            <line x1={mg.left} x2={W - mg.right} y1={ySc(v)} y2={ySc(v)} stroke="var(--gray-200)" strokeWidth="1" />
            <text x={mg.left - 6} y={ySc(v)} textAnchor="end" dominantBaseline="middle" fontSize="8.5" fill="var(--text-faint)">{v}</text>
          </g>
        ))}
        {/* WHO band */}
        <path d={band} fill="var(--blue-100,#E3F2FD)" opacity="0.5" />
        {/* Median */}
        <path d={whoSlice.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xSc(d.month).toFixed(1)} ${ySc(d.median).toFixed(1)}`).join(' ')}
          fill="none" stroke="var(--blue-300)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
        {/* Child line */}
        <path d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xSc(p.month).toFixed(1)} ${ySc(p.val).toFixed(1)}`).join(' ')}
          fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xSc(p.month)} cy={ySc(p.val)} r={selected === i ? 6 : 4.5}
            fill={color} stroke="#fff" strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setSelected(selected === i ? null : i); }}
          />
        ))}
        {/* Current-age indicator: vertical line + triangle marker on the x-axis */}
        <line x1={currentX} x2={currentX} y1={mg.top} y2={mg.top + pH} stroke="var(--text-heading)" strokeWidth="1.5" />
        <path d={`M ${currentX - 5} ${mg.top + pH + 6} L ${currentX + 5} ${mg.top + pH + 6} L ${currentX} ${mg.top + pH} Z`} fill="var(--text-heading)" />
        {/* x-axis month ticks */}
        {xTicks.map((m, i) => (
          <text key={`x${i}`} x={xSc(m)} y={H - 4} textAnchor="middle" fontSize="8.5" fill="var(--text-faint)">{Math.round(m)}</text>
        ))}
        <text x={W - mg.right} y={mg.top - 4} textAnchor="end" fontSize="8.5" fill="var(--text-faint)">เดือน · {unit}</text>
        {selected != null && (
          <ChartTooltip
            x={xSc(points[selected].month)} y={ySc(points[selected].val)} W={W}
            lines={[formatThaiDate(points[selected].date), `${points[selected].val} ${unit}`]}
          />
        )}
      </svg>
      <ChartLegend lineColor={color} />
    </Card>
  );
}

function WHChart({ records, gender }) {
  const [selected, setSelected] = useState(null);
  const sorted = [...records].filter(r => r.heightCm).sort((a, b) => a.heightCm - b.heightCm);
  const points = sorted.map(r => ({ h: r.heightCm, w: r.weightKg, date: r.date }));
  if (!points.length) return null;

  const wflData = getWHOWflData(gender);
  const minH = Math.max(45, Math.floor(Math.min(...points.map(p => p.h))) - 2);
  const maxH = Math.min(120, Math.ceil(Math.max(...points.map(p => p.h))) + 2);
  const whoSlice = wflData.filter(d => d.length >= minH && d.length <= maxH);
  if (!whoSlice.length) return null;

  const wMin = Math.min(...points.map(p => p.w), ...whoSlice.map(d => d.sd2neg)) - 0.5;
  const wMax = Math.max(...points.map(p => p.w), ...whoSlice.map(d => d.sd2pos)) + 0.5;

  const W = 326, H = 190, mg = { top: 14, right: 10, bottom: 30, left: 30 };
  const pW = W - mg.left - mg.right, pH = H - mg.top - mg.bottom;
  const xSc = h => mg.left + ((h - minH) / ((maxH - minH) || 1)) * pW;
  const ySc = w => mg.top + (1 - (w - wMin) / ((wMax - wMin) || 1)) * pH;

  const bandTop    = whoSlice.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xSc(d.length).toFixed(1)} ${ySc(d.sd2pos).toFixed(1)}`).join(' ');
  const bandBottom = [...whoSlice].reverse().map((d) => `L ${xSc(d.length).toFixed(1)} ${ySc(d.sd2neg).toFixed(1)}`).join(' ');
  const band = bandTop + ' ' + bandBottom + ' Z';

  const yTicks = niceTicks(wMin, wMax, 5);
  const xStep = niceStep(maxH - minH, 5);
  const xTicks = [];
  for (let h = Math.ceil(minH / xStep) * xStep; h <= maxH; h += xStep) xTicks.push(h);

  // "Current" here = height from the most recently recorded entry (by date,
  // not by height value — points are sorted by height for the trend line).
  const latestByDate = [...records].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const currentH = Math.min(maxH, Math.max(minH, latestByDate.heightCm));
  const currentX = xSc(currentH);

  return (
    <Card>
      <SectionTitle>แนวโน้มย้อนหลัง</SectionTitle>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} onClick={() => setSelected(null)}>
        {/* Horizontal gridlines + y-axis (weight) labels */}
        {yTicks.map((v, i) => (
          <g key={`y${i}`}>
            <line x1={mg.left} x2={W - mg.right} y1={ySc(v)} y2={ySc(v)} stroke="var(--gray-200)" strokeWidth="1" />
            <text x={mg.left - 6} y={ySc(v)} textAnchor="end" dominantBaseline="middle" fontSize="8.5" fill="var(--text-faint)">{v}</text>
          </g>
        ))}
        <path d={band} fill="var(--blue-100,#E3F2FD)" opacity="0.5" />
        <path d={whoSlice.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xSc(d.length).toFixed(1)} ${ySc(d.median).toFixed(1)}`).join(' ')}
          fill="none" stroke="var(--blue-300)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
        <path d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xSc(p.h).toFixed(1)} ${ySc(p.w).toFixed(1)}`).join(' ')}
          fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xSc(p.h)} cy={ySc(p.w)} r={selected === i ? 6 : 4.5}
            fill="var(--blue-600)" stroke="#fff" strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setSelected(selected === i ? null : i); }}
          />
        ))}
        {/* Current-height indicator: vertical line + triangle marker on the x-axis */}
        <line x1={currentX} x2={currentX} y1={mg.top} y2={mg.top + pH} stroke="var(--text-heading)" strokeWidth="1.5" />
        <path d={`M ${currentX - 5} ${mg.top + pH + 6} L ${currentX + 5} ${mg.top + pH + 6} L ${currentX} ${mg.top + pH} Z`} fill="var(--text-heading)" />
        {/* x-axis (height) ticks */}
        {xTicks.map((h, i) => (
          <text key={`x${i}`} x={xSc(h)} y={H - 4} textAnchor="middle" fontSize="8.5" fill="var(--text-faint)">{Math.round(h)}</text>
        ))}
        <text x={W - mg.right} y={mg.top - 4} textAnchor="end" fontSize="8.5" fill="var(--text-faint)">ซม. · กก.</text>
        {selected != null && (
          <ChartTooltip
            x={xSc(points[selected].h)} y={ySc(points[selected].w)} W={W}
            lines={[formatThaiDate(points[selected].date), `${points[selected].h} ซม. · ${points[selected].w} กก.`]}
          />
        )}
      </svg>
      <ChartLegend />
    </Card>
  );
}

// ─── History list ─────────────────────────────────────────────────────────────

function HistoryList({ records }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const shown = expanded ? sorted : sorted.slice(0, 3);

  return (
    <div>
      <SectionTitle>รายการบันทึกย้อนหลัง</SectionTitle>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {shown.map((r, i) => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
            borderBottom: i < shown.length - 1 ? '1px solid var(--gray-100)' : 'none',
          }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gray-50)', color: 'var(--blue-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Scale width={18} height={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>
                {r.weightKg.toFixed(1)} กก. · {r.heightCm.toFixed(1)} ซม.
              </div>
            </div>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatThaiDate(r.date)}</span>
          </div>
        ))}
        {sorted.length > 3 && (
          <button onClick={() => setExpanded(v => !v)} style={{
            width: '100%', border: 'none', background: 'var(--gray-50)', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            font: 'var(--weight-medium) 13px var(--font-base)', color: 'var(--text-muted)', cursor: 'pointer',
          }}>
            {expanded ? <><ChevronUp width={16} height={16} />ย่อ</> : <><ChevronDown width={16} height={16} />ดูทั้งหมด {sorted.length} รายการ</>}
          </button>
        )}
      </Card>
    </div>
  );
}

// ─── Add record panel ─────────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', height: 46, padding: '0 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)', font: 'var(--type-body)', color: 'var(--text-body)',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};

function AddRecordPanel({ childId, onCancel, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [thigh, setThigh] = useState('');
  const [waist, setWaist] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canSave = date && weight && height;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true); setError(null);
    try {
      const payload = {
        child_id: childId, recorded_date: date,
        weight_kg: parseFloat(weight), height_cm: parseFloat(height),
        thigh_cm:  thigh  ? parseFloat(thigh)  : null,
        waist_cm:  waist  ? parseFloat(waist)  : null,
        diaper_size: recommendSize(parseFloat(weight)).code,
      };
      const { data, error: err } = await supabase.from('004_growth').insert(payload).select().single();
      if (err) throw err;
      onSaved({
        id: data.id, date: data.recorded_date,
        weightKg: data.weight_kg, heightCm: data.height_cm,
        thighCm: data.thigh_cm, waistCm: data.waist_cm,
      });
    } catch (e) {
      console.error('[AddRecord]', e);
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>บันทึกข้อมูลใหม่</h3>
        <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface-soft)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X width={18} height={18} />
        </button>
      </div>
      <FormField label="วันที่บันทึก">
        <div style={{ position: 'relative' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          <Calendar width={18} height={18} style={{ position: 'absolute', right: 14, top: 14, color: 'var(--text-faint)', pointerEvents: 'none' }} />
        </div>
      </FormField>
      <FormField label="น้ำหนัก (กก.) *">
        <input type="number" step="0.1" placeholder="เช่น 8.5" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} />
      </FormField>
      <FormField label="ส่วนสูง (ซม.) *">
        <input type="number" step="0.1" placeholder="เช่น 70.0" value={height} onChange={e => setHeight(e.target.value)} style={inputStyle} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="รอบขา (ซม.)">
          <input type="number" step="0.5" placeholder="เช่น 22.0" value={thigh} onChange={e => setThigh(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label="รอบเอว (ซม.)">
          <input type="number" step="0.5" placeholder="เช่น 44.0" value={waist} onChange={e => setWaist(e.target.value)} style={inputStyle} />
        </FormField>
      </div>
      <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', marginBottom: 14 }}>* จำเป็น · ช่องอื่นไม่บังคับ</div>
      {error && <div style={{ font: 'var(--type-caption)', color: 'var(--red-400)', marginBottom: 12 }}>{error}</div>}
      <Button variant="primary" fullWidth disabled={!canSave} loading={saving} onClick={handleSave} leftIcon={<Plus width={18} height={18} />}>บันทึก</Button>
    </Card>
  );
}

// ─── Overview panel ───────────────────────────────────────────────────────────

function OverviewPanel({ records, gender, birthDate, chartTab, onChartTabChange, onAddNew }) {
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const latestAge = ageInMonths(birthDate, latest.date);
  const ageLabel = formatAgeLabel(latestAge);

  const whoWA  = getWHOValueAtMonth(gender, 'wfa',  latestAge);
  const whoHA  = getWHOValueAtMonth(gender, 'lhfa', latestAge);

  // z-scores
  const zWA  = calcZScore(latest.weightKg, whoWA);
  const zHA  = calcZScore(latest.heightCm, whoHA);

  // WH z-score — interpolate by exact height using getWHOWflAtLength
  let zWH = null;
  if (latest.heightCm >= 45 && latest.heightCm <= 120) {
    const wflAtH = getWHOWflAtLength(gender, latest.heightCm);
    if (wflAtH) zWH = calcZScore(latest.weightKg, wflAtH);
  }

  const waZone  = getZone(zWA,  WA_ZONES);
  const haZone  = getZone(zHA,  HA_ZONES);
  const whZone  = zWH !== null ? getZone(zWH, WH_ZONES) : WH_ZONES[2];

  // Chart data
  const waChart = buildAgeChart(records, gender, birthDate, 'wfa',  'var(--color-primary)');
  const haChart = buildAgeChart(records, gender, birthDate, 'lhfa', 'var(--color-secondary)');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Latest date */}
      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', textAlign: 'right' }}>
        อัพเดตล่าสุด: {formatThaiDate(latest.date)}
      </div>

      {/* Summary cards */}
      <MetricSummaryCard metric={METRICS[0]} value={latest.weightKg} who={whoWA} />
      <MetricSummaryCard metric={METRICS[1]} value={latest.heightCm} who={whoHA} />

      {/* Tab selector */}
      <ChartTabBar active={chartTab} onChange={onChartTabChange} />

      {/* Interpretation card + Chart */}
      {chartTab === 'wa' && (
        <>
          <InterpretationCard
            title="น้ำหนักตามอายุ"
            zone={waZone}
            measurementText={`${latest.weightKg.toFixed(1)} กก. เมื่ออายุ ${ageLabel}`}
            zScore={zWA}
          />
          <AgeChart chartData={waChart} />
        </>
      )}
      {chartTab === 'ha' && (
        <>
          <InterpretationCard
            title="ส่วนสูงตามอายุ"
            zone={haZone}
            measurementText={`${latest.heightCm.toFixed(1)} ซม. เมื่ออายุ ${ageLabel}`}
            zScore={zHA}
          />
          <AgeChart chartData={haChart} />
        </>
      )}
      {chartTab === 'wh' && (
        <>
          <InterpretationCard
            title="น้ำหนักเทียบส่วนสูง"
            zone={whZone}
            measurementText={`${latest.weightKg.toFixed(1)} กก. ที่ส่วนสูง ${latest.heightCm.toFixed(1)} ซม.`}
            zScore={zWH}
          />
          <WHChart records={records} gender={gender} />
        </>
      )}

      {/* History */}
      <HistoryList records={records} />

      {/* Add button */}
      <Button variant="primary" fullWidth onClick={onAddNew} leftIcon={<Plus width={18} height={18} />}>บันทึกข้อมูลใหม่</Button>
    </div>
  );
}

// ─── GrowthPanel (exported) ───────────────────────────────────────────────────

export function GrowthPanel({ child }) {
  const [panelView, setPanelView] = useState('overview');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState('wa');

  const gender    = child?.gender   || 'female';
  const birthDate = child?.birth_date || new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!child?.id) { setLoading(false); return; }
    async function fetchRecords() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('004_growth').select('*')
          .eq('child_id', child.child_id).order('recorded_date', { ascending: true });
        if (error) throw error;
        setRecords((data || []).map(r => ({
          id: r.id, date: r.recorded_date,
          weightKg: r.weight_kg, heightCm: r.height_cm,
          thighCm: r.thigh_cm, waistCm: r.waist_cm,
        })));
      } catch (e) {
        console.error('[GrowthPanel]', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, [child?.id]);

  const handleSaved = (record) => {
    setRecords(prev => [...prev, record].sort((a, b) => new Date(a.date) - new Date(b.date)));
    setPanelView('overview');
  };

  if (loading) return (
    <Card style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ font: 'var(--weight-medium) 15px var(--font-base)', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
    </Card>
  );

  if (!child?.id) return (
    <Card style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
      <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>ไม่พบข้อมูลลูก</div>
      <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 8 }}>กรุณาลงทะเบียนข้อมูลลูกก่อน</div>
    </Card>
  );

  if (panelView === 'add') {
    return <AddRecordPanel childId={child.child_id} onCancel={() => setPanelView('overview')} onSaved={handleSaved} />;
  }

  if (records.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
        <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>ยังไม่มีข้อมูลพัฒนาการ</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>เริ่มบันทึกน้ำหนักและส่วนสูง<br />เพื่อติดตามพัฒนาการของลูก</div>
      </Card>
      <Button variant="primary" fullWidth onClick={() => setPanelView('add')} leftIcon={<Plus width={18} height={18} />}>บันทึกข้อมูลแรก</Button>
    </div>
  );

  return (
    <OverviewPanel
      records={records}
      gender={gender}
      birthDate={birthDate}
      chartTab={chartTab}
      onChartTabChange={setChartTab}
      onAddNew={() => setPanelView('add')}
    />
  );
}

export default GrowthPanel;
