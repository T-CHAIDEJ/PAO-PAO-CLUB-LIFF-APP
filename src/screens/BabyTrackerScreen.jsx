import { useState, useEffect } from 'react';
import { Ruler, Calendar, Plus, X, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Card, Button } from '../components/index.jsx';
import { SectionTitle, ConsentGateNotice, ScaleStandIcon } from '../shared/index.jsx';
import { getWHOData, getWHOValueAtMonth } from '../data/whoData.js';
import { getWHOWflData, getWHOWflAtLength } from '../data/whoWflData.js';
import { supabase } from '../lib/supabase.js';
import { recommendSize } from '../lib/diaperSize.js';
import { inputStyle, dateInputStyle, todayStr } from '../lib/formStyles.js';
import { logAction, logError } from '../lib/userLogs.js';

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

// Zone labels use the same "ตามเกณฑ์/สูงกว่าเกณฑ์/ต่ำกว่าเกณฑ์" vocabulary
// across all 3 tabs — used to say "ผอม/อ้วน" or "เตี้ย/สูง" per metric, which
// read as 3 unrelated scales instead of one consistent one.
const WH_ZONES = [
  { key: 'very_low',    zMin: -3,   zMax: -2,   label: 'ต่ำกว่าเกณฑ์มาก',     friendly: 'น้ำหนักต่ำกว่าเกณฑ์เมื่อเทียบกับส่วนสูง' },
  { key: 'low',         zMin: -2,   zMax: -1.5, label: 'ต่ำกว่าเกณฑ์เล็กน้อย', friendly: 'น้ำหนักต่ำกว่าช่วงสมส่วนเล็กน้อย' },
  { key: 'normal',      zMin: -1.5, zMax:  1.5, label: 'ตามเกณฑ์',            friendly: 'น้ำหนักเหมาะสมเมื่อเทียบกับส่วนสูง' },
  { key: 'high',        zMin:  1.5, zMax:  2,   label: 'สูงกว่าเกณฑ์เล็กน้อย', friendly: 'น้ำหนักสูงกว่าช่วงสมส่วนเล็กน้อย' },
  { key: 'very_high',   zMin:  2,   zMax:  3,   label: 'สูงกว่าเกณฑ์มาก',     friendly: 'น้ำหนักสูงกว่าเกณฑ์เมื่อเทียบกับส่วนสูง' },
];
const WA_ZONES = [
  { key: 'very_low',  zMin: -3,   zMax: -2,   label: 'ต่ำกว่าเกณฑ์มาก',     friendly: 'น้ำหนักต่ำกว่าเกณฑ์ตามวัย' },
  { key: 'low',       zMin: -2,   zMax: -1.5, label: 'ต่ำกว่าเกณฑ์เล็กน้อย', friendly: 'น้ำหนักต่ำกว่าค่ากลางเล็กน้อย' },
  { key: 'normal',    zMin: -1.5, zMax:  1.5, label: 'ตามเกณฑ์',            friendly: 'น้ำหนักอยู่ในช่วงเหมาะสมตามวัย' },
  { key: 'high',      zMin:  1.5, zMax:  2,   label: 'สูงกว่าเกณฑ์เล็กน้อย', friendly: 'น้ำหนักสูงกว่าค่ากลางเล็กน้อย' },
  { key: 'very_high', zMin:  2,   zMax:  3,   label: 'สูงกว่าเกณฑ์มาก',     friendly: 'น้ำหนักสูงกว่าเกณฑ์ตามวัย' },
];
const HA_ZONES = [
  { key: 'very_low',  zMin: -3,   zMax: -2,   label: 'ต่ำกว่าเกณฑ์มาก',     friendly: 'ส่วนสูงต่ำกว่าเกณฑ์ตามวัย' },
  { key: 'low',       zMin: -2,   zMax: -1.5, label: 'ต่ำกว่าเกณฑ์เล็กน้อย', friendly: 'ส่วนสูงต่ำกว่าค่ากลางเล็กน้อย' },
  { key: 'normal',    zMin: -1.5, zMax:  1.5, label: 'ตามเกณฑ์',            friendly: 'ส่วนสูงอยู่ในช่วงเหมาะสมตามวัย' },
  { key: 'high',      zMin:  1.5, zMax:  2,   label: 'สูงกว่าเกณฑ์เล็กน้อย', friendly: 'ส่วนสูงสูงกว่าค่ากลางเล็กน้อย' },
  { key: 'very_high', zMin:  2,   zMax:  3,   label: 'สูงกว่าเกณฑ์มาก',     friendly: 'ส่วนสูงสูงกว่าเกณฑ์ตามวัย' },
];

function getZone(z, zones) {
  const clamped = Math.max(-3, Math.min(3, z ?? 0));
  // zMax is exclusive on every zone, but a clamped value can land exactly on
  // the outermost boundary (z=3 or z=-3) — matching from the top down by
  // zMin instead avoids that value falling through to the "|| zones[2]"
  // (normal) fallback and silently misreporting an extreme outlier as normal.
  return [...zones].reverse().find(zn => clamped >= zn.zMin) || zones[0];
}

const ZONE_COLORS = {
  very_low:  { bg: 'var(--orange-100, #FFF3E0)', fg: 'var(--orange-700, #E65100)' },
  low:       { bg: 'var(--yellow-100, #FFFDE7)', fg: 'var(--yellow-800, #F57F17)' },
  normal:    { bg: 'var(--surface-green, #E8F5E9)', fg: 'var(--green-700, #2E7D32)' },
  high:      { bg: 'var(--yellow-100, #FFFDE7)', fg: 'var(--yellow-800, #F57F17)' },
  very_high: { bg: 'var(--orange-100, #FFF3E0)', fg: 'var(--orange-700, #E65100)' },
};

// ─── RangeBar ────────────────────────────────────────────────────────────────

// The track only ever spans [min, max] — the normal WHO window — instead of
// auto-expanding its domain to fit an outlier value. An out-of-range value
// pins to the near edge and gets called out with a floating value bubble
// connected by a dashed line, so the "normal" band always reads as a full,
// uncluttered bar rather than a sliver squeezed between two padded ends.
function RangeBar({ value, min, max, unit, accentColor, statusLabel }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / ((max - min) || 1)) * 100));
  const tickStyle = { width: 0, height: 7, borderLeft: '1.5px dashed var(--gray-300)' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        <Calendar width={13} height={13} style={{ flex: 'none' }} />
        เกณฑ์ปกติ: {min}–{max} {unit}
      </div>

      <div style={{ position: 'relative' }}>
        {/* Floating current-value callout, pinned above the marker */}
        <div style={{
          position: 'absolute', left: `${pct}%`, top: -30, transform: 'translateX(-50%)',
          whiteSpace: 'nowrap', padding: '3px 10px', borderRadius: 999,
          background: accentColor, color: '#fff',
          font: 'var(--weight-bold) 11px var(--font-base)', zIndex: 3,
        }}>
          {value.toFixed(2)} {unit}
        </div>
        <div style={{ position: 'absolute', left: `${pct}%`, top: -8, height: 8, borderLeft: `1.5px dashed ${accentColor}`, transform: 'translateX(-50%)' }} />

        {/* Track — the whole visible bar is the normal WHO band */}
        <div style={{ position: 'relative', height: 24, background: 'var(--surface-green)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <span style={{ font: 'var(--weight-semibold) 11px var(--font-base)', color: 'var(--green-700)' }}>{statusLabel}</span>
          <div style={{
            position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)',
            width: 4, height: 28, borderRadius: 2,
            background: accentColor, boxShadow: '0 0 0 2px #fff', zIndex: 2,
          }} />
        </div>
      </div>

      {/* Min/max labels, each with a short dashed tick pointing up at the bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={tickStyle} />
          <span style={{ font: 'var(--weight-medium) 10px var(--font-base)', color: 'var(--text-faint)' }}>{min} {unit}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={tickStyle} />
          <span style={{ font: 'var(--weight-medium) 10px var(--font-base)', color: 'var(--text-faint)' }}>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Metric config ───────────────────────────────────────────────────────────

const METRICS = [
  { key: 'weightKg', indicator: 'wfa',  label: 'น้ำหนัก',           unit: 'กก.', Icon: ScaleStandIcon, iconSrc: '/icon-weight-hippo.png',   tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
  { key: 'heightCm', indicator: 'lhfa', label: 'ส่วนสูง',           unit: 'ซม.', Icon: Ruler,          iconSrc: '/icon-height-giraffe.png', tone: 'var(--green-100)', fg: 'var(--green-700)' },
  { key: 'weightKg', indicator: 'wfl',  label: 'น้ำหนักเทียบส่วนสูง', unit: 'กก.', Icon: ScaleStandIcon, iconSrc: '/icon-weight-hippo.png',   tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
];

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

// ─── Merged Metric Card ────────────────────────────────────────────────────────
// One card per metric instead of the old pair (a summary card always shown
// for weight+height, plus a separate per-tab interpretation card with its
// own second range bar) — same value/zone/range info, said once.

function MergedMetricCard({ metric, value, who, zone, measurementText }) {
  const { label, unit, Icon, iconSrc, tone, fg } = metric;
  const colors = ZONE_COLORS[zone.key] || ZONE_COLORS.normal;
  return (
    <Card>
      <div style={{ position: 'relative' }}>
        {/* Ribbon-style status tag — a pointed left edge instead of a plain
            pill, sitting in the card's top-right corner. */}
        <span style={{
          position: 'absolute', top: -4, right: -4,
          padding: '5px 12px 5px 16px',
          clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)',
          background: colors.fg, color: '#fff',
          font: 'var(--weight-bold) 12px var(--font-base)', whiteSpace: 'nowrap',
        }}>{zone.label}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingRight: 70 }}>
          {iconSrc
            ? <img src={iconSrc} alt="" style={{ width: 56, height: 56, objectFit: 'contain', flex: 'none' }} />
            : (
              <span style={{ width: 48, height: 48, borderRadius: 14, background: tone, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon width={23} height={23} />
              </span>
            )}
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ font: '800 30px var(--font-display)', color: 'var(--text-heading)' }}>{value.toFixed(1)}</span>
              <span style={{ font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-muted)' }}>{unit}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 12px', background: 'var(--surface-soft)', borderRadius: 'var(--radius-sm)', marginBottom: 10 }}>
        <span style={{ font: 'var(--weight-bold) 14px var(--font-display)', color: colors.fg }}>{zone.friendly}</span>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}> {measurementText}</span>
      </div>

      <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', lineHeight: 1.5, marginBottom: 14 }}>
        ข้อมูลนี้ใช้เพื่อช่วยติดตามแนวโน้มการเจริญเติบโตเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์
      </div>

      <RangeBar value={value} min={who.sd2neg} max={who.sd2pos} unit={unit} accentColor={colors.fg} statusLabel="อยู่ในเกณฑ์ปกติ" />

      <div style={{ marginTop: 14, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'center' }}>
        อ้างอิงจากเกณฑ์การเจริญเติบโตขององค์การอนามัยโลก (WHO) สำหรับเด็กอายุ 0–5 ปี
      </div>
    </Card>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

// Orange (not red) per explicit product direction — flags an out-of-range
// point without reading as alarming as a red warning color would.
const OUT_OF_RANGE_COLOR = '#F97316';

// Matches each legend swatch to how that element actually renders on the
// chart — a flat bar read the same for the solid line, the dashed median,
// and the translucent band, so none of them were visually distinguishable.
function LegendSwatch({ kind, color }) {
  if (kind === 'band') {
    return <span style={{ width: 16, height: 10, background: color, opacity: 0.5, borderRadius: 2, flex: 'none' }} />;
  }
  if (kind === 'dashed') {
    return (
      <svg width="16" height="8" style={{ flex: 'none' }}>
        <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (kind === 'dot') {
    return <span style={{ width: 10, height: 10, background: color, border: '1.5px solid #fff', outline: `1px solid ${color}`, borderRadius: '50%', flex: 'none' }} />;
  }
  return <span style={{ width: 16, height: 2.5, background: color, borderRadius: 1, flex: 'none' }} />;
}

function ChartLegend({ lineColor = 'var(--color-primary)', hasOutOfRange = false }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
      {[
        { color: lineColor, label: 'ข้อมูลลูก', kind: 'line' },
        { color: 'var(--blue-100,#E3F2FD)', label: 'ช่วงเกณฑ์', kind: 'band' },
        { color: 'var(--blue-300)', label: 'ค่ากลาง',   kind: 'dashed' },
        ...(hasOutOfRange ? [{ color: OUT_OF_RANGE_COLOR, label: 'สูง/ต่ำกว่าเกณฑ์', kind: 'dot' }] : []),
      ].map(({ color, label, kind }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          <LegendSwatch kind={kind} color={color} />
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

const MIN_CHART_SPAN_MONTHS = 12;

// One point per calendar month of age — if a parent logs several times in
// the same month, keep only the latest (most current) one so the trend
// line doesn't get noisy.
function aggregateMonthly(points) {
  const byMonth = new Map();
  for (const p of points) {
    const bucket = Math.floor(p.month);
    const existing = byMonth.get(bucket);
    if (!existing || new Date(p.date) > new Date(existing.date)) byMonth.set(bucket, p);
  }
  return Array.from(byMonth.values()).sort((a, b) => a.month - b.month);
}

function buildAgeChart(records, gender, birthDate, indicator, color) {
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const key = indicator === 'wfa' ? 'weightKg' : 'heightCm';
  const unit = indicator === 'wfa' ? 'กก.' : 'ซม.';
  const rawPoints = sorted.map(r => ({ month: ageInMonths(birthDate, r.date), val: r[key], date: r.date }));
  if (!rawPoints.length) return null;
  const aggregated = aggregateMonthly(rawPoints);
  // Flag points outside the WHO ±2SD band so the chart can call them out
  // visually instead of blending in with values that are perfectly normal.
  const points = aggregated.map(p => {
    const who = getWHOValueAtMonth(gender, indicator, p.month);
    return { ...p, outOfRange: !!who && (p.val > who.sd2pos || p.val < who.sd2neg) };
  });

  const wfa = getWHOData(gender, indicator);
  let minM = Math.max(0, Math.floor(Math.min(...points.map(p => p.month))) - 1);
  let maxM = Math.ceil(Math.max(...points.map(p => p.month))) + 1;
  if (maxM - minM < MIN_CHART_SPAN_MONTHS) maxM = minM + MIN_CHART_SPAN_MONTHS;
  const whoSlice = Array.from(new Set([minM, ...wfa.filter(d => d.month > minM && d.month < maxM).map(d => d.month), maxM]))
    .sort((a, b) => a - b).map(m => ({ month: m, ...getWHOValueAtMonth(gender, indicator, m) }));

  const vMin = Math.min(...points.map(p => p.val), ...whoSlice.map(d => d.sd2neg)) - (indicator === 'wfa' ? 0.5 : 1);
  const vMax = Math.max(...points.map(p => p.val), ...whoSlice.map(d => d.sd2pos)) + (indicator === 'wfa' ? 0.5 : 1);

  return { points, whoSlice, minM, maxM, vMin, vMax, color, unit };
}

function AgeChart({ chartData, title }) {
  const [selected, setSelected] = useState(null);
  if (!chartData) return null;
  const { points, whoSlice, minM, maxM, vMin, vMax, color, unit } = chartData;
  const W = 326, H = 190, mg = { top: 14, right: 10, bottom: 30, left: 30 };
  const pW = W - mg.left - mg.right, pH = H - mg.top - mg.bottom;
  const xSc = m => mg.left + ((m - minM) / ((maxM - minM) || 1)) * pW;
  const ySc = v => mg.top + (1 - (v - vMin) / ((vMax - vMin) || 1)) * pH;

  const bandTop    = whoSlice.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xSc(d.month).toFixed(1)} ${ySc(d.sd2pos).toFixed(1)}`).join(' ');
  const bandBottom = [...whoSlice].reverse().map((d) => `L ${xSc(d.month).toFixed(1)} ${ySc(d.sd2neg).toFixed(1)}`).join(' ');
  const band = bandTop + ' ' + bandBottom + ' Z';

  const yTicks = niceTicks(vMin, vMax, 5);
  const monthStep = pickMonthStep(maxM - minM);
  const xTicks = [];
  for (let m = Math.ceil(minM / monthStep) * monthStep; m <= maxM; m += monthStep) xTicks.push(m);

  return (
    <Card>
      <SectionTitle>แนวโน้มย้อนหลัง{title ? ` : ${title}` : ''}</SectionTitle>
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
        {/* Child line — each segment turns orange if either endpoint falls
            outside the WHO ±2SD band, instead of one uniform color that
            can't tell a parent anything is off. */}
        {points.slice(1).map((p, i) => {
          const prev = points[i];
          const segColor = (prev.outOfRange || p.outOfRange) ? OUT_OF_RANGE_COLOR : color;
          return (
            <path key={i} d={`M ${xSc(prev.month).toFixed(1)} ${ySc(prev.val).toFixed(1)} L ${xSc(p.month).toFixed(1)} ${ySc(p.val).toFixed(1)}`}
              fill="none" stroke={segColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          );
        })}
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          const r = selected === i ? 6 : isLast ? 5.5 : 4.5;
          return (
            <circle
              key={i}
              cx={xSc(p.month)} cy={ySc(p.val)} r={r}
              fill={p.outOfRange ? OUT_OF_RANGE_COLOR : color} stroke="#fff" strokeWidth={isLast ? 2.5 : 2}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setSelected(selected === i ? null : i); }}
            />
          );
        })}
        {/* Label the current point directly instead of a connecting guide
            line + arrow pointing down at the x-axis. */}
        {points.length > 0 && (() => {
          const last = points[points.length - 1];
          const lx = xSc(last.month), ly = ySc(last.val);
          const above = ly - mg.top > 16;
          return (
            <text x={lx} y={above ? ly - 10 : ly + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-heading)">ปัจจุบัน</text>
          );
        })()}
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
      <ChartLegend lineColor={color} hasOutOfRange={points.some(p => p.outOfRange)} />
    </Card>
  );
}

const MIN_CHART_SPAN_CM = 12;

function WHChart({ records, gender, birthDate, title }) {
  const [selected, setSelected] = useState(null);
  // Reuse the same "1 record per calendar month of age" selection as the
  // weight/height-by-age charts, so all 3 charts agree on which records
  // to plot — just re-projected onto height (x) vs weight (y) here.
  const withAge = [...records].filter(r => r.heightCm)
    .map(r => ({ month: ageInMonths(birthDate, r.date), val: r.heightCm, date: r.date, r }));
  const monthly = aggregateMonthly(withAge).map(p => p.r);
  const sorted = monthly.sort((a, b) => a.heightCm - b.heightCm);
  const points = sorted.map(r => {
    const who = getWHOWflAtLength(gender, r.heightCm);
    return { h: r.heightCm, w: r.weightKg, date: r.date, outOfRange: !!who && (r.weightKg > who.sd2pos || r.weightKg < who.sd2neg) };
  });
  if (!points.length) return null;

  const wflData = getWHOWflData(gender);
  // Fixed 5cm-stepped axis starting at 45cm (the standard WHO weight-for-
  // length chart baseline) rather than a data-dependent range, so the
  // gridlines are always clean round numbers.
  const minH = 45;
  let maxH = Math.min(120, Math.ceil((Math.max(...points.map(p => p.h)) + 2) / 5) * 5);
  if (maxH < minH + MIN_CHART_SPAN_CM) maxH = minH + MIN_CHART_SPAN_CM;
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
  const xStep = 5;
  const xTicks = [];
  for (let h = minH; h <= maxH; h += xStep) xTicks.push(h);

  // "Current" here = the most recently recorded entry by date, not by
  // height value — points are sorted by height for the trend line, so this
  // is looked up by matching date rather than assumed to be points[last].
  const latestByDate = [...records].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const currentIdx = points.findIndex(p => p.date === latestByDate.date);

  return (
    <Card>
      <SectionTitle>แนวโน้มย้อนหลัง{title ? ` : ${title}` : ''}</SectionTitle>
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
        {points.slice(1).map((p, i) => {
          const prev = points[i];
          const segColor = (prev.outOfRange || p.outOfRange) ? OUT_OF_RANGE_COLOR : 'var(--color-primary)';
          return (
            <path key={i} d={`M ${xSc(prev.h).toFixed(1)} ${ySc(prev.w).toFixed(1)} L ${xSc(p.h).toFixed(1)} ${ySc(p.w).toFixed(1)}`}
              fill="none" stroke={segColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          );
        })}
        {points.map((p, i) => {
          const isCurrent = i === currentIdx;
          const r = selected === i ? 6 : isCurrent ? 5.5 : 4.5;
          return (
            <circle
              key={i}
              cx={xSc(p.h)} cy={ySc(p.w)} r={r}
              fill={p.outOfRange ? OUT_OF_RANGE_COLOR : 'var(--blue-600)'} stroke="#fff" strokeWidth={isCurrent ? 2.5 : 2}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setSelected(selected === i ? null : i); }}
            />
          );
        })}
        {/* Label the current point directly instead of a connecting guide
            line + arrow pointing down at the x-axis. */}
        {currentIdx >= 0 && (() => {
          const cur = points[currentIdx];
          const lx = xSc(cur.h), ly = ySc(cur.w);
          const above = ly - mg.top > 16;
          return (
            <text x={lx} y={above ? ly - 10 : ly + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-heading)">ปัจจุบัน</text>
          );
        })()}
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
      <ChartLegend hasOutOfRange={points.some(p => p.outOfRange)} />
    </Card>
  );
}

// ─── History list ─────────────────────────────────────────────────────────────

function HistoryList({ records, onEditRecord }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const shown = expanded ? sorted : sorted.slice(0, 3);

  return (
    <div>
      <SectionTitle>รายการบันทึกย้อนหลัง</SectionTitle>
      <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', marginBottom: 8 }}>แตะรายการเพื่อแก้ไข หากบันทึกผิด</div>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {shown.map((r, i) => (
          <div
            key={r.id}
            onClick={() => onEditRecord(r)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer',
              borderBottom: i < shown.length - 1 ? '1px solid var(--gray-100)' : 'none',
            }}
          >
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gray-50)', color: 'var(--blue-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <ScaleStandIcon width={18} height={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>
                {r.weightKg.toFixed(1)} กก. · {r.heightCm.toFixed(1)} ซม.
              </div>
            </div>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatThaiDate(r.date)}</span>
            <ChevronRight width={16} height={16} style={{ color: 'var(--text-faint)', flex: 'none' }} />
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
  const required = typeof label === 'string' && label.endsWith(' *');
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>
        {required ? label.slice(0, -2) : label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </div>
      {children}
    </div>
  );
}

// `record` (optional): an existing 004_growth row being corrected — pre-fills
// the form and UPDATEs that row instead of inserting a new one, so a mistyped
// entry can be fixed in place rather than living in the history forever.
function AddRecordPanel({ childId, lineUid, record, needsConsent, onCancel, onSaved, onDelete }) {
  const today = todayStr();
  const isEdit = !!record;
  const [date, setDate] = useState(record?.date ?? today);
  const [weight, setWeight] = useState(record ? String(record.weightKg) : '');
  const [height, setHeight] = useState(record ? String(record.heightCm) : '');
  const [thigh, setThigh] = useState(record?.thighCm != null ? String(record.thighCm) : '');
  const [waist, setWaist] = useState(record?.waistCm != null ? String(record.waistCm) : '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const canSave = date && weight && height;

  const handleSave = async () => {
    if (!canSave || needsConsent) return;
    const weightKg = parseFloat(weight), heightCm = parseFloat(height);
    if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) {
      setError('น้ำหนักหรือส่วนสูงไม่ถูกต้อง กรุณาใส่เป็นตัวเลข');
      return;
    }
    if (date > today) {
      setError('วันที่บันทึกต้องไม่เกินวันนี้');
      return;
    }
    setSaving(true); setError(null);
    try {
      const payload = {
        child_id: childId, recorded_date: date,
        weight_kg: weightKg, height_cm: heightCm,
        thigh_cm:  thigh  ? parseFloat(thigh)  : null,
        waist_cm:  waist  ? parseFloat(waist)  : null,
        diaper_size: recommendSize(weightKg).code,
      };
      const query = isEdit
        ? supabase.from('004_growth').update(payload).eq('id', record.id)
        : supabase.from('004_growth').insert(payload);
      const { data, error: err } = await query.select().single();
      if (err) throw err;
      logAction(lineUid, isEdit ? 'edit_growth_record' : 'add_growth_record');
      onSaved({
        id: data.id, date: data.recorded_date,
        weightKg: data.weight_kg, heightCm: data.height_cm,
        thighCm: data.thigh_cm, waistCm: data.waist_cm,
      }, isEdit);
    } catch (e) {
      console.error('[AddRecord]', e);
      logError(lineUid, isEdit ? 'edit_growth_record' : 'add_growth_record', e);
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record || needsConsent || !window.confirm('ลบรายการบันทึกนี้?')) return;
    setDeleting(true); setError(null);
    try {
      // DELETE reports no error even when RLS silently blocks it (0 rows
      // removed) — .select() forces the deleted row back so we can tell
      // apart "actually deleted" from "no-op", instead of trusting the
      // absence of an error alone.
      const { data, error: err } = await supabase.from('004_growth').delete().eq('id', record.id).select('id');
      if (err) throw err;
      if (!data || data.length === 0) throw new Error('ไม่มีสิทธิ์ลบรายการนี้');
      logAction(lineUid, 'delete_growth_record');
      onDelete(record.id);
    } catch (e) {
      console.error('[DeleteRecord]', e);
      logError(lineUid, 'delete_growth_record', e);
      setError('ลบไม่สำเร็จ กรุณาลองใหม่');
      setDeleting(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>{isEdit ? 'แก้ไขข้อมูลบันทึก' : 'บันทึกข้อมูลใหม่'}</h3>
        <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface-soft)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X width={18} height={18} />
        </button>
      </div>
      <FormField label="วันที่บันทึก">
        <div style={{ position: 'relative' }}>
          <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} style={dateInputStyle} />
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
      <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', marginBottom: 14 }}><span style={{ color: '#dc2626' }}>*</span> จำเป็น · ช่องอื่นไม่บังคับ</div>
      {needsConsent && <ConsentGateNotice />}
      {error && <div style={{ font: 'var(--type-caption)', color: 'var(--red-400)', marginBottom: 12 }}>{error}</div>}
      <Button variant="primary" fullWidth disabled={needsConsent || !canSave} loading={saving} onClick={handleSave} leftIcon={<Plus width={18} height={18} />}>
        {isEdit ? 'บันทึกการแก้ไข' : 'บันทึก'}
      </Button>
      {isEdit && (
        <Button variant="soft" fullWidth disabled={needsConsent} loading={deleting} onClick={handleDelete} style={{ marginTop: 10, color: 'var(--red-400)' }}>
          ลบรายการนี้
        </Button>
      )}
    </Card>
  );
}

// ─── Overview panel ───────────────────────────────────────────────────────────

function OverviewPanel({ records, gender, birthDate, chartTab, onChartTabChange, onAddNew, onEditRecord }) {
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
  let zWH = null, whoWH = null;
  if (latest.heightCm >= 45 && latest.heightCm <= 120) {
    whoWH = getWHOWflAtLength(gender, latest.heightCm);
    if (whoWH) zWH = calcZScore(latest.weightKg, whoWH);
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

      {/* Tab selector */}
      <ChartTabBar active={chartTab} onChange={onChartTabChange} />

      {/* Metric card + Chart — one merged card per tab instead of always
          showing both weight+height cards plus a second per-tab card. */}
      {chartTab === 'wa' && (
        <>
          <MergedMetricCard
            metric={METRICS[0]} value={latest.weightKg} who={whoWA} zone={waZone}
            measurementText={`เมื่ออายุ ${ageLabel}`}
          />
          <AgeChart chartData={waChart} title="น้ำหนักตามอายุ" />
        </>
      )}
      {chartTab === 'ha' && (
        <>
          <MergedMetricCard
            metric={METRICS[1]} value={latest.heightCm} who={whoHA} zone={haZone}
            measurementText={`เมื่ออายุ ${ageLabel}`}
          />
          <AgeChart chartData={haChart} title="ส่วนสูงตามอายุ" />
        </>
      )}
      {chartTab === 'wh' && whoWH && (
        <>
          <MergedMetricCard
            metric={METRICS[2]} value={latest.weightKg} who={whoWH} zone={whZone}
            measurementText={`ที่ส่วนสูง ${latest.heightCm.toFixed(1)} ซม.`}
          />
          <WHChart records={records} gender={gender} birthDate={birthDate} title="น้ำหนักเทียบส่วนสูง" />
        </>
      )}

      {/* History */}
      <HistoryList records={records} onEditRecord={onEditRecord} />

      {/* Add button */}
      <Button variant="primary" fullWidth onClick={onAddNew} leftIcon={<Plus width={18} height={18} />}>บันทึกข้อมูลใหม่</Button>
    </div>
  );
}

// ─── GrowthPanel (exported) ───────────────────────────────────────────────────

export function GrowthPanel({ child, needsConsent, autoOpenAdd, onAutoOpenAddConsumed }) {
  const [panelView, setPanelView] = useState('overview'); // 'overview' | 'form'
  const [editingRecord, setEditingRecord] = useState(null); // null = adding new, record = editing that one
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

  const closeForm = () => { setPanelView('overview'); setEditingRecord(null); };
  const openAdd = () => { setEditingRecord(null); setPanelView('form'); };
  const openEdit = (record) => { setEditingRecord(record); setPanelView('form'); };

  // Diaper tab's "บันทึกผ่านหน้า พัฒนาการ → บันทึกข้อมูลใหม่" link jumps here
  // and wants the form open immediately — consume the one-shot signal once
  // records have finished loading, then tell the parent to clear it so
  // navigating away and back doesn't reopen the form on its own.
  useEffect(() => {
    if (autoOpenAdd && !loading) {
      openAdd();
      onAutoOpenAddConsumed?.();
    }
  }, [autoOpenAdd, loading]);

  const handleSaved = (record, isEdit) => {
    setRecords(prev => {
      const next = isEdit ? prev.map(r => (r.id === record.id ? record : r)) : [...prev, record];
      return next.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    closeForm();
  };

  const handleDeleted = (id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    closeForm();
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

  if (panelView === 'form') {
    return (
      <AddRecordPanel
        childId={child.child_id}
        lineUid={child?.line_uid}
        record={editingRecord}
        needsConsent={needsConsent}
        onCancel={closeForm}
        onSaved={handleSaved}
        onDelete={handleDeleted}
      />
    );
  }

  if (records.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
        <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>ยังไม่มีข้อมูลพัฒนาการ</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>เริ่มบันทึกน้ำหนักและส่วนสูง<br />เพื่อติดตามพัฒนาการของลูก</div>
      </Card>
      <Button variant="primary" fullWidth onClick={openAdd} leftIcon={<Plus width={18} height={18} />}>บันทึกข้อมูลแรก</Button>
    </div>
  );

  return (
    <OverviewPanel
      records={records}
      gender={gender}
      birthDate={birthDate}
      chartTab={chartTab}
      onChartTabChange={setChartTab}
      onAddNew={openAdd}
      onEditRecord={openEdit}
    />
  );
}

export default GrowthPanel;
